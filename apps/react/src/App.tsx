import { Outlet, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "./lib/firebase";
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
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="hanai-header">
      <div className="hanai-header-inner">
        <Link to="/" className="brand">
          <span className="brand-logo">汉</span>
          <span>SotamHSK</span>
        </Link>
        <nav className="hanai-nav">
          <Link to="/">Khoá học</Link>
          <Link to="/pinyin">Ngữ âm</Link>
          <Link to="/word-search">Tìm từ</Link>
          <Link to="/bingo">Bingo</Link>
          <Link to="/me">Tiến độ</Link>
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
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="hanai-modal" onClick={close}>
      <div className="hanai-modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Đăng nhập SotamHSK</h3>
        <button
          className="btn btn-google"
          onClick={async () => {
            try { await signInWithPopup(auth, googleProvider); close(); }
            catch (e: any) { setErr(e.message); }
          }}
        >
          Đăng nhập bằng Google
        </button>
        <div className="divider">hoặc dùng email</div>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Mật khẩu" value={pw} onChange={(e) => setPw(e.target.value)} />
        <div className="row gap">
          <button className="btn btn-primary" onClick={async () => {
            try { await signInWithEmailAndPassword(auth, email, pw); close(); }
            catch (e: any) { setErr(e.message); }
          }}>Đăng nhập</button>
          <button className="btn btn-ghost" onClick={async () => {
            try { await createUserWithEmailAndPassword(auth, email, pw); close(); }
            catch (e: any) { setErr(e.message); }
          }}>Tạo tài khoản</button>
        </div>
        {err && <div className="feedback feedback-bad">{err}</div>}
        <button className="btn btn-text close-x" onClick={close}>Đóng</button>
      </div>
    </div>
  );
}
