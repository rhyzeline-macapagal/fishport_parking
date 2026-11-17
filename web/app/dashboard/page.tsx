"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { Protected } from "../../components/Protected";

type Stats = { vehicles_inside: number; today_revenue: number; total_vehicles_today: number };
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null); const [recent, setRecent] = useState<Array<Record<string, string | number>>>([]); const [error, setError] = useState("");
  useEffect(() => { apiFetch<{ stats: Stats; recent_transactions: Array<Record<string, string | number>> }>("/dashboard/stats").then(r => { setStats(r.stats); setRecent(r.recent_transactions); }).catch(e => setError(e instanceof Error ? e.message : "Could not load dashboard.")); }, []);
  return <Protected roles={["admin"]}><h1 className="mb-6 text-3xl font-black">Dashboard</h1>{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}<div className="grid gap-4 sm:grid-cols-3">{[["Vehicles inside", stats?.vehicles_inside ?? "—"], ["Today's revenue", stats ? `₱${stats.today_revenue.toFixed(2)}` : "—"], ["Vehicles today", stats?.total_vehicles_today ?? "—"]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-ink">{value}</p></div>)}</div><section className="mt-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">Recent transactions</h2><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b"><th className="p-2">Plate</th><th className="p-2">Entry</th><th className="p-2">Status</th><th className="p-2">Amount</th></tr></thead><tbody>{recent.map(row => <tr key={String(row.id)} className="border-b"><td className="p-2 font-bold">{row.plate_no}</td><td className="p-2">{row.entry_time}</td><td className="p-2 uppercase">{row.status}</td><td className="p-2">₱{Number(row.amount_paid || row.amount_due || 0).toFixed(2)}</td></tr>)}</tbody></table></section></Protected>;
}
