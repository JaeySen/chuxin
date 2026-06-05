import type { FastifyInstance } from "fastify";
import type { QueryParam } from "../db/index.js";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import {
  loginWithPassword,
  signJwt,
  signupWithPassword,
  normalizePhone,
  signupWithPhone,
} from "../services/auth.js";
import { createSession } from "../services/session.js";

// Domain restriction for giaovu portal login
const ALLOWED_DOMAINS = (process.env.GIAOVU_ALLOWED_DOMAINS ?? "hanngusotam.io.vn,hanngusotam.com")
  .split(",").map((d) => d.trim().toLowerCase());

function isAllowedEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return ALLOWED_DOMAINS.includes(domain);
}

function getClientMeta(req: { headers: Record<string, unknown>; ip?: string }) {
  const xff = req.headers["x-forwarded-for"];
  const ip = (typeof xff === "string" ? xff.split(",")[0]?.trim() : undefined) ?? req.ip ?? "unknown";
  const userAgent = (req.headers["user-agent"] as string | undefined) ?? "unknown";
  return { ip, userAgent };
}

// ─── Shared query helpers ──────────────────────────────────────────────────

async function getClass(id: string) {
  const { rows } = await query<{ id: string }>(
    `SELECT c.*, u.display_name AS teacher_name
       FROM classes c
       LEFT JOIN users u ON u.id = c.teacher_id
       WHERE c.id = $1`, [id],
  );
  return rows[0] ?? null;
}

// ─── Route plugin ──────────────────────────────────────────────────────────

export async function giaoVuRoutes(app: FastifyInstance) {

  // ── Login (domain-restricted) ───────────────────────────────────────────
  const LoginBody = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post("/login", async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });

    if (!isAllowedEmail(parsed.data.email)) {
      return reply.status(403).send({
        error: "DOMAIN_RESTRICTED",
        message: "Chỉ tài khoản nội bộ mới được truy cập cổng giáo vụ.",
      });
    }

    let user;
    try {
      user = await loginWithPassword(parsed.data.email, parsed.data.password);
    } catch {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const allowedRoles = ["teacher", "admin", "staff", "assistant"] as const;
    if (!allowedRoles.includes(user.role as typeof allowedRoles[number])) {
      return reply.status(403).send({
        error: "ROLE_FORBIDDEN",
        message: "Tài khoản học viên không được phép truy cập cổng giáo vụ.",
      });
    }

    if (user.locked) {
      return reply.status(423).send({ error: "ACCOUNT_LOCKED", message: "Tài khoản đã bị khóa." });
    }

    const { ip, userAgent } = getClientMeta(req);
    const sessionToken = await createSession(user.id, ip, userAgent);
    const jwt = signJwt(user);
    return reply.send({ jwt, sessionToken, user });
  });

  // Current user — used by frontend on refresh
  app.get("/me", { preHandler: [authenticate, requireRole("teacher", "admin", "staff", "assistant")] }, async (req) => {
    const { rows } = await query<{ id: string; email: string; display_name: string; role: string }>(
      `SELECT id, email, display_name, role FROM users WHERE id = $1`, [req.user.uid],
    );
    const u = rows[0];
    if (!u) return { id: req.user.uid, email: req.user.email, displayName: req.user.email, role: req.user.role };
    return { id: u.id, email: u.email, displayName: u.display_name, role: u.role };
  });

  // All routes below require auth + giaovu-eligible role
  const giaoVuGuard = [authenticate, requireRole("teacher", "admin", "staff", "assistant")];

  // ── Classes ─────────────────────────────────────────────────────────────

  app.get("/classes", { preHandler: giaoVuGuard }, async (req) => {
    const role = req.user.role;
    const uid  = req.user.uid;

    // Teachers see only their own classes; staff/admin see all
    const { rows } = await query(
      `SELECT c.*,
              u.display_name AS teacher_name,
              COUNT(e.id)::int AS student_count
         FROM classes c
         LEFT JOIN users u ON u.id = c.teacher_id
         LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'active'
         ${role === "teacher" ? "WHERE c.teacher_id = $1" : "WHERE 1=1"}
         GROUP BY c.id, u.display_name
         ORDER BY c.start_date DESC NULLS LAST`,
      role === "teacher" ? [uid] : [],
    );
    return rows;
  });

  const CreateClassBody = z.object({
    name:        z.string().min(1).max(200),
    courseId:    z.string().min(1),
    teacherId:   z.string().uuid().optional(),
    schedule:    z.array(z.object({ day: z.string(), start: z.string(), end: z.string() })).optional(),
    startDate:   z.string().optional(),
    endDate:     z.string().optional(),
    maxStudents: z.number().int().positive().default(30),
  });

  app.post("/classes", { preHandler: [authenticate, requireRole("staff", "admin")] }, async (req, reply) => {
    const parsed = CreateClassBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    const d = parsed.data;

    const { rows } = await query(
      `INSERT INTO classes (name, course_id, teacher_id, schedule, start_date, end_date, max_students, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [d.name, d.courseId, d.teacherId ?? null, d.schedule ? JSON.stringify(d.schedule) : null,
       d.startDate ?? null, d.endDate ?? null, d.maxStudents, req.user.uid],
    );
    return reply.status(201).send(rows[0]);
  });

  app.get<{ Params: { id: string } }>("/classes/:id", { preHandler: giaoVuGuard }, async (req, reply) => {
    const cls = await getClass(req.params.id);
    if (!cls) return reply.status(404).send({ error: "Class not found" });
    return cls;
  });

  app.patch<{ Params: { id: string } }>("/classes/:id", { preHandler: [authenticate, requireRole("staff", "admin")] }, async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const fields: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(body)) {
      const col = { name: "name", courseId: "course_id", teacherId: "teacher_id", status: "status",
                    startDate: "start_date", endDate: "end_date", maxStudents: "max_students",
                    schedule: "schedule" }[k];
      if (col) { fields.push(`${col} = $${i++}`); vals.push(k === "schedule" ? JSON.stringify(v) : v); }
    }
    if (!fields.length) return reply.status(400).send({ error: "No valid fields" });
    vals.push(req.params.id);
    const { rows } = await query(`UPDATE classes SET ${fields.join(", ")}, updated_at = now() WHERE id = $${i} RETURNING *`, vals as QueryParam[]);
    if (!rows[0]) return reply.status(404).send({ error: "Class not found" });
    return rows[0];
  });

  // ── Sessions ─────────────────────────────────────────────────────────────

  app.get<{ Params: { id: string } }>("/classes/:id/sessions", { preHandler: giaoVuGuard }, async (req) => {
    const { rows } = await query(
      `SELECT * FROM class_sessions WHERE class_id = $1 ORDER BY session_date, start_time`,
      [req.params.id],
    );
    return rows;
  });

  const CreateSessionBody = z.object({
    sessionDate: z.string(),
    startTime:   z.string(),
    endTime:     z.string(),
    topic:       z.string().optional(),
    notes:       z.string().optional(),
  });

  app.post<{ Params: { id: string } }>("/classes/:id/sessions", { preHandler: [authenticate, requireRole("teacher", "staff", "admin")] }, async (req, reply) => {
    const parsed = CreateSessionBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });
    const d = parsed.data;
    const { rows } = await query(
      `INSERT INTO class_sessions (class_id, session_date, start_time, end_time, topic, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, d.sessionDate, d.startTime, d.endTime, d.topic ?? null, d.notes ?? null],
    );
    return reply.status(201).send(rows[0]);
  });

  // ── Enrollments ──────────────────────────────────────────────────────────

  app.get<{ Params: { id: string } }>("/classes/:id/students", { preHandler: giaoVuGuard }, async (req) => {
    const { rows } = await query(
      `SELECT e.id AS enrollment_id, e.status AS enrollment_status, e.enrolled_at, e.notes,
              u.id, u.display_name, u.email, u.phone, u.date_of_birth, u.parent_name, u.parent_phone
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
         WHERE e.class_id = $1
         ORDER BY u.display_name`,
      [req.params.id],
    );
    return rows;
  });

  app.post<{ Params: { id: string } }>("/classes/:id/students", { preHandler: [authenticate, requireRole("staff", "admin")] }, async (req, reply) => {
    const { studentId, notes } = req.body as { studentId: string; notes?: string };
    if (!studentId) return reply.status(400).send({ error: "studentId required" });
    const { rows } = await query(
      `INSERT INTO enrollments (class_id, student_id, notes) VALUES ($1,$2,$3)
       ON CONFLICT (class_id, student_id) DO UPDATE SET status = 'active', notes = EXCLUDED.notes
       RETURNING *`,
      [req.params.id, studentId, notes ?? null],
    );
    return reply.status(201).send(rows[0]);
  });

  app.delete<{ Params: { id: string; studentId: string } }>("/classes/:id/students/:studentId", { preHandler: [authenticate, requireRole("staff", "admin")] }, async (req, reply) => {
    await query(`UPDATE enrollments SET status = 'dropped' WHERE class_id = $1 AND student_id = $2`, [req.params.id, req.params.studentId]);
    return { ok: true };
  });

  // ── Check-ins ────────────────────────────────────────────────────────────

  app.get<{ Params: { sessionId: string } }>("/sessions/:sessionId/checkins", { preHandler: giaoVuGuard }, async (req) => {
    const { rows } = await query(
      `SELECT c.*, u.display_name AS student_name, u.email AS student_email
         FROM checkins c
         JOIN users u ON u.id = c.student_id
         WHERE c.session_id = $1
         ORDER BY u.display_name`,
      [req.params.sessionId],
    );
    return rows;
  });

  const CheckinBody = z.object({
    studentId: z.string().uuid(),
    status:    z.enum(["present", "absent", "late", "excused"]),
    note:      z.string().optional(),
  });

  app.post<{ Params: { sessionId: string } }>("/sessions/:sessionId/checkins", { preHandler: [authenticate, requireRole("teacher", "assistant", "staff", "admin")] }, async (req, reply) => {
    const parsed = CheckinBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });
    const d = parsed.data;
    const { rows } = await query(
      `INSERT INTO checkins (session_id, student_id, status, note, marked_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (session_id, student_id) DO UPDATE
         SET status = EXCLUDED.status, note = EXCLUDED.note, marked_by = EXCLUDED.marked_by, marked_at = now()
       RETURNING *`,
      [req.params.sessionId, d.studentId, d.status, d.note ?? null, req.user.uid],
    );
    return reply.status(201).send(rows[0]);
  });

  // Bulk checkin — post array
  app.post<{ Params: { sessionId: string } }>("/sessions/:sessionId/checkins/bulk", { preHandler: [authenticate, requireRole("teacher", "assistant", "staff", "admin")] }, async (req, reply) => {
    const items = req.body as Array<{ studentId: string; status: string; note?: string }>;
    if (!Array.isArray(items)) return reply.status(400).send({ error: "Expected array" });

    for (const item of items) {
      await query(
        `INSERT INTO checkins (session_id, student_id, status, note, marked_by)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (session_id, student_id) DO UPDATE
           SET status = EXCLUDED.status, note = EXCLUDED.note, marked_by = EXCLUDED.marked_by, marked_at = now()`,
        [req.params.sessionId, item.studentId, item.status, item.note ?? null, req.user.uid],
      );
    }
    return { ok: true, count: items.length };
  });

  // ── Materials & Homework ──────────────────────────────────────────────────

  app.get<{ Params: { id: string } }>("/classes/:id/materials", { preHandler: giaoVuGuard }, async (req) => {
    const { rows } = await query(
      `SELECT m.*, u.display_name AS created_by_name,
              cs.session_date, cs.topic AS session_topic
         FROM materials m
         LEFT JOIN users u ON u.id = m.created_by
         LEFT JOIN class_sessions cs ON cs.id = m.session_id
         WHERE m.class_id = $1
         ORDER BY m.created_at DESC`,
      [req.params.id],
    );
    return rows;
  });

  const CreateMaterialBody = z.object({
    title:       z.string().min(1).max(300),
    type:        z.enum(["lesson", "homework", "reference", "announcement"]),
    googleUrl:   z.string().url().optional(),
    description: z.string().optional(),
    sessionId:   z.string().uuid().optional(),
    dueDate:     z.string().optional(),
  });

  app.post<{ Params: { id: string } }>("/classes/:id/materials", { preHandler: [authenticate, requireRole("teacher", "staff", "admin")] }, async (req, reply) => {
    const parsed = CreateMaterialBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    const d = parsed.data;
    const { rows } = await query(
      `INSERT INTO materials (class_id, session_id, title, type, google_url, description, due_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, d.sessionId ?? null, d.title, d.type, d.googleUrl ?? null, d.description ?? null, d.dueDate ?? null, req.user.uid],
    );
    return reply.status(201).send(rows[0]);
  });

  app.delete<{ Params: { id: string } }>("/materials/:id", { preHandler: [authenticate, requireRole("teacher", "staff", "admin")] }, async (req, reply) => {
    const { rowCount } = await query(`DELETE FROM materials WHERE id = $1`, [req.params.id]);
    if (!rowCount) return reply.status(404).send({ error: "Not found" });
    return { ok: true };
  });

  // ── Homework submissions ──────────────────────────────────────────────────

  app.get<{ Params: { materialId: string } }>("/materials/:materialId/submissions", { preHandler: giaoVuGuard }, async (req) => {
    const { rows } = await query(
      `SELECT s.*, u.display_name AS student_name, u.email AS student_email,
              r.display_name AS reviewer_name
         FROM homework_submissions s
         JOIN users u ON u.id = s.student_id
         LEFT JOIN users r ON r.id = s.reviewed_by
         WHERE s.material_id = $1
         ORDER BY s.submitted_at DESC`,
      [req.params.materialId],
    );
    return rows;
  });

  const ReviewBody = z.object({
    status:   z.enum(["reviewed", "needs_revision"]),
    score:    z.number().min(0).max(100).optional(),
    feedback: z.string().optional(),
  });

  app.patch<{ Params: { id: string } }>("/submissions/:id/review", { preHandler: [authenticate, requireRole("assistant", "teacher", "admin")] }, async (req, reply) => {
    const parsed = ReviewBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });
    const d = parsed.data;
    const { rows } = await query(
      `UPDATE homework_submissions
          SET status = $1, score = $2, feedback = $3, reviewed_by = $4, reviewed_at = now()
        WHERE id = $5 RETURNING *`,
      [d.status, d.score ?? null, d.feedback ?? null, req.user.uid, req.params.id],
    );
    if (!rows[0]) return reply.status(404).send({ error: "Submission not found" });
    return rows[0];
  });

  // ── Users / Students (staff manages) ─────────────────────────────────────

  app.get("/students", { preHandler: [authenticate, requireRole("staff", "admin", "teacher")] }, async () => {
    const { rows } = await query(
      `SELECT id, email, phone, display_name, date_of_birth, parent_name, parent_phone, address, notes, created_at
         FROM users WHERE role = 'student' ORDER BY display_name`,
    );
    return rows;
  });

  const CreateStaffUserBody = z.object({
    email:       z.string().email(),
    displayName: z.string().min(1).max(80),
    password:    z.string().min(8),
    role:        z.enum(["teacher", "assistant", "staff", "student"]),
    phone:       z.string().optional(),
    dateOfBirth: z.string().optional(),
    parentName:  z.string().optional(),
    parentPhone: z.string().optional(),
    address:     z.string().optional(),
    notes:       z.string().optional(),
  });

  app.post("/users", { preHandler: [authenticate, requireRole("staff", "admin")] }, async (req, reply) => {
    const parsed = CreateStaffUserBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    const d = parsed.data;

    let user;
    try {
      user = await signupWithPassword({ email: d.email, password: d.password, displayName: d.displayName });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "EMAIL_TAKEN") return reply.status(409).send({ error: "EMAIL_TAKEN" });
      throw err;
    }

    // Set correct role + extra profile fields
    await query(
      `UPDATE users SET role = $1, phone = $2, date_of_birth = $3,
          parent_name = $4, parent_phone = $5, address = $6, notes = $7
       WHERE id = $8`,
      [d.role,
       d.phone ? normalizePhone(d.phone) : null,
       d.dateOfBirth ?? null, d.parentName ?? null, d.parentPhone ?? null,
       d.address ?? null, d.notes ?? null, user.id],
    );

    return reply.status(201).send({ ...user, role: d.role });
  });

  app.patch<{ Params: { id: string } }>("/users/:id", { preHandler: [authenticate, requireRole("staff", "admin")] }, async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const allowed: Record<string, string> = {
      displayName: "display_name", phone: "phone", role: "role",
      dateOfBirth: "date_of_birth", parentName: "parent_name",
      parentPhone: "parent_phone", address: "address", notes: "notes",
    };
    const fields: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(body)) {
      if (allowed[k]) { fields.push(`${allowed[k]} = $${i++}`); vals.push(v); }
    }
    if (!fields.length) return reply.status(400).send({ error: "No valid fields" });
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING id, email, display_name, role, phone`,
      vals as QueryParam[],
    );
    if (!rows[0]) return reply.status(404).send({ error: "User not found" });
    return rows[0];
  });

  // ── Staff management (only admin creates staff/assistant) ─────────────────

  app.get("/staff", { preHandler: [authenticate, requireRole("admin")] }, async () => {
    const { rows } = await query(
      `SELECT id, email, display_name, role, created_at FROM users
         WHERE role IN ('staff', 'assistant', 'teacher')
         ORDER BY role, display_name`,
    );
    return rows;
  });

  // ── Calendar (teacher's upcoming sessions) ────────────────────────────────

  app.get("/calendar", { preHandler: giaoVuGuard }, async (req) => {
    const role = req.user.role;
    const uid  = req.user.uid;
    const { rows } = await query(
      `SELECT cs.*, c.name AS class_name, c.id AS class_id, c.course_id,
              u.display_name AS teacher_name
         FROM class_sessions cs
         JOIN classes c ON c.id = cs.class_id
         LEFT JOIN users u ON u.id = c.teacher_id
         ${role === "teacher" ? "WHERE c.teacher_id = $1" : "WHERE 1=1"}
         ORDER BY cs.session_date, cs.start_time`,
      role === "teacher" ? [uid] : [],
    );
    return rows;
  });
}
