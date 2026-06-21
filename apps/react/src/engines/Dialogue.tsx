import { useState } from "react";
import type { Lesson } from "@sotam/shared";
import { AudioButton } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "dialogue" }> };

const colors = ["#0EA5E9", "#FF8C00", "#10B981", "#8B5CF6"];

export function Dialogue({ lesson }: Props) {
  const speakers = lesson.roles ?? [...new Set(lesson.lines.map((l) => l.speaker))];
  const speakerColor = new Map(speakers.map((s, i) => [s, colors[i % colors.length]]));
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [hide, setHide] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);

  return (
    <div>
      <div className="row gap" style={{ flexWrap: "wrap", marginBottom: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowPinyin(!showPinyin)}>
          {showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowVi(!showVi)}>
          {showVi ? "Ẩn nghĩa" : "Hiện nghĩa"}
        </button>
        {speakers.map((s) => (
          <button
            key={s}
            className="btn btn-ghost btn-sm"
            onClick={() => setHide(hide === s ? null : s)}
          >
            {hide === s ? `Hiện vai «${s}»` : `Ẩn vai «${s}»`}
          </button>
        ))}
      </div>
      <div className="dlg-list">
        {lesson.lines.map((line, i) => {
          const isHidden = hide === line.speaker;
          return (
            <div key={i} className="dlg-line" style={{ borderLeft: `4px solid ${speakerColor.get(line.speaker) ?? "#999"}` }}>
              <div className="dlg-speaker">{line.speaker}</div>
              <div className="hanzi" style={{ fontSize: 18 }}>
                {isHidden ? "（隐藏）" : line.hanzi}
              </div>
              {showPinyin && !isHidden && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{line.pinyin}</div>}
              {showVi && !isHidden && <div style={{ marginTop: 2, fontSize: 14 }}>{line.vi}</div>}
              {line.audioUrl && <div style={{ marginTop: 8 }}><AudioButton url={line.audioUrl} label="▶︎" /></div>}
            </div>
          );
        })}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 18 }}
        onClick={() => {
          recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
          setMarked(true);
        }}
      >
        Đánh dấu đã đọc xong
      </button>
      {marked && <div className="feedback feedback-ok" style={{ marginTop: 12 }}>Đã ghi nhận hoàn thành.</div>}
      <style>{`
        .dlg-list { display: flex; flex-direction: column; gap: 10px; }
        .dlg-line { background: white; padding: 12px 16px; border-radius: 10px;
          box-shadow: 0 1px 3px var(--c-shadow); }
        .dlg-speaker { font-size: 12px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--c-text-soft); margin-bottom: 4px; }
      `}</style>
    </div>
  );
}
