import { useMemo, useState } from "react";
import type { Lesson } from "@hanai/shared";
import { AudioButton } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "role-play" }> };

export function RolePlay({ lesson }: Props) {
  const sceneById = useMemo(
    () => new Map(lesson.scenes.map((s) => [s.id, s])),
    [lesson.scenes],
  );
  const [sceneId, setSceneId] = useState(lesson.startScene);
  const [hits, setHits] = useState(0);
  const [total, setTotal] = useState(0);
  const [restartKey, setRestartKey] = useState(0);

  const s = sceneById.get(sceneId);
  if (!s) return <div className="feedback feedback-bad">Cảnh «{sceneId}» không tồn tại.</div>;

  function choose(next: string, isPreferred: boolean | undefined) {
    setTotal(total + 1);
    if (isPreferred) setHits(hits + 1);
    setSceneId(next);
  }

  if (s.end) {
    const score = total ? Math.round((hits / total) * 100) : 100;
    recordAttempt(lesson.id, { score, durationSec: 0, completed: true });
    return (
      <div>
        <SceneBubble s={s} />
        <div className="summary-card" style={{ marginTop: 18 }}>
          <h3>Kết thúc cảnh</h3>
          <div className="summary-score">{score}/100</div>
          <div className="muted">Lựa chọn tốt: {hits}/{total}</div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 18 }}
            onClick={() => { setSceneId(lesson.startScene); setHits(0); setTotal(0); setRestartKey(restartKey + 1); }}
          >
            Chơi lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div key={restartKey}>
      <SceneBubble s={s} />
      <div style={{ marginTop: 18 }}>
        {s.choices.map((c, i) => (
          <button key={i} className="option-btn" onClick={() => choose(c.next, c.isPreferred)}>
            <strong className="hanzi">{c.text}</strong>
            {c.vi && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{c.vi}</div>}
          </button>
        ))}
      </div>
      <style>{`
        .rp-bubble { background: white; border-left: 4px solid var(--c-blue);
          padding: 18px 20px; border-radius: 12px;
          box-shadow: 0 4px 14px var(--c-shadow); }
        .rp-speaker { font-size: 13px; font-weight: 600; color: var(--c-blue);
          text-transform: uppercase; letter-spacing: 0.06em; }
      `}</style>
    </div>
  );
}

function SceneBubble({ s }: { s: any }) {
  return (
    <div className="rp-bubble">
      <div className="rp-speaker">{s.speaker}</div>
      <div className="hanzi" style={{ fontSize: 22, marginTop: 6 }}>{s.line}</div>
      {s.pinyin && <div className="muted" style={{ marginTop: 4 }}>{s.pinyin}</div>}
      {s.vi && <div style={{ marginTop: 4 }}>{s.vi}</div>}
      {s.audioUrl && <div style={{ marginTop: 10 }}><AudioButton url={s.audioUrl} /></div>}
    </div>
  );
}
