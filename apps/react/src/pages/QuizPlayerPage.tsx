import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API, authHeaders, QuizPlayerInline, type QuizDetail } from "./Home";

// Standalone page used when "▶ Thử làm" opens the quiz player in a new
// browser tab instead of swapping the teacher's admin list view in place.
// authHeaders() (see Home.tsx) transparently picks up the #jwt=...&session=...
// handoff that giaovu attaches to this link when the exercise was shared to a
// teacher who's never logged into this app directly, so every request made by
// QuizPlayerInline below (start/answer/complete/stats) stays authenticated —
// not just this initial quiz-detail fetch.
export function QuizPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/admin/quiz/${id}`, { credentials: "include", headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (!Array.isArray(data.questions)) throw new Error("Dữ liệu bài tập không hợp lệ");
        if (!cancelled) setQuiz(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được bài tập");
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (error) {
    return (
      <div className="qp-shell">
        <div className="qp-empty">{error}</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="qp-shell">
        <div className="muted" style={{ padding: "12px 16px", fontSize: 14 }}>Đang tải…</div>
      </div>
    );
  }

  // No onClose behavior needed — this tab exists purely to try the quiz;
  // closing just re-shows the "done" screen so the tab can be closed manually.
  return <QuizPlayerInline quiz={quiz} onClose={() => window.close()} />;
}
