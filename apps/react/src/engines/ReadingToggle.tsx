import { useState } from "react";
import type { Lesson } from "@hanai/shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "reading-toggle" }> };

export function ReadingToggle({ lesson }: Props) {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [picks, setPicks] = useState<(number | null)[]>(() => (lesson.comprehension ?? []).map(() => null));

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
    <div>
      <div className="row gap" style={{ marginBottom: 18 }}>
        <button className="btn" onClick={() => setShowPinyin(!showPinyin)}>{showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}</button>
        <button className="btn" onClick={() => setShowVi(!showVi)}>{showVi ? "Ẩn nghĩa" : "Hiện nghĩa"}</button>
      </div>
      <div className="reading-passage">
        {lesson.passage.map((line, i) => (
          <div key={i} className="reading-line">
            <div className="hanzi" style={{ fontSize: 22 }}>{line.hanzi}</div>
            {showPinyin && <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{line.pinyin}</div>}
            {showVi && <div style={{ fontSize: 15, marginTop: 2 }}>{line.vi}</div>}
          </div>
        ))}
      </div>

      {lesson.vocab?.length ? (
        <>
          <h3 style={{ marginTop: 24 }}>Từ vựng</h3>
          <table className="vocab-table">
            <tbody>
              <tr><th>Hán tự</th><th>Pinyin</th><th>Nghĩa</th></tr>
              {lesson.vocab.map((v, i) => (
                <tr key={i}>
                  <td className="hanzi">{v.hanzi}</td><td>{v.pinyin}</td><td>{v.vi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      {lesson.comprehension?.length ? (
        <>
          <h3 style={{ marginTop: 24 }}>Câu hỏi đọc hiểu</h3>
          {lesson.comprehension.map((q, qi) => (
            <div key={qi} style={{ margin: "14px 0" }}>
              <div style={{ fontWeight: 600 }}>{qi + 1}. {q.prompt}</div>
              {q.options.map((opt, oi) => {
                const p = picks[qi];
                const cls =
                  p == null ? "option-btn" :
                  oi === q.correctIndex ? "option-btn correct" :
                  oi === p ? "option-btn wrong" : "option-btn";
                return (
                  <button key={oi} className={cls} disabled={p != null} onClick={() => pick(qi, oi)}>{opt}</button>
                );
              })}
            </div>
          ))}
        </>
      ) : null}

      <style>{`
        .reading-passage { background: white; border-radius: 14px;
          border: 1px solid var(--c-divider); padding: 20px; }
        .reading-line { padding: 8px 0; border-bottom: 1px dashed var(--c-divider); }
        .reading-line:last-child { border-bottom: 0; }
        .vocab-table { width: 100%; border-collapse: collapse; margin-top: 8px;
          background: white; border-radius: 12px; overflow: hidden; }
        .vocab-table th, .vocab-table td { padding: 10px 14px; text-align: left;
          border-bottom: 1px solid var(--c-divider); }
        .vocab-table th { background: #f1f5f9; font-weight: 600; }
      `}</style>
    </div>
  );
}
