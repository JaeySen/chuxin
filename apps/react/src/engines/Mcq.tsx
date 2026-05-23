import { useState } from "react";
import type { Lesson } from "@hanai/shared";
import { ScoreStrip, Summary, AudioButton, useTimer } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "mcq" }> };

export function Mcq({ lesson }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const t = useTimer();
  const q = lesson.questions[idx];

  if (done) {
    const sec = t.elapsed();
    recordAttempt(lesson.id, {
      score: Math.round((correct / lesson.questions.length) * 100),
      durationSec: sec,
      completed: correct / lesson.questions.length >= 0.6,
    });
    return (
      <Summary
        score={correct}
        total={lesson.questions.length}
        durationSec={sec}
        onRetry={() => { setIdx(0); setPicked(null); setCorrect(0); setWrong(0); setDone(false); }}
      />
    );
  }

  return (
    <div>
      <ScoreStrip idx={idx + 1} total={lesson.questions.length} correct={correct} wrong={wrong} timeLabel={t.label} />
      {q.audioUrl && <AudioButton url={q.audioUrl} />}
      <h3 style={{ margin: "14px 0 18px" }}>{q.prompt}</h3>
      {q.options.map((opt, i) => {
        const cls =
          picked == null ? "option-btn" :
          i === q.correctIndex ? "option-btn correct" :
          i === picked ? "option-btn wrong" : "option-btn";
        return (
          <button
            key={i}
            className={cls}
            disabled={picked != null}
            onClick={() => {
              setPicked(i);
              if (i === q.correctIndex) setCorrect(correct + 1);
              else setWrong(wrong + 1);
            }}
          >
            {opt}
          </button>
        );
      })}
      {picked != null && (
        <>
          <div className={`feedback ${picked === q.correctIndex ? "feedback-ok" : "feedback-bad"}`}>
            {picked === q.correctIndex ? "Chính xác!" : "Chưa đúng. "}
            {q.explanation && <div style={{ marginTop: 6 }}>{q.explanation}</div>}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              if (idx + 1 === lesson.questions.length) setDone(true);
              else { setIdx(idx + 1); setPicked(null); }
            }}
          >
            {idx + 1 === lesson.questions.length ? "Xem kết quả" : "Câu tiếp"}
          </button>
        </>
      )}
    </div>
  );
}
