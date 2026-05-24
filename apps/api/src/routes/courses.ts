import type { FastifyInstance } from "fastify";
import { query } from "../db/index.js";

interface CourseRow {
  id: string;
  title: string;
  subtitle: string | null;
  color: string | null;
  order: number;
}

export async function courseRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const { rows } = await query<CourseRow>(
      `SELECT id, title, subtitle, color, "order"
         FROM courses
        ORDER BY "order"`,
    );

    const courses = await Promise.all(
      rows.map(async (c) => {
        const lessonIds = await query<{ id: string }>(
          `SELECT id FROM lessons WHERE course_id = $1 ORDER BY "order"`,
          [c.id],
        );
        return { ...c, lessonIds: lessonIds.rows.map((r) => r.id) };
      }),
    );

    return courses;
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const { rows } = await query<CourseRow>(
      `SELECT id, title, subtitle, color, "order" FROM courses WHERE id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return reply.status(404).send({ error: "Course not found" });

    const lessonIds = await query<{ id: string }>(
      `SELECT id FROM lessons WHERE course_id = $1 ORDER BY "order"`,
      [req.params.id],
    );

    return { ...rows[0], lessonIds: lessonIds.rows.map((r) => r.id) };
  });

  app.get<{ Params: { id: string } }>("/:id/lessons", async (req) => {
    const { rows } = await query<{ id: string; data: unknown }>(
      `SELECT id, data FROM lessons WHERE course_id = $1 ORDER BY "order"`,
      [req.params.id],
    );
    return rows.map((r) => r.data);
  });
}
