import { useEffect, useState } from "react";
import type { Lesson } from "@hanai/shared";
import { saveWorksheet, loadWorksheet, recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "worksheet" }> };

export function Worksheet({ lesson }: Props) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { loadWorksheet(lesson.id).then((d) => d && setVals(d.fields)); }, [lesson.id]);

  return (
    <div>
      {lesson.intro && (
        <div className="feedback feedback-info" style={{ whiteSpace: "pre-wrap" }}>
          {lesson.intro}
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        {lesson.fields.map((f) => (
          <div key={f.name} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
            {f.hint && <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>{f.hint}</div>}
            {f.type === "textarea" ? (
              <textarea
                value={vals[f.name] ?? ""}
                onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })}
                style={{ width: "100%", minHeight: 80, padding: 10, border: "2px solid var(--c-divider)", borderRadius: 10, fontFamily: "inherit", fontSize: 15 }}
              />
            ) : (
              <input
                type="text"
                value={vals[f.name] ?? ""}
                onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })}
                style={{ width: "100%", padding: 10, border: "2px solid var(--c-divider)", borderRadius: 10, fontSize: 15 }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="row gap" style={{ marginTop: 14 }}>
        {lesson.submitMode === "save" ? (
          <button
            className="btn btn-primary"
            onClick={async () => {
              await saveWorksheet(lesson.id, vals);
              await recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
              setSaved(true);
              setTimeout(() => setSaved(false), 1800);
            }}
          >
            Lưu phiếu
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => window.print()}>In phiếu</button>
        )}
      </div>
      {saved && <div className="feedback feedback-ok" style={{ marginTop: 14 }}>Đã lưu!</div>}
    </div>
  );
}
