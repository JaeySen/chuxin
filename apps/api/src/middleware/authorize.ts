import type { FastifyRequest, FastifyReply } from "fastify";

export type Role = "admin" | "teacher" | "student" | "staff" | "assistant" | "guest";

/**
 * Usage: { preHandler: [authenticate, requireRole("teacher", "admin")] }
 */
export function requireRole(...allowed: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const role = req.user?.role as Role | undefined;
    if (!role || !allowed.includes(role)) {
      return reply.status(403).send({
        error: "Forbidden",
        required: allowed,
        current: role ?? "none",
      });
    }
  };
}
