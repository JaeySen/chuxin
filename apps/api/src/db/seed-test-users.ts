import "dotenv/config";
import argon2 from "argon2";
import { pool } from "./index.js";

interface TestUser {
  email: string;
  password: string;
  displayName: string;
  role: "student" | "teacher" | "admin";
}

const USERS: TestUser[] = [
  { email: "student@sotam.test", password: "Student@2026", displayName: "Hoc Vien Demo", role: "student" },
  { email: "teacher@sotam.test", password: "Teacher@2026", displayName: "Giao Vien Demo", role: "teacher" },
  { email: "admin@sotam.test",   password: "Admin@2026",   displayName: "Quan Tri Demo",  role: "admin"   },
];

async function run() {
  for (const u of USERS) {
    const hash = await argon2.hash(u.password, { type: argon2.argon2id });
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, provider)
       VALUES ($1, $2, $3, $4, 'password')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         display_name  = EXCLUDED.display_name,
         role          = EXCLUDED.role,
         provider      = 'password'`,
      [u.email, hash, u.displayName, u.role],
    );
    console.log(`✓ ${u.role.padEnd(8)} ${u.email}  (password: ${u.password})`);
  }
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
