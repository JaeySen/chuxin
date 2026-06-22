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
  signIn: (input: { email?: string; phone?: string; password: string }) => Promise<AuthUser>;
  signUp: (input: { email?: string; phone?: string; password: string; displayName: string }) => Promise<AuthUser>;
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

  async function signIn(input: { email?: string; phone?: string; password: string }) {
    await apiLogin(input);
    const full = await apiMe();
    setUser(full);
    return full!;
  }

  async function signUp(input: { email?: string; phone?: string; password: string; displayName: string }) {
    await apiSignup(input);
    const full = await apiMe();
    setUser(full);
    return full!;
  }

  async function signInWithGoogle(): Promise<never> {
    throw new Error("Google sign-in is not configured yet.");
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
