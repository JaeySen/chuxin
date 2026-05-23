import { useState } from "react";
import type { Lesson } from "@hanai/shared";
import { ScoreStrip, Summary, AudioButton, useTimer } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "listen-tf" }> };

export function ListenTf({ lesson }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const t = useTimer();
  const it = lesson.items[idx];

  if (done) {
    const sec = t.elapsed();
    recordAttempt(lesson.id, {
      score: Math.round((correct / lesson.items.length) * 100),
      durationSec: sec,
      completed: correct / lesson.items.length >= 0.6,
    });
    return (
      <Summary
        score={correct}
        total={lesson.items.length}
        durationSec={sec}
        onRetry={() => { setIdx(0); setPicked(null); setCorrect(0); setWrong(0); setDone(false); }}
      />
    );
  }

  function classFor(value: boolean) {
    if (picked == null) return "option-btn";
    if (value === it.correct) return "option-btn correct";
    if (value === picked) return "option-btn wrong";
    return "option-btn";
  }

  return (
    <div>
      <ScoreStrip idx={idx + 1} total={lesson.items.length} correct={correct} wrong={wrong} timeLabel={t.label} />
      <AudioButton url={it.audioUrl} label="▶︎ Nghe đoạn" />
      <h3 style={{ margin: "14px 0 18px" }}>{it.statement}</h3>
      <button
        className={classFor(true)}
        disabled={picked != null}
        style={{ background: "#f0fdf4" }}
        onClick={() => { setPicked(true); if (it.correct) setCorrect(correct + 1); else setWrong(wrong + 1); }}
      >
        对 — Đúng
      </button>
      <button
        className={classFor(false)}
        disabled={picked != null}
        style={{ background: "#fef2f2" }}
        onClick={() => { setPicked(false); if (!it.correct) setCorrect(correct + 1); else setWrong(wrong + 1); }}
      >
        错 — Sai
      </button>
      {picked != null && (
        <>
          <div className={`feedback ${picked === it.correct ? "feedback-ok" : "feedback-bad"}`}>
            {picked === it.correct ? "Chính xác!" : "Chưa đúng."}
            {it.transcript && <div style={{ marginTop: 6 }}>Phiên âm: {it.transcript}</div>}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              if (idx + 1 === lesson.items.length) setDone(true);
              else { setIdx(idx + 1); setPicked(null); }
            }}
          >
            {idx + 1 === lesson.items.length ? "Xem kết quả" : "Câu tiếp"}
          </button>
        </>
      )}
    </div>
  );
}
