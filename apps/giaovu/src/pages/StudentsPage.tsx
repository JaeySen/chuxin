import { useEffect, useState } from "react";
import { Shell } from "../components/Shell";
import { apiFetch, type GvStaffUser } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<GvStaffUser[]>([]);
  const [err, setErr]   = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create student form
  const [showForm, setShowForm]       = useState(false);
  const [email, setEmail]             = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword]       = useState("");
  const [phone, setPhone]             = useState("");
  const [parentName, setParentName]   = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [dob, setDob]                 = useState("");
  const [address, setAddress]         = useState("");
  const [notes, setNotes]             = useState("");
  const [role, setRole]               = useState<"student" | "teacher" | "assistant" | "staff">("student");
  const [busy, setBusy]               = useState(false);
  const [ok, setOk]                   = useState<string | null>(null);

  const canCreate = user?.role === "staff" || user?.role === "admin";

  async function load() {
    try { setErr(null); setStudents(await apiFetch<GvStaffUser[]>("/students")); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  useEffect(() => { load(); }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setOk(null); setErr(null);
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify({
        email, displayName, password, role,
        phone: phone || undefined,
        dateOfBirth: dob || undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        address: address || undefined,
        notes: notes || undefined,
      }) });
      setOk(`Đã tạo tài khoản: ${displayName}`);
      setEmail(""); setDisplayName(""); setPassword(""); setPhone("");
      setParentName(""); setParentPhone(""); setDob(""); setAddress(""); setNotes("");
      setRole("student"); setShowForm(false);
      load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const filtered = students.filter((s) =>
    !search ||
    s.display_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Shell title="Học viên">
      <div className="gv-page-header">
        <h1>Học viên &amp; Người dùng</h1>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Tạo tài khoản</button>
        )}
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}
      {ok  && <div className="feedback feedback-ok"  style={{ marginBottom: 12 }}>{ok}</div>}

      {showForm && (
        <div className="gv-card" style={{ marginBottom: 16 }}>
          <div className="gv-card-title">Tạo tài khoản mới</div>
          <form className="gv-form" onSubmit={createUser}>
            <div className="gv-form-row">
              <div className="gv-field">
                <label>Họ tên *</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={80} />
              </div>
              <div className="gv-field">
                <label>Vai trò</label>
                <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                  <option value="student">Học viên</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="assistant">Trợ giảng</option>
                  <option value="staff">Nhân viên</option>
                </select>
              </div>
              <div className="gv-field">
                <label>Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="gv-field">
                <label>Mật khẩu * (≥8 ký tự)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="gv-field">
                <label>Số điện thoại</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="gv-field">
                <label>Ngày sinh</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              {role === "student" && <>
                <div className="gv-field">
                  <label>Tên phụ huynh</label>
                  <input value={parentName} onChange={(e) => setParentName(e.target.value)} />
                </div>
                <div className="gv-field">
                  <label>SĐT phụ huynh</label>
                  <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                </div>
                <div className="gv-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Địa chỉ</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="gv-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Ghi chú nội bộ</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? "Đang tạo…" : "Tạo tài khoản"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Huỷ</button>
            </div>
          </form>
        </div>
      )}

      <div className="gv-card">
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Tìm theo tên hoặc email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px", border: "1.5px solid var(--c-divider)", borderRadius: 8,
              fontSize: 14, fontFamily: "inherit", width: "100%", maxWidth: 320 }}
          />
        </div>
        {filtered.length === 0
          ? <div className="muted">Không tìm thấy học viên.</div>
          : <div className="gv-table-wrap">
              <table className="gv-table">
                <thead><tr>
                  <th>Họ tên</th><th>Email</th><th>SĐT</th><th>Phụ huynh</th>
                  <th>Ngày sinh</th><th>Vai trò</th><th>Ghi chú</th>
                </tr></thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.display_name}</td>
                      <td className="muted">{s.email}</td>
                      <td>{s.phone ?? "—"}</td>
                      <td>
                        <div>{s.parent_name ?? "—"}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{s.parent_phone ?? ""}</div>
                      </td>
                      <td>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString("vi-VN") : "—"}</td>
                      <td><span className={`gv-badge gv-badge-${s.role === "student" ? "active" : "submitted"}`}>{s.role}</span></td>
                      <td className="muted" style={{ fontSize: 12, maxWidth: 160 }}>{s.notes ?? "—"}</td>
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
