import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { WordEntry, Placement } from "../utils/wordSearchGen";

export type { WordEntry, Placement };

export type GameStatus = "lobby" | "active" | "ended";

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
  found: Record<string, FoundInfo>;
  status: GameStatus;
  startAt: number | null;
  endAt: number | null;
  maxPlayers: number;
  teacherUid: string;
  createdAt: number;
}

export function createWordSearchGame(input: {
  maxPlayers: number;
  board: string[][];
  wordList: WordEntry[];
  placements: Placement[];
}): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>("/games/word-search", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getWordSearchGame(id: string): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}`);
}

export function joinWordSearch(id: string): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}/join`, { method: "POST" });
}

export function startWordSearch(id: string): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}/start`, { method: "POST" });
}

export function endWordSearch(id: string): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}/end`, { method: "POST" });
}

export function submitFoundWord(
  id: string,
  wordIndex: number,
  positions: [number, number][],
): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}/found`, {
    method: "POST",
    body: JSON.stringify({ wordIndex, positions }),
  });
}

export function useWordSearchGame(id: string | undefined): {
  game: WordSearchGame | null;
  error: string | null;
} {
  const [game, setGame] = useState<WordSearchGame | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const loop = async () => {
      if (cancelled) return;
      try {
        const g = await getWordSearchGame(id);
        if (cancelled) return;
        setGame(g);
        setError(null);
        const interval = g.status === "active" ? 1200 : 2000;
        timer = setTimeout(loop, interval);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        timer = setTimeout(loop, 3000);
      }
    };
    loop();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id]);

  return { game, error };
}
