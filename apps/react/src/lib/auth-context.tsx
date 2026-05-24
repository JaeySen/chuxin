import { createContext, useContext, useEffect, useState } from "react";
import {
  apiLogin,
  apiSignup,
  apiLogout,
  apiMe,
  type AuthUser,
} from "./api";

export type Role = "admin" | "teacher" | "student" | null;

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  role: Role;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<never>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  role: null,
  signIn: async () => { throw new Error("AuthProvider not mounted"); },
  signUp: async () => { throw new Error("AuthProvider not mounted"); },
  signInWithGoogle: async () => { throw new Error("AuthProvider not mounted"); },
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiMe().then((u) => {
      if (cancelled) return;
      setUser(u);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function signIn(email: string, password: string) {
    const u = await apiLogin(email, password);
    setUser(u);
    return u;
  }

  async function signUp(email: string, password: string, displayName: string) {
    const u = await apiSignup({ email, password, displayName });
    setUser(u);
    return u;
  }

  async function signInWithGoogle(): Promise<never> {
    throw new Error("Google sign-in is not configured yet. Set GOOGLE_OAUTH_CLIENT_ID on the API and add /auth/google.");
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  const role: Role = user?.role ?? null;

  return (
    <Ctx.Provider value={{ user, loading, role, signIn, signUp, signInWithGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
