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

import sys, os, json, argparse, psycopg2
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
    """Return list of [char, pinyin_or_empty]."""
    if not text:
        return []
    result = []
    for ch in text:
        if is_cjk(ch):
            py = get_pinyin(ch, style=Style.TONE)
            result.append([ch, py[0][0] if py else ''])
        else:
            result.append([ch, ''])
    return result

# A string is "pinyin-only" when it has no CJK characters and contains at
# least one Latin/pinyin letter (tone marks included) — mirrors the client
# heuristic in apps/react/src/pages/Home.tsx (isPinyinOnlyText).
PINYIN_LETTERS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "üÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ"
)

def is_pinyin_only_text(s) -> bool:
    if not s:
        return False
    t = str(s).strip()
    if not t:
        return False
    if any(is_cjk(ch) for ch in t):
        return False
    return any(ch in PINYIN_LETTERS for ch in t)

def compute_area_all_answer_pinyin(qtype: str, options: dict) -> bool:
    """True for MCQ "find the pinyin of <hán tự>" questions where every
    option is a pinyin transcription (no CJK). Mirrors isPinyinAnswerQuestion
    in apps/react/src/pages/Home.tsx."""
    if qtype != 'mcq' or not isinstance(options, dict):
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
        'areAllAnswerPinyin': compute_area_all_answer_pinyin(qtype, options or {}),
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
