import { useMemo, useState } from "react";
import type { Lesson } from "@hanai/shared";
import { shuffle, useTimer } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "match-pairs" }> };

type Tile = { id: number; value: string; side: "a" | "b" };

export function MatchPairs({ lesson }: Props) {
  const [tiles] = useState<Tile[]>(() => {
    const xs: Tile[] = [];
    lesson.pairs.forEach((p, i) => {
      xs.push({ id: i, value: p.a, side: "a" });
      xs.push({ id: i, value: p.b, side: "b" });
    });
    return shuffle(xs);
  });
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const t = useTimer();

  const allMatched = useMemo(() => matched.size / 2 === lesson.pairs.length, [matched, lesson.pairs.length]);
  if (allMatched && !done) {
    setDone(true);
    recordAttempt(lesson.id, { score: 100, durationSec: t.elapsed(), completed: true });
  }

  function flip(idx: number) {
    if (matched.has(idx) || open.includes(idx) || open.length === 2) return;
    const next = [...open, idx];
    setOpen(next);
    if (next.length === 2) {
      const [a, b] = next;
      const ta = tiles[a], tb = tiles[b];
      if (ta.id === tb.id && ta.side !== tb.side) {
        setTimeout(() => {
          setMatched((s) => new Set([...s, a, b]));
          setOpen([]);
        }, 250);
      } else {
        setTimeout(() => setOpen([]), 800);
      }
    }
  }

  if (done) {
    const sec = t.elapsed();
    return (
      <div className="summary-card">
        <h2>Đã ghép xong! 🎉</h2>
        <div className="summary-score">{lesson.pairs.length} cặp</div>
        <div className="muted">Thời gian: {Math.floor(sec / 60)}m {sec % 60}s</div>
        <div className="row gap" style={{ justifyContent: "center", marginTop: 24 }}>
          <a className="btn btn-primary" href="/">Về trang chính</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row gap" style={{ justifyContent: "space-between" }}>
        <div className="muted">Bấm 2 thẻ để ghép cặp</div>
        <div className="muted">⏱ {t.label}</div>
      </div>
      <div className="match-board">
        {tiles.map((tile, i) => {
          const isOpen = open.includes(i);
          const isMatched = matched.has(i);
          return (
            <button
              key={i}
              className={`match-cell ${isOpen ? "open" : ""} ${isMatched ? "matched" : ""}`}
              onClick={() => flip(i)}
            >
              {isOpen || isMatched ? tile.value : "?"}
            </button>
          );
        })}
      </div>
      <style>{styleStr}</style>
    </div>
  );
}

const styleStr = `
  .match-board { display: grid; gap: 10px; margin-top: 16px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
  .match-cell { min-height: 78px; border-radius: 14px; cursor: pointer;
    background: var(--c-blue); color: white; font-size: 22px; font-weight: 600;
    border: none; transition: all 0.2s ease; }
  .match-cell.open { background: white; color: var(--c-text);
    border: 2px solid var(--c-orange); }
  .match-cell.matched { background: var(--c-correct-bg); color: #166534;
    border: 2px solid var(--c-correct); cursor: default; }
`;
