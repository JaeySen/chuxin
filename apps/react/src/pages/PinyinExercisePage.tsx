import { useState, useEffect } from "react";
import hsk1Raw from "../data/hsk1.json";
import { parsePinyin, TONE_LABELS, type PinyinParts } from "../utils/pinyinParser";

interface WordEntry extends PinyinParts {
  char: string;
  pinyin: string;
  en: string;
}

const ALL_WORDS: WordEntry[] = Object.entries(hsk1Raw)
  .filter(([, v]) => !v.pinyin.includes(" "))
  .flatMap(([char, v]) => {
    const parts = parsePinyin(v.pinyin);
    if (!parts) return [];
    return [{ char, pinyin: v.pinyin, en: v.en, ...parts }];
  });

const BATCH_SIZE = 7;

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = ((seed * (i + 1)) ^ 0x9e3779b9) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeChoices(correct: string, pool: string[], count: number, seed: number): string[] {
  const others = seededShuffle(pool.filter((o) => o !== correct), seed).slice(0, count - 1);
  return seededShuffle([correct, ...others], seed + 1);
}

const ALL_INITIALS = [...new Set(ALL_WORDS.map((w) => w.initial))];
const ALL_FINALS = [...new Set(ALL_WORDS.map((w) => w.final))];

type Sel = { initial: string | null; final: string | null; tone: number | null };

function BatchEndScreen({
  batchIdx,
  score,
  hasMore,
  onNext,
  onRestart,
}: {
  batchIdx: number;
  score: { correct: number; total: number };
  hasMore: boolean;
  onNext: () => void;
  onRestart: () => void;
}) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  return (
    <div className="pe-shell">
      <div className="pe-batch-end">
        <div className="pe-batch-end-title">Bài tập {batchIdx + 1} xong!</div>
        <div className="pe-batch-end-score">
          <span style={{ color: "var(--c-correct)" }}>✓ {score.correct}</span>
          <span style={{ color: "var(--c-text-muted)" }}>/{score.total}</span>
          <span className="pe-batch-end-pct">{pct}%</span>
        </div>
        <div className="pe-batch-end-actions">
          {hasMore ? (
            <button className="btn btn-primary" onClick={onNext}>
              Bài tập tiếp theo →
            </button>
          ) : (
            <div style={{ color: "var(--c-text-soft)", fontWeight: 600, fontSize: "1.1rem" }}>
              Bạn đã hoàn thành tất cả HSK1!
            </div>
          )}
          <button className="btn btn-ghost" onClick={onRestart}>
            Làm lại từ đầu
          </button>
        </div>
      </div>
    </div>
  );
}

export function PinyinExercisePage() {
  const [batchIdx, setBatchIdx] = useState(0);
  const [posInBatch, setPosInBatch] = useState(0);
  const [batchScore, setBatchScore] = useState({ correct: 0, total: 0 });
  const [showBatchEnd, setShowBatchEnd] = useState(false);
  const [sel, setSel] = useState<Sel>({ initial: null, final: null, tone: null });
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const batchStart = batchIdx * BATCH_SIZE;
  const batchWords = ALL_WORDS.slice(batchStart, batchStart + BATCH_SIZE);
  const word = batchWords[posInBatch] ?? batchWords[0];
  const seed = (batchIdx * BATCH_SIZE + posInBatch) * 31337;

  const initialChoices = makeChoices(word.initial, ALL_INITIALS, 5, seed);
  const finalChoices = makeChoices(word.final, ALL_FINALS, 5, seed + 7);
  const toneChoices = [1, 2, 3, 4, 5];

  // Auto-check when all 3 are selected
  useEffect(() => {
    if (sel.initial !== null && sel.final !== null && sel.tone !== null && !checked) {
      const ok =
        sel.initial === word.initial && sel.final === word.final && sel.tone === word.tone;
      setChecked(true);
      setIsCorrect(ok);
      setBatchScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    }
  }, [sel, checked, word]);

  function toggle<K extends keyof Sel>(key: K, value: Sel[K]) {
    if (checked) return;
    setSel((s) => ({ ...s, [key]: s[key] === value ? null : value }));
  }

  function handleNext() {
    const nextPos = posInBatch + 1;
    if (nextPos >= batchWords.length) {
      setShowBatchEnd(true);
    } else {
      setPosInBatch(nextPos);
      setSel({ initial: null, final: null, tone: null });
      setChecked(false);
      setIsCorrect(false);
    }
  }

  function handleNextBatch() {
    setBatchIdx((b) => b + 1);
    setPosInBatch(0);
    setBatchScore({ correct: 0, total: 0 });
    setSel({ initial: null, final: null, tone: null });
    setChecked(false);
    setIsCorrect(false);
    setShowBatchEnd(false);
  }

  function handleRestart() {
    setBatchIdx(0);
    setPosInBatch(0);
    setBatchScore({ correct: 0, total: 0 });
    setSel({ initial: null, final: null, tone: null });
    setChecked(false);
    setIsCorrect(false);
    setShowBatchEnd(false);
  }

  if (showBatchEnd) {
    return (
      <BatchEndScreen
        batchIdx={batchIdx}
        score={batchScore}
        hasMore={batchStart + BATCH_SIZE < ALL_WORDS.length}
        onNext={handleNextBatch}
        onRestart={handleRestart}
      />
    );
  }

  // Assembled preview
  const previewInitial = sel.initial !== null ? (sel.initial || "∅") : "·";
  const previewFinal = sel.final !== null ? sel.final : "·";
  const previewTone = sel.tone !== null ? TONE_LABELS[sel.tone] : "·";
  const hasAnySelection = sel.initial !== null || sel.final !== null || sel.tone !== null;

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

  return (
    <div className="pe-shell">
      {/* Header */}
      <div className="pe-score">
        <span>
          Bài tập {batchIdx + 1} · Câu {posInBatch + 1}/{batchWords.length}
        </span>
        <span className="pe-score-sep">·</span>
        <span style={{ color: "var(--c-correct)" }}>✓ {batchScore.correct}</span>
        <span className="pe-score-sep">·</span>
        <span style={{ color: "var(--c-wrong)" }}>✗ {batchScore.total - batchScore.correct}</span>
      </div>

      {/* Card: preview + character + meaning */}
      <div className="pe-card">
        {/* Assembled preview line */}
        <div className={`pe-preview ${!hasAnySelection ? "pe-preview--empty" : ""} ${checked ? (isCorrect ? "pe-preview--correct" : "pe-preview--wrong") : ""}`}>
          {checked ? (
            word.pinyin
          ) : hasAnySelection ? (
            <>
              <span className={sel.initial !== null ? "pe-preview-part pe-preview-part--set" : "pe-preview-part"}>
                {previewInitial}
              </span>
              <span className="pe-preview-sep">+</span>
              <span className={sel.final !== null ? "pe-preview-part pe-preview-part--set" : "pe-preview-part"}>
                {previewFinal}
              </span>
              <span className="pe-preview-sep">+</span>
              <span className={sel.tone !== null ? "pe-preview-part pe-preview-part--set" : "pe-preview-part"}>
                {previewTone}
              </span>
            </>
          ) : (
            <span className="pe-preview-placeholder">chọn bên dưới…</span>
          )}
        </div>

        <div className="pe-hanzi">{word.char}</div>
        <div className="pe-meaning">{word.en}</div>

        {checked && (
          <div className={`pe-inline-feedback ${isCorrect ? "pe-inline-feedback--ok" : "pe-inline-feedback--bad"}`}>
            {isCorrect ? "Đúng rồi! 🎉" : `Đáp án đúng: ${word.initial || "∅"} + ${word.final} + ${TONE_LABELS[word.tone]}`}
          </div>
        )}
      </div>

      {/* Choice rows */}
      <div className="pe-choices">
        <div className="pe-row">
          <div className="pe-row-label">声母 · Thanh mẫu (initial)</div>
          <div className="pe-row-buttons">
            {initialChoices.map((opt) => (
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
          <div className="pe-row-label">韵母 · Vận mẫu (final)</div>
          <div className="pe-row-buttons">
            {finalChoices.map((opt) => (
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
          <div className="pe-row-label">声调 · Dấu thanh (tone)</div>
          <div className="pe-row-buttons">
            {toneChoices.map((t) => (
              <button
                key={t}
                className={choiceClass(t, word.tone, sel.tone)}
                onClick={() => toggle("tone", t)}
              >
                {TONE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Next button — only after checked */}
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
