import { createContext, useContext, useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  auth,
  db,
  ensureUserDoc,
  onAuthStateChanged,
  signOut,
  type User,
} from "./firebase";
import { createSession, deleteSession } from "./api";

// ── Types ──────────────────────────────────────────────────────

export type Role = "admin" | "teacher" | "student" | null;

interface AuthState {
  user: User | null;
  loading: boolean;
  role: Role;
  /** Always call this instead of signOut(auth) — properly clears the backend session. */
  logout: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  role: null,
  logout: async () => {},
});

// ── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole]       = useState<Role>(null);

  // Unsubscribe handle for the per-user Firestore session watcher
  const sessionUnsubRef = useRef<(() => void) | null>(null);

  // ── logout ─────────────────────────────────────────────────
  async function logout() {
    sessionUnsubRef.current?.();
    sessionUnsubRef.current = null;
    await deleteSession();                   // DELETE /auth/session (best-effort)
    localStorage.removeItem("sessionToken");
    await signOut(auth);
  }

  // ── onAuthStateChanged ─────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      // Always tear down the previous session listener first
      sessionUnsubRef.current?.();
      sessionUnsubRef.current = null;

      if (!firebaseUser) {
        localStorage.removeItem("sessionToken");
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // 1. Ensure user doc exists in Firestore
      await ensureUserDoc(firebaseUser);

      // 2. Get ID token + custom claims (role) in parallel
      const [idToken, tokenResult] = await Promise.all([
        firebaseUser.getIdToken(),
        firebaseUser.getIdTokenResult(),
      ]);
      const userRole = (tokenResult.claims.role as Role) ?? "student";

      // 3. Create / refresh backend session.
      //    Passing the existing token means a page reload won't kick another device.
      const sessionToken = await createSession(idToken);
      if (sessionToken) localStorage.setItem("sessionToken", sessionToken);

      setUser(firebaseUser);
      setRole(userRole);
      setLoading(false);

      // 4. Watch users/{uid}/sessions/active for remote-logout.
      //    If sessionToken in Firestore changes (another device logged in),
      //    the stored local token won't match → sign out this tab automatically.
      sessionUnsubRef.current = onSnapshot(
        doc(db, "users", firebaseUser.uid, "sessions", "active"),
        (snap) => {
          if (!snap.exists()) return;
          const serverToken = snap.data()?.sessionToken as string | undefined;
          const localToken  = localStorage.getItem("sessionToken");
          if (serverToken && localToken && serverToken !== localToken) {
            logout(); // silent remote logout
          }
        }
      );
    });
  // logout is defined in the same closure and stable — eslint-disable is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, role, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
