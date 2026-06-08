import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { WordEntry, Placement } from "../utils/wordSearchGen";

export type { WordEntry, Placement };

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

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
  guestExpired: boolean;
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

export async function getWordSearchGame(id: string): Promise<WordSearchGame> {
  const res = await fetch(`${API_BASE}/games/word-search/${id}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  return res.json();
}

export async function joinWordSearch(id: string, guest?: { name: string }): Promise<{ game: WordSearchGame; guestUid?: string }> {
  if (guest) {
    const res = await fetch(`${API_BASE}/games/word-search/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: guest.name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((body.error as string) ?? `HTTP ${res.status}`);
    }
    const game = await res.json() as WordSearchGame;
    const entry = Object.values(game.players).find((p) => p.name === guest.name && p.uid.startsWith("guest_"));
    return { game, guestUid: entry?.uid };
  }
  return { game: await apiFetch<WordSearchGame>(`/games/word-search/${id}/join`, { method: "POST" }) };
}

export function startWordSearch(id: string): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}/start`, { method: "POST" });
}

export function endWordSearch(id: string): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}/end`, { method: "POST" });
}

export function expireWordSearchGuestLink(id: string): Promise<WordSearchGame> {
  return apiFetch<WordSearchGame>(`/games/word-search/${id}/expire-guest`, { method: "POST" });
}

export async function submitFoundWord(
  id: string,
  wordIndex: number,
  positions: [number, number][],
  guestUid?: string,
): Promise<WordSearchGame> {
  if (guestUid) {
    const res = await fetch(`${API_BASE}/games/word-search/${id}/found`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordIndex, positions, guestUid }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    return res.json();
  }
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
        if (g.status === "ended") return;
        const interval = g.status === "active" ? 2000 : 3000;
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
