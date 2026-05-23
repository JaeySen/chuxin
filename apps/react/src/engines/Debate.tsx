import { useState } from "react";
import type { Lesson } from "@hanai/shared";
import { recordAttempt } from "../lib/progress";

type Props = { lesson: Extract<Lesson, { interactionType: "debate" }> };

export function Debate({ lesson }: Props) {
  const [marked, setMarked] = useState(false);
  return (
    <div>
      <div className="debate-topic">
        <div className="muted">Chủ đề tranh luận</div>
        <div className="hanzi" style={{ fontSize: 24, marginTop: 6 }}>{lesson.topic}</div>
        {lesson.topicVi && <div style={{ marginTop: 6, color: "var(--c-text-soft)" }}>{lesson.topicVi}</div>}
      </div>

      <div className="debate-cols">
        <Col title="✅ Ủng hộ (赞成)" items={lesson.pro} color="#16a34a" />
        <Col title="❌ Phản đối (反对)" items={lesson.con} color="#dc2626" />
      </div>

      {lesson.discussionQuestions?.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Câu hỏi thảo luận</h3>
          <ul className="debate-list">
            {lesson.discussionQuestions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </>
      )}

      <button
        className="btn btn-primary"
        style={{ marginTop: 24 }}
        onClick={() => {
          recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
          setMarked(true);
        }}
      >
        Đánh dấu đã thảo luận
      </button>
      {marked && <div className="feedback feedback-ok" style={{ marginTop: 12 }}>Đã ghi nhận hoàn thành!</div>}

      <style>{styleStr}</style>
    </div>
  );
}

function Col({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="debate-col">
      <h4 style={{ color, marginTop: 0 }}>{title}</h4>
      {items.map((it, i) => <div key={i} className="debate-item">{it}</div>)}
    </div>
  );
}

const styleStr = `
  .debate-topic { background: white; padding: 20px; border-radius: 14px;
    border: 1px solid var(--c-divider); margin-bottom: 22px; }
  .debate-cols { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 720px) { .debate-cols { grid-template-columns: 1fr; } }
  .debate-col { background: white; padding: 18px; border-radius: 12px;
    border: 1px solid var(--c-divider); }
  .debate-item { padding: 10px 12px; border-radius: 8px;
    background: #f8fafc; margin: 8px 0; font-size: 15px; }
  .debate-list { padding-left: 20px; line-height: 2; }
`;
