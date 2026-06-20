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
const PYTHON_BIN = process.env.PYTHON_BIN ?? "python3";

export async function quizImportRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("admin", "teacher"));

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

  // List saved quizzes, optionally filtered by courseId.
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
        GROUP BY q.id
        ORDER BY q.created_at DESC`,
      [courseId ?? null],
    );
    return reply.send(rows);
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
    };

    const { quiz, courseId } = body;
    if (!quiz?.slug || !quiz?.title) {
      return reply.code(400).send({ error: "Invalid quiz payload" });
    }

    // Upsert quiz row (re-upload replaces existing slug)
    const { rows } = await query<{ id: string }>(
      `INSERT INTO quizzes (slug, title, source, course_id, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title, source = EXCLUDED.source,
             course_id = EXCLUDED.course_id
       RETURNING id`,
      [quiz.slug, quiz.title, quiz.source ?? null, courseId ?? null, request.user.uid],
    );

    const quizId = rows[0].id;

    // Replace all questions for this quiz
    await query("DELETE FROM quiz_questions WHERE quiz_id = $1", [quizId]);
    for (const q of quiz.questions) {
      await query(
        `INSERT INTO quiz_questions (quiz_id, num, text, type, options, answer)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quizId, q.num, q.text, q.type, JSON.stringify(q.options), q.answer ?? null],
      );
    }

    return reply.send({ id: quizId, slug: quiz.slug });
  });
}
