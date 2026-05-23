import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { listProgress } from "../lib/progress";
import { useAuth } from "../lib/auth-context";

type Row = Awaited<ReturnType<typeof listProgress>>[number];

export function MePage() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    if (user) listProgress().then(setRows);
  }, [user]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="lesson-shell">
        <div className="feedback feedback-info">Vui lòng đăng nhập để xem tiến độ.</div>
      </div>
    );
  }

  return (
    <div className="lesson-shell">
      <h1 style={{ color: "var(--c-blue-dark)" }}>Tiến độ học tập</h1>
      {!rows && <div className="muted">Đang tải…</div>}
      {rows?.length === 0 && <div className="feedback feedback-info">Bạn chưa làm bài nào.</div>}
      <div className="lesson-list" style={{ marginTop: 16 }}>
        {rows?.map((r) => (
          <Link key={r.id} to={`/lesson/${r.id}`} className="lesson-row">
            <div>
              <strong>{r.id}</strong>
              <div className="muted" style={{ fontSize: 13 }}>
                Số lần: {r.attempts ?? 0} · Điểm cao nhất: {r.bestScore ?? "—"}
              </div>
            </div>
            <span className="badge">{r.completed ? "✓ Hoàn thành" : "Đang học"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
