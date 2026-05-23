import { useState, useMemo, useCallback } from "react";
import hsk1Raw from "../data/hsk1.json";
import { parsePinyin, TONE_LABELS, type PinyinParts } from "../utils/pinyinParser";

interface WordEntry extends PinyinParts {
  char: string;
  pinyin: string;
  en: string;
}

// Build flat list of single-syllable words with parsed parts
const ALL_WORDS: WordEntry[] = Object.entries(hsk1Raw)
  .filter(([, v]) => !v.pinyin.includes(" "))
  .flatMap(([char, v]) => {
    const parts = parsePinyin(v.pinyin);
    if (!parts) return [];
    return [{ char, pinyin: v.pinyin, en: v.en, ...parts }];
  });

// Stable pools of all unique initials and finals across the word list
const ALL_INITIALS = [...new Set(ALL_WORDS.map((w) => w.initial))];
const ALL_FINALS = [...new Set(ALL_WORDS.map((w) => w.final))];

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

type Selection = { initial: string | null; final: string | null; tone: number | null };

export function PinyinExercisePage() {
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<Selection>({ initial: null, final: null, tone: null });
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const word = ALL_WORDS[idx % ALL_WORDS.length];
  const seed = idx * 31337;

  const initialChoices = useMemo(
    () => makeChoices(word.initial, ALL_INITIALS, 5, seed),
    [word, seed]
  );
  const finalChoices = useMemo(
    () => makeChoices(word.final, ALL_FINALS, 5, seed + 7),
    [word, seed]
  );
  const toneChoices = [1, 2, 3, 4, 5];

  const allCorrect =
    sel.initial === word.initial &&
    sel.final === word.final &&
    sel.tone === word.tone;

  const canCheck = sel.initial !== null && sel.final !== null && sel.tone !== null;

  const handleCheck = useCallback(() => {
    setChecked(true);
    setScore((s) => ({ correct: s.correct + (allCorrect ? 1 : 0), total: s.total + 1 }));
  }, [allCorrect]);

  const handleNext = useCallback(() => {
    setIdx((i) => i + 1);
    setSel({ initial: null, final: null, tone: null });
    setChecked(false);
  }, []);

  function btnClass(value: string | number, correct: string | number) {
    const isSelected = value === (typeof value === "number" ? sel.tone : value === sel.initial || value === sel.final ? value : null);
    // We check per-row below instead
    return "";
  }
  void btnClass; // suppress unused warning — using inline logic below

  function choiceClass(value: string | number, correctValue: string | number, selectedValue: string | number | null) {
    const isSelected = value === selectedValue;
    if (!isSelected && !checked) return "pe-btn";
    if (!checked) return "pe-btn pe-btn--selected";
    if (value === correctValue) return "pe-btn pe-btn--correct";
    if (isSelected) return "pe-btn pe-btn--wrong";
    return "pe-btn";
  }

  return (
    <div className="pe-shell">
      {/* Score strip */}
      <div className="pe-score">
        <span>Bài {score.total + 1} / {ALL_WORDS.length}</span>
        <span className="pe-score-sep">·</span>
        <span style={{ color: "var(--c-correct)" }}>✓ {score.correct}</span>
        <span className="pe-score-sep">·</span>
        <span style={{ color: "var(--c-wrong)" }}>✗ {score.total - score.correct}</span>
      </div>

      {/* Character card — top half */}
      <div className="pe-card">
        <div className="pe-hanzi">{word.char}</div>
        <div className="pe-meaning">{word.en}</div>
        {checked && (
          <div className="pe-pinyin-reveal">{word.pinyin}</div>
        )}
      </div>

      {/* Choice rows — bottom half */}
      <div className="pe-choices">
        {/* Row 1: Initial */}
        <div className="pe-row">
          <div className="pe-row-label">声母 · Thanh mẫu (initial)</div>
          <div className="pe-row-buttons">
            {initialChoices.map((opt) => (
              <button
                key={opt}
                disabled={checked}
                className={choiceClass(opt, word.initial, sel.initial)}
                onClick={() => setSel((s) => ({ ...s, initial: opt }))}
              >
                {opt || "∅"}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Final */}
        <div className="pe-row">
          <div className="pe-row-label">韵母 · Vận mẫu (final)</div>
          <div className="pe-row-buttons">
            {finalChoices.map((opt) => (
              <button
                key={opt}
                disabled={checked}
                className={choiceClass(opt, word.final, sel.final)}
                onClick={() => setSel((s) => ({ ...s, final: opt }))}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Tone */}
        <div className="pe-row">
          <div className="pe-row-label">声调 · Dấu thanh (tone)</div>
          <div className="pe-row-buttons">
            {toneChoices.map((t) => (
              <button
                key={t}
                disabled={checked}
                className={choiceClass(t, word.tone, sel.tone)}
                onClick={() => setSel((s) => ({ ...s, tone: t }))}
              >
                {TONE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="pe-actions">
          {!checked ? (
            <button className="btn btn-primary" disabled={!canCheck} onClick={handleCheck}>
              Kiểm tra
            </button>
          ) : (
            <>
              <div className={`feedback ${allCorrect ? "feedback-ok" : "feedback-bad"}`}>
                {allCorrect
                  ? "Đúng rồi!"
                  : `Chưa đúng — đáp án: ${word.initial || "∅"} + ${word.final} + tone ${word.tone}`}
              </div>
              <button className="btn btn-primary" onClick={handleNext}>
                Tiếp theo →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
