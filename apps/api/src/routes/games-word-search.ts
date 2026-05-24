import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
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
});

function mapError(err: unknown, reply: FastifyReply) {
  const code = err instanceof Error ? err.message : "INTERNAL";
  const status =
    code === "GAME_NOT_FOUND" || code === "INVALID_WORD" ? 404 :
    code === "ROOM_FULL" || code === "GAME_ENDED" || code === "GAME_NOT_ACTIVE" || code === "WRONG_SELECTION" ? 409 :
    code === "NOT_TEACHER" || code === "NOT_IN_GAME" ? 403 :
    500;
  return reply.status(status).send({ error: code });
}

export async function wordSearchRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/", { preHandler: [requireRole("teacher", "admin")] }, async (req, reply) => {
    const parsed = CreateBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    try {
      return reply.send(await ws.createGame({ teacherUid: req.user.uid, ...parsed.data }));
    } catch (err) { return mapError(err, reply); }
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const game = ws.getGame(req.params.id);
    if (!game) return reply.status(404).send({ error: "GAME_NOT_FOUND" });
    return reply.send(game);
  });

  app.post<{ Params: { id: string } }>("/:id/join", async (req, reply) => {
    try { return reply.send(await ws.joinGame(req.params.id, { uid: req.user.uid, name: req.user.email })); }
    catch (err) { return mapError(err, reply); }
  });

  app.post<{ Params: { id: string } }>(
    "/:id/start",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await ws.startGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  app.post<{ Params: { id: string }; Body: unknown }>("/:id/found", async (req, reply) => {
    const parsed = FoundBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });
    try {
      return reply.send(await ws.submitFound({
        id: req.params.id,
        playerUid: req.user.uid,
        wordIndex: parsed.data.wordIndex,
        positions: parsed.data.positions,
      }));
    } catch (err) { return mapError(err, reply); }
  });

  app.post<{ Params: { id: string } }>(
    "/:id/end",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await ws.endGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );
}
