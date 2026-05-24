import { auth, apiFetch } from "./firebase.js";

export async function recordAttempt(lessonId, { score, durationSec, completed }) {
  if (!auth.currentUser) return;
  return apiFetch(`/progress/${encodeURIComponent(lessonId)}`, {
    method: "POST",
    body: JSON.stringify({ score: score ?? null, durationSec: durationSec ?? null, completed: !!completed }),
  });
}

export async function fetchProgress(lessonId) {
  if (!auth.currentUser) return null;
  const all = await apiFetch("/progress");
  return all.find((p) => p.lessonId === lessonId) ?? null;
}

export async function saveWorksheet(lessonId, fields) {
  if (!auth.currentUser) return;
  await apiFetch(`/worksheets/${encodeURIComponent(lessonId)}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

export async function loadWorksheet(lessonId) {
  if (!auth.currentUser) return null;
  return apiFetch(`/worksheets/${encodeURIComponent(lessonId)}`);
}
