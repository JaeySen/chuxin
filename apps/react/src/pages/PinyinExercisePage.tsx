import { useEffect, useState } from "react";
import hsk1Raw from "../data/hsk1.json";
import { parsePinyin, TONE_LABELS, type PinyinParts } from "../utils/pinyinParser";

interface WordEntry extends PinyinParts {
  char: string;
  pinyin: string;
  vi: string;
  en: string;
}

const ALL_WORDS: WordEntry[] = Object.entries(hsk1Raw)
  .filter(([, v]) => !v.pinyin.includes(" "))
  .flatMap(([char, v]) => {
    const parts = parsePinyin(v.pinyin);
    if (!parts) return [];
    return [{ char, pinyin: v.pinyin, vi: v.vi, en: v.en, ...parts }];
  });

const BATCH_SIZE = 7;
const TOTAL_BATCHES = Math.ceil(ALL_WORDS.length / BATCH_SIZE);
const STORAGE_KEY = "pinyin-hsk1-progress";

// Placeholder wrong choices for "zero-initial" (∅) slots — replaced with
// fake-but-Latin-looking strings until a real distractor source exists.
const FAKE_FILLERS = ["v", "ee", "oo", "aa", "uu", "ai", "ei", "ao"];

const ALL_INITIALS = [...new Set(ALL_WORDS.map((w) => w.initial))];
const ALL_FINALS = [...new Set(ALL_WORDS.map((w) => w.final))];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = (((seed * (i + 1)) ^ 0x9e3779b9) >>> 0) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeChoices(correct: string, pool: string[], count: number, seed: number, useFillers = false): string[] {
  let others = seededShuffle(pool.filter((o) => o !== correct), seed).slice(0, count - 1);
  if (useFillers) {
    others = others.map((o, i) => {
      if (o !== "") return o;
      const candidates = FAKE_FILLERS.filter((f) => f !== correct && !others.includes(f));
      return seededShuffle(candidates, seed + i + 17)[0] ?? "v";
    });
  }
  return seededShuffle([correct, ...others], seed + 1);
}

function makeToneChoices(correct: number, count: number, seed: number): number[] {
  const others = seededShuffle([1, 2, 3, 4, 5].filter((t) => t !== correct), seed).slice(0, count - 1);
  return seededShuffle([correct, ...others], seed + 1);
}

type Sel = { initial: string | null; final: string | null; tone: number | null };

interface BatchProgress {
  correct: number;
  total: number;
  completed: boolean;
}
type Progress = Record<number, BatchProgress>;

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore (e.g. private browsing)
  }
}

function BatchListView({
  progress,
  onSelect,
}: {
  progress: Progress;
  onSelect: (batchIdx: number) => void;
}) {
  return (
    <div className="pe-shell">
      <h2 className="pe-list-title">Luyện phát âm Pinyin · HSK1</h2>
      <div className="pe-batch-list">
        {Array.from({ length: TOTAL_BATCHES }, (_, i) => {
          const start = i * BATCH_SIZE;
          const count = Math.min(BATCH_SIZE, ALL_WORDS.length - start);
          const p = progress[i];
          return (
            <button key={i} className="pe-batch-card" onClick={() => onSelect(i)}>
              <div className="pe-batch-card-title">Bài tập {i + 1}</div>
              <div className="pe-batch-card-sub">{count} từ</div>
              {p?.completed ? (
                <div className={`pe-batch-card-score ${p.correct === p.total ? "pe-batch-card-score--perfect" : ""}`}>
                  ✓ {p.correct}/{p.total}
                </div>
              ) : (
                <div className="pe-batch-card-status">Chưa làm</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseView({
  batchIdx,
  onBack,
  onComplete,
  onNextBatch,
  hasNextBatch,
}: {
  batchIdx: number;
  onBack: () => void;
  onComplete: (score: { correct: number; total: number }) => void;
  onNextBatch: () => void;
  hasNextBatch: boolean;
}) {
  const batchStart = batchIdx * BATCH_SIZE;
  const batchWords = ALL_WORDS.slice(batchStart, batchStart + BATCH_SIZE);
  // Early exercises offer just enough choices to find the answer; later
  // ones become more abundant (and thus harder).
  const choiceCount = Math.min(2 + batchIdx, 5);

  const [posInBatch, setPosInBatch] = useState(0);
  const [sel, setSel] = useState<Sel>({ initial: null, final: null, tone: null });
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>(() => batchWords.map(() => null));
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showEnd, setShowEnd] = useState(false);

  const word = batchWords[posInBatch];
  const seed = (batchIdx * BATCH_SIZE + posInBatch) * 31337;

  const initialChoices = makeChoices(word.initial, ALL_INITIALS, choiceCount, seed, true);
  const finalChoices = makeChoices(word.final, ALL_FINALS, choiceCount, seed + 7);
  const toneChoices = makeToneChoices(word.tone, choiceCount, seed + 13);

  // Auto-check when all 3 are selected
  useEffect(() => {
    if (sel.initial !== null && sel.final !== null && sel.tone !== null && !checked) {
      const ok =
        sel.initial === word.initial && sel.final === word.final && sel.tone === word.tone;
      setChecked(true);
      setIsCorrect(ok);
      setResults((r) => r.map((v, i) => (i === posInBatch ? ok : v)));
      setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    }
  }, [sel, checked, word, posInBatch]);

  function toggle<K extends keyof Sel>(key: K, value: Sel[K]) {
    if (checked) return;
    setSel((s) => ({ ...s, [key]: s[key] === value ? null : value }));
  }

  function handleNext() {
    const nextPos = posInBatch + 1;
    if (nextPos >= batchWords.length) {
      onComplete(score);
      setShowEnd(true);
    } else {
      setPosInBatch(nextPos);
      setSel({ initial: null, final: null, tone: null });
      setChecked(false);
      setIsCorrect(false);
    }
  }

  function resetBatch() {
    setPosInBatch(0);
    setSel({ initial: null, final: null, tone: null });
    setChecked(false);
    setIsCorrect(false);
    setResults(batchWords.map(() => null));
    setScore({ correct: 0, total: 0 });
    setShowEnd(false);
  }

  function choiceClass(
    value: string | number,
    correctValue: string | number,
    selectedValue: string | number | null,
  ) {
    const isSelected = value === selectedValue;
    if (!checked) return isSelected ? "pe-btn pe-btn--selected" : "pe-btn";
    if (value === correctValue) return "pe-btn pe-btn--correct";
    if (isSelected) return "pe-btn pe-btn--wrong";
    return "pe-btn";
  }

  const header = (
    <div className="pe-header">
      <button className="pe-back-btn" onClick={onBack} aria-label="Quay lại danh sách">
        ←
      </button>
      <div className="pe-peas">
        {results.map((r, i) => (
          <span
            key={i}
            className={[
              "pe-pea",
              r === true ? "pe-pea--correct" : "",
              r === false ? "pe-pea--wrong" : "",
              i === posInBatch && !checked && !showEnd ? "pe-pea--current" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>
    </div>
  );

  if (showEnd) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="pe-shell">
        {header}
        <div className="pe-batch-end">
          <div className="pe-batch-end-title">Bài tập {batchIdx + 1} xong!</div>
          <div className="pe-batch-end-score">
            <span style={{ color: "var(--c-correct)" }}>✓ {score.correct}</span>
            <span style={{ color: "var(--c-text-muted)" }}>/{score.total}</span>
            <span className="pe-batch-end-pct">{pct}%</span>
          </div>
          <div className="pe-batch-end-actions">
            {hasNextBatch ? (
              <button className="btn btn-primary" onClick={onNextBatch}>
                Bài tập tiếp theo →
              </button>
            ) : (
              <div style={{ color: "var(--c-text-soft)", fontWeight: 600, fontSize: "1.1rem" }}>
                Bạn đã hoàn thành tất cả HSK1!
              </div>
            )}
            <button className="btn btn-ghost" onClick={resetBatch}>
              Làm lại bài này
            </button>
            <button className="btn btn-ghost" onClick={onBack}>
              Về danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assembled preview — concatenated syllable (y + i → "yi", not "y + i").
  // Empty/zero-initial selections contribute nothing to the syllable text.
  const syllablePart = `${sel.initial ?? ""}${sel.final ?? ""}`;
  const hasAnySelection = sel.initial !== null || sel.final !== null || sel.tone !== null;

  return (
    <div className="pe-shell">
      {header}

      {/* Card: preview + character + meaning */}
      <div className="pe-card">
        <div className={`pe-preview ${!hasAnySelection ? "pe-preview--empty" : ""} ${checked ? (isCorrect ? "pe-preview--correct" : "pe-preview--wrong") : ""}`}>
          {checked ? (
            word.pinyin
          ) : hasAnySelection ? (
            <>
              {syllablePart && (
                <span className="pe-preview-part pe-preview-part--set">{syllablePart}</span>
              )}
              {sel.tone !== null && (
                <span className="pe-preview-part pe-preview-part--set pe-preview-tone">{TONE_LABELS[sel.tone]}</span>
              )}
            </>
          ) : (
            <span className="pe-preview-placeholder">chọn bên dưới…</span>
          )}
        </div>

        <div className="pe-hanzi">{word.char}</div>
        <div className="pe-meaning">{word.vi}</div>
        <div className="pe-meaning pe-meaning--secondary">{word.en}</div>

        {checked && (
          <div className={`pe-inline-feedback ${isCorrect ? "pe-inline-feedback--ok" : "pe-inline-feedback--bad"}`}>
            {isCorrect ? "Đúng rồi! 🎉" : `Đáp án đúng: ${word.initial}${word.final} ${TONE_LABELS[word.tone]}`}
          </div>
        )}
      </div>

      {/* Choice rows */}
      <div className="pe-choices">
        <div className="pe-row">
          {/* <div className="pe-row-label">声母 · Thanh mẫu (initial)</div> */}
          <div className="pe-row-buttons">
            {initialChoices.filter((opt) => opt.trim() !== "" || opt === word.initial).map((opt) => (
              <button
                key={opt}
                className={choiceClass(opt, word.initial, sel.initial)}
                onClick={() => toggle("initial", opt)}
              >
                {opt || "∅"}
              </button>
            ))}
          </div>
        </div>

        <div className="pe-row">
          {/* <div className="pe-row-label">韵母 · Vận mẫu (final)</div> */}
          <div className="pe-row-buttons">
            {finalChoices.filter((opt) => opt.trim() !== "").map((opt) => (
              <button
                key={opt}
                className={choiceClass(opt, word.final, sel.final)}
                onClick={() => toggle("final", opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="pe-row">
          {/* <div className="pe-row-label">声调 · Dấu thanh (tone)</div> */}
          <div className="pe-row-buttons">
            {toneChoices.map((t) => (
              <button
                key={t}
                className={`${choiceClass(t, word.tone, sel.tone)} pe-btn--tone`}
                onClick={() => toggle("tone", t)}
              >
                {TONE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {checked && (
        <div className="pe-actions">
          <button className="btn btn-primary" onClick={handleNext}>
            {posInBatch + 1 < batchWords.length ? "Tiếp theo →" : "Xem kết quả"}
          </button>
        </div>
      )}
    </div>
  );
}

export function PinyinExercisePage() {
  const [view, setView] = useState<"list" | "exercise">("list");
  const [activeBatch, setActiveBatch] = useState(0);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  function openBatch(idx: number) {
    setActiveBatch(idx);
    setView("exercise");
  }

  function handleComplete(score: { correct: number; total: number }) {
    setProgress((p) => {
      const next = { ...p, [activeBatch]: { ...score, completed: true } };
      saveProgress(next);
      return next;
    });
  }

  function handleNextBatch() {
    setActiveBatch((b) => Math.min(b + 1, TOTAL_BATCHES - 1));
  }

  if (view === "list") {
    return <BatchListView progress={progress} onSelect={openBatch} />;
  }

  return (
    <ExerciseView
      key={activeBatch}
      batchIdx={activeBatch}
      onBack={() => setView("list")}
      onComplete={handleComplete}
      onNextBatch={handleNextBatch}
      hasNextBatch={activeBatch + 1 < TOTAL_BATCHES}
    />
  );
}
