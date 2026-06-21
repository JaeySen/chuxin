import { useState } from "react";
import type { Lesson } from "@sotam/shared";
import { answerMatches } from "@sotam/shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "grammar-tabs" }> };

type Tab = "theory" | "vocab" | "exercises";

export function GrammarTabs({ lesson }: Props) {
  const [tab, setTab] = useState<Tab>("theory");
  return (
    <div>
      <div className="gt-tabs">
        {(["theory", "vocab", "exercises"] as Tab[]).map((k) => (
          <button
            key={k}
            className={`gt-tab ${tab === k ? "active" : ""}`}
            onClick={() => setTab(k)}
          >
            {k === "theory" ? "Lý thuyết" : k === "vocab" ? "Từ vựng" : "Bài tập"}
          </button>
        ))}
      </div>
      {tab === "theory" && <Theory lesson={lesson} />}
      {tab === "vocab" && <Vocab lesson={lesson} />}
      {tab === "exercises" && <Exercises lesson={lesson} />}
      <style>{styleStr}</style>
    </div>
  );
}

function Theory({ lesson }: Props) {
  return (
    <>
      {lesson.theory.map((t, i) => (
        <div key={i} className="gt-card">
          <h4 style={{ margin: "0 0 6px" }}>{t.point}</h4>
          <div style={{ whiteSpace: "pre-wrap", color: "var(--c-text-soft)", marginBottom: 10 }}>{t.explanation}</div>
          {t.examples.map((ex, j) => (
            <div key={j} className="gt-example">
              <div className="hanzi" style={{ fontSize: 18 }}>{ex.hanzi}</div>
              <div className="muted" style={{ fontSize: 13 }}>{ex.pinyin}</div>
              <div style={{ fontSize: 14 }}>{ex.vi}</div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Vocab({ lesson }: Props) {
  if (!lesson.vocab.length) return <div className="muted">Không có từ vựng.</div>;
  return (
    <table className="vocab-table">
      <tbody>
        <tr><th>Hán tự</th><th>Pinyin</th><th>Nghĩa</th></tr>
        {lesson.vocab.map((v, i) => (
          <tr key={i}><td className="hanzi">{v.hanzi}</td><td>{v.pinyin}</td><td>{v.vi}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function Exercises({ lesson }: Props) {
  const mcq = lesson.exercises?.mcq ?? [];
  const fb = lesson.exercises?.fillBlank ?? [];
  const total = mcq.length + fb.length;
  const [mcqPicks, setMcqPicks] = useState<(number | null)[]>(() => mcq.map(() => null));
  const [fbVals, setFbVals] = useState<string[][]>(() => fb.map((it) => it.blanks.map(() => "")));
  const [fbChecked, setFbChecked] = useState<(boolean[] | null)[]>(() => fb.map(() => null));

  function pickMcq(qi: number, oi: number) {
    if (mcqPicks[qi] != null) return;
    const next = [...mcqPicks]; next[qi] = oi; setMcqPicks(next);
    maybeFinalize(next, fbChecked);
  }

  function checkFb(i: number) {
    if (fbChecked[i] != null) return;
    const flags = fb[i].blanks.map((b, j) =>
      answerMatches(fbVals[i][j], b.answer, b.alternatives ?? []),
    );
    const next = [...fbChecked]; next[i] = flags; setFbChecked(next);
    maybeFinalize(mcqPicks, next);
  }

  function maybeFinalize(picks: (number | null)[], checks: (boolean[] | null)[]) {
    const allDone = picks.every((p) => p != null) && checks.every((c) => c != null);
    if (!allDone) return;
    let correct = 0;
    picks.forEach((p, i) => { if (p === mcq[i].correctIndex) correct++; });
    checks.forEach((c) => { if (c && c.every(Boolean)) correct++; });
    recordAttempt(lesson.id, {
      score: total ? Math.round((correct / total) * 100) : 100,
      durationSec: 0, completed: true,
    });
  }

  if (total === 0) return <div className="muted">Bài này chưa có bài tập.</div>;

  return (
    <>
      {mcq.map((q, qi) => {
        const p = mcqPicks[qi];
        return (
          <div key={`m${qi}`} className="gt-card">
            <div style={{ fontWeight: 600 }}>Trắc nghiệm {qi + 1}: {q.prompt}</div>
            {q.options.map((opt, oi) => {
              const cls =
                p == null ? "option-btn" :
                oi === q.correctIndex ? "option-btn correct" :
                oi === p ? "option-btn wrong" : "option-btn";
              return <button key={oi} className={cls} disabled={p != null} onClick={() => pickMcq(qi, oi)}>{opt}</button>;
            })}
            {p != null && q.explanation && (
              <div className="feedback feedback-info" style={{ marginTop: 6 }}>{q.explanation}</div>
            )}
          </div>
        );
      })}
      {fb.map((it, i) => {
        const c = fbChecked[i];
        return (
          <div key={`f${i}`} className="gt-card">
            <div style={{ fontWeight: 600 }}>Điền từ {i + 1}: {it.prompt.replace(/_+/g, "____")}</div>
            {it.blanks.map((_, j) => (
              <input
                key={j}
                className={`input-blank ${c ? (c[j] ? "correct" : "wrong") : ""}`}
                value={fbVals[i][j]}
                disabled={c != null}
                onChange={(e) => {
                  const next = fbVals.map((r) => [...r]); next[i][j] = e.target.value; setFbVals(next);
                }}
              />
            ))}
            {!c && (
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => checkFb(i)}>Kiểm tra</button>
            )}
            {c && (
              <div className={`feedback ${c.every(Boolean) ? "feedback-ok" : "feedback-bad"}`}>
                {c.every(Boolean) ? "Đúng rồi!" : `Đáp án mẫu: ${it.blanks.map((b) => b.answer).join(" / ")}`}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

const styleStr = `
  .gt-tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--c-divider);
    margin-bottom: 14px; }
  .gt-tab { padding: 10px 18px; border: 0; background: transparent; cursor: pointer;
    font-weight: 600; color: var(--c-text-soft); border-bottom: 3px solid transparent;
    margin-bottom: -2px; }
  .gt-tab.active { color: var(--c-blue-dark); border-bottom-color: var(--c-orange); }
  .gt-card { background: white; padding: 16px; border-radius: 12px;
    border: 1px solid var(--c-divider); margin-bottom: 12px; }
  .gt-example { background: #f8fafc; padding: 10px 14px; border-radius: 10px;
    border-left: 3px solid var(--c-blue); margin: 8px 0; }
  .vocab-table { width: 100%; border-collapse: collapse; margin-top: 8px;
    background: white; border-radius: 12px; overflow: hidden; }
  .vocab-table th, .vocab-table td { padding: 10px 14px; text-align: left;
    border-bottom: 1px solid var(--c-divider); }
  .vocab-table th { background: #f1f5f9; font-weight: 600; }
`;
