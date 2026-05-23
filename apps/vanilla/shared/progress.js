import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "./firebase.js";

export async function recordAttempt(lessonId, { score, durationSec, completed }) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid, "progress", lessonId);
  const snap = await getDoc(ref);
  const prev = snap.exists() ? snap.data() : null;
  const now = Date.now();

  const next = {
    firstSeenAt: prev?.firstSeenAt ?? now,
    lastSeenAt: now,
    attempts: (prev?.attempts ?? 0) + 1,
    bestScore: Math.max(prev?.bestScore ?? -1, score ?? 0),
    lastScore: score ?? null,
    completed: !!completed || !!prev?.completed,
    scoreHistory: [
      ...((prev?.scoreHistory ?? []).slice(-19)),
      { score: score ?? 0, durationSec: durationSec ?? 0, at: now },
    ],
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function fetchProgress(lessonId) {
  const user = auth.currentUser;
  if (!user) return null;
  const ref = doc(db, "users", user.uid, "progress", lessonId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveWorksheet(lessonId, fields) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid, "worksheets", lessonId);
  await setDoc(
    ref,
    { fields, savedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function loadWorksheet(lessonId) {
  const user = auth.currentUser;
  if (!user) return null;
  const ref = doc(db, "users", user.uid, "worksheets", lessonId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
