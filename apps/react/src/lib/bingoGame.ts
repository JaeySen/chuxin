import { useEffect, useState } from "react";
import { apiFetch } from "./api";

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

export function getBingoGame(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}`);
}

export function joinBingo(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/join`, { method: "POST" });
}

export function startBingo(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/start`, { method: "POST" });
}

export function callNextWord(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/call`, { method: "POST" });
}

export function markCell(id: string, char: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/mark`, {
    method: "POST",
    body: JSON.stringify({ char }),
  });
}

export function endBingo(id: string): Promise<BingoGame> {
  return apiFetch<BingoGame>(`/games/bingo/${id}/end`, { method: "POST" });
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
