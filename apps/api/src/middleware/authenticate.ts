import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyJwt, type Role } from "../services/auth.js";
import { getSessionByToken, touchSession } from "../services/session.js";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      uid: string;
      email: string;
      role: Role;
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

  let payload;
  try {
    payload = verifyJwt(bearer.slice(7));
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }

  const session = await getSessionByToken(sessionToken);
  if (!session || session.userId !== payload.sub) {
    return reply.status(401).send({
      error: "Session invalidated — sign in again",
      code: "SESSION_INVALID",
    });
  }

  touchSession(sessionToken).catch(() => {});

  req.user = {
    uid: payload.sub,
    email: payload.email,
    role: payload.role,
    sessionToken,
  };
}
