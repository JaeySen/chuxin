import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { query } from "../db/index.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createWriteStream, unlink } from "node:fs";
import { pipeline } from "node:stream/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const execFileAsync = promisify(execFile);
const unlinkAsync = promisify(unlink);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../");
const PARSE_SCRIPT = join(REPO_ROOT, "scripts", "parse_quiz.py");
const POPULATE_PINYIN_SCRIPT = join(REPO_ROOT, "scripts", "populate_pinyin.py");
const PYTHON_BIN = process.env.PYTHON_BIN ?? "python3";

// Fire-and-log: (re)compute per-character pinyin meta for a quiz's questions.
// Non-blocking failures are logged but never fail the save/reupload request.
async function populatePinyinForQuiz(quizId: string, log: { error: (obj: unknown, msg: string) => void }) {
  try {
    await execFileAsync(PYTHON_BIN, [POPULATE_PINYIN_SCRIPT, "--quiz-id", quizId], { timeout: 60_000 });
  } catch (err) {
    log.error({ err, quizId }, "populate_pinyin failed");
  }
}

export async function quizImportRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  // giaovu portal staff/assistants manage homework quizzes too, not just teachers/admins
  app.addHook("preHandler", requireRole("admin", "teacher", "staff", "assistant"));

  app.post("/parse", async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: "No file uploaded" });

    const ext = data.filename.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "docx"].includes(ext)) {
      return reply.code(400).send({ error: "Only PDF and DOCX files are supported" });
    }

    const tmpPath = join(tmpdir(), `quiz-upload-${Date.now()}.${ext}`);

    try {
      await pipeline(data.file, createWriteStream(tmpPath));

      const { stdout } = await execFileAsync(
        PYTHON_BIN,
        [PARSE_SCRIPT, "--stdout", tmpPath],
        { timeout: 60_000 },
      );

      const parsed = JSON.parse(stdout);
      return reply.send(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      request.log.error({ err }, "quiz parse failed");
      return reply.code(500).send({ error: "Parse failed", detail: msg });
    } finally {
      unlinkAsync(tmpPath).catch(() => {});
    }
  });

  // List saved quizzes, optionally filtered by courseId. Quizzes with no
  // course (course_id IS NULL) are orphans — they're hidden from this
  // general listing (so they don't clutter per-course/"all" tabs in the
  // giaovu homework page) and only surfaced via GET /unassigned below,
  // where an admin can assign them a course or delete them.
  app.get("/", async (request, reply) => {
    const { courseId } = request.query as { courseId?: string };
    const { rows } = await query<{
      id: string; slug: string; title: string; source: string | null;
      course_id: string | null; created_at: string;
      total: number; mcq: number; open: number;
    }>(
      `SELECT q.id, q.slug, q.title, q.source, q.course_id, q.created_at,
              COUNT(qq.id)::int                                    AS total,
              COUNT(qq.id) FILTER (WHERE qq.type = 'mcq')::int    AS mcq,
              COUNT(qq.id) FILTER (WHERE qq.type = 'open')::int   AS open
         FROM quizzes q
         LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
        WHERE ($1::text IS NULL OR q.course_id = $1)
          AND q.course_id IS NOT NULL
          AND q.deleted_at IS NULL
        GROUP BY q.id
        ORDER BY q.sort_order NULLS LAST, q.created_at ASC`,
      [courseId ?? null],
    );
    return reply.send(rows);
  });

  // Persist a manual drag-and-drop order for all exercises within one course.
  // Body: { courseId: string, quizIds: string[] }  (ordered top-to-bottom).
  // Teachers may reorder within courses they can see; admins may reorder any.
  app.post("/reorder", async (request, reply) => {
    const { courseId, quizIds } = request.body as { courseId?: string; quizIds?: string[] };
    if (!courseId || !Array.isArray(quizIds) || quizIds.length === 0) {
      return reply.code(400).send({ error: "courseId and quizIds are required" });
    }

    // Guard: every id must belong to this course and not be deleted, so a stray
    // client-side id can't silently move a quiz out of its course ordering.
    const { rows: owned } = await query<{ id: string }>(
      `SELECT id FROM quizzes WHERE course_id = $1 AND deleted_at IS NULL AND id = ANY($2::uuid[])`,
      [courseId, quizIds],
    );
    const ownedIds = new Set(owned.map((r) => r.id));
    const filtered = quizIds.filter((id) => ownedIds.has(id));
    if (filtered.length === 0) return reply.code(404).send({ error: "No matching quizzes in course" });

    await Promise.all(
      filtered.map((id, idx) => query(`UPDATE quizzes SET sort_order = $2 WHERE id = $1`, [id, idx])),
    );
    return reply.send({ ok: true });
  });

  // ── Unassigned quizzes (admin only) ───────────────────────────────────────────
  // Quizzes with no course_id — usually left behind by an old/removed course or
  // an import that never got assigned. Surfaced on the admin dashboard so an
  // admin can assign them a course or delete them; hidden from the normal
  // GET / listing so they don't clutter the giaovu homework page.
  app.get("/unassigned", { preHandler: requireRole("admin") }, async (_request, reply) => {
    const { rows } = await query<{
      id: string; slug: string; title: string; source: string | null;
      created_at: string; created_by_name: string | null;
      total: number; mcq: number; open: number;
    }>(
      `SELECT q.id, q.slug, q.title, q.source, q.created_at,
              creator.display_name AS created_by_name,
              COUNT(qq.id)::int                                    AS total,
              COUNT(qq.id) FILTER (WHERE qq.type = 'mcq')::int    AS mcq,
              COUNT(qq.id) FILTER (WHERE qq.type = 'open')::int   AS open
         FROM quizzes q
         LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
         LEFT JOIN users creator ON creator.id = q.created_by
        WHERE q.course_id IS NULL AND q.deleted_at IS NULL
        GROUP BY q.id, creator.display_name
        ORDER BY q.created_at DESC`,
    );
    return reply.send(rows);
  });

  // ── Recycle bin (admin only) ──────────────────────────────────────────────────
  // List soft-deleted quizzes. Metadata only — no questions/answers are exposed,
  // so admins can decide to restore without being able to view/try the content.
  app.get("/deleted", { preHandler: requireRole("admin") }, async (_request, reply) => {
    const { rows } = await query<{
      id: string; slug: string; title: string; source: string | null;
      course_id: string | null; created_at: string; deleted_at: string;
      created_by_name: string | null; deleted_by_name: string | null;
      total: number; mcq: number; open: number;
    }>(
      `SELECT q.id, q.slug, q.title, q.source, q.course_id, q.created_at, q.deleted_at,
              creator.display_name AS created_by_name,
              deleter.display_name AS deleted_by_name,
              COUNT(qq.id)::int                                    AS total,
              COUNT(qq.id) FILTER (WHERE qq.type = 'mcq')::int    AS mcq,
              COUNT(qq.id) FILTER (WHERE qq.type = 'open')::int   AS open
         FROM quizzes q
         LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
         LEFT JOIN users creator ON creator.id = q.created_by
         LEFT JOIN users deleter ON deleter.id = q.deleted_by
        WHERE q.deleted_at IS NOT NULL
        GROUP BY q.id, creator.display_name, deleter.display_name
        ORDER BY q.deleted_at DESC`,
    );
    return reply.send(rows);
  });

  // Soft-delete a quiz: moves it to the recycle bin (admin-only visibility).
  // Teachers may delete their own quizzes; admins may delete any.
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { role, uid } = request.user;

    const { rows: [quiz] } = await query<{ id: string; created_by: string | null }>(
      `SELECT id, created_by FROM quizzes WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (!quiz) return reply.code(404).send({ error: "Not found" });
    if (role !== "admin" && quiz.created_by !== uid) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    await query(
      `UPDATE quizzes SET deleted_at = now(), deleted_by = $2 WHERE id = $1`,
      [id, uid],
    );
    return reply.send({ ok: true });
  });

  // Restore a soft-deleted quiz (admin only).
  app.post("/:id/restore", { preHandler: requireRole("admin") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { rows: [row] } = await query<{ id: string }>(
      `UPDATE quizzes SET deleted_at = NULL, deleted_by = NULL
        WHERE id = $1 AND deleted_at IS NOT NULL
        RETURNING id`,
      [id],
    );
    if (!row) return reply.code(404).send({ error: "Not found in recycle bin" });
    return reply.send({ ok: true });
  });

  // Save a previously parsed quiz to the DB.
  app.post("/save", async (request, reply) => {
    const body = request.body as {
      quiz: {
        slug: string;
        title: string;
        source?: string;
        questions: { num: number; text: string; type: string; options: Record<string, string>; answer: string | null }[];
      };
      courseId?: string;
      customTitle?: string;   // teacher-supplied name; overrides parsed title if non-empty
      shared?: boolean;       // share with all teachers
    };

    const { quiz, courseId, customTitle, shared } = body;
    if (!quiz?.slug || !quiz?.title) {
      return reply.code(400).send({ error: "Invalid quiz payload" });
    }

    const finalTitle = customTitle?.trim() || quiz.title;
    // Derive slug from custom title if provided
    const finalSlug = customTitle?.trim()
      ? customTitle.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80) || quiz.slug
      : quiz.slug;

    const { rows } = await query<{ id: string }>(
      `INSERT INTO quizzes (slug, title, source, course_id, created_by, shared)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title, source = EXCLUDED.source,
             course_id = EXCLUDED.course_id, shared = EXCLUDED.shared
       RETURNING id`,
      [finalSlug, finalTitle, quiz.source ?? null, courseId ?? null, request.user.uid, shared ?? false],
    );

    const quizId = rows[0].id;

    await query("DELETE FROM quiz_questions WHERE quiz_id = $1", [quizId]);
    for (const q of quiz.questions) {
      await query(
        `INSERT INTO quiz_questions (quiz_id, num, text, type, options, answer)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quizId, q.num, q.text, q.type, JSON.stringify(q.options), q.answer ?? null],
      );
    }

    // Populate per-character pinyin meta for the new question set.
    await populatePinyinForQuiz(quizId, request.log);

    return reply.send({ id: quizId, slug: finalSlug, title: finalTitle });
  });

  // Fetch full quiz (with questions) by id.
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { rows: [quiz] } = await query<{ id: string; slug: string; title: string }>(
      `SELECT id, slug, title FROM quizzes WHERE id = $1`,
      [id],
    );
    if (!quiz) return reply.code(404).send({ error: "Not found" });

    const { rows: questions } = await query<{
      num: number; text: string; type: string; options: unknown; answer: string | null; meta: unknown;
    }>(
      `SELECT num, text, type, options, answer, meta FROM quiz_questions WHERE quiz_id = $1 ORDER BY num`,
      [id],
    );
    return reply.send({ ...quiz, questions });
  });

  // ── Re-upload: parse new PDF, snapshot old questions, replace in-place ────────
  app.post("/:id/reupload", async (request, reply) => {
    const { id: quizId } = request.params as { id: string };

    // 1. Verify quiz exists
    const { rows: [quiz] } = await query<{ id: string; title: string; source: string | null }>(
      `SELECT id, title, source FROM quizzes WHERE id = $1`,
      [quizId],
    );
    if (!quiz) return reply.code(404).send({ error: "Not found" });

    // 2. Accept uploaded file
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: "No file uploaded" });

    const ext = data.filename.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "docx"].includes(ext)) {
      return reply.code(400).send({ error: "Only PDF and DOCX files are supported" });
    }

    const tmpPath = join(tmpdir(), `quiz-reupload-${Date.now()}.${ext}`);

    try {
      await pipeline(data.file, createWriteStream(tmpPath));

      // 3. Parse
      const { stdout } = await execFileAsync(
        PYTHON_BIN,
        [PARSE_SCRIPT, "--stdout", tmpPath],
        { timeout: 60_000 },
      );
      const parsed = JSON.parse(stdout) as {
        questions: { num: number; text: string; type: string; options: Record<string, string>; answer: string | null }[];
        meta: { total: number; mcq: number; open: number };
      };

      // 4. Snapshot old questions into quiz_revisions
      const { rows: oldQuestions } = await query<{
        num: number; text: string; type: string; options: unknown; answer: string | null;
      }>(
        `SELECT num, text, type, options, answer FROM quiz_questions WHERE quiz_id = $1 ORDER BY num`,
        [quizId],
      );

      const oldMcq  = oldQuestions.filter((q) => q.type === "mcq").length;
      const oldOpen = oldQuestions.filter((q) => q.type === "open").length;

      await query(
        `INSERT INTO quiz_revisions (quiz_id, replaced_by, questions, meta)
         VALUES ($1, $2, $3::jsonb, $4::jsonb)`,
        [
          quizId,
          request.user.uid,
          JSON.stringify(oldQuestions),
          JSON.stringify({ total: oldQuestions.length, mcq: oldMcq, open: oldOpen }),
        ],
      );

      // 5. Replace questions
      await query("DELETE FROM quiz_questions WHERE quiz_id = $1", [quizId]);
      for (const q of parsed.questions) {
        await query(
          `INSERT INTO quiz_questions (quiz_id, num, text, type, options, answer)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [quizId, q.num, q.text, q.type, JSON.stringify(q.options), q.answer ?? null],
        );
      }

      // 6. Update source filename on quizzes row
      await query(
        `UPDATE quizzes SET source = $1 WHERE id = $2`,
        [data.filename, quizId],
      );

      // 7. Populate per-character pinyin meta for the new question set.
      await populatePinyinForQuiz(quizId, request.log);

      return reply.send({
        quizId,
        title: quiz.title,
        questions: parsed.questions,
        meta: parsed.meta,
        revisionSaved: true,
        previous: { total: oldQuestions.length, mcq: oldMcq, open: oldOpen },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      request.log.error({ err }, "quiz reupload failed");
      return reply.code(500).send({ error: "Re-upload failed", detail: msg });
    } finally {
      unlinkAsync(tmpPath).catch(() => {});
    }
  });

  // ── List revision history for a quiz ──────────────────────────────────────────
  app.get("/:id/revisions", async (request, reply) => {
    const { id: quizId } = request.params as { id: string };
    const { rows } = await query<{
      id: string; replaced_at: string; replaced_by_name: string | null;
      meta: { total: number; mcq: number; open: number };
    }>(
      `SELECT r.id, r.replaced_at,
              u.display_name AS replaced_by_name,
              r.meta
         FROM quiz_revisions r
         LEFT JOIN users u ON u.id = r.replaced_by
        WHERE r.quiz_id = $1
        ORDER BY r.replaced_at DESC`,
      [quizId],
    );
    return reply.send(rows);
  });

  // ── Get one revision's full question snapshot ─────────────────────────────────
  app.get("/:id/revisions/:revId", async (request, reply) => {
    const { id: quizId, revId } = request.params as { id: string; revId: string };
    const { rows: [rev] } = await query<{
      id: string; replaced_at: string; questions: unknown; meta: unknown;
    }>(
      `SELECT id, replaced_at, questions, meta
         FROM quiz_revisions
        WHERE id = $1 AND quiz_id = $2`,
      [revId, quizId],
    );
    if (!rev) return reply.code(404).send({ error: "Revision not found" });
    return reply.send(rev);
  });

  // Rename a quiz.
  app.patch("/:id/title", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { title } = request.body as { title: string };
    if (!title?.trim()) return reply.code(400).send({ error: "title required" });
    const { rows: [row] } = await query<{ id: string; title: string }>(
      `UPDATE quizzes SET title = $1 WHERE id = $2 RETURNING id, title`,
      [title.trim(), id],
    );
    if (!row) return reply.code(404).send({ error: "Not found" });
    return reply.send(row);
  });

  // Update a quiz's course assignment.
  app.patch("/:id/course", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { courseId } = request.body as { courseId: string | null };
    const { rows: [row] } = await query<{ id: string; course_id: string | null }>(
      `UPDATE quizzes SET course_id = $1 WHERE id = $2 RETURNING id, course_id`,
      [courseId ?? null, id],
    );
    if (!row) return reply.code(404).send({ error: "Not found" });
    return reply.send({ id: row.id, courseId: row.course_id });
  });
}
