import { useState } from "react";
import type { Lesson } from "@hanai/shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "flashcard" }> };

export function Flashcard({ lesson }: Props) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const c = lesson.cards[i];

  if (done) {
    recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
    return (
      <div className="summary-card">
        <h2>Đã ôn xong! ✓</h2>
        <p className="muted">Bạn đã xem qua {lesson.cards.length} thẻ.</p>
        <a className="btn btn-primary" href="/">Về trang chính</a>
      </div>
    );
  }

  return (
    <div>
      <div className="rc-scene" onClick={() => setFlipped(!flipped)}>
        <div className={`rc-card ${flipped ? "flipped" : ""}`}>
          <div className="rc-face rc-front">
            <div className="hanzi" style={{ fontSize: 80, color: "var(--c-blue-dark)" }}>{c.hanzi}</div>
            <div className="muted" style={{ marginTop: 24 }}>Bấm để lật thẻ</div>
          </div>
          <div className="rc-face rc-back">
            <div style={{ fontSize: 32, color: "var(--c-blue)" }}>{c.pinyin}</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 10 }}>{c.vi}</div>
            {c.example && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--c-divider)", fontSize: 14 }}>
                <div className="hanzi">{c.example.hanzi}</div>
                <div className="muted" style={{ marginTop: 4 }}>{c.example.pinyin}</div>
                <div style={{ marginTop: 4 }}>{c.example.vi}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="muted" style={{ margin: "8px 0 14px", textAlign: "center" }}>
        Thẻ {i + 1} / {lesson.cards.length}
      </div>
      <div className="row gap" style={{ justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={() => { setI((i - 1 + lesson.cards.length) % lesson.cards.length); setFlipped(false); }}>← Trước</button>
        <button className="btn btn-ghost" onClick={() => { setI((i + 1) % lesson.cards.length); setFlipped(false); }}>Tiếp →</button>
        <button className="btn btn-primary" onClick={() => setDone(true)}>Hoàn thành</button>
      </div>
      <style>{styleStr}</style>
    </div>
  );
}

const styleStr = `
  .rc-scene { width: 100%; max-width: 480px; height: 360px; margin: 0 auto;
    perspective: 1200px; cursor: pointer; }
  .rc-card { position: relative; width: 100%; height: 100%;
    transition: transform 0.7s; transform-style: preserve-3d; }
  .rc-card.flipped { transform: rotateY(180deg); }
  .rc-face { position: absolute; inset: 0; backface-visibility: hidden;
    border-radius: 20px; padding: 24px;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    box-shadow: 0 12px 30px var(--c-shadow); border: 1px solid var(--c-border);
    text-align: center; }
  .rc-front { background: white; }
  .rc-back { background: linear-gradient(135deg, #fff7ed, #ffe4c4); transform: rotateY(180deg); }
`;
