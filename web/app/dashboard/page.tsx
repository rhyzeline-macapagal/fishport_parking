"use client";

import { useEffect, useState } from "react";
import { apiFetch, formatDate } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { StaffBadge } from "../../components/StaffBadge";
import { Ticket } from "../../lib/api";

type Stats = { vehicles_inside: number; today_revenue: number; total_vehicles_today: number; total_cards: number; available_cards: number; paid_today: number; lost_today: number };
type RankedValue = { value: string; count: number };
type RankedGuard = { id: number; name: string; username: string; count: number };
type Insights = {
  average_stay_minutes: number;
  repeat_plate_count: number;
  top_plates: RankedValue[];
  top_vehicle_types: RankedValue[];
  top_cards: RankedValue[];
  top_entrance_guards: RankedGuard[];
  top_exit_guards: RankedGuard[];
};

function RankingCard({ title, items, hrefValue }: { title: string; items: RankedValue[]; hrefValue: (value: string) => string }) {
  return (
    <section className="app-surface p-5">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      {items.length === 0 ? <p className="mt-4 text-sm font-semibold text-slate-500">No data for this period.</p> :
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={item.value}>
              <a href={hrefValue(item.value)} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-slate-100">
                <span className="min-w-0 break-words text-sm font-bold text-slate-700"><span className="mr-2 text-slate-400">{index + 1}</span>{item.value}</span>
                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">{item.count}</span>
              </a>
            </li>
          ))}
        </ol>}
    </section>
  );
}

function GuardRankingCard({ title, items }: { title: string; items: RankedGuard[] }) {
  return (
    <section className="app-surface p-5">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      {items.length === 0 ? <p className="mt-4 text-sm font-semibold text-slate-500">No data for this period.</p> :
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={item.id}>
              <a href={`/transactions?guard_id=${item.id}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-slate-100">
                <span className="min-w-0 break-words text-sm font-bold text-slate-700"><span className="mr-2 text-slate-400">{index + 1}</span>{item.name}<span className="block text-xs font-semibold text-slate-500">@{item.username}</span></span>
                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">{item.count}</span>
              </a>
            </li>
          ))}
        </ol>}
    </section>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Ticket[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    const query = new URLSearchParams();
    if (year) query.set("year", year);
    if (month) query.set("month", month);
    if (day) query.set("day", day);
    const queryString = query.toString();
    apiFetch<{ stats?: Stats; recent_transactions?: Ticket[]; available_dates?: string[]; insights?: Insights }>(`/dashboard/stats${queryString ? `?${queryString}` : ""}`)
      .then(result => {
        const recentTransactions = Array.isArray(result.recent_transactions) ? result.recent_transactions : [];
        const dates = Array.isArray(result.available_dates)
          ? result.available_dates.filter((date): date is string => typeof date === "string")
          : [];
        setStats(result.stats ?? null);
        setRecent(recentTransactions);
        setInsights(result.insights ?? null);
        setAvailableDates(dates);
        if (!year && dates.length > 0) {
          setYear(dates[0].slice(0, 4));
        }
      })
      .catch(e => {
        setStats(null);
        setRecent([]);
        setInsights(null);
        setAvailableDates([]);
        setError(e instanceof Error ? e.message : "Could not load dashboard.");
      });
  }, [year, month, day]);

  const availableYears = [...new Set(availableDates.map(date => date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const availableMonths = [...new Set(availableDates
    .filter(date => !year || date.startsWith(`${year}-`))
    .map(date => date.slice(5, 7)))]
    .sort((a, b) => a.localeCompare(b));
  const availableDays = [...new Set(availableDates
    .filter(date => !year || date.startsWith(`${year}-`))
    .filter(date => !month || date.slice(5, 7) === month)
    .map(date => date.slice(8, 10)))]
    .sort((a, b) => a.localeCompare(b));

  const metrics = [
    ["🚗", "Active Vehicles", stats?.vehicles_inside ?? "—", "text-blue-600"],
    ["▣", "Total Cards", stats?.total_cards ?? "—", "text-emerald-600"],
    ["₱", "Period Collection", stats ? `₱${stats.today_revenue.toFixed(2)}` : "—", "text-amber-500"],
    ["▤", "Period Transactions", stats?.total_vehicles_today ?? "—", "text-violet-600"],
    ["↻", "Repeat Plate Counts", insights?.repeat_plate_count ?? "—", "text-cyan-600"],
    ["◷", "Average Stay", insights ? `${Math.floor(insights.average_stay_minutes / 60)}h ${insights.average_stay_minutes % 60}m` : "—", "text-rose-600"],
  ];
  return <Protected roles={["admin"]}><div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="page-title">Parking Dashboard</h1></div>
      <div className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-white/70 bg-white/70 p-2 shadow-card backdrop-blur-xl sm:flex sm:w-auto sm:flex-wrap sm:items-end">
        <label className="text-xs font-black uppercase text-slate-500">Year
          <select aria-label="Dashboard year" value={year} onChange={e => { setYear(e.target.value); setMonth(""); setDay(""); }} disabled={availableYears.length === 0} className="input-control mt-1 w-full px-3 py-2 text-sm sm:min-w-28 disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Select year</option>
            {availableYears.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs font-black uppercase text-slate-500">Month
          <select aria-label="Dashboard month" value={month} onChange={e => { setMonth(e.target.value); setDay(""); }} disabled={!year || availableMonths.length === 0} className="input-control mt-1 w-full px-3 py-2 text-sm sm:min-w-36 disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">All months</option>
            {availableMonths.map(value => <option key={value} value={value}>{["January","February","March","April","May","June","July","August","September","October","November","December"][Number(value) - 1]}</option>)}
          </select>
        </label>
        <label className="text-xs font-black uppercase text-slate-500">Day
          <select aria-label="Dashboard day" value={day} onChange={e => setDay(e.target.value)} disabled={!month || availableDays.length === 0} className="input-control mt-1 w-full px-3 py-2 text-sm sm:min-w-28 disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">All days</option>
            {availableDays.map(value => <option key={value} value={value}>{Number(value)}</option>)}
          </select>
        </label>
      </div>
    </div>
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    <section className="hero-fishport rounded-2xl border border-white/30 p-6 text-white shadow-lg backdrop-blur-lg sm:p-8">
      <p className="text-2xl font-black sm:text-3xl">Good morning, Administrator!</p>
      <p className="mt-2 font-semibold text-blue-100">Here&apos;s what&apos;s happening at Mercedes Municipal Fishport.</p>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([icon, label, value, color]) => <div key={label} className="app-surface flex items-center gap-4 p-5"><span className={`text-3xl ${color}`}>{icon}</span><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="text-2xl font-black text-ink">{value}</p></div></div>)}</div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RankingCard title="Top Plate Numbers" items={insights?.top_plates ?? []} hrefValue={(value) => `/transactions?search=${encodeURIComponent(value)}`} />
      <RankingCard title="Top Vehicle Types" items={insights?.top_vehicle_types ?? []} hrefValue={(value) => `/transactions?search=${encodeURIComponent(value)}`} />
      <RankingCard title="Most-Used Cards" items={insights?.top_cards ?? []} hrefValue={(value) => `/transactions?search=${encodeURIComponent(value)}`} />
      <GuardRankingCard title="Top Entrance Guards" items={insights?.top_entrance_guards ?? []} />
      <GuardRankingCard title="Top Exit Guards" items={insights?.top_exit_guards ?? []} />
      <section className="app-surface p-5">
        <h2 className="text-lg font-black text-ink">Period Summary</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-bold uppercase text-emerald-700">Paid</p><p className="mt-1 text-xl font-black text-emerald-900">{stats?.paid_today ?? "—"}</p></div>
          <div className="rounded-xl bg-red-50 p-3"><p className="text-xs font-bold uppercase text-red-700">Lost</p><p className="mt-1 text-xl font-black text-red-900">{stats?.lost_today ?? "—"}</p></div>
          <div className="col-span-2 rounded-xl bg-blue-50 p-3"><p className="text-xs font-bold uppercase text-blue-700">Active vehicles</p><p className="mt-1 text-xl font-black text-blue-900">{stats?.vehicles_inside ?? "—"}</p></div>
        </div>
      </section>
    </section>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.8fr]">
      <section className="app-surface overflow-hidden p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-black text-ink">Recent Transactions</h2><a href="/transactions" className="shrink-0 text-sm font-bold text-blue-600">View All →</a></div>
        {recent.length === 0 ? <p className="py-12 text-center text-sm font-semibold text-slate-500">No transactions for this period.</p> : <>
          <div className="space-y-3 md:hidden">
            {recent.map(row => <article key={row.id} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-lg font-black text-ink">{row.plate_no}</p><p className="text-sm text-slate-500">{row.vehicle_type}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-100 text-emerald-700" : row.status === "lost" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{row.status}</span></div>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm"><div><dt className="text-slate-500">Entry</dt><dd className="break-words font-semibold">{formatDate(row.entry_time)}</dd></div><div><dt className="text-slate-500">Exit</dt><dd className="break-words font-semibold">{formatDate(row.exit_time)}</dd></div><div><dt className="text-slate-500">Amount</dt><dd className="font-black text-blue-600">₱{Number(row.amount_paid || row.amount_due || 0).toFixed(2)}</dd></div><div><dt className="text-slate-500">Entrance Guard</dt><dd><StaffBadge staff={row.entrance_guard} /></dd></div><div><dt className="text-slate-500">Exit Guard</dt><dd><StaffBadge staff={row.exit_guard} /></dd></div></dl>
            </article>)}
          </div>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[980px] text-left text-sm"><thead className="sticky top-0 bg-blue-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Time</th><th className="p-3">Plate No.</th><th className="p-3">Vehicle Type</th><th className="p-3">Status</th><th className="p-3">Amount</th><th className="p-3">Entrance Guard</th><th className="p-3">Exit Guard</th></tr></thead><tbody>{recent.map(row => <tr key={String(row.id)} className="border-b border-slate-100"><td className="p-3">{formatDate(row.entry_time)}</td><td className="p-3 font-bold">{row.plate_no}</td><td className="p-3">{row.vehicle_type}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-100 text-emerald-700" : row.status === "lost" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{row.status}</span></td><td className="p-3 font-bold text-blue-600">₱{Number(row.amount_paid || row.amount_due || 0).toFixed(2)}</td><td className="max-w-44 p-3"><StaffBadge staff={row.entrance_guard} /></td><td className="max-w-44 p-3"><StaffBadge staff={row.exit_guard} /></td></tr>)}</tbody></table></div>
        </>}
      </section>
      <section className="app-surface p-5"><div className="mb-5"><h2 className="text-xl font-black text-ink">Period Overview</h2></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-700">Available cards</p><p className="mt-1 text-2xl font-black text-emerald-900">{stats?.available_cards ?? "—"}</p></div><div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold uppercase text-blue-700">Paid exits</p><p className="mt-1 text-2xl font-black text-blue-900">{stats?.paid_today ?? "—"}</p></div><div className="col-span-2 rounded-xl bg-red-50 p-4"><p className="text-xs font-bold uppercase text-red-700">Lost tickets</p><p className="mt-1 text-2xl font-black text-red-900">{stats?.lost_today ?? "—"}</p></div></div></section>
    </div>
  </div></Protected>;
}
