import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await signIn(email, password);
      navigate("/", { replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <div className="gv-login-wrap">
      <div className="gv-login-card">
        <div className="gv-login-brand">
          <img src="/chuxin-logo.jpg" alt="Sơ Tâm" />
          <div>
            <div className="gv-login-brand-title">Hán ngữ Sơ Tâm</div>
            <div className="gv-login-brand-sub">Cổng Giáo Vụ</div>
          </div>
        </div>

        <h2>Đăng nhập nội bộ</h2>

        <form className="gv-form" onSubmit={submit}>
          <div className="gv-field">
            <label>Email nội bộ</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@hanngusotam.io.vn"
              autoComplete="email"
              required
            />
          </div>
          <div className="gv-field">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              onKeyDown={(e) => { if (e.key === "Enter") submit(e); }}
            />
          </div>

          {err && <div className="feedback feedback-bad">{err}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="muted" style={{ fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Chỉ dành cho giáo viên, nhân viên và trợ giảng.
        </p>
      </div>
    </div>
  );
}
