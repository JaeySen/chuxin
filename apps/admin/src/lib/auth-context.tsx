import { createContext, useContext, useEffect, useState } from "react";
import { apiLogin, storeAuth, clearAuth, apiFetch, type GiaoVuUser } from "./api";

interface AuthState {
  user: GiaoVuUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState>({
  user: null, loading: true,
  signIn: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GiaoVuUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jwt = localStorage.getItem("gv_jwt");
    if (!jwt) { setLoading(false); return; }
    apiFetch<GiaoVuUser>("/me").then(setUser).catch(() => {
      clearAuth();
    }).finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    const res = await apiLogin(email, password);
    storeAuth(res.jwt, res.sessionToken);
    setUser(res.user);
  }

  function logout() {
    clearAuth();
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, signIn, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
