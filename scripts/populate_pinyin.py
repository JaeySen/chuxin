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
  }
}

Non-Chinese chars are stored with empty pinyin "".
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

def build_meta(text: str, options: dict) -> dict:
    opts_pairs = {}
    if isinstance(options, dict):
        for k, v in options.items():
            opts_pairs[str(k)] = text_to_pairs(str(v)) if v else []
    return {
        'text_pairs': text_to_pairs(text or ''),
        'options_pairs': opts_pairs,
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiz-id", default=None, help="Only (re)populate meta for this quiz id")
    args = ap.parse_args()

    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    if args.quiz_id:
        cur.execute("SELECT id, text, options FROM quiz_questions WHERE quiz_id = %s", (args.quiz_id,))
    else:
        cur.execute("SELECT id, text, options FROM quiz_questions")
    rows = cur.fetchall()
    total = len(rows)
    print(f"Processing {total} questions …", flush=True)

    for i, (qid, text, options) in enumerate(rows):
        meta = build_meta(text, options or {})
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
