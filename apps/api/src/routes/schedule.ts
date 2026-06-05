import type { FastifyInstance } from "fastify";
import { getSchedule, clearScheduleCache } from "../services/schedule.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

export async function scheduleRoutes(app: FastifyInstance) {
  // Public — landing page reads this for the schedule table.
  app.get("/", async (_req, reply) => {
    try {
      const rows = await getSchedule();
      return reply.send({ rows, source: process.env.SCHEDULE_CSV_URL ? "sheet" : "empty" });
    } catch (err) {
      return reply.status(503).send({ error: "SCHEDULE_FETCH_FAILED", message: (err as Error).message });
    }
  });

  // Admin can bust the 5-min cache to pull a fresh copy immediately after editing the sheet.
  app.post(
    "/refresh",
    { preHandler: [authenticate, requireRole("admin")] },
    async () => {
      clearScheduleCache();
      const rows = await getSchedule();
      return { ok: true, rows };
    },
  );
}
