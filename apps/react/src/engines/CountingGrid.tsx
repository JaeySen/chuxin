import { useState } from "react";
import type { Lesson } from "@hanai/shared";
import { useTimer } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "counting-grid" }> };

export function CountingGrid({ lesson }: Props) {
  const [pos, setPos] = useState(lesson.startIndex);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const t = useTimer();

  function click(i: number) {
    if (done.has(i)) return;
    if (i === pos) {
      const nd = new Set(done); nd.add(i); setDone(nd);
      if (i === lesson.endIndex) {
        const score = Math.max(0, 100 - mistakes * 10);
        recordAttempt(lesson.id, { score, durationSec: t.elapsed(), completed: true });
        setFinished(true);
      } else {
        setPos(pos + 1);
      }
    } else {
      setShake(i); setMistakes(mistakes + 1);
      setTimeout(() => setShake(null), 500);
    }
  }

  if (finished) {
    const sec = t.elapsed();
    const score = Math.max(0, 100 - mistakes * 10);
    return (
      <div className="summary-card">
        <h2>Đã đến đích! 🏁</h2>
        <div className="summary-score">{score}/100</div>
        <div className="muted">Sai: {mistakes} · Thời gian: {Math.floor(sec / 60)}m {sec % 60}s</div>
        <a className="btn btn-primary" href="/" style={{ marginTop: 24 }}>Về trang chính</a>
      </div>
    );
  }

  return (
    <div>
      <div className="row gap" style={{ justifyContent: "space-between" }}>
        <div className="muted">Bấm theo thứ tự bắt đầu từ ô đầu tiên</div>
        <div className="muted">⏱ {t.label}</div>
      </div>
      <div className="count-grid" style={{ gridTemplateColumns: `repeat(${lesson.gridCols}, 1fr)` }}>
        {lesson.cells.map((c, i) => (
          <button
            key={i}
            className={`count-cell hanzi
              ${done.has(i) ? "done" : ""}
              ${i === lesson.startIndex ? "start" : ""}
              ${i === lesson.endIndex ? "end" : ""}
              ${shake === i ? "shake" : ""}`}
            onClick={() => click(i)}
          >
            {c}
          </button>
        ))}
      </div>
      <style>{styleStr}</style>
    </div>
  );
}

const styleStr = `
  .count-grid { display: grid; gap: 8px; margin-top: 16px; }
  .count-cell { padding: 18px; border-radius: 12px; border: 2px solid var(--c-divider);
    background: white; font-size: 18px; cursor: pointer; transition: all 0.15s; font-weight:600; }
  .count-cell:hover { border-color: var(--c-orange); transform: scale(1.03); }
  .count-cell.done { background: var(--c-correct-bg); border-color: var(--c-correct); }
  .count-cell.start { box-shadow: inset 0 0 0 3px var(--c-orange); }
  .count-cell.end { box-shadow: inset 0 0 0 3px var(--c-blue); }
  .count-cell.shake { background: var(--c-wrong-bg); animation: cgshake 0.4s; }
  @keyframes cgshake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
`;
