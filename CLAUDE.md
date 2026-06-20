# CLAUDE.md

## Deploy (VPS: `sotam-vps`)

```bash
pnpm --filter shared build && pnpm --filter react build
rsync -avz --delete /Users/tranngochienlong/chuxin/apps/react/dist/ sotam-vps:/var/www/sotam/
```

API changes:
```bash
pnpm --filter api build
rsync -avz apps/api/dist/ sotam-vps:/home/sotam/sotam/apps/api/dist/
ssh sotam-vps "systemctl restart sotam-api"
```

CORS: `apps/api/src/index.ts` (`DEFAULT_ORIGINS`), or override on VPS via
`ALLOWED_ORIGINS` env var (comma-separated) in `/home/sotam/sotam/apps/api/.env`
— no rebuild needed for the env-var route, just `systemctl restart sotam-api`.

## `/pinyin` exercise page (apps/react/src/pages/PinyinExercisePage.tsx)

- **Data source**: `apps/react/src/data/hsk1.json` — static JSON,
  `{ "汉字": { "pinyin", "vi", "en" } }`. Edit directly + rebuild/deploy
  the React app to change vocabulary. `vi` (Vietnamese) is shown as the
  primary meaning, `en` secondary/smaller.
- There is a separate, NOT-yet-wired-up YAML+DB vocabulary/lookalike-brain
  system on branch `feat/vocabulary-lookalike-brain` (content/vocabulary/*.yml,
  `pnpm sync-vocabulary`, `/vocabulary` API route). `/pinyin` on `main` does
  not use it.
- Page structure: `BatchListView` (landing grid of "Bài tập 1..N" cards,
  shows saved score or "Chưa làm") → `ExerciseView` (per-batch quiz,
  `BATCH_SIZE = 7` words/batch).
- No submit button — selecting initial+final+tone auto-checks via
  `useEffect`, colors choices green/red immediately.
- Adaptive difficulty: `choiceCount = Math.min(2 + batchIdx, 5)` — batch 1
  has 2 choices/row, scaling to 5 by batch 4+.
- Zero-initial (`∅`) only ever shown when it's the correct answer; wrong
  zero-initial slots get replaced by `FAKE_FILLERS` (placeholder Latin
  strings) — real distractor source still TBD.
- Assembled preview concatenates initial+final into one syllable (`yi`,
  not `y + i`); tone shown as a separate badge via `TONE_LABELS`
  (short marks: ˉ ˊ ˇ ˋ ·).
- Tone buttons use `.pe-btn--tone` (64×64px flex-centered squares,
  2.4rem/900 weight) so the tone marks read like letter tiles.
- Progress (score per batch) persisted to `localStorage` under
  `pinyin-hsk1-progress`.
- Row subtitles (声母/韵母/声调 labels) are currently commented out in JSX.

## i18n

Site-wide i18n (language switcher) explicitly deferred — only `/pinyin`
shows Vietnamese-first definitions for now.

## Quiz import pipeline (teacher upload)

- **Parser script**: `scripts/parse_quiz.py` — run inside
  `/Users/tranngochienlong/chuxin-docs/.venv` (has `markitdown` installed).
  Use `--stdout` flag to get JSON on stdout instead of saving to file.
  ```bash
  cd /Users/tranngochienlong/chuxin-docs
  source .venv/bin/activate
  python /path/to/chuxin/scripts/parse_quiz.py Bài-1-HSK1.pdf
  # or batch:
  python /path/to/chuxin/scripts/parse_quiz.py --dir .
  ```
- **Output**: `content/quizzes/<slug>.json` per PDF. Schema:
  `{ title, slug, source, questions: [{ num, text, type, options:{A,B,C,D}, answer }] }`
  where `type` is `"mcq"` or `"open"`.
- **Handles 3 option layouts**: plain (`A. text`), bullet (`• A. text`),
  markdown table (`| A. x | B. y |`). Inline answers (`Đáp án: A`) and
  end-of-doc answer key table (`BẢNG ĐÁP ÁN`) both parsed. Two-pass
  approach: parse question types first so MCQ/open distinction fixes
  positional alignment in end-key tables.
- **Web upload UI**: React page at `/admin/quiz-import`
  (`apps/react/src/pages/QuizImportPage.tsx`) — drag-and-drop PDF/DOCX,
  POSTs to `POST /admin/quiz/parse`, shows preview with correct answers
  highlighted. Requires admin auth.
- **API route**: `apps/api/src/routes/quiz-import.ts`, registered at
  `/admin/quiz/parse`. Uses `@fastify/multipart` + calls Python subprocess
  (`PYTHON_BIN` env var, defaults to `python3`). Requires admin role.
- **VPS Python setup**: Python 3 + venv at `/home/sotam/sotam/venv/`.
  `PYTHON_BIN=/home/sotam/sotam/venv/bin/python` in
  `/home/sotam/sotam/apps/api/.env`.
- **Next**: DB migration for `quiz`/`quiz_question` tables, sync script
  to upload parsed JSON to DB, student quiz page at `/quiz/:slug`.
