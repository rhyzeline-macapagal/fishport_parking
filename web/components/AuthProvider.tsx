"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, User } from "../lib/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("parking_user");
    const token = localStorage.getItem("parking_token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        localStorage.removeItem("parking_user");
        localStorage.removeItem("parking_token");
      }
    } else {
      localStorage.removeItem("parking_user");
      localStorage.removeItem("parking_token");
    }
    setLoading(false);
  }, []);

  async function login(username: string, password: string) {
    const result = await apiFetch<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("parking_token", result.token);
    localStorage.setItem("parking_user", JSON.stringify(result.user));
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem("parking_token");
    localStorage.removeItem("parking_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
