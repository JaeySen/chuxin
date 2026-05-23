/**
 * Best-effort extraction of lesson data from the legacy content/hypertext/*.html files.
 *
 * Heuristics — not perfect, expect to hand-correct the drafts:
 *
 *   - Each input HTML becomes one draft YAML in content/lessons/<course>/<id>.draft.yml.
 *   - The interactionType is guessed from the filename:
 *       tuvung*, flashcard*, *card*    → flashcard
 *       *dich*                          → translate
 *       *tuongtac*, baidoc*tooltip*    → reading-tooltip
 *       baidoc*, ontap*reading*         → reading-toggle
 *       *demso*                         → counting-grid
 *       *boctham*                       → lucky-draw
 *       *cuoiky*, ontapcuoi*            → mcq        (final exam, multi-format)
 *       *baitap*, *phieubaitap*         → fill-blank
 *       *nguphap*                       → grammar-tabs
 *       *debate*, cauchude*             → debate
 *       default                         → mcq
 *
 *   - Hanzi/pinyin/Vietnamese strings are pulled from <td>/<li> rows in vocab tables.
 *   - Quiz options/answers are pulled from JS arrays matching common patterns
 *     (questions = [...], data = [...]). Failing that, the file is left mostly empty
 *     with a `// REVIEW:` flag on each unparsed section.
 *
 * Usage:
 *   pnpm extract -- --course=han1
 *   pnpm extract -- --file=content/hypertext/han2/flashcardbai18.html
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import yaml from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const LEGACY_ROOT = path.join(REPO_ROOT, "content", "hypertext");
const OUTPUT_ROOT = path.join(REPO_ROOT, "content", "yaml");

const COURSE_DIRS = ["han1", "han2", "han3", "han4"];

type Draft = {
  id: string;
  course: string;
  order: number;
  title: string;
  interactionType: string;
  [k: string]: unknown;
};

function guessInteractionType(filename: string): string {
  const f = filename.toLowerCase();
  if (/(flashcard|tuvung|^card)/.test(f)) return "flashcard";
  if (/dich/.test(f)) return "translate";
  if (/baidochonnhanh|baidocxuanvan/.test(f)) return "reading-tooltip";
  if (/baidoc/.test(f)) return "reading-toggle";
  if (/demso/.test(f)) return "counting-grid";
  if (/boctham/.test(f)) return "lucky-draw";
  if (/(cuoiky|cuoikihan|cuoikyhan)/.test(f)) return "mcq";
  if (/baitap|phieubaitap/.test(f)) return "fill-blank";
  if (/nguphap/.test(f)) return "grammar-tabs";
  if (/(debate|cauchude)/.test(f)) return "debate";
  if (/(tuongtac|hoithoai|dialogue)/.test(f)) return "dialogue";
  return "mcq";
}

function parseTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "Untitled lesson";
}

function extractVocabRows(root: ReturnType<typeof parse>):
  { hanzi: string; pinyin: string; vi: string }[] {
  const out: { hanzi: string; pinyin: string; vi: string }[] = [];
  for (const row of root.querySelectorAll("tr")) {
    const cells = row.querySelectorAll("td").map((c) => c.text.trim());
    if (cells.length < 3) continue;
    const [hanzi, pinyin, vi] = cells;
    if (!/[一-鿿]/.test(hanzi)) continue;
    out.push({ hanzi, pinyin, vi });
  }
  return out;
}

function extractScriptArrays(html: string): unknown[] {
  const arrays: unknown[] = [];
  const re = /(?:const|let|var)\s+(\w+)\s*=\s*(\[[\s\S]*?\]);/g;
  let m;
  while ((m = re.exec(html))) {
    const name = m[1].toLowerCase();
    if (!/(questions?|data|cards?|items?|pairs?|vocab|words?|outcomes?)/.test(name)) continue;
    try {
      // Wrap in IIFE-eval — only if it parses as JSON-like; otherwise skip.
      const cleaned = m[2]
        .replace(/(\w+)\s*:/g, '"$1":')
        .replace(/'/g, '"')
        .replace(/,\s*([\]}])/g, "$1");
      arrays.push({ name, value: JSON.parse(cleaned) });
    } catch {
      // ignore
    }
  }
  return arrays;
}

async function extractFile(file: string, course: string, order: number): Promise<Draft> {
  const html = await fs.readFile(file, "utf8");
  const root = parse(html);
  const filename = path.basename(file, ".html");
  const id = `${course}-${filename}-draft`;
  const title = parseTitle(html);
  const itype = guessInteractionType(filename);
  const vocab = extractVocabRows(root);
  const arrays = extractScriptArrays(html);

  const draft: Draft = {
    id,
    course,
    order,
    title,
    interactionType: itype,
    "// SOURCE": file.replace(REPO_ROOT + "/", ""),
    "// REVIEW": "Auto-extracted; verify and remove placeholder comment fields before sync.",
  };

  if (itype === "flashcard") {
    draft.cards = vocab.length
      ? vocab.map(({ hanzi, pinyin, vi }) => ({ hanzi, pinyin, vi }))
      : [{ hanzi: "REVIEW", pinyin: "", vi: "" }];
  } else if (itype === "reading-toggle" || itype === "reading-tooltip") {
    draft.passage = vocab.length
      ? vocab.map(({ hanzi, pinyin, vi }) => ({ hanzi, pinyin, vi }))
      : [{ hanzi: "REVIEW", pinyin: "", vi: "" }];
    if (itype === "reading-tooltip") {
      draft.glossary = vocab.map(({ hanzi, pinyin, vi }) => ({ token: hanzi, pinyin, vi }));
      draft.passage = vocab.map((v) => v.hanzi).join("\n");
    }
  } else if (itype === "mcq") {
    const qs = arrays.find((a: any) => /questions?/.test(a.name)) as any;
    draft.questions = qs?.value ?? [
      { prompt: "REVIEW: extract questions from source", options: ["A", "B"], correctIndex: 0 },
    ];
  } else if (itype === "fill-blank") {
    draft.items = [{ prompt: "REVIEW", blanks: [{ answer: "" }] }];
  } else if (itype === "translate") {
    draft.pairs = vocab.length
      ? vocab.map(({ hanzi, vi, pinyin }) => ({ zh: hanzi, vi, pinyin }))
      : [{ zh: "REVIEW", vi: "" }];
  } else if (itype === "lucky-draw") {
    draft.outcomes = ["REVIEW outcome 1", "REVIEW outcome 2"];
  } else if (itype === "counting-grid") {
    draft.cells = vocab.map((v) => v.hanzi);
    draft.gridCols = 5;
    draft.startIndex = 0;
    draft.endIndex = Math.max(0, draft.cells.length - 1);
  } else if (itype === "dialogue") {
    draft.roles = ["A", "B"];
    draft.lines = vocab.length
      ? vocab.map(({ hanzi, pinyin, vi }, i) => ({ speaker: i % 2 ? "B" : "A", hanzi, pinyin, vi }))
      : [{ speaker: "A", hanzi: "REVIEW", pinyin: "", vi: "" }];
  } else if (itype === "debate") {
    draft.topic = "REVIEW topic";
    draft.pro = []; draft.con = []; draft.discussionQuestions = [];
  } else if (itype === "grammar-tabs") {
    draft.theory = [{ point: "REVIEW", explanation: "", examples: [] }];
    draft.vocab = vocab;
    draft.exercises = { mcq: [], fillBlank: [] };
  }

  return draft;
}

function parseArgs(): { course?: string; file?: string } {
  const out: { course?: string; file?: string } = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--(\w+)=(.+)$/);
    if (m) out[m[1] as "course" | "file"] = m[2];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const courses = args.course ? [args.course] : COURSE_DIRS;
  let written = 0;

  for (const course of courses) {
    const dir = path.join(LEGACY_ROOT, course);
    let files: string[];
    try {
      const entries = await fs.readdir(dir);
      files = entries
        .filter((e) => e.endsWith(".html"))
        .map((e) => path.join(dir, e));
    } catch {
      continue;
    }
    if (args.file) {
      const target = path.resolve(REPO_ROOT, args.file);
      files = files.filter((f) => f === target);
    }

    const outDir = path.join(OUTPUT_ROOT, course);
    await fs.mkdir(outDir, { recursive: true });

    let order = 1000; // drafts get high orders so they sort after curated lessons
    for (const file of files) {
      const draft = await extractFile(file, course, order++);
      const outFile = path.join(outDir, `${path.basename(file, ".html")}.draft.yml`);
      await fs.writeFile(outFile, yaml.stringify(draft));
      written++;
      console.log(`→ ${path.relative(REPO_ROOT, outFile)}`);
    }
  }

  console.log(`\n✓ ${written} draft YAML files written. Review and rename to .yml to include in sync.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
