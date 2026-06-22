import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  signupWithPassword,
  signupWithPhone,
  loginWithPassword,
  loginWithPhone,
  findUserById,
  signJwt,
  lockUser,
  recordAuthEvent,
  normalizePhone,
} from "../services/auth.js";
import {
  createSession,
  deleteSessionByToken,
  deleteAllSessionsForUser,
  findActiveSessionsForUser,
} from "../services/session.js";
import { authenticate } from "../middleware/authenticate.js";
import { getSetting } from "../services/settings.js";
import { query } from "../db/index.js";
import type { EnrolledClass } from "../services/auth.js";

const SignupBody = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80),
}).refine((d) => d.email || d.phone, { message: "email or phone is required" });

const LoginBody = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(1),
}).refine((d) => d.email || d.phone, { message: "email or phone is required" });

function getClientMeta(req: { headers: Record<string, unknown>; ip?: string }) {
  const xff = req.headers["x-forwarded-for"];
  const ip = (typeof xff === "string" ? xff.split(",")[0]?.trim() : undefined) ?? req.ip ?? "unknown";
  const userAgent = (req.headers["user-agent"] as string | undefined) ?? "unknown";
  return { ip, userAgent };
}

export async function authRoutes(app: FastifyInstance) {
  // ── Public config endpoint ────────────────────────────────────────────
  // Frontend reads this on load to know which login methods to show.
  app.get("/config", async () => {
    const [allowSignup, disableEmail, allowPhone] = await Promise.all([
      getSetting<boolean>("allow_signup", true),
      getSetting<boolean>("disable_email_login", false),
      getSetting<boolean>("allow_phone_login", true),
    ]);
    return { allowSignup, disableEmailLogin: disableEmail, allowPhoneLogin: allowPhone };
  });

  // ── Signup ───────────────────────────────────────────────────────────
  app.post("/signup", async (req, reply) => {
    const allowSignup = await getSetting<boolean>("allow_signup", true);
    if (!allowSignup) {
      return reply.status(403).send({ error: "SIGNUP_DISABLED", message: "Tính năng tự đăng ký đã bị tắt. Liên hệ giáo viên để được cấp tài khoản." });
    }

    const parsed = SignupBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body", details: parsed.error.format() });

    let user;
    try {
      if (parsed.data.phone) {
        user = await signupWithPhone({
          phone: parsed.data.phone,
          password: parsed.data.password,
          displayName: parsed.data.displayName,
        });
      } else {
        user = await signupWithPassword({
          email: parsed.data.email!,
          password: parsed.data.password,
          displayName: parsed.data.displayName,
        });
      }
    } catch (err) {
      if (err instanceof Error && (err.message === "EMAIL_TAKEN" || err.message === "PHONE_TAKEN")) {
        return reply.status(409).send({ error: err.message === "EMAIL_TAKEN" ? "Email already registered" : "Phone number already registered" });
      }
      throw err;
    }

    const { ip, userAgent } = getClientMeta(req);
    const sessionToken = await createSession(user.id, ip, userAgent);
    const jwt = signJwt(user);
    return reply.send({ jwt, sessionToken, user });
  });

  // ── Login ────────────────────────────────────────────────────────────
  app.post("/login", async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" });

    let user;
    try {
      if (parsed.data.phone) {
        user = await loginWithPhone(normalizePhone(parsed.data.phone), parsed.data.password);
      } else {
        user = await loginWithPassword(parsed.data.email!, parsed.data.password);
      }
    } catch {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    if (user.locked) {
      return reply.status(423).send({
        error: "ACCOUNT_LOCKED",
        message: "Tài khoản đã bị khóa do phát hiện đăng nhập từ thiết bị khác. Liên hệ giáo viên / quản trị viên để mở khóa.",
      });
    }

    const { ip, userAgent } = getClientMeta(req);

    // Cross-IP detection — only for students.
    if (user.role === "student") {
      const existing = await findActiveSessionsForUser(user.id);
      const conflicting = existing.find((s) => s.ip && s.ip !== ip);

      if (conflicting) {
        const enforce = await getSetting<boolean>("enforce_cross_ip_lock", true);

        if (enforce) {
          await lockUser(user.id, `Cross-IP login attempt: existing ${conflicting.ip} vs new ${ip}`);
          await deleteAllSessionsForUser(user.id);
          await recordAuthEvent({
            userId: user.id,
            eventType: "cross_ip_blocked",
            attemptedIp: ip,
            attemptedUserAgent: userAgent,
            existingSessionIp: conflicting.ip,
          });
          return reply.status(423).send({
            error: "ACCOUNT_LOCKED",
            message: "Phát hiện đăng nhập từ mạng khác. Tài khoản đã bị khóa và phiên hiện tại đã đăng xuất. Liên hệ quản trị viên để mở khóa.",
          });
        } else {
          await recordAuthEvent({
            userId: user.id,
            eventType: "soft_cross_ip",
            attemptedIp: ip,
            attemptedUserAgent: userAgent,
            existingSessionIp: conflicting.ip,
          });
        }
      }
    }

    const sessionToken = await createSession(user.id, ip, userAgent);
    const jwt = signJwt(user);
    return reply.send({ jwt, sessionToken, user });
  });

  app.delete("/session", { preHandler: [authenticate] }, async (req, reply) => {
    await deleteSessionByToken(req.user.sessionToken);
    return reply.send({ ok: true });
  });

  app.get("/me", { preHandler: [authenticate] }, async (req, reply) => {
    const user = await findUserById(req.user.uid);
    if (!user) return reply.status(404).send({ error: "User not found" });

    let classes: EnrolledClass[] = [];
    if (user.role === "student") {
      const { rows } = await query<EnrolledClass>(
        `SELECT c.id, c.name, c.course_id AS "courseId", c.teacher_id AS "teacherId"
           FROM classes c
           JOIN enrollments e ON e.class_id = c.id
          WHERE e.student_id = $1 AND e.status = 'active'
          ORDER BY c.created_at DESC`,
        [user.id],
      );
      classes = rows;
    }

    return reply.send({ ...user, classes });
  });
}
