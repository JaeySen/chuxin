import { Outlet, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { useState } from "react";

export function App() {
  return (
    <AuthProvider>
      <Header />
      <main>
        <Outlet />
      </main>
    </AuthProvider>
  );
}

function Header() {
  const { user, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="hanai-header">
      <div className="hanai-header-inner">
        <Link to="/" className="brand">
          <img src="/chuxin-logo.jpg" alt="Sơ Tâm" className="brand-mark" />
          <span>Hán ngữ Sơ Tâm</span>
        </Link>
        <nav className="hanai-nav">
          <Link to="/">Khoá học</Link>
          <Link to="/pinyin">Ngữ âm</Link>
          <Link to="/word-search">Tìm từ</Link>
          <Link to="/bingo">Bingo</Link>
          <Link to="/me">Tiến độ</Link>
          {role === "admin" && <Link to="/admin" style={{ color: "var(--c-red)" }}>Quản trị</Link>}
        </nav>
        <div className="hanai-auth">
          {user ? (
            <div className="hanai-user">
              <span className="hanai-user-name">{user.displayName ?? user.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Đăng nhập</button>
          )}
        </div>
      </div>
      {open && <SignInModal close={() => setOpen(false)} />}
    </header>
  );
}

function SignInModal({ close }: { close: () => void }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="hanai-modal" onClick={close}>
      <div className="hanai-modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === "signin" ? "Đăng nhập SotamHSK" : "Tạo tài khoản SotamHSK"}</h3>
        <button
          className="btn btn-google"
          onClick={async () => {
            try { await signInWithGoogle(); close(); }
            catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
          }}
        >
          Đăng nhập bằng Google
        </button>
        <div className="divider">hoặc dùng email</div>
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Tên hiển thị"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Mật khẩu" value={pw} onChange={(e) => setPw(e.target.value)} />
        <div className="row gap">
          {mode === "signin" ? (
            <>
              <button className="btn btn-primary" onClick={async () => {
                try { await signIn(email, pw); close(); }
                catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
              }}>Đăng nhập</button>
              <button className="btn btn-ghost" onClick={() => { setErr(null); setMode("signup"); }}>
                Tạo tài khoản
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={async () => {
                try { await signUp(email, pw, displayName); close(); }
                catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
              }}>Tạo tài khoản</button>
              <button className="btn btn-ghost" onClick={() => { setErr(null); setMode("signin"); }}>
                Quay lại đăng nhập
              </button>
            </>
          )}
        </div>
        {err && <div className="feedback feedback-bad">{err}</div>}
        <button className="btn btn-text close-x" onClick={close}>Đóng</button>
      </div>
    </div>
  );
}
