import type { FastifyInstance } from "fastify";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

interface LessonRow {
  id: string;
  data: Record<string, unknown>;
}

export async function lessonRoutes(app: FastifyInstance) {
  // Lesson body content is gated — guests can see course shells but not the
  // actual hanzi/pinyin/exercises inside lessons.
  app.get("/", { preHandler: [authenticate] }, async () => {
    const { rows } = await query<LessonRow>(
      `SELECT id, data FROM lessons ORDER BY course_id, "order"`,
    );
    return rows.map((r) => r.data);
  });

  app.get<{ Params: { id: string } }>("/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const { rows } = await query<LessonRow>(
      `SELECT id, data FROM lessons WHERE id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return reply.status(404).send({ error: "Lesson not found" });
    return rows[0].data;
  });

  // Teacher-only write endpoint (replaces firestore.rules write check).
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/:id",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      const body = req.body;
      const courseId = typeof body.course === "string" ? body.course : null;
      const order = typeof body.order === "number" ? body.order : 0;
      const title = typeof body.title === "string" ? body.title : "Untitled";
      const subtitle = typeof body.subtitle === "string" ? body.subtitle : null;
      const interactionType = typeof body.interactionType === "string" ? body.interactionType : null;
      if (!interactionType) return reply.status(400).send({ error: "interactionType is required" });

      await query(
        `INSERT INTO lessons (id, course_id, "order", title, subtitle, interaction_type, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now())
         ON CONFLICT (id) DO UPDATE SET
           course_id = EXCLUDED.course_id,
           "order"   = EXCLUDED."order",
           title     = EXCLUDED.title,
           subtitle  = EXCLUDED.subtitle,
           interaction_type = EXCLUDED.interaction_type,
           data      = EXCLUDED.data,
           updated_at = now()`,
        [req.params.id, courseId, order, title, subtitle, interactionType, body],
      );
      return reply.send({ ok: true });
    },
  );
}
