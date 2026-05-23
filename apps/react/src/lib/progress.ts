import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "./firebase";
import type { Progress } from "@hanai/shared";

export async function recordAttempt(
  lessonId: string,
  { score, durationSec, completed }: { score: number; durationSec: number; completed: boolean },
) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid, "progress", lessonId);
  const snap = await getDoc(ref);
  const prev = (snap.exists() ? (snap.data() as Progress) : null) ?? null;
  const now = Date.now();
  const next = {
    firstSeenAt: prev?.firstSeenAt ?? now,
    lastSeenAt: now,
    attempts: (prev?.attempts ?? 0) + 1,
    bestScore: Math.max(prev?.bestScore ?? -1, score),
    lastScore: score,
    completed: completed || !!prev?.completed,
    scoreHistory: [
      ...((prev?.scoreHistory ?? []).slice(-19)),
      { score, durationSec, at: now },
    ],
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function listProgress() {
  const user = auth.currentUser;
  if (!user) return [];
  const snap = await getDocs(
    query(collection(db, "users", user.uid, "progress"), orderBy("lastSeenAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Progress) }));
}

export async function saveWorksheet(lessonId: string, fields: Record<string, string>) {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(
    doc(db, "users", user.uid, "worksheets", lessonId),
    { fields, savedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function loadWorksheet(lessonId: string) {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "users", user.uid, "worksheets", lessonId));
  return snap.exists() ? (snap.data() as { fields: Record<string, string> }) : null;
}
