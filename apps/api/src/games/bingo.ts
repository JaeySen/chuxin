import crypto from "node:crypto";
import { query } from "../db/index.js";

export type BoardSize = 3 | 4 | 5;
export type Status = "lobby" | "active" | "ended";

export interface BingoWord {
  char: string;
  pinyin: string;
  en: string;
}

export interface BingoPlayer {
  uid: string;
  name: string;
  board: string[][];
  marked: string[];
  bingo: boolean;
  joinedAt: number;
}

export interface BingoGame {
  id: string;
  size: BoardSize;
  words: Record<string, BingoWord>;
  wordPool: string[];
  called: string[];
  status: Status;
  maxPlayers: number;
  teacherUid: string;
  winner: { uid: string; name: string } | null;
  players: Record<string, BingoPlayer>;
  createdAt: number;
  guestExpired: boolean;
}

const games = new Map<string, BingoGame>();

function genId() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePlayerBoard(chars: string[], size: BoardSize): string[][] {
  const cells = shuffle(chars).slice(0, size * size);
  return Array.from({ length: size }, (_, r) => cells.slice(r * size, (r + 1) * size));
}

function findBingoLine(board: string[][], marked: Set<string>): [number, number][] | null {
  const n = board.length;
  for (let r = 0; r < n; r++) {
    if (board[r].every((c) => marked.has(c))) return board[r].map((_, c) => [r, c]);
  }
  for (let c = 0; c < n; c++) {
    if (board.every((row) => marked.has(row[c]))) return board.map((_, r) => [r, c]);
  }
  if (board.every((row, i) => marked.has(row[i]))) return board.map((_, i) => [i, i]);
  if (board.every((row, i) => marked.has(row[n - 1 - i]))) return board.map((_, i) => [i, n - 1 - i]);
  return null;
}

async function persist(game: BingoGame): Promise<void> {
  await query(
    `INSERT INTO bingo_games (id, state, status, updated_at)
     VALUES ($1, $2::jsonb, $3, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, status = EXCLUDED.status, updated_at = now()`,
    [game.id, JSON.stringify(game), game.status],
  );
}

export async function getGame(id: string): Promise<BingoGame | null> {
  if (games.has(id)) return games.get(id)!;
  // Cache miss — server may have restarted; reload from DB
  const { rows } = await query<{ state: BingoGame }>(
    "SELECT state FROM bingo_games WHERE id = $1", [id],
  );
  if (!rows[0]) return null;
  const game = rows[0].state;
  games.set(id, game);
  return game;
}

export async function createGame(input: {
  teacherUid: string;
  words: Record<string, BingoWord>;
  wordPool: string[];
  size: BoardSize;
  maxPlayers: number;
}): Promise<BingoGame> {
  const id = genId();
  const game: BingoGame = {
    id,
    size: input.size,
    words: input.words,
    wordPool: input.wordPool,
    called: [],
    status: "lobby",
    maxPlayers: input.maxPlayers,
    teacherUid: input.teacherUid,
    winner: null,
    players: {},
    createdAt: Date.now(),
    guestExpired: false,
  };
  games.set(id, game);
  await persist(game);
  return game;
}

export async function joinGame(id: string, player: { uid: string; name: string }): Promise<BingoGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.status === "ended") throw new Error("GAME_ENDED");

  // Teacher may rejoin without consuming a player slot
  if (player.uid === game.teacherUid) return game;

  if (game.players[player.uid]) return game; // already joined → idempotent

  const count = Object.keys(game.players).length;
  if (count >= game.maxPlayers) throw new Error("ROOM_FULL");

  game.players[player.uid] = {
    uid: player.uid,
    name: player.name,
    board: makePlayerBoard(Object.keys(game.words), game.size),
    marked: [],
    bingo: false,
    joinedAt: Date.now(),
  };
  await persist(game);
  return game;
}

export async function startGame(id: string, requesterUid: string): Promise<BingoGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.teacherUid !== requesterUid) throw new Error("NOT_TEACHER");
  game.status = "active";
  await persist(game);
  return game;
}

export async function callNextWord(id: string, requesterUid: string): Promise<BingoGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.teacherUid !== requesterUid) throw new Error("NOT_TEACHER");
  if (game.status !== "active") throw new Error("GAME_NOT_ACTIVE");

  const calledSet = new Set(game.called);
  const uncalled = game.wordPool.filter((c) => !calledSet.has(c));
  if (uncalled.length === 0) return game;

  const next = uncalled[Math.floor(Math.random() * uncalled.length)];
  game.called.push(next);
  await persist(game);
  return game;
}

export async function markCell(id: string, playerUid: string, char: string): Promise<BingoGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.status !== "active") throw new Error("GAME_NOT_ACTIVE");
  const player = game.players[playerUid];
  if (!player) throw new Error("NOT_IN_GAME");
  if (!game.called.includes(char)) throw new Error("CHAR_NOT_CALLED");
  if (player.marked.includes(char)) return game;

  player.marked.push(char);
  const newMarked = new Set(player.marked);
  if (findBingoLine(player.board, newMarked)) {
    player.bingo = true;
    if (!game.winner) {
      game.winner = { uid: playerUid, name: player.name };
      game.status = "ended";
    }
  }
  await persist(game);
  return game;
}

export async function endGame(id: string, requesterUid: string): Promise<BingoGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.teacherUid !== requesterUid) throw new Error("NOT_TEACHER");
  game.status = "ended";
  await persist(game);
  return game;
}

export async function expireGuestLink(id: string, requesterUid: string): Promise<BingoGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.teacherUid !== requesterUid) throw new Error("NOT_TEACHER");
  game.guestExpired = true;
  await persist(game);
  return game;
}
