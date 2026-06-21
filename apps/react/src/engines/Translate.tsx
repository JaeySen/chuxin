import { useState } from "react";
import type { Lesson } from "@sotam/shared";
import { answerMatches } from "@sotam/shared";
import { ScoreStrip, Summary, useTimer } from "./shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "translate" }> };

export function Translate({ lesson }: Props) {
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [verdict, setVerdict] = useState<"ok" | "bad" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const t = useTimer();
  const p = lesson.pairs[idx];

  if (done) {
    const sec = t.elapsed();
    recordAttempt(lesson.id, {
      score: Math.round((correct / lesson.pairs.length) * 100),
      durationSec: sec,
      completed: correct / lesson.pairs.length >= 0.6,
    });
    return (
      <Summary
        score={correct}
        total={lesson.pairs.length}
        durationSec={sec}
        onRetry={() => { setIdx(0); setVal(""); setVerdict(null); setCorrect(0); setWrong(0); setDone(false); }}
      />
    );
  }

  return (
    <div>
      <ScoreStrip idx={idx + 1} total={lesson.pairs.length} correct={correct} wrong={wrong} timeLabel={t.label} />
      <div className="muted" style={{ fontSize: 13 }}>Dịch sang tiếng Việt</div>
      <div className="hanzi" style={{ fontSize: 28, margin: "6px 0" }}>{p.zh}</div>
      {p.pinyin && <div className="muted">{p.pinyin}</div>}
      <textarea
        value={val}
        disabled={!!verdict}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Nhập bản dịch tiếng Việt…"
        style={{
          width: "100%", minHeight: 90, marginTop: 14, padding: 12,
          borderRadius: 10, border: "2px solid var(--c-divider)",
          fontFamily: "inherit", fontSize: 15,
        }}
      />
      {!verdict && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          onClick={() => {
            const ok = answerMatches(val, p.vi, p.alternatives ?? []);
            setVerdict(ok ? "ok" : "bad");
            if (ok) setCorrect(correct + 1);
            else setWrong(wrong + 1);
          }}
        >
          Kiểm tra
        </button>
      )}
      {verdict && (
        <>
          <div className={`feedback ${verdict === "ok" ? "feedback-ok" : "feedback-bad"}`}>
            {verdict === "ok" ? "Chính xác!" : `Bản dịch tham khảo: ${p.vi}`}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              if (idx + 1 === lesson.pairs.length) setDone(true);
              else { setIdx(idx + 1); setVal(""); setVerdict(null); }
            }}
          >
            {idx + 1 === lesson.pairs.length ? "Xem kết quả" : "Câu tiếp"}
          </button>
        </>
      )}
    </div>
  );
}
