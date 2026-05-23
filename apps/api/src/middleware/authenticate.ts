import type { FastifyRequest, FastifyReply } from "fastify";
import { adminAuth } from "../lib/firebase.js";
import { getSession, touchSession } from "../services/session.js";

// Extend Fastify's request type globally (picked up in all route files)
declare module "fastify" {
  interface FastifyRequest {
    user: {
      uid: string;
      email: string | null;
      role: string;
      sessionToken: string;
    };
  }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const bearer = req.headers.authorization;
  const sessionToken = req.headers["x-session-token"] as string | undefined;

  if (!bearer?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing Authorization header" });
  }
  if (!sessionToken) {
    return reply.status(401).send({ error: "Missing X-Session-Token header" });
  }

  let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decoded = await adminAuth.verifyIdToken(bearer.slice(7));
  } catch {
    return reply.status(401).send({ error: "Invalid or expired Firebase token" });
  }

  const session = await getSession(decoded.uid);
  if (!session || session.sessionToken !== sessionToken) {
    return reply.status(401).send({
      error: "Session invalidated — sign in again",
      code: "SESSION_INVALID",
    });
  }

  // Fire-and-forget: update lastSeenAt without blocking the request
  touchSession(decoded.uid);

  req.user = {
    uid: decoded.uid,
    email: decoded.email ?? null,
    role: (decoded as Record<string, unknown>).role as string ?? "student",
    sessionToken,
  };
}
