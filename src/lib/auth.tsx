import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem("sigap_user");
    if (raw) setUser(JSON.parse(raw));
    setReady(true);
  }, []);
  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        setSession: (token, u) => {
          localStorage.setItem("sigap_token", token);
          localStorage.setItem("sigap_user", JSON.stringify(u));
          setUser(u);
        },
        logout: () => {
          localStorage.removeItem("sigap_token");
          localStorage.removeItem("sigap_user");
          setUser(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth harus di dalam AuthProvider");
  return c;
}

export const homeFor = (role: User["role"]) =>
  role === "mahasiswa" ? "/mahasiswa" : role === "staf" ? "/staf" : "/admin";
