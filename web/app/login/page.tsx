"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

  return <main
    className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 bg-center bg-no-repeat p-4"
    style={{
      backgroundImage: "url('/images/fishport_facade.png')",
      backgroundSize: "100% 100%",
    }}
  >
    <div className="absolute inset-0 bg-slate-950/60" />
    <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl border border-white/35 bg-white/20 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex justify-center">
        <Image
          src="/images/mercedes_logo.jpg"
          alt="Mercedes logo"
          width={80}
          height={80}
          className="h-20 w-20 rounded-full object-cover"
        />
      </div>
      <h1 className="text-3xl font-black leading-tight">Mercedes Municipal Fishport Parking System</h1><p className="mb-6 mt-2 text-blue-50">Secure parking operations portal</p>
      {error && <p className="mb-4 rounded-xl bg-red-100/90 p-3 text-sm font-semibold text-red-800">{error}</p>}
      <label className="field-label text-white">Username<input value={username} onChange={e => setUsername(e.target.value)} className="input-control border-white/50 bg-white/75 text-ink placeholder:text-slate-500" required /></label>
      <label className="field-label text-white">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-control border-white/50 bg-white/75 text-ink placeholder:text-slate-500" required /></label>
      <button disabled={loading} className="primary-button mt-2 w-full text-lg">{loading ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
