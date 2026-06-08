import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { getSetting } from "../services/settings.js";
import * as bingo from "../games/bingo.js";

const CreateBody = z.object({
  size: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  maxPlayers: z.number().int().min(1).max(50),
  words: z.record(z.string(), z.object({
    char: z.string(),
    pinyin: z.string(),
    en: z.string(),
  })),
  wordPool: z.array(z.string()).min(9),
});

const GuestJoinBody = z.object({ name: z.string().min(1).max(40) });

function mapError(err: unknown, reply: FastifyReply) {
  const code = err instanceof Error ? err.message : "INTERNAL";
  const status =
    code === "GAME_NOT_FOUND" ? 404 :
    code === "ROOM_FULL" || code === "GAME_ENDED" || code === "GAME_NOT_ACTIVE" || code === "CHAR_NOT_CALLED" ? 409 :
    code === "NOT_TEACHER" || code === "NOT_IN_GAME" ? 403 :
    code === "GUEST_EXPIRED" || code === "GUEST_DISABLED" ? 403 :
    500;
  return reply.status(status).send({ error: code });
}

async function guestEnabled(): Promise<boolean> {
  return getSetting<boolean>("guest_games_enabled", false);
}

export async function bingoRoutes(app: FastifyInstance) {
  // Create — teacher/admin only
  app.post("/", { preHandler: [authenticate, requireRole("teacher", "admin")] }, async (req, reply) => {
    const parsed = CreateBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    try {
      const game = await bingo.createGame({ teacherUid: req.user.uid, ...parsed.data });
      return reply.send(game);
    } catch (err) { return mapError(err, reply); }
  });

  // Read — public (guests need to poll state)
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const game = bingo.getGame(req.params.id);
    if (!game) return reply.status(404).send({ error: "GAME_NOT_FOUND" });
    return reply.send(game);
  });

  // Join — auth OR guest with name
  app.post<{ Params: { id: string }; Body: unknown }>("/:id/join", async (req, reply) => {
    const game = bingo.getGame(req.params.id);
    if (!game) return reply.status(404).send({ error: "GAME_NOT_FOUND" });

    // Try authenticated join first
    try { await authenticate(req, reply); } catch { /* guest path */ }

    if (req.user) {
      try {
        return reply.send(await bingo.joinGame(game.id, { uid: req.user.uid, name: req.user.email }));
      } catch (err) { return mapError(err, reply); }
    }

    // Guest path
    if (!(await guestEnabled())) return reply.status(403).send({ error: "GUEST_DISABLED" });
    if (game.guestExpired) return reply.status(403).send({ error: "GUEST_EXPIRED" });

    const parsed = GuestJoinBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Name required" });

    const guestUid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      return reply.send(await bingo.joinGame(game.id, { uid: guestUid, name: parsed.data.name }));
    } catch (err) { return mapError(err, reply); }
  });

  // Start — teacher/admin only
  app.post<{ Params: { id: string } }>(
    "/:id/start",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await bingo.startGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  // Call next word — teacher/admin only
  app.post<{ Params: { id: string } }>(
    "/:id/call",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await bingo.callNextWord(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  // Mark cell — auth OR guest (uid passed in body when guest)
  const MarkBody = z.object({ char: z.string(), guestUid: z.string().optional() });
  app.post<{ Params: { id: string }; Body: unknown }>("/:id/mark", async (req, reply) => {
    const parsed = MarkBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });

    let playerUid: string;
    try { await authenticate(req, reply); } catch { /* guest */ }

    if (req.user) {
      playerUid = req.user.uid;
    } else {
      if (!(await guestEnabled())) return reply.status(403).send({ error: "GUEST_DISABLED" });
      if (!parsed.data.guestUid) return reply.status(400).send({ error: "guestUid required" });
      playerUid = parsed.data.guestUid;
    }

    try { return reply.send(await bingo.markCell(req.params.id, playerUid, parsed.data.char)); }
    catch (err) { return mapError(err, reply); }
  });

  // End game — teacher/admin only
  app.post<{ Params: { id: string } }>(
    "/:id/end",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await bingo.endGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  // Expire guest link — teacher/admin only
  app.post<{ Params: { id: string } }>(
    "/:id/expire-guest",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await bingo.expireGuestLink(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );
}
