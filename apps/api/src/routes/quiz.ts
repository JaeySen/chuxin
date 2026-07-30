import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { query } from "../db/index.js";

export async function quizRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // ── List quizzes for a course ────────────────────────────────────────────────
  // Students: filtered by course + teacher of their class (teacherId param).
  // Teachers/admins: filtered by course + their own uploads (created_by).
  app.get("/", async (request, reply) => {
    const { courseId, teacherId } = request.query as { courseId?: string; teacherId?: string };
    const role = request.user.role;

    let createdByFilter: string | null = null;
    if (role === "student") {
      createdByFilter = teacherId ?? null;
    } else if (role === "teacher") {
      createdByFilter = request.user.uid;
    }
    // admin: no created_by filter

    const { rows } = await query<{
      id: string; slug: string; title: string; course_id: string | null; created_at: string;
      total: number; mcq: number; open: number;
    }>(
      `SELECT q.id, q.slug, q.title, q.course_id, q.created_at,
              COUNT(qq.id)::int                                  AS total,
              COUNT(qq.id) FILTER (WHERE qq.type = 'mcq')::int  AS mcq,
              COUNT(qq.id) FILTER (WHERE qq.type = 'open')::int AS open
         FROM quizzes q
         LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
        WHERE ($1::text IS NULL OR q.course_id = $1)
          AND ($2::uuid IS NULL OR q.created_by = $2::uuid)
        GROUP BY q.id
        ORDER BY q.sort_order NULLS LAST, q.created_at ASC`,
      [courseId ?? null, createdByFilter ?? null],
    );
    return reply.send(rows.map((r) => ({
      id: r.id, slug: r.slug, title: r.title,
      courseId: r.course_id,
      total: r.total, mcq: r.mcq, open: r.open,
      createdAt: r.created_at,
    })));
  });

  // ── Full quiz with questions ─────────────────────────────────────────────────
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { rows: [quiz] } = await query<{ id: string; slug: string; title: string; course_id: string | null }>(
      `SELECT id, slug, title, course_id FROM quizzes WHERE id = $1`,
      [id],
    );
    if (!quiz) return reply.code(404).send({ error: "Not found" });

    const { rows: questions } = await query<{
      num: number; text: string; type: string; options: unknown; answer: string | null; meta: unknown;
    }>(
      `SELECT num, text, type, options, answer, meta FROM quiz_questions WHERE quiz_id = $1 ORDER BY num`,
      [id],
    );
    return reply.send({ ...quiz, courseId: quiz.course_id, questions });
  });

  // ── Start or resume an attempt ───────────────────────────────────────────────
  // Returns the latest incomplete attempt (or creates one).
  // If the latest attempt is completed, creates a fresh one.
  app.post("/:id/start", async (request, reply) => {
    const { id: quizId } = request.params as { id: string };
    const studentId = request.user.uid;

    // Check quiz exists
    const { rows: [quiz] } = await query<{ id: string; total_mcq: number }>(
      `SELECT q.id, COUNT(qq.id) FILTER (WHERE qq.type = 'mcq')::int AS total_mcq
         FROM quizzes q
         LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
        WHERE q.id = $1
        GROUP BY q.id`,
      [quizId],
    );
    if (!quiz) return reply.code(404).send({ error: "Not found" });

    // Get latest attempt
    const { rows: [existing] } = await query<{
      id: string; completed_at: string | null; last_question_num: number; score: number; total_mcq: number;
    }>(
      `SELECT id, completed_at, last_question_num, score, total_mcq
         FROM quiz_attempts
        WHERE quiz_id = $1 AND student_id = $2
        ORDER BY started_at DESC LIMIT 1`,
      [quizId, studentId],
    );

    let attemptId: string;
    if (!existing || existing.completed_at) {
      // Create fresh attempt
      const { rows: [created] } = await query<{ id: string }>(
        `INSERT INTO quiz_attempts (quiz_id, student_id, total_mcq)
         VALUES ($1, $2, $3) RETURNING id`,
        [quizId, studentId, quiz.total_mcq],
      );
      attemptId = created.id;
    } else {
      attemptId = existing.id;
    }

    // Load answered questions for this attempt
    const { rows: answers } = await query<{
      question_num: number; selected_answer: string; is_correct: boolean;
    }>(
      `SELECT question_num, selected_answer, is_correct
         FROM quiz_attempt_answers
        WHERE attempt_id = $1
        ORDER BY question_num`,
      [attemptId],
    );

    const attempt = existing && !existing.completed_at ? existing : null;

    return reply.send({
      attemptId,
      lastQuestionNum: attempt?.last_question_num ?? 0,
      score: attempt?.score ?? 0,
      completed: false,
      answers: answers.map((a) => ({
        questionNum: a.question_num,
        selected: a.selected_answer,
        isCorrect: a.is_correct,
      })),
    });
  });

  // ── Record an answer ─────────────────────────────────────────────────────────
  app.post("/attempts/:attemptId/answer", async (request, reply) => {
    const { attemptId } = request.params as { attemptId: string };
    const { questionNum, selected, isCorrect, reactionMs, nextQuestionNum } =
      request.body as {
        questionNum: number;
        selected: string;
        isCorrect: boolean;
        reactionMs: number | null;
        nextQuestionNum: number | null; // num of the next question being shown; null if last
      };

    // Upsert answer
    await query(
      `INSERT INTO quiz_attempt_answers (attempt_id, question_num, selected_answer, is_correct, reaction_ms)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (attempt_id, question_num) DO UPDATE
         SET selected_answer = EXCLUDED.selected_answer,
             is_correct = EXCLUDED.is_correct,
             reaction_ms = EXCLUDED.reaction_ms,
             answered_at = now()`,
      [attemptId, questionNum, selected, isCorrect, reactionMs ?? null],
    );

    // Update attempt: recalculate score + advance last_question_num
    await query(
      `UPDATE quiz_attempts
          SET score = (
                SELECT COUNT(*) FROM quiz_attempt_answers
                 WHERE attempt_id = $1 AND is_correct = true
              ),
              last_question_num = COALESCE($2, last_question_num)
        WHERE id = $1`,
      [attemptId, nextQuestionNum ?? null],
    );

    return reply.send({ ok: true });
  });

  // ── Complete an attempt ──────────────────────────────────────────────────────
  app.post("/attempts/:attemptId/complete", async (request, reply) => {
    const { attemptId } = request.params as { attemptId: string };

    const { rows: [attempt] } = await query<{ id: string; score: number; total_mcq: number }>(
      `UPDATE quiz_attempts SET completed_at = now()
        WHERE id = $1 RETURNING id, score, total_mcq`,
      [attemptId],
    );
    if (!attempt) return reply.code(404).send({ error: "Not found" });

    return reply.send({ score: attempt.score, totalMcq: attempt.total_mcq });
  });

  // ── Teacher: per-student stats for a quiz ────────────────────────────────────
  app.get("/:id/stats", { preHandler: requireRole("teacher", "admin", "staff", "assistant") }, async (request, reply) => {
    const { id: quizId } = request.params as { id: string };

    const { rows } = await query<{
      student_id: string; display_name: string; email: string;
      score: number; total_mcq: number;
      started_at: string; completed_at: string | null;
      avg_reaction_ms: number | null; answered_count: number;
    }>(
      `SELECT
          u.id AS student_id, u.display_name, u.email,
          a.score, a.total_mcq, a.started_at, a.completed_at,
          ROUND(AVG(ans.reaction_ms))::int  AS avg_reaction_ms,
          COUNT(ans.id)::int                AS answered_count
         FROM quiz_attempts a
         JOIN users u ON u.id = a.student_id
         LEFT JOIN quiz_attempt_answers ans ON ans.attempt_id = a.id
        WHERE a.quiz_id = $1
        GROUP BY u.id, u.display_name, u.email, a.score, a.total_mcq, a.started_at, a.completed_at
        ORDER BY a.completed_at DESC NULLS LAST, a.started_at DESC`,
      [quizId],
    );

    return reply.send(rows.map((r) => ({
      studentId: r.student_id,
      name: r.display_name,
      email: r.email,
      score: r.score,
      totalMcq: r.total_mcq,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      avgReactionMs: r.avg_reaction_ms,
      answeredCount: r.answered_count,
    })));
  });
}
