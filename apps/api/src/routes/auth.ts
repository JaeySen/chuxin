import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { adminAuth } from "../lib/firebase.js";
import { upsertSession, deleteSession } from "../services/session.js";
import { authenticate } from "../middleware/authenticate.js";

const SessionBody = z.object({
  idToken: z.string().min(1),
  existingSessionToken: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /auth/session
   * Called by the client right after Firebase sign-in.
   * Returns a sessionToken that must accompany every subsequent request.
   *
   * Single-device rule:
   *  - Same device (existingSessionToken matches stored) → refreshes, returns same token.
   *  - New device → new token stored → previous device's token becomes invalid.
   */
  app.post("/session", async (req, reply) => {
    const parsed = SessionBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body" });
    }

    const { idToken, existingSessionToken } = parsed.data;

    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return reply.status(401).send({ error: "Invalid Firebase token" });
    }

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      ?? req.ip
      ?? "unknown";
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const role = (decoded as Record<string, unknown>).role as string ?? "student";

    const sessionToken = await upsertSession(
      decoded.uid,
      role,
      ip,
      userAgent,
      existingSessionToken
    );

    return reply.send({
      sessionToken,
      user: { uid: decoded.uid, email: decoded.email ?? null, role },
    });
  });

  /**
   * DELETE /auth/session
   * Explicit logout — deletes the active session from Firestore.
   */
  app.delete("/session", { preHandler: [authenticate] }, async (req, reply) => {
    await deleteSession(req.user.uid);
    return reply.send({ ok: true });
  });

  /**
   * GET /auth/me
   * Returns the current authenticated user info.
   */
  app.get("/me", { preHandler: [authenticate] }, async (req, reply) => {
    return reply.send({
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
    });
  });
}
