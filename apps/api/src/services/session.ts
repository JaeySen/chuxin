import { db } from "../lib/firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "node:crypto";

export interface ActiveSession {
  sessionToken: string;
  ip: string;
  userAgent: string;
  role: string;
  createdAt: FirebaseFirestore.FieldValue;
  lastSeenAt: FirebaseFirestore.FieldValue;
}

// Path: users/{uid}/sessions/active  (4 segments = valid Firestore doc)
function ref(uid: string) {
  return db.collection("users").doc(uid).collection("sessions").doc("active");
}

/**
 * Create or refresh a session.
 * - If `existingToken` matches the stored token → refresh lastSeenAt, return same token.
 * - Otherwise → generate new token (kicks any other active device).
 */
export async function upsertSession(
  uid: string,
  role: string,
  ip: string,
  userAgent: string,
  existingToken?: string
): Promise<string> {
  const snap = await ref(uid).get();

  if (existingToken && snap.exists && snap.data()?.sessionToken === existingToken) {
    await ref(uid).update({ lastSeenAt: FieldValue.serverTimestamp() });
    return existingToken;
  }

  const sessionToken = crypto.randomUUID();
  await ref(uid).set({
    sessionToken,
    ip,
    userAgent,
    role,
    createdAt: FieldValue.serverTimestamp(),
    lastSeenAt: FieldValue.serverTimestamp(),
  });
  return sessionToken;
}

export async function getSession(uid: string): Promise<ActiveSession | null> {
  const snap = await ref(uid).get();
  return snap.exists ? (snap.data() as ActiveSession) : null;
}

export async function deleteSession(uid: string): Promise<void> {
  await ref(uid).delete();
}

export async function touchSession(uid: string): Promise<void> {
  await ref(uid).update({ lastSeenAt: FieldValue.serverTimestamp() }).catch(() => {});
}
