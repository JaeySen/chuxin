import { useState } from "react";
import type { Lesson } from "@sotam/shared";
import { answerMatches } from "@sotam/shared";
import { ScoreStrip, Summary, useTimer } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "fill-blank" }> };

export function FillBlank({ lesson }: Props) {
  const [idx, setIdx] = useState(0);
  const [vals, setVals] = useState<string[]>(() => lesson.items[0].blanks.map(() => ""));
  const [checked, setChecked] = useState<boolean[] | null>(null);
  const [showHint, setShowHint] = useState(false);
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
        onRetry={() => { setIdx(0); setVals(lesson.items[0].blanks.map(() => "")); setChecked(null); setCorrect(0); setWrong(0); setDone(false); }}
      />
    );
  }

  return (
    <div>
      <ScoreStrip idx={idx + 1} total={lesson.items.length} correct={correct} wrong={wrong} timeLabel={t.label} />
      <h3 style={{ margin: "8px 0 18px" }}>{it.prompt.replace(/_+/g, "____")}</h3>
      {it.blanks.map((b, i) => (
        <input
          key={i}
          className={`input-blank ${checked ? (checked[i] ? "correct" : "wrong") : ""}`}
          placeholder={`Đáp án ${i + 1}`}
          value={vals[i]}
          disabled={!!checked}
          onChange={(e) => {
            const next = [...vals]; next[i] = e.target.value; setVals(next);
          }}
        />
      ))}
      {it.hint && (
        <div className="row gap" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" onClick={() => setShowHint(!showHint)}>
            {showHint ? "Ẩn gợi ý" : "Gợi ý"}
          </button>
          {showHint && <span className="muted">💡 {it.hint}</span>}
        </div>
      )}
      {!checked && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          onClick={() => {
            const flags = it.blanks.map((b, i) =>
              answerMatches(vals[i], b.answer, b.alternatives ?? [], { toneSensitive: !!lesson.toneSensitive }),
            );
            setChecked(flags);
            if (flags.every(Boolean)) setCorrect(correct + 1);
            else setWrong(wrong + 1);
          }}
        >
          Kiểm tra
        </button>
      )}
      {checked && (
        <>
          <div className={`feedback ${checked.every(Boolean) ? "feedback-ok" : "feedback-bad"}`}>
            {checked.every(Boolean)
              ? "Đúng hết!"
              : `Có chỗ chưa đúng. Đáp án mẫu: ${it.blanks.map((b) => b.answer).join(" / ")}`}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              if (idx + 1 === lesson.items.length) setDone(true);
              else {
                setIdx(idx + 1);
                setVals(lesson.items[idx + 1].blanks.map(() => ""));
                setChecked(null);
                setShowHint(false);
              }
            }}
          >
            {idx + 1 === lesson.items.length ? "Xem kết quả" : "Câu tiếp"}
          </button>
        </>
      )}
    </div>
  );
}
