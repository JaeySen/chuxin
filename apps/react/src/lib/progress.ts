import { apiFetch, getStoredJwt } from "./api";
import type { Progress } from "@hanai/shared";

interface ProgressRow extends Progress {
  lessonId: string;
}

export async function recordAttempt(
  lessonId: string,
  { score, durationSec, completed }: { score: number; durationSec: number; completed: boolean },
): Promise<ProgressRow | undefined> {
  if (!getStoredJwt()) return undefined;
  return apiFetch<ProgressRow>(`/progress/${encodeURIComponent(lessonId)}`, {
    method: "POST",
    body: JSON.stringify({ score, durationSec, completed }),
  });
}

export async function listProgress(): Promise<Array<ProgressRow & { id: string }>> {
  if (!getStoredJwt()) return [];
  const rows = await apiFetch<ProgressRow[]>("/progress");
  return rows.map((r) => ({ ...r, id: r.lessonId }));
}

export async function saveWorksheet(lessonId: string, fields: Record<string, string>): Promise<void> {
  if (!getStoredJwt()) return;
  await apiFetch(`/worksheets/${encodeURIComponent(lessonId)}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

export async function loadWorksheet(
  lessonId: string,
): Promise<{ fields: Record<string, string> } | null> {
  if (!getStoredJwt()) return null;
  return apiFetch<{ fields: Record<string, string> } | null>(
    `/worksheets/${encodeURIComponent(lessonId)}`,
  );
}
