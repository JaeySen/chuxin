import crypto from "node:crypto";
import { query } from "../db/index.js";

export type Status = "lobby" | "active" | "ended";

export interface WordEntry {
  char: string;          // e.g. "你好"
  pinyin: string;        // e.g. "nǐ hǎo"
  en: string;            // gloss
  pinyinChars: string[]; // flat per-cell characters, e.g. ["n","ǐ","h","ǎ","o"]
}

export interface Placement {
  wordIndex: number;
  positions: [number, number][];
}

export interface Player {
  uid: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface FoundInfo {
  by: string;
  name: string;
  color: string;
  positions: [number, number][];
  foundAt: number;
}

export interface WordSearchGame {
  id: string;
  board: string[][];
  wordList: WordEntry[];
  placements: Placement[];
  players: Record<string, Player>;
  found: Record<string, FoundInfo>;       // key = wordIndex
  status: Status;
  startAt: number | null;
  endAt: number | null;
  maxPlayers: number;
  teacherUid: string;
  createdAt: number;
  guestExpired: boolean;
}

const PLAYER_COLORS = [
  "#a71e22", "#ffc60b", "#2563eb", "#16a34a", "#7c3aed",
  "#db2777", "#0891b2", "#ea580c", "#65a30d", "#4f46e5",
];

const games = new Map<string, WordSearchGame>();

function genId() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

async function persist(game: WordSearchGame): Promise<void> {
  await query(
    `INSERT INTO word_search_games (id, state, status, updated_at)
     VALUES ($1, $2::jsonb, $3, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, status = EXCLUDED.status, updated_at = now()`,
    [game.id, JSON.stringify(game), game.status],
  );
}

export async function getGame(id: string): Promise<WordSearchGame | null> {
  if (games.has(id)) return games.get(id)!;
  const { rows } = await query<{ state: WordSearchGame }>(
    "SELECT state FROM word_search_games WHERE id = $1", [id],
  );
  if (!rows[0]) return null;
  const game = rows[0].state;
  games.set(id, game);
  return game;
}

export async function createGame(input: {
  teacherUid: string;
  board: string[][];
  wordList: WordEntry[];
  placements: Placement[];
  maxPlayers: number;
}): Promise<WordSearchGame> {
  const id = genId();
  const game: WordSearchGame = {
    id,
    board: input.board,
    wordList: input.wordList,
    placements: input.placements,
    players: {},
    found: {},
    status: "lobby",
    startAt: null,
    endAt: null,
    maxPlayers: input.maxPlayers,
    teacherUid: input.teacherUid,
    createdAt: Date.now(),
    guestExpired: false,
  };
  games.set(id, game);
  await persist(game);
  return game;
}

export async function joinGame(id: string, player: { uid: string; name: string }): Promise<WordSearchGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.status === "ended") throw new Error("GAME_ENDED");

  if (player.uid === game.teacherUid) return game;
  if (game.players[player.uid]) return game;

  const count = Object.keys(game.players).length;
  if (count >= game.maxPlayers) throw new Error("ROOM_FULL");

  game.players[player.uid] = {
    uid: player.uid,
    name: player.name,
    color: PLAYER_COLORS[count % PLAYER_COLORS.length],
    joinedAt: Date.now(),
  };
  await persist(game);
  return game;
}

export async function startGame(id: string, requesterUid: string): Promise<WordSearchGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.teacherUid !== requesterUid) throw new Error("NOT_TEACHER");
  game.status = "active";
  game.startAt = Date.now();
  await persist(game);
  return game;
}

export async function endGame(id: string, requesterUid: string): Promise<WordSearchGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.teacherUid !== requesterUid) throw new Error("NOT_TEACHER");
  game.status = "ended";
  game.endAt = Date.now();
  await persist(game);
  return game;
}

export async function expireGuestLink(id: string, requesterUid: string): Promise<WordSearchGame> {
  const game = games.get(id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.teacherUid !== requesterUid) throw new Error("NOT_TEACHER");
  game.guestExpired = true;
  await persist(game);
  return game;
}

export async function submitFound(input: {
  id: string;
  playerUid: string;
  wordIndex: number;
  positions: [number, number][];
}): Promise<WordSearchGame> {
  const game = games.get(input.id);
  if (!game) throw new Error("GAME_NOT_FOUND");
  if (game.status !== "active") throw new Error("GAME_NOT_ACTIVE");

  const player = game.players[input.playerUid];
  if (!player) throw new Error("NOT_IN_GAME");

  const key = String(input.wordIndex);
  if (game.found[key]) return game; // already found by someone

  // Verify the submitted positions match the actual placement
  const expected = game.placements.find((p) => p.wordIndex === input.wordIndex);
  if (!expected) throw new Error("INVALID_WORD");

  const matches =
    expected.positions.length === input.positions.length &&
    expected.positions.every(([er, ec], i) => input.positions[i][0] === er && input.positions[i][1] === ec);

  // Also allow reversed selection
  const reversed = [...expected.positions].reverse();
  const matchesReversed =
    reversed.length === input.positions.length &&
    reversed.every(([er, ec], i) => input.positions[i][0] === er && input.positions[i][1] === ec);

  if (!matches && !matchesReversed) throw new Error("WRONG_SELECTION");

  game.found[key] = {
    by: input.playerUid,
    name: player.name,
    color: player.color,
    positions: input.positions,
    foundAt: Date.now(),
  };

  // Auto-end if all words found
  if (Object.keys(game.found).length === game.wordList.length) {
    game.status = "ended";
    game.endAt = Date.now();
  }
  await persist(game);
  return game;
}
