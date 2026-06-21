import { useState } from "react";
import type { Lesson } from "@sotam/shared";
import { shuffle } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "lucky-draw" }> };

export function LuckyDraw({ lesson }: Props) {
  const [picked, setPicked] = useState<string[] | null>(null);
  const [drawing, setDrawing] = useState(false);

  function draw() {
    setDrawing(true);
    setTimeout(() => {
      const xs = shuffle(lesson.outcomes).slice(0, lesson.drawCount ?? 1);
      setPicked(xs);
      setDrawing(false);
      recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
    }, 700);
  }

  return (
    <div>
      <p className="muted">Bấm vào lá thăm để nhận {lesson.drawCount ?? 1} chủ đề ngẫu nhiên.</p>
      {!picked && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <button
            className="draw-ticket"
            disabled={drawing}
            onClick={draw}
            style={{ opacity: drawing ? 0 : 1, transform: drawing ? "rotate(720deg) scale(0.6)" : "" }}
          >
            <div style={{ fontSize: 42 }}>🎟️</div>
            <div>Bốc thăm</div>
          </button>
        </div>
      )}
      {picked && (
        <div>
          <h3>Chủ đề của bạn:</h3>
          {picked.map((p, i) => (
            <div key={i} className="draw-card">{i + 1}. {p}</div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setPicked(null)}>Bốc lại</button>
        </div>
      )}
      <style>{styleStr}</style>
    </div>
  );
}

const styleStr = `
  .draw-ticket { background: linear-gradient(135deg, #FF8C00, #fbbf24);
    color: white; border: 0; padding: 30px 40px; border-radius: 18px;
    font-size: 18px; font-weight: 600; cursor: pointer;
    box-shadow: 0 12px 30px rgba(255,140,0,0.4);
    transition: transform 0.7s, opacity 0.7s; }
  .draw-ticket:hover { transform: scale(1.05); }
  .draw-card { background: var(--c-warm-bg); border-left: 4px solid var(--c-warm);
    padding: 14px 18px; border-radius: 10px; margin: 10px 0; font-size: 18px; }
`;
