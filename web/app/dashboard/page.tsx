"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { Protected } from "../../components/Protected";

type Stats = { vehicles_inside: number; today_revenue: number; total_vehicles_today: number };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Array<Record<string, string | number>>>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetch<{ stats: Stats; recent_transactions: Array<Record<string, string | number>> }>("/dashboard/stats")
      .then(result => { setStats(result.stats); setRecent(result.recent_transactions); })
      .catch(e => setError(e instanceof Error ? e.message : "Could not load dashboard."));
  }, []);
  const metrics = [
    ["🚗", "Active Vehicles", stats?.vehicles_inside ?? "—", "+12%", "text-blue-600"],
    ["▣", "Total Cards", "1,250", "+2%", "text-emerald-600"],
    ["₱", "Today's Collection", stats ? `₱${stats.today_revenue.toFixed(2)}` : "—", "", "text-amber-500"],
    ["▤", "Transactions", stats?.total_vehicles_today ?? "—", "+6%", "text-violet-600"],
  ];
  return <Protected roles={["admin"]}><div className="space-y-6">
    <div><p className="text-sm font-semibold text-slate-500">Good morning, Administrator!</p><h1 className="page-title">Here&apos;s what&apos;s happening at Mercedes Municipal Fishport today.</h1></div>
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    <section className="hero-fishport rounded-2xl p-6 text-white shadow-lg sm:p-8"><p className="text-2xl font-black sm:text-3xl">Mercedes Municipal Fishport<br />Parking System</p><p className="mt-2 font-semibold text-blue-100">Safe · Organized · Efficient</p></section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([icon, label, value, trend, color]) => <div key={label} className="app-surface flex items-center gap-4 p-5"><span className={`text-3xl ${color}`}>{icon}</span><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="text-2xl font-black text-ink">{value}</p>{trend && <p className="text-xs font-bold text-emerald-600">↗ {trend}</p>}</div></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.8fr]">
      <section className="app-surface overflow-hidden p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-ink">Recent Transactions</h2><a href="/transactions" className="text-sm font-bold text-blue-600">View All →</a></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-blue-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Time</th><th className="p-3">Plate No.</th><th className="p-3">Vehicle Type</th><th className="p-3">Status</th><th className="p-3">Amount</th></tr></thead><tbody>{recent.map(row => <tr key={String(row.id)} className="border-b border-slate-100"><td className="p-3">{String(row.entry_time)}</td><td className="p-3 font-bold">{String(row.plate_no)}</td><td className="p-3">{String(row.vehicle_type)}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{String(row.status)}</span></td><td className="p-3 font-bold text-blue-600">₱{Number(row.amount_paid || row.amount_due || 0).toFixed(2)}</td></tr>)}</tbody></table></div></section>
      <section className="app-surface p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-ink">Parking Overview</h2><span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">This Day⌄</span></div><div className="flex h-52 items-end gap-3 rounded-xl bg-gradient-to-t from-blue-50 to-white p-5">{[35, 58, 52, 45, 70, 82, 84, 92].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-blue-500" style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-500">{["6AM", "", "9AM", "", "12PM", "3PM", "", "6PM"][index]}</span></div>)}</div></section>
    </div>
  </div></Protected>;
}
