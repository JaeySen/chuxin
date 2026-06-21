import { useState } from "react";
import type { Lesson } from "@sotam/shared";
import { ScoreStrip, Summary, AudioButton, useTimer } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "listen-pick" }> };

export function ListenPick({ lesson }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
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

  return (
    <div>
      <ScoreStrip idx={idx + 1} total={lesson.items.length} correct={correct} wrong={wrong} timeLabel={t.label} />
      <AudioButton url={it.audioUrl} />
      {it.prompt && <h3 style={{ margin: "14px 0 18px" }}>{it.prompt}</h3>}
      <div style={{ marginTop: 14 }}>
        {it.options.map((opt, i) => {
          const cls =
            picked == null ? "option-btn" :
            i === it.correctIndex ? "option-btn correct" :
            i === picked ? "option-btn wrong" : "option-btn";
          return (
            <button
              key={i}
              className={cls}
              disabled={picked != null}
              onClick={() => {
                setPicked(i);
                if (i === it.correctIndex) setCorrect(correct + 1);
                else setWrong(wrong + 1);
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <>
          <div className={`feedback ${picked === it.correctIndex ? "feedback-ok" : "feedback-bad"}`}>
            {picked === it.correctIndex ? "Chính xác!" : "Chưa đúng."}
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
