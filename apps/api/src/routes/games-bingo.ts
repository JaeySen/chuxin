import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
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

function mapError(err: unknown, reply: FastifyReply) {
  const code = err instanceof Error ? err.message : "INTERNAL";
  const status =
    code === "GAME_NOT_FOUND" ? 404 :
    code === "ROOM_FULL" || code === "GAME_ENDED" || code === "GAME_NOT_ACTIVE" || code === "CHAR_NOT_CALLED" ? 409 :
    code === "NOT_TEACHER" || code === "NOT_IN_GAME" ? 403 :
    500;
  return reply.status(status).send({ error: code });
}

export async function bingoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/", { preHandler: [requireRole("teacher", "admin")] }, async (req, reply) => {
    const parsed = CreateBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });
    try {
      const game = await bingo.createGame({
        teacherUid: req.user.uid,
        ...parsed.data,
      });
      return reply.send(game);
    } catch (err) { return mapError(err, reply); }
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const game = bingo.getGame(req.params.id);
    if (!game) return reply.status(404).send({ error: "GAME_NOT_FOUND" });
    return reply.send(game);
  });

  app.post<{ Params: { id: string } }>("/:id/join", async (req, reply) => {
    try {
      const game = await bingo.joinGame(req.params.id, { uid: req.user.uid, name: req.user.email });
      return reply.send(game);
    } catch (err) { return mapError(err, reply); }
  });

  app.post<{ Params: { id: string } }>(
    "/:id/start",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await bingo.startGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/call",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await bingo.callNextWord(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );

  const MarkBody = z.object({ char: z.string() });
  app.post<{ Params: { id: string }; Body: unknown }>("/:id/mark", async (req, reply) => {
    const parsed = MarkBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid body" });
    try { return reply.send(await bingo.markCell(req.params.id, req.user.uid, parsed.data.char)); }
    catch (err) { return mapError(err, reply); }
  });

  app.post<{ Params: { id: string } }>(
    "/:id/end",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      try { return reply.send(await bingo.endGame(req.params.id, req.user.uid)); }
      catch (err) { return mapError(err, reply); }
    },
  );
}
