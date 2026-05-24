import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query, withTransaction } from "../db/index.js";
import { authenticate } from "../middleware/authenticate.js";

const RecordBody = z.object({
  score: z.number().nullable().optional(),
  durationSec: z.number().nullable().optional(),
  completed: z.boolean().optional(),
});

interface ProgressRow {
  lesson_id: string;
  first_seen_at: string;
  last_seen_at: string;
  attempts: number;
  best_score: number | null;
  last_score: number | null;
  completed: boolean;
  score_history: Array<{ score: number | null; durationSec: number | null; at: number }>;
}

function rowToApiProgress(row: ProgressRow) {
  return {
    lessonId: row.lesson_id,
    firstSeenAt: Number(row.first_seen_at),
    lastSeenAt: Number(row.last_seen_at),
    attempts: row.attempts,
    bestScore: row.best_score,
    lastScore: row.last_score,
    completed: row.completed,
    scoreHistory: row.score_history,
  };
}

export async function progressRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // GET /progress — list all progress rows for the current user (replaces listProgress()).
  app.get("/", async (req) => {
    const { rows } = await query<ProgressRow>(
      `SELECT lesson_id, first_seen_at, last_seen_at, attempts, best_score,
              last_score, completed, score_history
         FROM progress
        WHERE user_id = $1
        ORDER BY last_seen_at DESC`,
      [req.user.uid],
    );
    return rows.map(rowToApiProgress);
  });

  // GET /progress/summary/courses — aggregated per-course completion (replaces _summary/courses doc + onProgressWrite Cloud Function).
  app.get("/summary/courses", async (req) => {
    const { rows } = await query<{ course_id: string | null; completed: number; total: number; last_seen_at: string | null }>(
      `SELECT l.course_id,
              COUNT(*) FILTER (WHERE p.completed) AS completed,
              (SELECT COUNT(*) FROM lessons l2 WHERE l2.course_id = l.course_id) AS total,
              MAX(p.last_seen_at) AS last_seen_at
         FROM progress p
         JOIN lessons l ON l.id = p.lesson_id
        WHERE p.user_id = $1
        GROUP BY l.course_id`,
      [req.user.uid],
    );
    const summary: Record<string, { completed: number; total: number; lastSeenAt: number | null }> = {};
    for (const r of rows) {
      if (!r.course_id) continue;
      summary[r.course_id] = {
        completed: Number(r.completed),
        total: Number(r.total),
        lastSeenAt: r.last_seen_at ? Number(r.last_seen_at) : null,
      };
    }
    return summary;
  });

  // POST /progress/:lessonId — record one attempt (replaces recordAttempt()).
  app.post<{ Params: { lessonId: string }; Body: unknown }>("/:lessonId", async (req, reply) => {
    const parsed = RecordBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });

    const { score, durationSec, completed } = parsed.data;
    const now = Date.now();

    const result = await withTransaction(async (client) => {
      const existing = await client.query<ProgressRow>(
        `SELECT * FROM progress WHERE user_id = $1 AND lesson_id = $2`,
        [req.user.uid, req.params.lessonId],
      );

      const prev = existing.rows[0];
      const firstSeenAt = prev ? Number(prev.first_seen_at) : now;
      const attempts = (prev?.attempts ?? 0) + 1;
      const bestScore = Math.max(prev?.best_score ?? -1, score ?? 0);
      const lastScore = score ?? null;
      const newCompleted = !!completed || !!prev?.completed;
      const history = [
        ...(prev?.score_history ?? []).slice(-19),
        { score: score ?? null, durationSec: durationSec ?? null, at: now },
      ];

      const upsert = await client.query<ProgressRow>(
        `INSERT INTO progress
           (user_id, lesson_id, first_seen_at, last_seen_at, attempts, best_score, last_score, completed, score_history)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET
           last_seen_at  = EXCLUDED.last_seen_at,
           attempts      = EXCLUDED.attempts,
           best_score    = EXCLUDED.best_score,
           last_score    = EXCLUDED.last_score,
           completed     = EXCLUDED.completed,
           score_history = EXCLUDED.score_history,
           updated_at    = now()
         RETURNING *`,
        [
          req.user.uid,
          req.params.lessonId,
          firstSeenAt,
          now,
          attempts,
          bestScore < 0 ? null : bestScore,
          lastScore,
          newCompleted,
          JSON.stringify(history),
        ],
      );
      return upsert.rows[0];
    });

    return rowToApiProgress(result);
  });
}
