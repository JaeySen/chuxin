import { useMemo, useState } from "react";
import type { Lesson } from "@sotam/shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "reading-tooltip" }> };

export function ReadingTooltip({ lesson }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; pinyin: string; vi: string } | null>(null);
  const [picks, setPicks] = useState<(number | null)[]>(() => (lesson.comprehension ?? []).map(() => null));

  const tokens = useMemo(() => [...lesson.glossary].sort((a, b) => b.token.length - a.token.length), [lesson.glossary]);
  const segments = useMemo(() => annotate(lesson.passage, tokens), [lesson.passage, tokens]);

  function pick(qi: number, oi: number) {
    if (picks[qi] != null) return;
    const next = [...picks]; next[qi] = oi; setPicks(next);
    if (next.every((v) => v != null)) {
      const correct = next.reduce((s, v, i) => s + (v === lesson.comprehension[i].correctIndex ? 1 : 0), 0);
      recordAttempt(lesson.id, {
        score: Math.round((correct / lesson.comprehension.length) * 100),
        durationSec: 0, completed: true,
      });
    }
  }

  if ((lesson.comprehension?.length ?? 0) === 0) {
    recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
  }

  return (
    <div onClick={() => setTooltip(null)}>
      <div className="tooltip-passage hanzi">
        {segments.map((seg, i) =>
          typeof seg === "string" ? (
            <span key={i}>{seg}</span>
          ) : (
            <span
              key={i}
              className="gloss"
              onClick={(e) => {
                const r = (e.target as HTMLElement).getBoundingClientRect();
                setTooltip({
                  x: r.left + window.scrollX,
                  y: r.bottom + window.scrollY + 8,
                  pinyin: seg.pinyin, vi: seg.vi,
                });
                e.stopPropagation();
              }}
            >
              {seg.token}
            </span>
          ),
        )}
      </div>

      {tooltip && (
        <div className="tooltip-pop" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tp-pinyin">{tooltip.pinyin}</div>
          <div>{tooltip.vi}</div>
        </div>
      )}

      {lesson.glossary.length > 0 && (
        <>
          <h3 style={{ marginTop: 22 }}>Bảng từ</h3>
          <table className="vocab-table">
            <tbody>
              <tr><th>Từ</th><th>Pinyin</th><th>Nghĩa</th></tr>
              {lesson.glossary.map((g, i) => (
                <tr key={i}><td className="hanzi">{g.token}</td><td>{g.pinyin}</td><td>{g.vi}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {lesson.comprehension?.length ? (
        <>
          <h3 style={{ marginTop: 22 }}>Câu hỏi đọc hiểu</h3>
          {lesson.comprehension.map((q, qi) => (
            <div key={qi} style={{ margin: "14px 0" }}>
              <div style={{ fontWeight: 600 }}>{qi + 1}. {q.prompt}</div>
              {q.options.map((opt, oi) => {
                const p = picks[qi];
                const cls =
                  p == null ? "option-btn" :
                  oi === q.correctIndex ? "option-btn correct" :
                  oi === p ? "option-btn wrong" : "option-btn";
                return <button key={oi} className={cls} disabled={p != null} onClick={() => pick(qi, oi)}>{opt}</button>;
              })}
            </div>
          ))}
        </>
      ) : null}

      <style>{styleStr}</style>
    </div>
  );
}

type Seg = string | { token: string; pinyin: string; vi: string };

function annotate(text: string, tokens: { token: string; pinyin: string; vi: string }[]): Seg[] {
  let segs: Seg[] = [text];
  for (const t of tokens) {
    const next: Seg[] = [];
    for (const s of segs) {
      if (typeof s !== "string") { next.push(s); continue; }
      let i = 0;
      while (i < s.length) {
        const j = s.indexOf(t.token, i);
        if (j === -1) { next.push(s.slice(i)); break; }
        if (j > i) next.push(s.slice(i, j));
        next.push({ token: t.token, pinyin: t.pinyin, vi: t.vi });
        i = j + t.token.length;
      }
    }
    segs = next.filter((s) => s !== "");
  }
  return segs;
}

const styleStr = `
  .tooltip-passage { background: white; padding: 24px; border-radius: 14px;
    border: 1px solid var(--c-divider); line-height: 2.1; font-size: 22px;
    white-space: pre-wrap; }
  .tooltip-passage .gloss { background: #fff7ed;
    border-bottom: 2px dotted var(--c-orange); cursor: pointer; padding: 0 2px;
    border-radius: 4px; }
  .tooltip-passage .gloss:hover { background: #ffedd5; }
  .tooltip-pop { position: absolute; z-index: 90;
    background: var(--c-blue-dark); color: white; padding: 10px 14px;
    border-radius: 10px; font-size: 14px;
    box-shadow: 0 6px 20px var(--c-shadow); max-width: 280px; }
  .tooltip-pop .tp-pinyin { color: #fde68a; font-weight: 600; margin-bottom: 4px; }
  .vocab-table { width: 100%; border-collapse: collapse; margin-top: 8px;
    background: white; border-radius: 12px; overflow: hidden; }
  .vocab-table th, .vocab-table td { padding: 10px 14px; text-align: left;
    border-bottom: 1px solid var(--c-divider); }
  .vocab-table th { background: #f1f5f9; font-weight: 600; }
`;
