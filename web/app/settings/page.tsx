"use client";

import { useEffect, useState } from "react";
import { apiFetch, VEHICLE_TYPES } from "../../lib/api";
import { Protected } from "../../components/Protected";

type FixedRates = { vehicle_types: Record<string, string>; rates: Record<string, { first_3_hours: number; succeeding_hour: number }>; grace_minutes: number; overnight_fee: number; lost_ticket_fee: number; vip_fee: number };
type User = { id: number; name: string; username: string; role: string; created_at?: string };

export default function SettingsPage() {
  const [fixedRates, setFixedRates] = useState<FixedRates | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "guard_entrance" });
  const [showPassword, setShowPassword] = useState(false);

  function generateUsername(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    if (words.length === 1) return words[0].toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    const firstInitial = words[0][0].toLowerCase();
    const remainder = words.slice(1).join("").toLowerCase().replace(/[^a-z0-9]/g, "");
    return `${firstInitial}${remainder}`.slice(0, 30);
  }

  useEffect(() => {
    Promise.all([apiFetch<FixedRates>("/rates"), apiFetch<{ users: User[] }>("/users")])
      .then(([rates, usersResult]) => { setFixedRates(rates); setUsers(usersResult.users); })
      .catch(e => setError(e instanceof Error ? e.message : "Could not load settings."));
  }, []);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await apiFetch<{ user: User }>("/users", { method: "POST", body: JSON.stringify(newUser) });
      setUsers([...users, result.user]);
      setNewUser({ name: "", username: "", password: "", role: "guard_entrance" });
      setShowPassword(false);
      setMessage("User created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create user.");
    }
  }

  return <Protected roles={["admin"]}><div className="space-y-6">
    <div><p className="text-sm font-semibold text-slate-500">View fixed pricing and manage staff access.</p><h1 className="page-title">Settings</h1></div>
    {message && <p className="rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-700">{message}</p>}
    {error && <p className="rounded-xl bg-red-50 p-3 font-semibold text-red-700">{error}</p>}
    <section className="app-surface p-4 sm:p-5">
      <h2 className="mb-4 text-xl font-black text-ink">Parking Rates</h2>
      <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-800">Overnight stay: ₱200 flat (replaces hourly fees)</p>
      {fixedRates && <>
        <div className="grid gap-3 md:hidden">{VEHICLE_TYPES.map(type => <article key={type.code} className="rounded-2xl border border-slate-200 bg-white/70 p-4"><p className="font-black text-ink">{type.label}</p><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">First 3 hours</dt><dd className="font-black">₱{fixedRates.rates[type.code]?.first_3_hours.toFixed(2)}</dd></div><div><dt className="text-slate-500">Succeeding hour</dt><dd className="font-black">₱{fixedRates.rates[type.code]?.succeeding_hour.toFixed(2)}</dd></div></dl></article>)}</div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Vehicle</th><th className="p-3">First 3 hours</th><th className="p-3">Each succeeding hour</th></tr></thead><tbody>{VEHICLE_TYPES.map(type => <tr key={type.code} className="border-b border-slate-100"><td className="p-3 font-bold">{type.label}</td><td className="p-3">₱{fixedRates.rates[type.code]?.first_3_hours.toFixed(2)}</td><td className="p-3">₱{fixedRates.rates[type.code]?.succeeding_hour.toFixed(2)}</td></tr>)}</tbody></table></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><p className="rounded-xl bg-slate-100 p-3 text-sm"><b>Grace:</b> {fixedRates.grace_minutes} min</p><p className="rounded-xl bg-slate-100 p-3 text-sm"><b>Overnight:</b> ₱{fixedRates.overnight_fee}</p><p className="rounded-xl bg-slate-100 p-3 text-sm"><b>Lost ticket:</b> ₱{fixedRates.lost_ticket_fee}</p><p className="rounded-xl bg-slate-100 p-3 text-sm"><b>VIP:</b> ₱{fixedRates.vip_fee}</p></div>
      </>}
    </section>
    <section className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={createUser} className="app-surface p-5"><h2 className="mb-4 text-xl font-black text-ink">Add User</h2>
        <label className="field-label">Full name<input value={newUser.name} onChange={e => { const name = e.target.value; setNewUser({ ...newUser, name, username: generateUsername(name) }); }} className="input-control" required /></label>
        <label className="field-label">Username<input value={newUser.username} readOnly className="input-control bg-slate-100 text-slate-600" required /></label>
        <label className="field-label">Password<div className="relative"><input type={showPassword ? "text" : "password"} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="input-control pr-20" required minLength={8} /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-2 top-1/2 min-h-10 -translate-y-1/2 rounded-lg px-3 text-xs font-black text-blue-700">{showPassword ? "Hide" : "Show"}</button></div></label>
        <label className="field-label">Role<select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="input-control"><option value="guard_entrance">Entrance guard</option><option value="guard_exit">Exit guard</option></select></label>
        <button className="primary-button w-full">Create user</button>
      </form>
      <div className="app-surface p-5"><h2 className="mb-4 text-xl font-black text-ink">Users</h2>{users.map(user => <div key={user.id} className="flex justify-between border-b border-slate-100 py-3"><span><b>{user.name}</b><br /><small className="text-slate-500">{user.username}</small></span><span className="text-xs font-bold uppercase text-blue-700">{user.role}</span></div>)}</div>
    </section>
  </div></Protected>;
}
