import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  signupWithPassword,
  loginWithPassword,
  findUserById,
  signJwt,
} from "../services/auth.js";
import { createSession, deleteSessionByToken } from "../services/session.js";
import { authenticate } from "../middleware/authenticate.js";

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
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body" });
    }

    let user;
    try {
      user = await loginWithPassword(parsed.data.email, parsed.data.password);
    } catch {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const { ip, userAgent } = getClientMeta(req);
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
