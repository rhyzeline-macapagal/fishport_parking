"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try { await login(username, password); const stored = JSON.parse(localStorage.getItem("parking_user") || "{}"); router.push(stored.role === "admin" ? "/dashboard" : stored.role === "guard_entrance" ? "/entrance" : "/exit"); } catch (e) { setError(e instanceof Error ? e.message : "Login failed."); } finally { setLoading(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-amber-50 p-4">
    <form onSubmit={submit} className="app-surface w-full max-w-md p-6 sm:p-8">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl font-black text-ink">MF</div>
      <h1 className="text-3xl font-black leading-tight text-ink">Mercedes Municipal Fishport Parking System</h1><p className="mb-6 mt-2 text-slate-500">Secure parking operations portal</p>
      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <label className="field-label">Username<input value={username} onChange={e => setUsername(e.target.value)} className="input-control" required /></label>
      <label className="field-label">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-control" required /></label>
      <button disabled={loading} className="primary-button mt-2 w-full text-lg">{loading ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
