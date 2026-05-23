# Hanai Lab — Mandarin Course Platform

Vietnamese-language Mandarin learning platform on Firebase. The legacy site is a tree of ~119 standalone HTML pages with hardcoded data; this rebuild consolidates every kind of lesson into **16 interaction engines**, sources content from human-editable YAML files, persists progress in Firestore, and ships two independent front-ends:

- **`apps/vanilla`** — jQuery + native modules + Firebase web SDK; deployed as static files. Lightweight, no build step. *Easy authoring path.*
- **`apps/react`** — React + Vite + TypeScript. Production student-facing UX.

Both consume the same Firestore content and share progress.

## Repository layout

```
chuxin/
├─ apps/
│  ├─ vanilla/                # Static jQuery app (Firebase Hosting target: vanilla)
│  └─ react/                  # Vite SPA           (Firebase Hosting target: app)
├─ content/yaml/           # SOURCE OF TRUTH for lesson data (YAML)
│  ├─ han1/  han2/  han3/  han4/
├─ content/hypertext/           # Original site, untouched, kept for reference
│  ├─ han1/  han2/  han3/  han4/
├─ packages/shared/           # Zod lesson schema + tone-aware compare; both apps
├─ scripts/                   # YAML → Firestore sync; legacy HTML extractor
├─ functions/                 # Cloud Functions (progress roll-ups, teacher claim)                
└─ firebase.json              # Multi-site Hosting + Firestore + Functions
```

## Interaction engines

| ID | Vanilla | React | Source-of-truth example |
|---|---|---|---|
| `flashcard` | `apps/vanilla/engines/flashcard.js` | `apps/react/src/engines/Flashcard.tsx` | [content/yaml/han1/bai1-flashcard.yml](content/yaml/han1/bai1-flashcard.yml) |
| `mcq` | `engines/mcq.js` | `Mcq.tsx` | [han1/bai2-mcq.yml](content/yaml/han1/bai2-mcq.yml) |
| `fill-blank` | `engines/fill-blank.js` | `FillBlank.tsx` | [han1/bai3-fill-blank.yml](content/yaml/han1/bai3-fill-blank.yml) |
| `translate` | `engines/translate.js` | `Translate.tsx` | [han1/bai4-translate.yml](content/yaml/han1/bai4-translate.yml) |
| `match-pairs` | `engines/match-pairs.js` | `MatchPairs.tsx` | [han1/bai5-match-pairs.yml](content/yaml/han1/bai5-match-pairs.yml) |
| `counting-grid` | `engines/counting-grid.js` | `CountingGrid.tsx` | [han1/bai6-counting-grid.yml](content/yaml/han1/bai6-counting-grid.yml) |
| `worksheet` | `engines/worksheet.js` | `Worksheet.tsx` | [han1/bai7-worksheet.yml](content/yaml/han1/bai7-worksheet.yml) |
| `listen-pick` | `engines/listen-pick.js` | `ListenPick.tsx` | [han1/bai8-listen-pick.yml](content/yaml/han1/bai8-listen-pick.yml) |
| `listen-tf` | `engines/listen-tf.js` | `ListenTf.tsx` | [han2/bai16-listen-tf.yml](content/yaml/han2/bai16-listen-tf.yml) |
| `reading-toggle` | `engines/reading-toggle.js` | `ReadingToggle.tsx` | [han2/bai17-reading-toggle.yml](content/yaml/han2/bai17-reading-toggle.yml) |
| `lucky-draw` | `engines/lucky-draw.js` | `LuckyDraw.tsx` | [han2/bai18-lucky-draw.yml](content/yaml/han2/bai18-lucky-draw.yml) |
| `dialogue` | `engines/dialogue.js` | `Dialogue.tsx` | [han2/bai19-dialogue.yml](content/yaml/han2/bai19-dialogue.yml) |
| `reading-tooltip` | `engines/reading-tooltip.js` | `ReadingTooltip.tsx` | [han3/bai1-reading-tooltip.yml](content/yaml/han3/bai1-reading-tooltip.yml) |
| `grammar-tabs` | `engines/grammar-tabs.js` | `GrammarTabs.tsx` | [han4/bai1-grammar-tabs.yml](content/yaml/han4/bai1-grammar-tabs.yml) |
| `role-play` | `engines/role-play.js` | `RolePlay.tsx` | [han4/bai2-role-play.yml](content/yaml/han4/bai2-role-play.yml) |
| `debate` | `engines/debate.js` | `Debate.tsx` | [han4/bai3-debate.yml](content/yaml/han4/bai3-debate.yml) |

The schema for every engine lives in [packages/shared/src/lesson.ts](packages/shared/src/lesson.ts) as a Zod discriminated union — that file is the single source of truth.

## Adding a new lesson

1. **Pick an interaction type** from the table above.
2. **Copy the example YAML** for that type into `content/yaml/<course>/<your-id>.yml`.
3. **Edit** the fields. Required common fields: `id`, `course`, `order`, `title`, `interactionType`. Engine-specific fields are documented inline in [packages/shared/src/lesson.ts](packages/shared/src/lesson.ts).
4. **Sync to Firestore**:
   ```bash
   pnpm sync:emulator       # local emulator
   pnpm sync                # production project
   ```
   The script validates every YAML against the Zod schema and refuses to push if anything is malformed. Errors point at the specific file and field.

That's it — both apps will see the new lesson on the next page load.

> Tip: you can keep work-in-progress drafts as `*.draft.yml`. The sync script ignores them.

## Migrating a legacy lesson

There's a one-shot extractor that scrapes `content/hypertext/**/*.html` into draft YAMLs:

```bash
pnpm extract --course=han1                    # whole course
pnpm extract --file=content/hypertext/han2/bai18.html  # one file
```

Drafts are written to `content/yaml/<course>/<filename>.draft.yml` with a `// REVIEW` flag and high `order` values so they sort after curated lessons. Inspect, edit, and rename to `.yml` to include in the next sync.

## Running locally

```bash
pnpm install
firebase emulators:start                # Auth, Firestore, Functions, Hosting
pnpm sync:emulator                      # nudge YAMLs into the local Firestore

# Vanilla (separate terminal): served by emulator on port 5000
open http://127.0.0.1:5000

# React: dev server on 5173
VITE_USE_EMULATOR=true pnpm --filter react dev
```

## Configuration

The Firebase web config is checked in as a placeholder (`apps/vanilla/shared/firebase-config.js` and the `VITE_FB_*` env-var defaults in `apps/react/src/lib/firebase.ts`). Replace with your project's values before deploying.

To grant teacher privileges (write access to `/lessons` + `/courses`), edit the `TEACHER_EMAILS` allowlist in [functions/src/grant-teacher-claim.ts](functions/src/grant-teacher-claim.ts) and redeploy functions. The user's first sign-in receives the `role: "teacher"` custom claim, which the Firestore rules check.

## Verification (v1 acceptance)

1. **Schema check** — `pnpm sync:emulator` succeeds; all 16 sample YAMLs validate.
2. **Vanilla walk-through** — open every sample lesson at `http://127.0.0.1:5000/lesson?id=<lessonId>`, complete it, confirm a doc appears under `/users/{uid}/progress/{lessonId}` in the Firestore emulator UI.
3. **React walk-through** — same 16 lessons via the Vite dev server.
4. **Auth & rules** — in the emulator, sign in as a non-teacher, attempt to write `/lessons/foo` → blocked. Sign in with the teacher email → allowed.
5. **Audio** — `listen-pick` and `listen-tf` lessons play their Cloudinary URLs; the placeholder URLs in the sample YAMLs need real audio files for the v1 demo.
6. **Authoring loop** — change one YAML field, rerun `pnpm sync:emulator`, hard-refresh both apps, confirm the change appears.

When all six pass, v1 is ready. Migration of the remaining ~100 legacy lessons is unblocked: it's now a content-entry task in `content/yaml/`, not a code task.

## Deploy

```bash
pnpm build
firebase deploy --only firestore:rules,firestore:indexes,functions
firebase deploy --only hosting:vanilla
firebase deploy --only hosting:app
```

Configure the two Hosting targets in `.firebaserc`:

```bash
firebase target:apply hosting vanilla <vanilla-site-id>
firebase target:apply hosting app <app-site-id>
```
