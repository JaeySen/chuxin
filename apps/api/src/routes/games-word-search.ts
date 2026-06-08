import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate, tryAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { getSetting } from "../services/settings.js";
import * as ws from "../games/wordSearch.js";

const CreateBody = z.object({
  maxPlayers: z.number().int().min(1).max(50),
  board: z.array(z.array(z.string())),
  wordList: z.array(z.object({
    char: z.string(),
    pinyin: z.string(),
    en: z.string(),
    pinyinChars: z.array(z.string()),
  })),
  placements: z.array(z.object({
    wordIndex: z.number().int(),
    positions: z.array(z.tuple([z.number().int(), z.number().int()])),
  })),
});

const FoundBody = z.object({
  wordIndex: z.number().int(),
  positions: z.array(z.tuple([z.number().int(), z.number().int()])),
  guestUid: z.string().optional(),
});

const GuestJoinBody = z.object({ name: z.string().min(1).max(40) });

function mapError(err: unknown, reply: FastifyReply) {
  const code = err instanceof Error ? err.message : "INTERNAL";
  const status =
    code === "GAME_NOT_FOUND" || code === "INVALID_WORD" ? 404 :
    code === "ROOM_FULL" || code === "GAME_ENDED" || code === "GAME_NOT_ACTIVE" || code === "WRONG_SELECTION" ? 409 :
    code === "NOT_TEACHER" || code === "NOT_IN_GAME" ? 403 :
    code === "GUEST_EXPIRED" || code === "GUEST_DISABLED" ? 403 :
    500;
  return reply.status(status).send({ error: code });
}

async function guestEnabled(): Promise<boolean> {
  return getSetting<boolean>("guest_games_enabled", false);
}

export async function wordSearchRoutes(app: FastifyInstance) {
  // Create — teacher/admin only
  app.post("/", { preHandler: [authenticate, requireRole("teacher", "admin")] }, async (req, reply) => {
    const parsed = CreateBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    try {
      return reply.send(await ws.createGame({ teacherUid: req.user.uid, ...parsed.data }));
    } catch (err) { return mapError(err, reply); }
  });

  // Read — public
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const game = ws.getGame(req.params.id);
    if (!game) return reply.status(404).send({ error: "GAME_NOT_FOUND" });
    return reply.send(game);
  });

  // Join — auth OR guest with name
  app.post<{ Params: { id: string }; Body: unknown }>("/:id/join", async (req, reply) => {
    const game = ws.getGame(req.params.id);
    if (!game) return reply.status(404).send({ error: "GAME_NOT_FOUND" });

    await tryAuthenticate(req);

    if (req.user) {
      try {
        return reply.send(await ws.joinGame(game.id, { uid: req.user.uid, name: req.user.email }));
      } catch (err) { return mapError(err, reply); }
    }

    if (!(await guestEnabled())) return reply.status(403).send({ error: "GUEST_DISABLED" });
    if (game.guestExpired) return reply.status(403).send({ error: "GUEST_EXPIRED" });

    const parsed = GuestJoinBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Name required" });

    const guestUid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      return reply.send(await ws.joinGame(game.id, { uid: guestUid, name: parsed.data.name }));
    } catch (err) { return mapError(err, reply); }
  });

  // Start — teacher/admin only
  app.post<{ Params: { id: string } }>(
    "/:id/start",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await ws.startGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  // Submit found word — auth OR guest (uid passed in body)
  app.post<{ Params: { id: string }; Body: unknown }>("/:id/found", async (req, reply) => {
    const parsed = FoundBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });

    let playerUid: string;
    await tryAuthenticate(req);

    if (req.user) {
      playerUid = req.user.uid;
    } else {
      if (!(await guestEnabled())) return reply.status(403).send({ error: "GUEST_DISABLED" });
      if (!parsed.data.guestUid) return reply.status(400).send({ error: "guestUid required" });
      playerUid = parsed.data.guestUid;
    }

    try {
      return reply.send(await ws.submitFound({
        id: req.params.id,
        playerUid,
        wordIndex: parsed.data.wordIndex,
        positions: parsed.data.positions,
      }));
    } catch (err) { return mapError(err, reply); }
  });

  // End game — teacher/admin only
  app.post<{ Params: { id: string } }>(
    "/:id/end",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await ws.endGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  // Expire guest link — teacher/admin only
  app.post<{ Params: { id: string } }>(
    "/:id/expire-guest",
    { preHandler: [authenticate, requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await ws.expireGuestLink(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );
}
