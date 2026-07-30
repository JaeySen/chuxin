import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API, authHeaders, QuizPlayerInline, type QuizDetail } from "./Home";

// Reads a one-time auth handoff from the URL hash (#jwt=...&session=...).
// Used when another origin (e.g. giaovu.hanngusotam.com) opens this page in
// a new tab — it has no access to this domain's localStorage, so it passes
// its own JWT/session token via the fragment instead (never sent to the
// server, not persisted in browser/server logs). Falls back to this app's
// own stored credentials when the hash is absent (normal same-origin use).
function crossOriginAuthHeaders(): Record<string, string> {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return authHeaders();
  const params = new URLSearchParams(hash);
  const jwt = params.get("jwt");
  const session = params.get("session");
  if (!jwt || !session) return authHeaders();
  return { Authorization: `Bearer ${jwt}`, "X-Session-Token": session };
}

// Standalone page used when "▶ Thử làm" opens the quiz player in a new
// browser tab instead of swapping the teacher's admin list view in place.
export function QuizPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/admin/quiz/${id}`, { credentials: "include", headers: crossOriginAuthHeaders() });
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
