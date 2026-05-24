import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  signupWithPassword,
  loginWithPassword,
  findUserById,
  signJwt,
  lockUser,
  recordAuthEvent,
} from "../services/auth.js";
import {
  createSession,
  deleteSessionByToken,
  deleteAllSessionsForUser,
  findActiveSessionsForUser,
} from "../services/session.js";
import { authenticate } from "../middleware/authenticate.js";
import { getSetting } from "../services/settings.js";

const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function getClientMeta(req: { headers: Record<string, unknown>; ip?: string }) {
  const xff = req.headers["x-forwarded-for"];
  const ip = (typeof xff === "string" ? xff.split(",")[0]?.trim() : undefined) ?? req.ip ?? "unknown";
  const userAgent = (req.headers["user-agent"] as string | undefined) ?? "unknown";
  return { ip, userAgent };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/signup", async (req, reply) => {
    const parsed = SignupBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.format() });
    }

    let user;
    try {
      user = await signupWithPassword(parsed.data);
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_TAKEN") {
        return reply.status(409).send({ error: "Email already registered" });
      }
      throw err;
    }

    const { ip, userAgent } = getClientMeta(req);
    const sessionToken = await createSession(user.id, ip, userAgent);
    const jwt = signJwt(user);
    return reply.send({ jwt, sessionToken, user });
  });

  app.post("/login", async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" });

    let user;
    try {
      user = await loginWithPassword(parsed.data.email, parsed.data.password);
    } catch {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    if (user.locked) {
      return reply.status(423).send({
        error: "ACCOUNT_LOCKED",
        message: "Tài khoản đã bị khóa do phát hiện đăng nhập từ thiết bị khác. Liên hệ giáo viên / quản trị viên để mở khóa.",
      });
    }

    const { ip, userAgent } = getClientMeta(req);

    // Cross-IP detection — only enforced for students. Teachers/admins are unrestricted.
    if (user.role === "student") {
      const existing = await findActiveSessionsForUser(user.id);
      const conflicting = existing.find((s) => s.ip && s.ip !== ip);

      if (conflicting) {
        const enforce = await getSetting<boolean>("enforce_cross_ip_lock", true);

        if (enforce) {
          // Hard mode: lock + kill all sessions + reject this login
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
          // Soft mode: log it but still allow login (existing session is replaced by createSession)
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
    return reply.send(user);
  });
}
