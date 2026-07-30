import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth-context";
import { apiAuthConfig, type AuthConfig } from "./api";

function stripNonDigits(v: string) { return v.replace(/\D/g, ""); }

interface Props {
  close: () => void;
  /** If set, navigate here after a successful login */
  redirectTo?: string;
  /** Label shown at the top of the modal */
  heading?: string;
}

export function SignInModal({ close, redirectTo, heading = "Đăng nhập" }: Props) {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState<string | null>(null);
  const [busy, setBusy]   = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { apiAuthConfig().then(setConfig); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [close]);

  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>("input")?.focus();
  }, [config]);

  const usePhone = !!(config?.disableEmailLogin && config?.allowPhoneLogin);

  async function handleSignIn() {
    setBusy(true); setErr(null);
    try {
      await signIn(usePhone ? { phone, password: pw } : { email, password: pw });
      close();
      if (redirectTo) nav(redirectTo);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  const modal = (
    <div className="sotam-modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="sotam-modal-card" ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <h3>{heading}</h3>

        {config === null && <div className="muted" style={{ fontSize: 14 }}>Đang tải…</div>}

        {config !== null && (
          <>
            {usePhone ? (
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Số điện thoại (VD: 0901234567)"
                value={phone}
                onChange={(e) => setPhone(stripNonDigits(e.target.value))}
                autoComplete="tel"
              />
            ) : (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            )}

            <input
              type="password"
              placeholder="Mật khẩu"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === "Enter") handleSignIn(); }}
            />

            {err && <div className="feedback feedback-bad" style={{ marginTop: 0 }}>{err}</div>}

            <div className="modal-actions">
              <button className="btn btn-primary" disabled={busy} onClick={handleSignIn}>
                {busy ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </div>
          </>
        )}

        <button className="btn btn-text close-x" onClick={close} aria-label="Đóng">✕</button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
