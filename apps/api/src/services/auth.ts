import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { query } from "../db/index.js";

export type Role = "student" | "teacher" | "admin" | "staff" | "assistant";

export interface EnrolledClass {
  id: string;
  name: string;
  courseId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  displayName: string;
  role: Role;
  locked?: boolean;
  classes?: EnrolledClass[];
}

interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  display_name: string;
  role: Role;
  provider: string;
  provider_sub: string | null;
  locked: boolean;
  locked_at: Date | null;
  locked_reason: string | null;
}

// Teacher allowlist — moved from functions/src/grant-teacher-claim.ts.
// New users with these emails are auto-assigned the teacher role on signup.
const TEACHER_EMAILS = new Set<string>([
  "jasson.testapp@gmail.com",
]);

function resolveInitialRole(email: string): Role {
  return TEACHER_EMAILS.has(email.toLowerCase()) ? "teacher" : "student";
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export function signJwt(user: AuthUser): string {
  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d", issuer: "sotamhsk-api" });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret(), { issuer: "sotamhsk-api" }) as JwtPayload;
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone ?? null,
    displayName: row.display_name,
    role: row.role,
    locked: row.locked,
  };
}

export function normalizePhone(raw: string): string {
  // Strip all non-digits, normalise leading 0 → +84 (Vietnamese)
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("84")) return `+${digits}`;
  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  return `+${digits}`;
}

export async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const norm = normalizePhone(phone);
  const { rows } = await query<UserRow>("SELECT * FROM users WHERE phone = $1", [norm]);
  return rows[0] ?? null;
}

export async function signupWithPhone(input: {
  phone: string;
  password: string;
  displayName: string;
}): Promise<AuthUser> {
  const phone = normalizePhone(input.phone);
  const existing = await findUserByPhone(phone);
  if (existing) throw new Error("PHONE_TAKEN");

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  const { rows } = await query<UserRow>(
    `INSERT INTO users (email, phone, password_hash, display_name, role, provider)
     VALUES ($1, $2, $3, $4, 'student', 'password')
     RETURNING *`,
    [`phone_${phone.replace(/\D/g, "")}@placeholder.local`, phone, passwordHash, input.displayName],
  );
  return toAuthUser(rows[0]);
}

export async function loginWithPhone(phone: string, password: string): Promise<AuthUser> {
  const user = await findUserByPhone(phone);
  if (!user || !user.password_hash) throw new Error("INVALID_CREDENTIALS");
  const ok = await argon2.verify(user.password_hash, password);
  if (!ok) throw new Error("INVALID_CREDENTIALS");
  return toAuthUser(user);
}

export async function lockUser(userId: string, reason: string): Promise<void> {
  await query(
    `UPDATE users SET locked = true, locked_at = now(), locked_reason = $2 WHERE id = $1`,
    [userId, reason],
  );
}

export async function unlockUser(userId: string): Promise<void> {
  await query(
    `UPDATE users SET locked = false, locked_at = NULL, locked_reason = NULL WHERE id = $1`,
    [userId],
  );
}

export interface AuthEventInput {
  userId: string;
  eventType: "cross_ip_blocked" | "soft_cross_ip" | "admin_unlock";
  attemptedIp?: string | null;
  attemptedUserAgent?: string | null;
  existingSessionIp?: string | null;
  resolvedBy?: string | null;
  note?: string | null;
}

export async function recordAuthEvent(input: AuthEventInput): Promise<void> {
  const resolved = input.eventType === "admin_unlock";
  await query(
    `INSERT INTO auth_events
       (user_id, event_type, attempted_ip, attempted_user_agent, existing_session_ip,
        resolved, resolved_at, resolved_by, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.userId,
      input.eventType,
      input.attemptedIp ?? null,
      input.attemptedUserAgent ?? null,
      input.existingSessionIp ?? null,
      resolved,
      resolved ? new Date() : null,
      input.resolvedBy ?? null,
      input.note ?? null,
    ],
  );
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? toAuthUser(rows[0]) : null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function signupWithPassword(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthUser> {
  const email = input.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("EMAIL_TAKEN");

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
  const role = resolveInitialRole(email);

  const { rows } = await query<UserRow>(
    `INSERT INTO users (email, password_hash, display_name, role, provider)
     VALUES ($1, $2, $3, $4, 'password')
     RETURNING *`,
    [email, passwordHash, input.displayName, role],
  );
  return toAuthUser(rows[0]);
}

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  const user = await findUserByEmail(email);
  if (!user || !user.password_hash) throw new Error("INVALID_CREDENTIALS");
  const ok = await argon2.verify(user.password_hash, password);
  if (!ok) throw new Error("INVALID_CREDENTIALS");
  return toAuthUser(user);
}

/**
 * For Google OAuth: find or create a user from a verified Google profile.
 * Caller is responsible for verifying the Google ID token first.
 */
export async function upsertGoogleUser(input: {
  googleSub: string;
  email: string;
  displayName: string;
}): Promise<AuthUser> {
  const email = input.email.toLowerCase();

  const byProvider = await query<UserRow>(
    "SELECT * FROM users WHERE provider = 'google' AND provider_sub = $1",
    [input.googleSub],
  );
  if (byProvider.rows[0]) return toAuthUser(byProvider.rows[0]);

  const byEmail = await findUserByEmail(email);
  if (byEmail) {
    const { rows } = await query<UserRow>(
      `UPDATE users SET provider = 'google', provider_sub = $1 WHERE id = $2 RETURNING *`,
      [input.googleSub, byEmail.id],
    );
    return toAuthUser(rows[0]);
  }

  const role = resolveInitialRole(email);
  const { rows } = await query<UserRow>(
    `INSERT INTO users (email, display_name, role, provider, provider_sub)
     VALUES ($1, $2, $3, 'google', $4)
     RETURNING *`,
    [email, input.displayName, role, input.googleSub],
  );
  return toAuthUser(rows[0]);
}
