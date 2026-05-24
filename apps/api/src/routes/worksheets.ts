import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/authenticate.js";

const SaveBody = z.object({
  fields: z.record(z.string(), z.string()),
});

export async function worksheetRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get<{ Params: { lessonId: string } }>("/:lessonId", async (req, reply) => {
    const { rows } = await query<{ fields: Record<string, string>; saved_at: Date }>(
      `SELECT fields, saved_at FROM worksheets WHERE user_id = $1 AND lesson_id = $2`,
      [req.user.uid, req.params.lessonId],
    );
    if (!rows[0]) return reply.send(null);
    return { fields: rows[0].fields, savedAt: rows[0].saved_at };
  });

  app.put<{ Params: { lessonId: string }; Body: unknown }>("/:lessonId", async (req, reply) => {
    const parsed = SaveBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });

    await query(
      `INSERT INTO worksheets (user_id, lesson_id, fields, saved_at)
       VALUES ($1, $2, $3::jsonb, now())
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET
         fields   = EXCLUDED.fields,
         saved_at = now()`,
      [req.user.uid, req.params.lessonId, JSON.stringify(parsed.data.fields)],
    );
    return reply.send({ ok: true });
  });
}
