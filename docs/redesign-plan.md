# Sotam Platform — Redesign / Consolidation Plan

Status: draft v1
Owner: platform (Claude-assisted)
Scope: `apps/react` (student/teacher/admin app, hanngusotam.com), `apps/giaovu`
(staff/assistant "giaovu" portal, giaovu.hanngusotam.com), `apps/api`
(Fastify + Postgres backend), `packages/shared` (@sotam/shared).

## 1. Why this doc exists

Two apps (`apps/react` and `apps/giaovu`) now both render quiz/exercise
management UI against the same `apps/api` backend, built independently at
different times with diverging patterns (inline fetch calls vs a small
`api.ts` client, different card/table styling, different auth flows). This
happened organically while shipping features fast (soft-delete, reorder,
recycle bin, pinyin meta, orphan-quiz admin, quiz revisions/reupload — all
landed in the last work session). Before more surface area gets added, this
doc captures the current shape of the system, the debt accumulated getting
here, and a concrete plan to consolidate so the two frontends stop drifting
apart and the backend contract stays coherent as more roles (staff,
assistant) get added.

This intentionally does **not** propose a rewrite. The stack (Fastify +
Postgres + Vite/React, no ORM, raw SQL with `pg`) works and is well
understood; the plan below is about consolidation and de-duplication, not
migrating frameworks.

## 2. Current architecture (as of this session)

```
apps/
  react/     — hanngusotam.com — student, teacher, admin (guest/public too)
  giaovu/    — giaovu.hanngusotam.com — staff/assistant back-office portal
  api/       — Fastify API, single Postgres DB (sotamhsk), JWT + session
               token auth (both required on protected routes)
  vanilla/   — testpage.hanngusotam.com, static, mostly unrelated to the
               above (legacy/marketing, not touched by this plan)
packages/
  shared/    — @sotam/shared: zod schemas + shared types, wired into
               apps/react and (as of this session) apps/giaovu
```

Roles: `guest` (unauthenticated), `student`, `teacher`, `staff`,
`assistant`, `admin`. Role checks happen per-route via `requireRole(...)`
preHandlers in `apps/api/src/middleware/authorize.ts`. There is no
role→app mapping enforced at the infra level — `apps/giaovu` is just a
second Vite app that happens to be used mostly by `staff`/`assistant`
accounts, but nothing stops a teacher from logging into it, and nothing
stops staff from using `apps/react`'s admin UI if they have the URL.

Deploy: **frontends via FTP** (`scripts/ftp-deploy.sh {giaovu|testpage|all}`,
uploads static `dist/` to shared hosting), **API via rsync** to a VPS
(`sotam-vps`, systemd service `sotam-api`, nginx reverse proxy). These are
two entirely different deploy mechanisms with no shared CI — every deploy
in this session was a manual `pnpm build` + `ftp-deploy.sh` / `rsync` +
`ssh systemctl restart` sequence. See CLAUDE.md "Deploy" sections for the
exact commands; that tribal knowledge should eventually become a script,
not a doc a human/agent has to remember.

## 3. Debt observed this session (concrete, not hypothetical)

These are things that actually caused bugs or rework while implementing
quiz revisions / soft-delete / reorder / pinyin / giaovu-homework-migration
this session — listed because they're the strongest signal for what the
redesign should fix first.

1. **Duplicated list/query logic across two route files.**
   `apps/api/src/routes/quiz.ts` (student-facing `GET /quiz`) and
   `apps/api/src/routes/quiz-import.ts` (teacher/staff-facing
   `GET /admin/quiz-import`) each hand-roll their own `SELECT ... FROM
   quizzes` with slightly different `WHERE`/`ORDER BY` clauses. This is
   exactly how the bug just fixed happened: the reorder endpoint wrote
   `sort_order`, the teacher list read it, but the student list still had
   the old `ORDER BY created_at DESC` — so students saw a different
   exercise order than teachers set. **Any future ordering/filtering rule
   (soft-delete, orphan-hiding, sort_order) has to be updated in both
   places by hand**, with no compiler/type help to catch a missed one.
   → Fix: extract a single `listQuizzesForCourse()` / shared SQL builder
   (or a view) that both routes call, parameterized by role/visibility
   rather than duplicated.

2. **Two frontend apps, two API client patterns.** `apps/react` uses a
   central `apitFetch` wrapper in `lib/api.ts` with typed helpers; historic
   pages there also have some inline `fetch()` calls with duplicated
   header/error-handling logic (see `CoursePage.tsx`,
   `AdminDashboard.tsx`). `apps/giaovu` started fresh this session with its
   own `src/lib/api.ts`. Nothing is shared between the two API clients
   even though they hit the *same* backend and mostly the *same* endpoints
   (`/admin/quiz-import/*`). → Fix: move a role-agnostic typed API client
   into `packages/shared` (it already holds the zod schemas that should be
   the source of truth for request/response shapes) and have both apps
   import it, instead of re-implementing fetch wrappers per app.

3. **No shared UI kit → visual drift.** `apps/giaovu`'s card/table/modal
   styling was rebuilt from scratch in `apps/giaovu/src/styles.css` rather
   than reusing `apps/react`'s `.gv-*` classes it's visually copying
   (`gv-card`, `gv-table`, `btn-primary`/`btn-ghost`/`btn-danger`, status
   badges). Every new feature (recycle bin, unassigned-quizzes, drag
   reorder) had to be styled twice. → Fix: promote the `.gv-*` /
   `.btn-*` design tokens/components out of `apps/react/src/styles.css`
   into a shared CSS (or a tiny shared React component set) both apps
   import, instead of copy-pasting class names + rules.

4. **Migrations are hand-run, ordering is easy to get wrong.**
   `apps/api/src/db/migrations/010..013` were all added in one session and
   had to be applied via `node dist/db/migrate.js` on the VPS after every
   `rsync`, with a documented footgun (build script has to `rm -rf
   dist/db/migrations` first or stale files linger — this was itself a bug
   fixed this session, see `api/package.json`). → Fix: migrations +
   `systemctl restart` should be one deploy script/CI step, not a manually
   remembered 3-command sequence per CLAUDE.md.

5. **Soft-delete / visibility rules are string-typed WHERE clauses,
   repeated per route.** `deleted_at IS NULL`, `course_id IS NOT NULL`
   (orphan-hiding) are copy-pasted into every quiz `SELECT`. A missed copy
   = a bug where deleted/orphan quizzes leak into a listing (already had
   to specifically check for this while adding `/unassigned` and
   `/deleted`). → Fix: same as #1, centralize behind one query builder or
   a Postgres view (`CREATE VIEW visible_quizzes AS ...`) so visibility
   rules exist in exactly one place.

6. **Role model is additive/ad-hoc.** `staff` and `assistant` were bolted
   onto `requireRole("admin", "teacher")` calls one route at a time this
   session (quiz-import list/save/reupload, quiz stats) rather than there
   being a single "who can manage homework quizzes" policy checked in one
   place. Easy to add a new staff-facing endpoint and forget the role
   widening. → Fix: name role *groups* (e.g. `CAN_MANAGE_QUIZZES =
   ["admin","teacher","staff","assistant"]`) once in
   `middleware/authorize.ts` and reference the group, not the literal role
   list, at each route.

7. **No automated tests.** Every fix this session (ordering bug, pinyin
   leak, orphan-quiz filtering) was verified by manual curl/SSH/browser
   checks against the live VPS. There is no test suite for
   `apps/api/src/routes/*` or the SQL query layer. This is the main reason
   duplicated logic (#1) actually diverged silently instead of getting
   caught immediately.

## 4. Proposed direction

Two viable strategies were available going in: (a) migrate to an existing
open-source school/LMS platform (Moodle-style, or a lighter headless
LMS + custom frontend), or (b) keep the current bespoke Fastify/Postgres/
React stack and consolidate the duplication above. Given the current
codebase is small, fully understood, deployed, and actively used by real
students/teachers/staff, and a platform migration would mean re-modeling
all existing data (users, classes, enrollments, quizzes, attempts,
homework submissions) and retraining users on new UI, **(b) is the
recommended path**: incremental consolidation of the current stack, not a
platform swap. A full open-source LMS migration should stay a documented
option (see §6) revisited only if the consolidation below still leaves the
team unable to ship features safely.

## 5. Phased plan

**Phase 1 — stop the bleeding (query/visibility layer).**
- Extract a shared quiz-visibility query builder used by both
  `quiz.ts` and `quiz-import.ts` (student list, teacher/staff list,
  unassigned, deleted all become parameterized calls into one function,
  not four hand-written SQL strings).
- Same treatment for the `deleted_at IS NULL` / orphan-hiding predicates —
  one place, not copy-pasted per route.
- Add a minimal integration test (spin up against a test DB, or at least
  a query-builder unit test) asserting student list order == teacher list
  order for a given course, so the exact bug fixed this session can't
  silently regress.

**Phase 2 — shared API client + role policy.**
- Move a typed fetch client (using the existing `@sotam/shared` zod
  schemas for response validation) into `packages/shared`; port
  `apps/react/src/lib/api.ts` and `apps/giaovu/src/lib/api.ts` to both
  wrap it instead of maintaining separate `fetch()` logic.
- Centralize role groups in `middleware/authorize.ts`
  (`CAN_MANAGE_QUIZZES`, `CAN_VIEW_ADMIN`, etc.) and reference them at
  every route instead of literal `requireRole("admin","teacher",...)`
  lists, so widening access to a new role is a one-line change.

**Phase 3 — shared UI primitives.**
- Pull the `.gv-card` / `.gv-table` / `.btn-*` / status-badge design
  tokens out of `apps/react/src/styles.css` into a shared stylesheet (or
  a handful of shared React components — `Card`, `Table`, `Badge`,
  `Button` — in `packages/shared` or a new `packages/ui`), imported by
  both `apps/react` and `apps/giaovu`. New features (recycle bin,
  drag-reorder, upload modal) should only need styling once.

**Phase 4 — deploy unification.**
- One deploy script that: builds the affected workspace(s), runs
  `node dist/db/migrate.js` when API changed, restarts `sotam-api` when
  API changed, FTP-uploads `dist/` when a frontend changed — instead of
  the current "remember the right 3–5 commands from CLAUDE.md" workflow.
  Doesn't need full CI/CD; a single local script covering the FTP + rsync
  + ssh steps already documented in CLAUDE.md removes the main
  human-error surface (forgetting the migration step, forgetting to clear
  `dist/db/migrations` first, etc.).

**Phase 5 (optional, only if Phase 1–4 aren't enough) — role/app split
enforcement.** If `staff`/`assistant` fully move onto `apps/giaovu` and
teachers/students/admins stay on `apps/react`, consider enforcing that at
login (redirect by role to the right subdomain) rather than leaving both
apps able to serve overlapping roles, which is what's driving the
duplicated-listing/duplicated-styling problem in the first place.

## 6. Alternative considered: migrate to an open-source LMS

Not recommended now (see §4), but kept here as the documented fallback:
a headless/self-hostable open-source LMS (course + user + assignment
model) behind a thin custom quiz-player frontend, replacing
`apps/api`'s bespoke `users/classes/enrollments/quizzes/quiz_attempts/
homework_*` schema with the LMS's data model, and importing existing
Postgres data via a one-time migration script. Trade-off: gains
maintained auth/roles/gradebook/course infrastructure and community
plugins, but costs a full data migration, UI rebuild (current quiz-player
UX — drag-drop MCQ options, pinyin-annotated Chinese text, per-character
tone display — is fairly bespoke to this app's Vietnamese-HSK-Chinese
teaching use case and unlikely to exist in an off-the-shelf LMS), and
re-training every existing student/teacher/staff account. Revisit if the
consolidation phases above prove insufficient to keep the two-frontend,
one-backend shape maintainable.

## 7. Non-goals

- Not migrating away from raw SQL (`pg`) to an ORM — current query
  patterns are fine, the problem is duplication, not the lack of an ORM.
- Not merging `apps/react` and `apps/giaovu` into one Vite app/one
  deployed origin — they intentionally serve different audiences
  (public marketing/games pages live in `apps/react` and shouldn't be
  staff-portal-branded); the goal is shared *code*, not shared *deploy*.
- Not touching `apps/vanilla` (testpage) — unrelated legacy/marketing
  surface, out of scope here.
