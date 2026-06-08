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
  const ok = await tryAuthenticate(req);
  if (!ok) return reply.status(401).send({ error: "Missing Authorization header" });
}

/** Tries to authenticate without touching reply. Returns true if successful. */
export async function tryAuthenticate(req: FastifyRequest): Promise<boolean> {
  const bearer = req.headers.authorization;
  const sessionToken = req.headers["x-session-token"] as string | undefined;

  if (!bearer?.startsWith("Bearer ") || !sessionToken) return false;

  let payload;
  try {
    payload = verifyJwt(bearer.slice(7));
  } catch {
    return false;
  }

  const session = await getSessionByToken(sessionToken);
  if (!session || session.userId !== payload.sub) return false;

  touchSession(sessionToken).catch(() => {});

  req.user = {
    uid: payload.sub,
    email: payload.email,
    role: payload.role,
    sessionToken,
  };
  return true;
}
