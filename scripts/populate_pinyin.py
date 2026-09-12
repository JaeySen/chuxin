#!/usr/bin/env python3
"""
Populate quiz_questions.meta with per-character pinyin pairs.

meta JSON shape:
{
  "text_pairs":    [["汉","hàn"],["字","zì"],[" ",""],[...], ...],
  "options_pairs": {
    "A": [["我","wǒ"],["喜","xǐ"], ...],
    "B": [...],
    ...
  },
  "areAllAnswerPinyin": false
}

Non-Chinese chars are stored with empty pinyin "".

`areAllAnswerPinyin` is true for MCQ "find the pinyin of <hán tự>" style
questions where every option is itself a pinyin transcription (no CJK).
When true, the client must NOT show ruby pinyin over the question text,
since that would hand the student the answer.
"""

import sys, os, json, re, argparse, psycopg2
from pypinyin import pinyin as get_pinyin, Style

DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgres://sotamhsk:a41be9c3894017fa0ea782965cc2920b02a20fff33c0e63f@localhost:5432/sotamhsk',
)

def is_cjk(ch):
    cp = ord(ch)
    return (0x4E00 <= cp <= 0x9FFF or
            0x3400 <= cp <= 0x4DBF or
            0x20000 <= cp <= 0x2A6DF or
            0x2A700 <= cp <= 0x2CEAF or
            0xF900 <= cp <= 0xFAFF)

def text_to_pairs(text: str) -> list:
    """Return list of [char, pinyin_or_empty].

    IMPORTANT: pypinyin must be called on whole runs of consecutive CJK
    characters (not one character at a time) so its phrase dictionary can
    disambiguate polyphonic/heteronym characters (多音字) using surrounding
    context — e.g. 只 is "zhǐ" in "只有" but "zhī" in "一只猫"; 的/还/会/中/长
    etc. all have multiple valid readings that are only resolvable from
    context. Converting character-by-character in isolation always falls
    back to pypinyin's single "most common" reading, which is frequently
    wrong for these characters and was the source of incorrect tone marks
    (this is also why source Word docs encode the intended reading via a
    font-substitution trick — FZKTPY01..FZKTPY06 — switching which of a
    character's several pre-rendered pronunciations is shown; we don't
    parse that font hint, we instead recover the correct reading the same
    way pypinyin's own phrase dictionary does: from surrounding context).

    Non-CJK runs (spaces, punctuation, digits, Latin letters, labels like
    "A. ") are still emitted one character at a time with empty pinyin,
    unchanged from before — only CJK spans are batched for conversion.
    """
    if not text:
        return []
    result = []
    run = []  # buffer of consecutive CJK chars
    def flush_run():
        if not run:
            return
        pys = get_pinyin(''.join(run), style=Style.TONE, errors='default')
        for ch, py in zip(run, pys):
            result.append([ch, py[0] if py else ''])
        run.clear()
    for ch in text:
        if is_cjk(ch):
            run.append(ch)
        else:
            flush_run()
            result.append([ch, ''])
    flush_run()
    _apply_heteronym_corrections(result, text)
    return result

def _apply_heteronym_corrections(pairs: list, source_text: str = '') -> None:
    """Fix two known pypinyin phrase-dict mistakes that the CJK-run batching
    above still can't resolve, because they depend on context pypinyin's
    dictionary doesn't have:

    1. 睡觉 (shuìjiào, "to sleep") is a separable verb (离合词/ly hợp từ) —
       grammar exercises deliberately insert aspect particles between its
       two characters ("睡了觉", "睡着觉", "我昨天没睡了觉"). Once 睡 and 觉
       aren't adjacent, pypinyin's phrase dictionary can't recognize
       "睡觉" and falls back to 觉's single-character default reading
       "jué" (as in 觉得/感觉), when this context always means "jiào".
    2. "都" immediately followed by "会" — pypinyin's dictionary treats
       adjacent "都会" as the noun "metropolis" (dūhuì) and returns "dū"
       for 都, even when the sentence actually means adverb 都 (dōu,
       "all") + modal verb 会 (huì, "can/will"), e.g. "我们都会写了".
       "都会"-as-metropolis is advanced vocabulary that doesn't occur in
       this HSK1 material, so always preferring the adverb reading here
       is safe and fixes the far more common grammar-drill sentence.
    """
    n = len(pairs)
    # e.g. 'Lượng từ "只" trong bài dùng cho đối tượng nào?' — the question
    # is explicitly introducing/quoting 只 as the 量词 (measure word/classifier),
    # so a standalone citation of the character (no CJK neighbor to give
    # pypinyin phrase context) should read "zhī", not the bare default "zhǐ".
    mentions_liang_ci = 'lượng từ' in source_text.lower()
    for i in range(n):
        ch = pairs[i][0]
        if ch == '觉':
            j = i - 1
            steps = 0
            found_shui = False
            while j >= 0 and steps < 3:
                pch = pairs[j][0]
                if pch == '睡':
                    found_shui = True
                    break
                if pch in ('了', '过', '着', '没', '有'):
                    j -= 1
                    steps += 1
                    continue
                break
            if found_shui:
                pairs[i][1] = 'jiào'
        elif ch == '都' and i + 1 < n and pairs[i + 1][0] == '会':
            pairs[i][1] = 'dōu'
        elif ch == '只':
            # 只 as a measure word/classifier ("this/that/several/two/one
            # [animal]") is "zhī" — e.g. "这只小猫" (this cat), "两只狗" (two
            # dogs). 只 as the adverb "only" is "zhǐ" — e.g. "只有", "只是",
            # "这只是个测试" (this is only a test). pypinyin's phrase
            # dictionary recognizes "一只"/"几只" as the classifier but
            # defaults everything else (这只/那只/两只/每只) to the adverb
            # reading "zhǐ", which is wrong whenever 只 is actually acting
            # as a classifier before a noun rather than "只是/只有" before a
            # verb.
            prev_ch = pairs[i - 1][0] if i > 0 else ''
            next_ch = pairs[i + 1][0] if i + 1 < n else ''
            if prev_ch in ('这', '那', '几', '两', '每', '一') and next_ch not in ('是', '有'):
                pairs[i][1] = 'zhī'
            elif mentions_liang_ci and not (prev_ch and is_cjk(prev_ch)) and not (next_ch and is_cjk(next_ch)):
                pairs[i][1] = 'zhī'

# A string is "pinyin-only" when it has no CJK characters, isn't Vietnamese
# prose, and contains at least one Latin/pinyin letter (tone marks
# included) — mirrors the client heuristic in apps/react/src/pages/Home.tsx
# (isPinyinOnlyText / hasVietnameseOnlySounds / hasVietnameseCommonWord).
# IMPORTANT: this must stay in sync with Home.tsx — a naive version that
# only excludes CJK (and doesn't also exclude Vietnamese-only sounds/words)
# will classify ordinary Vietnamese-language MCQ options (e.g. "Cái gì",
# "Ở đâu", "Ai", "Nào") as "pinyin-only" since Vietnamese is Latin-scripted,
# which wrongly sets areAllAnswerPinyin=true and hides the ruby pinyin over
# the question text for any MCQ whose options happen to all be Vietnamese.
import unicodedata

PINYIN_LETTERS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "üÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ"
)

# đ/Đ never decompose; the rest are combining marks pinyin never uses
# (horn, dot below, breve, circumflex, hook above, tilde) — see Home.tsx
# VN_ONLY_DIACRITIC_RE for the rationale.
VN_ONLY_DIACRITIC_CHARS = set("đĐ")
VN_ONLY_COMBINING_MARKS = {"̛", "̣", "̆", "̂", "̉", "̃"}

def has_vietnamese_only_sounds(s: str) -> bool:
    nfd = unicodedata.normalize('NFD', s)
    return any(ch in VN_ONLY_DIACRITIC_CHARS or ch in VN_ONLY_COMBINING_MARKS for ch in nfd)

# Mirrors Home.tsx VN_COMMON_WORDS exactly.
VN_COMMON_WORDS = {
    "chào", "cảm", "ơn", "không", "có", "là", "của", "và", "những", "các",
    "một", "người", "này", "kia", "đó", "rất", "cũng", "thì", "nhưng", "vì",
    "nếu", "trước", "trong", "ngoài", "với", "được", "bị", "sẽ", "đã", "đang",
    "nữa", "chỉ", "còn", "hoặc", "mà", "nên", "ở", "đi", "về", "lại", "vào",
    "lên", "xuống", "đến", "từ", "như", "vậy", "thế", "à", "ạ", "nhé", "nhá",
    "ừ", "vâng", "dạ", "tôi", "bạn", "chị", "chúng", "mình", "gì", "đâu",
    "nào", "nhiêu", "làm", "nói", "biết", "muốn", "cần", "phải", "bằng",
    "trên", "dưới",
}

def _vn_tokenize(s: str) -> list:
    """Split into runs of letters/combining-diacritics, mirroring the JS
    regex split(/[^\\p{L}\\u0300-\\u036f]+/u)."""
    tokens = []
    cur = []
    for ch in s.lower():
        if unicodedata.category(ch).startswith('L') or 0x0300 <= ord(ch) <= 0x036F:
            cur.append(ch)
        elif cur:
            tokens.append(''.join(cur))
            cur = []
    if cur:
        tokens.append(''.join(cur))
    return tokens

def has_vietnamese_common_word(s: str) -> bool:
    tokens = _vn_tokenize(s)
    if len(tokens) < 2:
        return False
    return any(tok in VN_COMMON_WORDS for tok in tokens)

def is_pinyin_only_text(s) -> bool:
    if not s:
        return False
    t = str(s).strip()
    if not t:
        return False
    if any(is_cjk(ch) for ch in t):
        return False
    if has_vietnamese_only_sounds(t) or has_vietnamese_common_word(t):
        return False
    return any(ch in PINYIN_LETTERS for ch in t)

# A question text like "202.2元" or "6.02元" embeds a lone currency-unit
# hanzi (元/块/毛/角/分) next to a number — that's a money-amount label, not
# the vocabulary word being tested. MCQs like 'Cách đọc đúng cho số tiền
# "202.2元" là:' give whole-phrase pinyin readings of the amount as options
# (e.g. "èrbǎi èr kuài líng èr máo"), which happen to satisfy
# is_pinyin_only_text, but revealing the ruby for "元" alone doesn't hand
# away that multi-word answer — so these must never be treated as "find the
# pinyin" questions. Mirrors CURRENCY_AMOUNT_RE in Home.tsx.
CURRENCY_AMOUNT_RE = re.compile(r'\d[\d.,]*\s*[元块毛角分]')

def compute_area_all_answer_pinyin(qtype: str, options: dict, text: str = '') -> bool:
    """True for MCQ "find the pinyin of <hán tự>" questions where every
    option is a pinyin transcription (no CJK). Mirrors isPinyinAnswerQuestion
    in apps/react/src/pages/Home.tsx."""
    if qtype != 'mcq' or not isinstance(options, dict):
        return False
    if CURRENCY_AMOUNT_RE.search(text or ''):
        return False
    vals = [options[l] for l in ('A', 'B', 'C', 'D') if options.get(l) and str(options[l]).strip()]
    if len(vals) < 2:
        return False
    return all(is_pinyin_only_text(v) for v in vals)

def build_meta(text: str, options: dict, qtype: str) -> dict:
    opts_pairs = {}
    if isinstance(options, dict):
        for k, v in options.items():
            opts_pairs[str(k)] = text_to_pairs(str(v)) if v else []
    return {
        'text_pairs': text_to_pairs(text or ''),
        'options_pairs': opts_pairs,
        'areAllAnswerPinyin': compute_area_all_answer_pinyin(qtype, options or {}, text or ''),
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiz-id", default=None, help="Only (re)populate meta for this quiz id")
    args = ap.parse_args()

    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    if args.quiz_id:
        cur.execute("SELECT id, text, options, type FROM quiz_questions WHERE quiz_id = %s", (args.quiz_id,))
    else:
        cur.execute("SELECT id, text, options, type FROM quiz_questions")
    rows = cur.fetchall()
    total = len(rows)
    print(f"Processing {total} questions …", flush=True)

    for i, (qid, text, options, qtype) in enumerate(rows):
        meta = build_meta(text, options or {}, qtype)
        cur.execute(
            "UPDATE quiz_questions SET meta = %s WHERE id = %s",
            (json.dumps(meta, ensure_ascii=False), qid),
        )
        if (i + 1) % 100 == 0:
            conn.commit()
            print(f"  {i+1}/{total}", flush=True)

    conn.commit()
    cur.close()
    conn.close()
    print("Done ✓")

if __name__ == '__main__':
    main()
