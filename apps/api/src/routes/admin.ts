import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { getAllSettings, setSetting } from "../services/settings.js";
import { unlockUser, recordAuthEvent, signupWithPassword, signupWithPhone, normalizePhone } from "../services/auth.js";

const SettingsPatchBody = z.object({
  enforce_cross_ip_lock: z.boolean().optional(),
  allow_signup:          z.boolean().optional(),
  disable_email_login:   z.boolean().optional(),
  allow_phone_login:     z.boolean().optional(),
  guest_games_enabled:   z.boolean().optional(),
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

  // ── Class management (admin only) ──────────────────────────────────────────

  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  type WeekDay = typeof WEEK_DAYS[number];

  const ClassSchedule = z.object({
    days:      z.array(z.enum(WEEK_DAYS)).min(1),
    clock_in:  z.string().regex(/^\d{2}:\d{2}$/),
    clock_out: z.string().regex(/^\d{2}:\d{2}$/),
  });

  const CreateClassBody = z.object({
    name:       z.string().min(1).max(120),
    classCode:  z.string().min(1).max(20).optional(),
    courseId:   z.string().min(1),
    teacherId:  z.string().uuid().optional(),
    schedule:   ClassSchedule.optional(),
    startDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  });

  app.get("/classes", async () => {
    const { rows } = await query<{
      id: string; name: string; class_code: string | null; course_id: string; status: string;
      teacher_id: string | null; teacher_name: string | null;
      schedule: { days: WeekDay[]; clock_in: string; clock_out: string } | null;
      start_date: string | null; end_date: string | null;
      enrolled: number; created_at: Date;
    }>(
      `SELECT c.id, c.name, c.class_code, c.course_id, c.status, c.teacher_id,
              u.display_name AS teacher_name,
              c.schedule, c.start_date, c.end_date,
              COUNT(e.id)::int AS enrolled
         FROM classes c
         LEFT JOIN users u ON u.id = c.teacher_id
         LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'active'
        GROUP BY c.id, u.display_name
        ORDER BY c.created_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id, name: r.name, classCode: r.class_code, courseId: r.course_id,
      status: r.status, teacherId: r.teacher_id, teacherName: r.teacher_name,
      schedule: r.schedule, startDate: r.start_date, endDate: r.end_date,
      enrolled: r.enrolled, createdAt: r.created_at,
    }));
  });

  app.post("/classes", async (req, reply) => {
    const parsed = CreateClassBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    const { name, classCode, courseId, teacherId, schedule, startDate, endDate } = parsed.data;
    const { rows } = await query<{ id: string }>(
      `INSERT INTO classes (name, class_code, course_id, teacher_id, schedule, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [name, classCode ?? null, courseId, teacherId ?? null,
       schedule ? JSON.stringify(schedule) : null,
       startDate ?? null, endDate ?? null, req.user.uid],
    );
    return reply.status(201).send({ id: rows[0].id, name, classCode, courseId });
  });

  app.patch<{ Params: { id: string }; Body: { teacherId: string | null } }>(
    "/classes/:id/teacher", async (req, reply) => {
      await query(
        `UPDATE classes SET teacher_id = $1, updated_at = now() WHERE id = $2`,
        [req.body.teacherId, req.params.id],
      );
      return { ok: true };
    },
  );

  app.post<{ Params: { id: string }; Body: { studentId: string } }>(
    "/classes/:id/enroll", async (req, reply) => {
      await query(
        `INSERT INTO enrollments (class_id, student_id)
         VALUES ($1, $2)
         ON CONFLICT (class_id, student_id) DO UPDATE SET status = 'active'`,
        [req.params.id, req.body.studentId],
      );
      return { ok: true };
    },
  );

  app.delete<{ Params: { id: string; studentId: string } }>(
    "/classes/:id/enrollments/:studentId", async (req) => {
      await query(
        `UPDATE enrollments SET status = 'dropped' WHERE class_id = $1 AND student_id = $2`,
        [req.params.id, req.params.studentId],
      );
      return { ok: true };
    },
  );

  // ── Admin creates a new user (bypasses allow_signup flag) ────
  const CreateUserBody = z.object({
    displayName: z.string().min(1).max(80),
    password:    z.string().min(8),
    role:        z.enum(["student", "teacher", "admin"]),
    email:       z.string().email(),
    phone:       z.string().min(8).max(20),
  });

  app.post("/users", async (req, reply) => {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    const { displayName, password, role, email, phone } = parsed.data;

    let user;
    try {
      user = await signupWithPassword({ email, password, displayName });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "EMAIL_TAKEN") return reply.status(409).send({ error: msg });
      throw err;
    }

    const normalised = normalizePhone(phone);
    try {
      await query(`UPDATE users SET phone = $1 WHERE id = $2`, [normalised, user.id]);
    } catch {
      // phone unique violation
      await query(`DELETE FROM users WHERE id = $1`, [user.id]);
      return reply.status(409).send({ error: "PHONE_TAKEN" });
    }

    if (role !== user.role) {
      await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, user.id]);
      user = { ...user, role };
    }

    return reply.send({ ...user, phone: normalised });
  });
}
