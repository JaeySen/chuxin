# CLAUDE.md

## Deploy (FTP: `hanngusotam.com` subdomains)

Credentials in `.env.deploy` (host `112.213.89.77`, port 21, FTPS).
Script: `scripts/ftp-deploy.sh` — builds then uploads, **excludes `.map` files**.

```bash
# giaovu portal (apps/giaovu/ → giaovu.hanngusotam.com/public_html/)
./scripts/ftp-deploy.sh giaovu

# testpage (apps/vanilla/ static → testpage.hanngusotam.com/public_html/)
./scripts/ftp-deploy.sh testpage

# both at once
./scripts/ftp-deploy.sh all
```

- `giaovu`: runs `pnpm --filter shared build && pnpm --filter giaovu build` first, then uploads `apps/giaovu/dist/`
- `testpage`: runs `pnpm --filter shared build && pnpm --filter react build` first, then uploads `apps/react/dist/`
- `.map` files are always skipped on upload

## Deploy (VPS: `sotam-vps`)

**Frontend is deployed via FTP only** (see FTP section above). Never use rsync for React/giaovu frontend.

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

## Quiz visibility (student-side) — debugging notes

Quiz visibility rule: a quiz is shown to a student only if
`quiz.course_id = class.course_id AND quiz.created_by = class.teacher_id`
for the class the student is enrolled in (`GET /quiz?courseId=&teacherId=`
in `apps/api/src/routes/quiz.ts`). This is intentional — quizzes belong
to the teacher who uploaded them, not just to a course level.

When a student reports "no exercises" despite being enrolled and the
teacher having uploaded quizzes, check **in this order** (each layer
silently produces an empty list if wrong, with no obvious error):

1. **`/auth/me` not returning classes after login.** `signIn`/`signUp` in
   `apps/react/src/lib/auth-context.tsx` must call `apiMe()` after
   login/signup — the login/signup response itself never includes
   `classes` (only `GET /auth/me` queries enrollments). Without this,
   the student sees "chưa được xếp lớp" until a hard page refresh.
2. **Bruno 401 on `/me` despite Authorization header.** The
   `authenticate` middleware (`apps/api/src/middleware/authenticate.ts`)
   requires **both** `Authorization: Bearer <jwt>` AND
   `X-Session-Token: <token>` — missing either returns 401. Both come
   from the `/auth/login` response.
3. **`quiz.created_by` ≠ `class.teacher_id` mismatch.** This is the
   most common real cause. Quizzes uploaded while testing under one
   teacher account (or a demo/admin account) won't show for a class
   managed by a *different* teacher account, even if `course_id`
   matches. Diagnose with:

   ```sql
   SELECT c.id, c.course_id, c.teacher_id,
          (SELECT array_agg(DISTINCT created_by) FROM quizzes WHERE course_id = c.course_id) AS quiz_creators
   FROM classes c WHERE c.course_id = '<course>';
   ```

   Fix by reassigning either the quiz's `created_by` or the class's
   `teacher_id` to match — pick based on who the *real* teacher is,
   don't blindly reassign (other classes may legitimately share that
   `course_id` with a different teacher).
4. **Frontend crash masking the real error.** Any fetch that does
   `.then(setX)` without checking `res.ok` / `Array.isArray` will, on a
   401/500, set state to an error object instead of `[]`, then crash
   with `t.map is not a function` on render. `StudentQuizList` and
   `QuizStatsPanel` in `apps/react/src/pages/Home.tsx` guard against
   this — keep that pattern for any new list-fetching component here.
5. **Migration not run on VPS.** `apps/api/src/db/migrations/*.sql`
   files are NOT included in the `rsync .../dist/` API deploy — they
   must be rsync'd and run separately. Forgetting this makes any route
   touching the new tables 500 (e.g. `quiz_attempts`/`quiz_attempt_answers`
   from `009_quiz_attempts.sql`).
6. **VPS Postgres peer auth.** DB role/database is `sotamhsk`, but the
   Linux login user may be `sotam` (or another name) — peer auth fails
   if they don't match. Force TCP instead: `psql -h localhost -U
   sotamhsk -d sotamhsk -f file.sql`, or run as `sudo -u postgres psql`.
