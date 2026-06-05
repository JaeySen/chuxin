import { useEffect, useState } from "react";
import { Shell } from "../components/Shell";
import { apiFetch } from "../lib/api";

interface StaffMember { id: string; email: string; display_name: string; role: string; }

const ROLE_LABELS: Record<string, string> = {
  teacher: "Giáo viên", assistant: "Trợ giảng", staff: "Nhân viên", admin: "Quản trị",
};

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<StaffMember[]>("/staff")
      .then(setStaff)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <Shell title="Nhân sự">
      <div className="gv-page-header"><h1>Nhân sự</h1></div>
      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}
      <div className="gv-card">
        {staff.length === 0
          ? <div className="muted">Chưa có nhân sự nào.</div>
          : <div className="gv-table-wrap">
              <table className="gv-table">
                <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th></tr></thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.display_name}</td>
                      <td className="muted">{s.email}</td>
                      <td><span className="gv-badge gv-badge-submitted">{ROLE_LABELS[s.role] ?? s.role}</span></td>
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
