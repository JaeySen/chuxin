import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { getAllSettings, setSetting } from "../services/settings.js";
import { unlockUser, recordAuthEvent } from "../services/auth.js";

const SettingsPatchBody = z.object({
  enforce_cross_ip_lock: z.boolean().optional(),
});

interface AuthEventRow {
  id: number;
  user_id: string;
  user_email: string;
  user_locked: boolean;
  event_type: string;
  attempted_ip: string | null;
  attempted_user_agent: string | null;
  existing_session_ip: string | null;
  resolved: boolean;
  resolved_at: Date | null;
  note: string | null;
  created_at: Date;
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("admin"));

  // ── Settings ────────────────────────────────────────────
  app.get("/settings", async () => {
    return await getAllSettings();
  });

  app.patch("/settings", async (req, reply) => {
    const parsed = SettingsPatchBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });
    for (const [key, value] of Object.entries(parsed.data)) {
      await setSetting(key, value);
    }
    return await getAllSettings();
  });

  // ── Auth events ─────────────────────────────────────────
  app.get<{ Querystring: { resolved?: string; limit?: string } }>("/auth-events", async (req) => {
    const showResolved = req.query.resolved === "true";
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const { rows } = await query<AuthEventRow>(
      `SELECT e.id, e.user_id, u.email AS user_email, u.locked AS user_locked,
              e.event_type, e.attempted_ip, e.attempted_user_agent, e.existing_session_ip,
              e.resolved, e.resolved_at, e.note, e.created_at
         FROM auth_events e
         JOIN users u ON u.id = e.user_id
        WHERE ($1::bool OR e.resolved = false)
        ORDER BY e.created_at DESC
        LIMIT $2`,
      [showResolved, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email,
      userLocked: r.user_locked,
      eventType: r.event_type,
      attemptedIp: r.attempted_ip,
      attemptedUserAgent: r.attempted_user_agent,
      existingSessionIp: r.existing_session_ip,
      resolved: r.resolved,
      resolvedAt: r.resolved_at,
      note: r.note,
      createdAt: r.created_at,
    }));
  });

  app.post<{ Params: { id: string }; Body: { note?: string } }>(
    "/auth-events/:id/unlock",
    async (req, reply) => {
      const { rows } = await query<{ user_id: string }>(
        "SELECT user_id FROM auth_events WHERE id = $1",
        [req.params.id],
      );
      const ev = rows[0];
      if (!ev) return reply.status(404).send({ error: "Event not found" });

      await unlockUser(ev.user_id);
      await query(
        `UPDATE auth_events SET resolved = true, resolved_at = now(), resolved_by = $2, note = $3
         WHERE id = $1`,
        [req.params.id, req.user.uid, req.body?.note ?? null],
      );
      await recordAuthEvent({
        userId: ev.user_id,
        eventType: "admin_unlock",
        resolvedBy: req.user.uid,
        note: req.body?.note ?? "Unlocked from admin dashboard",
      });
      return { ok: true };
    },
  );

  // ── User management ─────────────────────────────────────
  app.get("/users", async () => {
    const { rows } = await query<{
      id: string; email: string; display_name: string; role: string;
      locked: boolean; locked_at: Date | null; locked_reason: string | null;
      created_at: Date;
    }>(
      `SELECT id, email, display_name, role, locked, locked_at, locked_reason, created_at
         FROM users ORDER BY created_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id, email: r.email, displayName: r.display_name, role: r.role,
      locked: r.locked, lockedAt: r.locked_at, lockedReason: r.locked_reason,
      createdAt: r.created_at,
    }));
  });

  app.post<{ Params: { id: string } }>("/users/:id/unlock", async (req) => {
    await unlockUser(req.params.id);
    await recordAuthEvent({
      userId: req.params.id,
      eventType: "admin_unlock",
      resolvedBy: req.user.uid,
      note: "Unlocked from user list",
    });
    return { ok: true };
  });
}
