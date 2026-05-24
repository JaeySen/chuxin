import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { query } from "../db/index.js";

export type Role = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string;
  role: Role;
  provider: string;
  provider_sub: string | null;
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
  return { id: row.id, email: row.email, displayName: row.display_name, role: row.role };
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
