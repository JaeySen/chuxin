#!/usr/bin/env python3
"""
parse_quiz.py — convert PDF/DOCX quiz files to structured JSON.

Usage (from chuxin-docs venv):
  python /path/to/chuxin/scripts/parse_quiz.py Bài-1-HSK1.pdf
  python /path/to/chuxin/scripts/parse_quiz.py *.pdf        # batch
  python /path/to/chuxin/scripts/parse_quiz.py --dir /path/to/pdfs

Output: content/quizzes/<slug>.json  (relative to repo root, auto-detected)
"""

import re
import json
import sys
import os
import argparse
from pathlib import Path


# ── Repo root (two levels up from this script) ───────────────────────────────
REPO_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = REPO_ROOT / "content" / "quizzes"


# ── Extraction ────────────────────────────────────────────────────────────────

def extract_text(path: str) -> str:
    from markitdown import MarkItDown
    md = MarkItDown()
    result = md.convert(path)
    return result.text_content


# ── Helpers ───────────────────────────────────────────────────────────────────

# Matches "Câu 1:", "Câu 1.", "Câu 1 " at start of line (question separator)
Q_HEADER = re.compile(r"^Câu\s+(\d+)\s*[.:\s]", re.MULTILINE)

# Option patterns (all variants observed across PDFs):
#   Plain:   "A. text" or "A.text"
#   Bullet:  "• A. text" or "•  A. text"
#   Table:   "| A. text |" → handled by stripping pipes
OPTION_RE = re.compile(
    r"^[•\s]*([A-D])\.\s*(.+?)(?:\s*\|.*)?$",
    re.MULTILINE,
)

# Inline answer: "Đáp án: A" or "Đáp án:A"
INLINE_ANS = re.compile(r"Đáp\s+án\s*:\s*([A-D])", re.IGNORECASE)

# Open-ended marker
OPEN_MARKER = re.compile(r"Đáp\s+án\s+của\s+bạn|Gõ\s+chữ\s+Hán|_{5,}", re.IGNORECASE)

# Answer summary section
ANS_SECTION = re.compile(r"BẢNG\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s+THAM\s+KHẢO", re.IGNORECASE)


def parse_table_options(block: str) -> dict:
    """Extract options from a markdown table row: | A. x | B. y | C. z | D. w |"""
    opts = {}
    # Try to find a table row that contains lettered options
    for row in re.findall(r"\|([^|\n]+(?:\|[^|\n]+)+)\|", block):
        cells = [c.strip() for c in row.split("|")]
        for cell in cells:
            m = re.match(r"([A-D])\.\s*(.+)", cell)
            if m:
                opts[m.group(1)] = m.group(2).strip()
    return opts


def parse_options(block: str) -> dict:
    """Extract A/B/C/D options from a question block (handles all 3 layouts)."""
    # First try table format
    table_opts = parse_table_options(block)
    if len(table_opts) >= 2:
        return table_opts

    # Plain / bullet format
    opts = {}
    for m in OPTION_RE.finditer(block):
        letter = m.group(1)
        text = m.group(2).strip()
        # Skip lines that look like "---" separators from markdown tables
        if re.match(r"^[-\s]+$", text):
            continue
        if text:
            opts[letter] = text
    return opts


def extract_end_answer_key(text: str, mcq_nums: set | None = None) -> dict:
    """
    Parse the MCQ answer key at the end of Bài 3/4-style PDFs.

    Handles two layouts:
      • Bài 4 (plain text): header line "Câu 1  Câu 2  ..." then one letter
        per line below it.
      • Bài 3 (markdown table): "| Câu 1 | Câu 2 | ... |" header row then
        "| B | A | ... |" answer row (with empty separator cells ignored).

    `mcq_nums`: set of question numbers known to be MCQ (from pass-1 parsing).
    When provided, open-ended questions in a header block are skipped so that
    the positional answer pairing stays correct.

    Returns {question_num: letter} dict.
    """
    m = ANS_SECTION.search(text)
    if not m:
        return {}

    # Only look at the MCQ part — stop before open-ended answer hints
    section = text[m.start():]
    stop = re.search(r"Gợi\s+ý\s+đáp\s+án\s+phần\s+tự\s+luận|2\.\s*Gợi", section, re.IGNORECASE)
    if stop:
        section = section[: stop.start()]

    key: dict[int, str] = {}
    current_q_nums: list[int] = []
    current_answers: list[str] = []

    def flush():
        # Filter to MCQ-only numbers within this header block so that
        # open-ended question slots (which have no letter in the key)
        # don't shift the positional pairing.
        eligible = (
            [n for n in current_q_nums if n in mcq_nums]
            if mcq_nums is not None
            else current_q_nums
        )
        for i, num in enumerate(eligible):
            if i < len(current_answers):
                key[num] = current_answers[i]

    for raw_line in section.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        has_câu = bool(re.search(r"Câu\s+\d+", line))

        if has_câu:
            flush()
            current_q_nums = [int(n) for n in re.findall(r"Câu\s+(\d+)", line)]
            current_answers = []
        elif line.startswith("|"):
            # Markdown table row (Bài 3 style) — extract single-letter cells
            cells = [c.strip() for c in line.split("|") if c.strip()]
            for cell in cells:
                if re.match(r"^[A-D]$", cell):
                    current_answers.append(cell)
        elif re.match(r"^[A-D]$", line):
            # Single letter on its own line (Bài 4 style)
            current_answers.append(line)

    flush()
    return key


def split_questions(text: str) -> list:
    """Split full text into per-question blocks."""
    splits = list(Q_HEADER.finditer(text))
    if not splits:
        return []

    answer_section_start = ANS_SECTION.search(text)
    answer_pos = answer_section_start.start() if answer_section_start else len(text)

    blocks = []
    for i, m in enumerate(splits):
        start = m.start()
        # Skip any "Câu N" matches that come from inside the answer key section
        if start >= answer_pos:
            break
        end = splits[i + 1].start() if i + 1 < len(splits) else answer_pos
        end = min(end, answer_pos)
        num = int(m.group(1))
        content = text[start:end].strip()
        blocks.append((num, content))

    return blocks


def parse_question(num: int, block: str) -> dict | None:
    """Parse a single question block into a structured dict."""
    # Remove the "Câu N:" header from the start
    block_body = re.sub(r"^Câu\s+\d+\s*[.:\s]*", "", block, count=1).strip()

    # Check for open-ended marker before parsing options
    is_open = bool(OPEN_MARKER.search(block_body))

    # Extract inline answer if present
    ans_m = INLINE_ANS.search(block_body)
    inline_answer = ans_m.group(1) if ans_m else None

    # Strip inline answer line and open-ended answer lines from body
    block_body_clean = INLINE_ANS.sub("", block_body)
    block_body_clean = OPEN_MARKER.sub("", block_body_clean)

    # Extract options
    options = parse_options(block_body_clean) if not is_open else {}

    # Extract question text: everything before the first option
    first_opt = re.search(r"^[•\s]*[A-D]\.", block_body_clean, re.MULTILINE)
    if first_opt:
        q_text = block_body_clean[: first_opt.start()].strip()
    else:
        # No options found — either open-ended or unparseable
        q_text = block_body_clean.strip()

    # Clean up noise from q_text
    q_text = re.sub(r"\|\s*-+\s*\|.*", "", q_text)  # remove stray table rows
    q_text = re.sub(r"\n{3,}", "\n\n", q_text).strip()

    if not q_text:
        return None

    q_type = "open" if is_open or not options else "mcq"

    return {
        "num": num,
        "text": q_text,
        "type": q_type,
        "options": options if q_type == "mcq" else {},
        "answer": inline_answer,  # may be filled from end key after
    }


def derive_title(text: str) -> str:
    """Extract quiz title from first non-empty, non-instruction line."""
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("Yêu cầu") and not line.startswith("("):
            return line
    return "Untitled Quiz"


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    return s.strip("-")


# ── Main parser ───────────────────────────────────────────────────────────────

def parse_quiz(pdf_path: str) -> dict:
    print(f"  Extracting: {pdf_path}", file=sys.stderr)
    text = extract_text(pdf_path).replace("\x0c", "\n")  # strip PDF page-break chars

    title = derive_title(text)
    q_blocks = split_questions(text)

    # Pass 1 — parse questions to identify types (MCQ vs open) and inline answers
    questions = []
    for num, block in q_blocks:
        q = parse_question(num, block)
        if q is not None:
            questions.append(q)

    # Pass 2 — extract end-of-doc answer key, using MCQ question set so that
    # open-ended questions in the same header block don't shift alignment
    mcq_nums = {q["num"] for q in questions if q["type"] == "mcq"}
    end_key = extract_end_answer_key(text, mcq_nums)

    for q in questions:
        if q["answer"] is None and q["num"] in end_key:
            q["answer"] = end_key[q["num"]]

    filename = Path(pdf_path).stem  # e.g. "Bài-1-HSK1"
    return {
        "source": Path(pdf_path).name,
        "title": title,
        "slug": slugify(filename),
        "questions": questions,
        "meta": {
            "total": len(questions),
            "mcq": sum(1 for q in questions if q["type"] == "mcq"),
            "open": sum(1 for q in questions if q["type"] == "open"),
            "missing_answers": sum(1 for q in questions if q["type"] == "mcq" and not q["answer"]),
        },
    }


def process(pdf_path: str):
    result = parse_quiz(pdf_path)
    slug = result["slug"]
    out_path = OUTPUT_DIR / f"{slug}.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    meta = result["meta"]
    status = "✓" if meta["missing_answers"] == 0 else f"⚠  {meta['missing_answers']} MCQ answers missing"
    print(f"  → {out_path.relative_to(REPO_ROOT)}", file=sys.stderr)
    print(f"     {meta['mcq']} MCQ  |  {meta['open']} open  |  {status}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Parse quiz PDFs → JSON")
    parser.add_argument("files", nargs="*", help="PDF/DOCX files to parse")
    parser.add_argument("--dir", help="Directory to scan for PDF files")
    parser.add_argument("--stdout", action="store_true",
                        help="Print parsed JSON to stdout instead of saving to file")
    args = parser.parse_args()

    paths = list(args.files)
    if args.dir:
        paths += [str(p) for p in Path(args.dir).glob("*.pdf")]
        paths += [str(p) for p in Path(args.dir).glob("*.docx")]

    if not paths:
        print("Usage: parse_quiz.py <file.pdf> [file2.pdf ...]  or  --dir <folder>", file=sys.stderr)
        sys.exit(1)

    if args.stdout:
        # Single-file mode for API use — emit JSON to stdout, logs to stderr
        if len(paths) != 1:
            print("--stdout requires exactly one file", file=sys.stderr)
            sys.exit(1)
        result = parse_quiz(paths[0])
        print(json.dumps(result, ensure_ascii=False))
        return

    for p in sorted(paths):
        print(f"\n{Path(p).name}", file=sys.stderr)
        try:
            process(p)
        except Exception as e:
            print(f"  ✗ ERROR: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
