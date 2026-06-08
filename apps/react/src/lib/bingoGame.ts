import { useEffect, useState } from "react";
import { apiFetch } from "./api";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

export type BoardSize = 3 | 4 | 5;
export type GameStatus = "lobby" | "active" | "ended";

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
  status: GameStatus;
  maxPlayers: number;
  teacherUid: string;
  winner: { uid: string; name: string } | null;
  players: Record<string, BingoPlayer>;
  createdAt: number;
  guestExpired: boolean;
}

export function createBingoGame(input: {
  size: BoardSize;
  maxPlayers: number;
  words: Record<string, BingoWord>;
  wordPool: string[];
}): Promise<BingoGame> {
  return apiFetch<BingoGame>("/games/bingo", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getBingoGame(id: string): Promise<BingoGame> {
  const res = await fetch(`${API_BASE}/games/bingo/${id}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  return res.json();
}

export async function joinBingo(id: string, guest?: { name: string }): Promise<{ game: BingoGame; guestUid?: string }> {
  if (guest) {
    const res = await fetch(`${API_BASE}/games/bingo/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: guest.name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((body.error as string) ?? `HTTP ${res.status}`);
    }
    const game = await res.json() as BingoGame;
    // The returned game has the guest's player entry; find uid by name (they just joined, last entry)
    const entry = Object.values(game.players).find((p) => p.name === guest.name && p.uid.startsWith("guest_"));
    return { game, guestUid: entry?.uid };
  }
  return { game: await apiFetch<BingoGame>(`/games/bingo/${id}/join`, { method: "POST" }) };
}

export function startBingo(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/start`, { method: "POST" });
}

export function callNextWord(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/call`, { method: "POST" });
}

export async function markCell(id: string, char: string, guestUid?: string): Promise<BingoGame> {
  if (guestUid) {
    const res = await fetch(`${API_BASE}/games/bingo/${id}/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ char, guestUid }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    return res.json();
  }
  return apiFetch<BingoGame>(`/games/bingo/${id}/mark`, {
    method: "POST",
    body: JSON.stringify({ char }),
  });
}

export function endBingo(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/end`, { method: "POST" });
}

export function expireBingoGuestLink(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/expire-guest`, { method: "POST" });
}

/** Poll game state. Slows down to 2s while in lobby/ended, 1s while active. */
export function useBingoGame(id: string | undefined): {
  game: BingoGame | null;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [game, setGame] = useState<BingoGame | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = async () => {
    if (!id) return;
    try {
      const g = await getBingoGame(id);
      setGame(g);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const loop = async () => {
      if (cancelled) return;
      try {
        const g = await getBingoGame(id);
        if (cancelled) return;
        setGame(g);
        setError(null);
        const interval = g.status === "active" ? 1000 : 2000;
        if (g.status !== "ended" || !game) {
          timer = setTimeout(loop, interval);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        timer = setTimeout(loop, 3000);
      }
    };
    loop();
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { game, error, refetch: fetchOnce };
}
