/**
 * Sync content/lessons/**\/*.yml to Postgres.
 *
 * Usage:
 *   pnpm sync
 *
 * Requires DATABASE_URL env var (see apps/api/.env.example).
 *
 * Writes:
 *   - One row per lesson into the `lessons` table (id, course_id, order, title,
 *     subtitle, interaction_type, data JSONB).
 *   - One row per course into the `courses` table.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";
import pg from "pg";
import { LessonSchema, COURSES, type Lesson } from "@hanai/shared";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content", "yaml");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required (see apps/api/.env.example).");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const lessons = await loadAllLessons();
  console.log(`Found ${lessons.length} lesson YAML files.`);

  const errors: string[] = [];
  const validated: Lesson[] = [];
  for (const { file, raw } of lessons) {
    const parsed = LessonSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`${file}\n${parsed.error.toString()}`);
    } else {
      validated.push(parsed.data);
    }
  }
  if (errors.length) {
    console.error(`✗ ${errors.length} lesson(s) failed validation:`);
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log(`✓ all ${validated.length} lessons validated against schema.`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const c of COURSES) {
      await client.query(
        `INSERT INTO courses (id, title, subtitle, color, "order", updated_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (id) DO UPDATE SET
           title    = EXCLUDED.title,
           subtitle = EXCLUDED.subtitle,
           color    = EXCLUDED.color,
           "order"  = EXCLUDED."order",
           updated_at = now()`,
        [c.id, c.title, c.subtitle ?? null, c.color, c.order],
      );
    }

    for (const lesson of validated) {
      await client.query(
        `INSERT INTO lessons (id, course_id, "order", title, subtitle, interaction_type, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now())
         ON CONFLICT (id) DO UPDATE SET
           course_id        = EXCLUDED.course_id,
           "order"          = EXCLUDED."order",
           title            = EXCLUDED.title,
           subtitle         = EXCLUDED.subtitle,
           interaction_type = EXCLUDED.interaction_type,
           data             = EXCLUDED.data,
           updated_at       = now()`,
        [
          lesson.id,
          lesson.course,
          lesson.order,
          lesson.title,
          lesson.subtitle ?? null,
          lesson.interactionType,
          lesson,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  await pool.end();
  console.log(`✓ wrote ${validated.length} lessons + ${COURSES.length} courses to Postgres.`);
}

async function loadAllLessons(): Promise<{ file: string; raw: unknown }[]> {
  const out: { file: string; raw: unknown }[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (
        e.isFile() &&
        (p.endsWith(".yml") || p.endsWith(".yaml")) &&
        !p.endsWith(".draft.yml")
      ) {
        const txt = await fs.readFile(p, "utf8");
        out.push({ file: path.relative(REPO_ROOT, p), raw: yaml.parse(txt) });
      }
    }
  }
  await walk(CONTENT_DIR);
  return out;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
