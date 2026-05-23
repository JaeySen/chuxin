import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { PlacedWord } from "../utils/wordSearchGen";

export const PLAYER_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706",
  "#7c3aed", "#db2777", "#0891b2", "#ea580c",
  "#65a30d", "#4f46e5",
];

export interface WordEntry {
  char: string;
  pinyin: string;
  en: string;
  syllables: string[];
}

export interface Player {
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

export interface GameConfig {
  hsk1: boolean;
  hsk2: boolean;
  hsk3: boolean;
  maxPlayers: number;
}

export interface GameState {
  id: string;
  board: string[][];
  wordList: WordEntry[];
  placements: PlacedWord[];
  players: Record<string, Player>;
  found: Record<string, FoundInfo>;
  status: "lobby" | "active" | "ended";
  startAt: Timestamp | null;
  endAt: Timestamp | null;
  maxPlayers: number;
  config: GameConfig;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createGame(
  board: string[][],
  wordList: WordEntry[],
  placements: PlacedWord[],
  config: GameConfig
): Promise<string> {
  const id = genId();
  await setDoc(doc(db, "wordSearchGames", id), {
    board,
    wordList,
    placements,
    players: {},
    found: {},
    status: "lobby",
    startAt: null,
    endAt: null,
    maxPlayers: config.maxPlayers,
    config,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function joinGame(
  gameId: string,
  playerId: string,
  playerName: string
): Promise<{ color: string } | { error: string }> {
  const ref = doc(db, "wordSearchGames", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { error: "Không tìm thấy trò chơi" };

  const data = snap.data();
  const players: Record<string, Player> = data.players ?? {};

  if (players[playerId]) return { color: players[playerId].color };

  const count = Object.keys(players).length;
  if (count >= (data.maxPlayers ?? 10)) return { error: "Phòng đã đầy" };
  if (data.status === "ended") return { error: "Trò chơi đã kết thúc" };

  const color = PLAYER_COLORS[count % PLAYER_COLORS.length];
  await updateDoc(ref, {
    [`players.${playerId}`]: { name: playerName, color, joinedAt: Date.now() },
  });
  return { color };
}

export async function startGame(gameId: string): Promise<void> {
  await updateDoc(doc(db, "wordSearchGames", gameId), {
    status: "active",
    startAt: serverTimestamp(),
  });
}

export async function endGame(gameId: string): Promise<void> {
  await updateDoc(doc(db, "wordSearchGames", gameId), {
    status: "ended",
    endAt: serverTimestamp(),
  });
}

export async function submitFoundWord(
  gameId: string,
  wordKey: string,
  playerId: string,
  playerName: string,
  playerColor: string,
  positions: [number, number][]
): Promise<void> {
  const ref = doc(db, "wordSearchGames", gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  if (snap.data().found?.[wordKey]) return; // already found, no-op

  await updateDoc(ref, {
    [`found.${wordKey}`]: {
      by: playerId,
      name: playerName,
      color: playerColor,
      positions,
      foundAt: Date.now(),
    },
  });
}

export function subscribeGame(
  gameId: string,
  cb: (g: GameState | null) => void
): () => void {
  return onSnapshot(doc(db, "wordSearchGames", gameId), (snap) => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...(snap.data() as Omit<GameState, "id">) });
  });
}
