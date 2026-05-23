/**
 * Sync content/lessons/**\/*.yml to Firestore.
 *
 * Usage:
 *   pnpm sync                         # writes to the production project
 *   pnpm sync:emulator                # writes to the local Firestore emulator
 *
 * The `course/{id}` documents (with their lessonIds) are also rewritten from scratch.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { LessonSchema, COURSES, type Lesson } from "@hanai/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content", "lessons");

async function main() {
  const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const projectId = process.env.FIREBASE_PROJECT_ID ?? "sotamhsk";

  if (usingEmulator) {
    console.log(`→ using emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    initializeApp({ projectId });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: applicationDefault(), projectId });
  } else if (process.env.FB_SERVICE_ACCOUNT_JSON) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON)),
      projectId,
    });
  } else {
    initializeApp({ projectId });
  }

  const db = getFirestore();
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

  const batch = db.batch();
  for (const lesson of validated) {
    batch.set(db.collection("lessons").doc(lesson.id), {
      ...lesson,
      updatedAt: new Date(),
    });
  }

  for (const c of COURSES) {
    const ids = validated
      .filter((l) => l.course === c.id)
      .sort((a, b) => a.order - b.order)
      .map((l) => l.id);
    batch.set(db.collection("courses").doc(c.id), { ...c, lessonIds: ids });
  }

  await batch.commit();
  console.log(`✓ wrote ${validated.length} lessons + ${COURSES.length} courses to Firestore.`);
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
