import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { apiFetch, type GvSubmission, type GvMaterial } from "../lib/api";
import { useAuth } from "../lib/auth-context";

// Used when navigated to /homework/:materialId
export function HomeworkDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const { user } = useAuth();
  const [material, setMaterial]       = useState<GvMaterial | null>(null);
  const [submissions, setSubmissions] = useState<GvSubmission[]>([]);
  const [err, setErr]                 = useState<string | null>(null);
  const [saving, setSaving]           = useState<string | null>(null);
  const [scoreInput, setScoreInput]   = useState<Record<string, string>>({});
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});

  const canReview = user?.role === "assistant" || user?.role === "teacher" || user?.role === "admin";

  async function load() {
    if (!materialId) return;
    try {
      setErr(null);
      const subs = await apiFetch<GvSubmission[]>(`/materials/${materialId}/submissions`);
      setSubmissions(subs);
      const init: Record<string, string> = {};
      subs.forEach((s) => {
        init[s.id] = s.score != null ? String(s.score) : "";
        setFeedbackInput((prev) => ({ ...prev, [s.id]: s.feedback ?? "" }));
      });
      setScoreInput(init);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  useEffect(() => { load(); }, [materialId]);

  async function review(subId: string, status: "reviewed" | "needs_revision") {
    setSaving(subId);
    try {
      const score = parseFloat(scoreInput[subId] ?? "");
      await apiFetch(`/submissions/${subId}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          score: isNaN(score) ? undefined : score,
          feedback: feedbackInput[subId] || undefined,
        }),
      });
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(null); }
  }

  const pending   = submissions.filter((s) => s.status === "submitted");
  const reviewed  = submissions.filter((s) => s.status !== "submitted");

  const statusBadge = (s: GvSubmission["status"]) => (
    <span className={`gv-badge gv-badge-${s}`}>
      {s === "submitted" ? "Chờ chấm" : s === "reviewed" ? "Đã chấm" : "Cần sửa"}
    </span>
  );

  return (
    <Shell title="Chấm bài tập">
      <div className="gv-page-header">
        <div>
          <Link to="/homework" className="muted" style={{ fontSize: 13, textDecoration: "none" }}>← Danh sách bài tập</Link>
          <h1 style={{ marginTop: 4 }}>{material?.title ?? "Chấm bài tập"}</h1>
        </div>
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}

      {/* Pending */}
      <div className="gv-card">
        <div className="gv-card-title">Chờ chấm ({pending.length})</div>
        {pending.length === 0
          ? <div className="muted" style={{ fontSize: 14 }}>Không có bài nào chờ chấm.</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pending.map((s) => (
                <div key={s.id} style={{ background: "#fffbf0", border: "1px solid var(--c-border)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <div>
                      <strong>{s.student_name}</strong>
                      <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>{s.student_email}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {statusBadge(s.status)}
                      <span className="muted" style={{ fontSize: 12 }}>
                        {new Date(s.submitted_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {s.google_url && (
                    <a href={s.google_url} target="_blank" rel="noreferrer"
                      className="btn btn-sm btn-secondary" style={{ marginBottom: 10 }}>
                      📄 Xem bài nộp
                    </a>
                  )}
                  {s.note && <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>"{s.note}"</div>}

                  {canReview && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <div className="gv-field" style={{ minWidth: 80 }}>
                        <label>Điểm (0–100)</label>
                        <input type="number" min={0} max={100}
                          value={scoreInput[s.id] ?? ""}
                          onChange={(e) => setScoreInput((p) => ({ ...p, [s.id]: e.target.value }))}
                          style={{ width: 80, padding: "6px 10px", border: "1.5px solid var(--c-divider)", borderRadius: 8, fontSize: 14 }}
                        />
                      </div>
                      <div className="gv-field" style={{ flex: 1, minWidth: 200 }}>
                        <label>Nhận xét</label>
                        <input
                          value={feedbackInput[s.id] ?? ""}
                          onChange={(e) => setFeedbackInput((p) => ({ ...p, [s.id]: e.target.value }))}
                          placeholder="Nhận xét cho học viên…"
                          style={{ padding: "6px 10px", border: "1.5px solid var(--c-divider)", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}
                        />
                      </div>
                      <button className="btn btn-sm btn-primary" disabled={saving === s.id}
                        onClick={() => review(s.id, "reviewed")}>
                        {saving === s.id ? "Đang lưu…" : "✓ Đã chấm"}
                      </button>
                      <button className="btn btn-sm btn-danger" disabled={saving === s.id}
                        onClick={() => review(s.id, "needs_revision")}>
                        Cần sửa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
        }
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="gv-card" style={{ marginTop: 16 }}>
          <div className="gv-card-title">Đã chấm ({reviewed.length})</div>
          <div className="gv-table-wrap">
            <table className="gv-table">
              <thead><tr>
                <th>Học viên</th><th>Trạng thái</th><th>Điểm</th><th>Nhận xét</th><th>Người chấm</th>
              </tr></thead>
              <tbody>
                {reviewed.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.student_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{s.student_email}</div>
                    </td>
                    <td>{statusBadge(s.status)}</td>
                    <td>{s.score != null ? s.score : "—"}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{s.feedback ?? "—"}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{s.reviewer_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
}

// /homework list — shows all homework materials across classes accessible to user
export function HomeworkListPage() {
  const [items, setItems] = useState<(GvMaterial & { class_name?: string })[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ id: string; name: string }[]>("/classes").then(async (classes) => {
      const all: (GvMaterial & { class_name?: string })[] = [];
      await Promise.all(classes.map(async (c) => {
        const mats = await apiFetch<GvMaterial[]>(`/classes/${c.id}/materials`);
        mats.filter((m) => m.type === "homework").forEach((m) => {
          all.push({ ...m, class_name: c.name });
        });
      }));
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(all);
    }).catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <Shell title="Bài tập">
      <div className="gv-page-header"><h1>Bài tập</h1></div>
      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}
      <div className="gv-card">
        {items.length === 0
          ? <div className="muted">Chưa có bài tập nào.</div>
          : <div className="gv-table-wrap">
              <table className="gv-table">
                <thead><tr><th>Tiêu đề</th><th>Lớp</th><th>Hạn nộp</th><th>Ngày tạo</th><th></th></tr></thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>
                        {m.google_url
                          ? <a href={m.google_url} target="_blank" rel="noreferrer" style={{ color: "var(--c-red-dark)" }}>{m.title}</a>
                          : m.title}
                      </td>
                      <td className="muted">{m.class_name ?? "—"}</td>
                      <td>{m.due_date ? new Date(m.due_date).toLocaleString("vi-VN") : <span className="muted">—</span>}</td>
                      <td className="muted">{new Date(m.created_at).toLocaleDateString("vi-VN")}</td>
                      <td><Link to={`/homework/${m.id}`} className="btn btn-sm btn-secondary">Chấm bài</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </Shell>
  );
}
