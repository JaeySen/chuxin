import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";

export type BoardSize = 3 | 4 | 5;

export interface BingoWord {
  char: string;
  pinyin: string;
  en: string;
}

export interface BingoPlayer {
  name: string;
  board: string[][];  // BoardSize × BoardSize grid of chars
  marked: string[];
  bingo: boolean;
}

export interface BingoConfig {
  size: BoardSize;
  hsk1: boolean;
  hsk2: boolean;
  hsk3: boolean;
  maxPlayers: number;
}

export interface BingoGame {
  id: string;
  size: BoardSize;
  words: Record<string, BingoWord>;   // char → word entry (full lookup)
  wordPool: string[];                  // all available chars for calling
  called: string[];                    // chars called so far, in order
  status: "lobby" | "active" | "ended";
  maxPlayers: number;
  config: BingoConfig;
  winner: { uid: string; name: string } | null;
  players: Record<string, BingoPlayer>;
}

// ── Helpers ────────────────────────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function makePlayerBoard(chars: string[], size: BoardSize): string[][] {
  const shuffled = [...chars].sort(() => Math.random() - 0.5);
  const cells = shuffled.slice(0, size * size);
  return Array.from({ length: size }, (_, r) => cells.slice(r * size, (r + 1) * size));
}

// Returns row/col/diagonal indices for any winning line, or null.
export function findBingoLine(
  board: string[][],
  marked: Set<string>
): Array<[number, number]> | null {
  const n = board.length;

  // Rows
  for (let r = 0; r < n; r++) {
    if (board[r].every((c) => marked.has(c))) {
      return board[r].map((_, c) => [r, c] as [number, number]);
    }
  }
  // Columns
  for (let c = 0; c < n; c++) {
    if (board.every((row) => marked.has(row[c]))) {
      return board.map((_, r) => [r, c] as [number, number]);
    }
  }
  // Main diagonal
  if (board.every((row, i) => marked.has(row[i]))) {
    return board.map((_, i) => [i, i] as [number, number]);
  }
  // Anti-diagonal
  if (board.every((row, i) => marked.has(row[n - 1 - i]))) {
    return board.map((_, i) => [i, n - 1 - i] as [number, number]);
  }
  return null;
}

// ── Firestore ops ──────────────────────────────────────────────

export async function createBingoGame(
  words: Record<string, BingoWord>,
  wordPool: string[],
  config: BingoConfig
): Promise<string> {
  const id = genId();
  await setDoc(doc(db, "bingoGames", id), {
    size: config.size,
    words,
    wordPool,
    called: [],
    status: "lobby",
    maxPlayers: config.maxPlayers,
    config,
    winner: null,
    players: {},
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function joinBingo(
  gameId: string,
  playerId: string,
  playerName: string
): Promise<{ board: string[][] } | { error: string }> {
  const ref = doc(db, "bingoGames", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { error: "Không tìm thấy trò chơi" };

  const data = snap.data() as Omit<BingoGame, "id">;
  if (data.players[playerId]) return { board: data.players[playerId].board };

  const count = Object.keys(data.players).length;
  if (count >= data.maxPlayers) return { error: "Phòng đã đầy" };
  if (data.status === "ended") return { error: "Trò chơi đã kết thúc" };

  const board = makePlayerBoard(Object.keys(data.words), data.size);
  await updateDoc(ref, {
    [`players.${playerId}`]: { name: playerName, board, marked: [], bingo: false },
  });
  return { board };
}

export async function startBingo(gameId: string): Promise<void> {
  await updateDoc(doc(db, "bingoGames", gameId), { status: "active" });
}

export async function callNextWord(gameId: string): Promise<void> {
  const ref = doc(db, "bingoGames", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as Omit<BingoGame, "id">;
  const calledSet = new Set(data.called);
  const uncalled = data.wordPool.filter((c) => !calledSet.has(c));
  if (uncalled.length === 0) return;

  const next = uncalled[Math.floor(Math.random() * uncalled.length)];
  await updateDoc(ref, { called: arrayUnion(next) });
}

export async function markCell(
  gameId: string,
  playerId: string,
  char: string,
  board: string[][],
  currentMarked: string[],
  playerName: string
): Promise<void> {
  const newMarked = new Set([...currentMarked, char]);
  const bingo = findBingoLine(board, newMarked) !== null;

  const updates: Record<string, unknown> = {
    [`players.${playerId}.marked`]: arrayUnion(char),
  };
  if (bingo) {
    updates[`players.${playerId}.bingo`] = true;
    updates["winner"] = { uid: playerId, name: playerName };
    updates["status"] = "ended";
  }
  await updateDoc(doc(db, "bingoGames", gameId), updates);
}

export function subscribeBingo(
  gameId: string,
  cb: (g: BingoGame | null) => void
): () => void {
  return onSnapshot(doc(db, "bingoGames", gameId), (snap) => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...(snap.data() as Omit<BingoGame, "id">) });
  });
}
