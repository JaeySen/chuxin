import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { apiFetch, type GvCheckin } from "../lib/api";

type CheckinStatus = "present" | "absent" | "late" | "excused";

interface SessionInfo {
  id: string; class_id: string; session_date: string;
  start_time: string; end_time: string; topic: string | null;
  class_name: string;
}
interface EnrolledStudent { id: string; display_name: string; email: string; }

const STATUS_LABELS: Record<CheckinStatus, string> = {
  present: "Có mặt", absent: "Vắng", late: "Đi trễ", excused: "Nghỉ phép",
};

export function CheckinPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession]   = useState<SessionInfo | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [checkins, setCheckins] = useState<Record<string, GvCheckin>>({});
  const [draft, setDraft]       = useState<Record<string, CheckinStatus>>({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    // Load session info via calendar endpoint then load students + checkins
    Promise.all([
      apiFetch<GvCheckin[]>(`/sessions/${sessionId}/checkins`),
    ]).then(([ci]) => {
      const map: Record<string, GvCheckin> = {};
      ci.forEach((c) => { map[c.student_id] = c; });
      setCheckins(map);
      // Pre-fill draft from existing checkins
      const d: Record<string, CheckinStatus> = {};
      ci.forEach((c) => { d[c.student_id] = c.status; });
      setDraft(d);
    }).catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, [sessionId]);

  // We need to load the class students separately — get from session's class
  useEffect(() => {
    if (!sessionId) return;
    // Fetch session via calendar (all sessions) to get class_id
    apiFetch<SessionInfo[]>("/calendar").then((all) => {
      const s = all.find((x) => x.id === sessionId);
      if (!s) return;
      setSession(s);
      return apiFetch<EnrolledStudent[]>(`/classes/${s.class_id}/students`);
    }).then((stu) => { if (stu) setStudents(stu); })
    .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, [sessionId]);

  async function saveAll() {
    if (!sessionId) return;
    setSaving(true); setSaved(false); setErr(null);
    try {
      const payload = students.map((s) => ({
        studentId: s.id,
        status: draft[s.id] ?? "present",
      }));
      await apiFetch(`/sessions/${sessionId}/checkins/bulk`, {
        method: "POST", body: JSON.stringify(payload),
      });
      setSaved(true);
      // Reload
      const ci = await apiFetch<GvCheckin[]>(`/sessions/${sessionId}/checkins`);
      const map: Record<string, GvCheckin> = {};
      ci.forEach((c) => { map[c.student_id] = c; });
      setCheckins(map);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("vi-VN");

  return (
    <Shell title="Điểm danh">
      <div className="gv-page-header">
        <div>
          {session && (
            <Link to={`/classes/${session.class_id}`} className="muted" style={{ fontSize: 13, textDecoration: "none" }}>
              ← {session.class_name}
            </Link>
          )}
          <h1 style={{ marginTop: 4 }}>
            Điểm danh {session ? `— ${fmtDate(session.session_date)}` : ""}
          </h1>
          {session?.topic && <div className="muted">{session.topic}</div>}
        </div>
        <button className="btn btn-primary" onClick={saveAll} disabled={saving || students.length === 0}>
          {saving ? "Đang lưu…" : "Lưu điểm danh"}
        </button>
      </div>

      {err    && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}
      {saved  && <div className="feedback feedback-ok"  style={{ marginBottom: 12 }}>✓ Đã lưu điểm danh.</div>}

      {students.length === 0
        ? <div className="muted">Đang tải danh sách học viên…</div>
        : <>
            {/* Quick-set all */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {(["present", "absent", "late", "excused"] as CheckinStatus[]).map((s) => (
                <button key={s} className="btn btn-sm btn-secondary"
                  onClick={() => setDraft(Object.fromEntries(students.map((st) => [st.id, s])))}>
                  Tất cả: {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="gv-checkin-grid">
              {students.map((st) => {
                const cur = draft[st.id] ?? "present";
                return (
                  <div key={st.id} className="gv-checkin-card">
                    <div className="gv-checkin-card-name">{st.display_name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{st.email}</div>
                    <select
                      className="gv-checkin-select"
                      value={cur}
                      onChange={(e) => setDraft((d) => ({ ...d, [st.id]: e.target.value as CheckinStatus }))}
                      style={{
                        background: cur === "present" ? "#dcfce7"
                          : cur === "absent" ? "#fee2e2"
                          : cur === "late"   ? "#fef9c3"
                          : "#f3f4f6",
                      }}
                    >
                      {(["present", "absent", "late", "excused"] as CheckinStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    {checkins[st.id] && (
                      <div className="muted" style={{ fontSize: 11 }}>
                        Đã ghi: <span className={`gv-badge gv-badge-${checkins[st.id].status}`}>{STATUS_LABELS[checkins[st.id].status]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
      }
    </Shell>
  );
}
