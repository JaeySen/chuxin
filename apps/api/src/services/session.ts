import crypto from "node:crypto";
import { query, withTransaction } from "../db/index.js";

export interface ActiveSession {
  token: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastSeenAt: Date;
}

interface SessionRow {
  token: string;
  user_id: string;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
  last_seen_at: Date;
}

function toSession(row: SessionRow): ActiveSession {
  return {
    token: row.token,
    userId: row.user_id,
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

/**
 * Create a new session and invalidate all prior sessions for the user
 * (single-device enforcement). Returns the new session token.
 */
export async function createSession(
  userId: string,
  ip: string,
  userAgent: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await withTransaction(async (client) => {
    await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    await client.query(
      `INSERT INTO sessions (token, user_id, ip, user_agent) VALUES ($1, $2, $3, $4)`,
      [token, userId, ip, userAgent],
    );
  });
  return token;
}

export async function getSessionByToken(token: string): Promise<ActiveSession | null> {
  const { rows } = await query<SessionRow>("SELECT * FROM sessions WHERE token = $1", [token]);
  return rows[0] ? toSession(rows[0]) : null;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function deleteAllSessionsForUser(userId: string): Promise<void> {
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

export async function touchSession(token: string): Promise<void> {
  await query("UPDATE sessions SET last_seen_at = now() WHERE token = $1", [token]);
}
