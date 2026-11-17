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

  return <main className="flex min-h-screen items-center justify-center p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
      <h1 className="text-3xl font-black text-ink">Mercedes Municipal Fishport Parking System</h1><p className="mb-6 text-slate-500">Parking management login</p>
      {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}
      <label className="mb-4 block font-bold">Username<input value={username} onChange={e => setUsername(e.target.value)} className="mt-1 w-full rounded-xl border p-3" required /></label>
      <label className="mb-5 block font-bold">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border p-3" required /></label>
      <button disabled={loading} className="w-full rounded-xl bg-ink py-4 text-lg font-black text-white disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
