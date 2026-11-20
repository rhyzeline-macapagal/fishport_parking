"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, formatDate, StaffRef } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { StaffBadge } from "../../components/StaffBadge";

type Transaction = {
  id: number;
  card_code: string | null;
  plate_no: string;
  vehicle_type: string;
  entry_time: string;
  exit_time: string | null;
  status: "active" | "paid" | "lost";
  amount_due: number;
  amount_paid: number | null;
  entrance_guard: StaffRef;
  exit_guard: StaffRef;
};

type GuardUser = { id: number; name: string; username: string; role: string };
type SortKey = "card" | "plate" | "entry" | "exit" | "status" | "amount" | "entrance" | "exitGuard";
type TransactionSummary = {
  total: number;
  active_count: number;
  paid_count: number;
  lost_count: number;
  total_collection: number;
  unique_plates: number;
  unique_cards: number;
  entrance_guards: number;
  exit_guards: number;
};

export default function TransactionsPage() {
  const [filters, setFilters] = useState(() => {
    if (typeof window === "undefined") return { search: "", status: "", date: "", guardId: "" };
    const params = new URLSearchParams(window.location.search);
    return { search: params.get("search") || "", status: "", date: "", guardId: params.get("guard_id") || "" };
  });
  const [rows, setRows] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [guards, setGuards] = useState<GuardUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "entry", direction: "desc" });

  async function search() {
    setError("");
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.search) query.set("search", filters.search);
      if (filters.status) query.set("status", filters.status);
      if (filters.date) query.set("date", filters.date);
      if (filters.guardId) query.set("guard_id", filters.guardId);
      const result = await apiFetch<{ transactions: Transaction[]; summary?: TransactionSummary }>(`/transactions?${query}`);
      setRows(Array.isArray(result.transactions) ? result.transactions : []);
      setSummary(result.summary ?? null);
    } catch (e) {
      setRows([]);
      setSummary(null);
      setError(e instanceof Error ? e.message : "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiFetch<{ users: GuardUser[] }>("/users")
      .then(result => setGuards(result.users.filter(user => user.role !== "admin")))
      .catch(() => setGuards([]));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void search();
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [filters]);

  function exportCsv() {
    const header = "Card,Plate,Vehicle,Entry,Exit,Status,Amount,Entrance Guard,Entrance Username,Exit Guard,Exit Username\n";
    const csv = header + rows.map(row => [
      row.card_code || "",
      row.plate_no,
      row.vehicle_type,
      formatDate(row.entry_time),
      formatDate(row.exit_time),
      row.status,
      row.amount_paid ?? row.amount_due,
      row.entrance_guard?.name || "",
      row.entrance_guard?.username || "",
      row.exit_guard?.name || "",
      row.exit_guard?.username || "",
    ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "parking-transactions.csv";
    link.click();
  }

  function toggleSort(key: SortKey) {
    setSort(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }

  const sortedRows = useMemo(() => [...rows].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";
    if (sort.key === "card") { aValue = a.card_code || ""; bValue = b.card_code || ""; }
    if (sort.key === "plate") { aValue = a.plate_no; bValue = b.plate_no; }
    if (sort.key === "entry") { aValue = a.entry_time; bValue = b.entry_time; }
    if (sort.key === "exit") { aValue = a.exit_time || ""; bValue = b.exit_time || ""; }
    if (sort.key === "status") { aValue = a.status; bValue = b.status; }
    if (sort.key === "amount") { aValue = Number(a.amount_paid ?? a.amount_due); bValue = Number(b.amount_paid ?? b.amount_due); }
    if (sort.key === "entrance") { aValue = `${a.entrance_guard?.name || ""} ${a.entrance_guard?.username || ""}`; bValue = `${b.entrance_guard?.name || ""} ${b.entrance_guard?.username || ""}`; }
    if (sort.key === "exitGuard") { aValue = `${a.exit_guard?.name || ""} ${a.exit_guard?.username || ""}`; bValue = `${b.exit_guard?.name || ""} ${b.exit_guard?.username || ""}`; }
    const comparison = typeof aValue === "number" && typeof bValue === "number"
      ? aValue - bValue
      : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [rows, sort]);

  const sortHeader = (key: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(key)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/70" aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <span className="flex flex-col text-[8px] leading-[7px]" aria-hidden="true">
        <span className={sort.key === key && sort.direction === "asc" ? "text-blue-700" : "text-slate-400"}>▲</span>
        <span className={sort.key === key && sort.direction === "desc" ? "text-blue-700" : "text-slate-400"}>▼</span>
      </span>
    </button>
  );

  return (
    <Protected roles={["admin"]}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-slate-500">Search, review and export parking activity.</p>
          <h1 className="page-title">Transactions</h1>
        </div>
        <section className="app-surface p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input aria-label="Universal search" placeholder="Search card, plate, guard, vehicle, status..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="input-control mt-0" />
            <select aria-label="Transaction status" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="input-control mt-0">
              <option value="">All statuses</option><option>active</option><option>paid</option><option>lost</option>
            </select>
            <input aria-label="Transaction date" type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className="input-control mt-0" />
            <select aria-label="Guard filter" value={filters.guardId} onChange={e => setFilters({ ...filters, guardId: e.target.value })} className="input-control mt-0">
              <option value="">All guards</option>
              {guards.map(guard => <option key={guard.id} value={guard.id}>{guard.name} (@{guard.username})</option>)}
            </select>
            <button onClick={exportCsv} disabled={!rows.length} className="accent-button disabled:opacity-50">CSV</button>
          </div>
          {summary && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs font-bold uppercase text-slate-500">Transactions</p><p className="mt-1 text-xl font-black text-ink">{summary.total}</p></div>
              <div className="rounded-xl bg-blue-50 p-3"><p className="text-xs font-bold uppercase text-blue-700">Active</p><p className="mt-1 text-xl font-black text-blue-900">{summary.active_count}</p></div>
              <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-bold uppercase text-emerald-700">Paid</p><p className="mt-1 text-xl font-black text-emerald-900">{summary.paid_count}</p></div>
              <div className="rounded-xl bg-red-50 p-3"><p className="text-xs font-bold uppercase text-red-700">Lost</p><p className="mt-1 text-xl font-black text-red-900">{summary.lost_count}</p></div>
              <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs font-bold uppercase text-amber-700">Collection</p><p className="mt-1 text-xl font-black text-amber-900">₱{summary.total_collection.toFixed(2)}</p></div>
              <div className="rounded-xl bg-violet-50 p-3"><p className="text-xs font-bold uppercase text-violet-700">Unique Plates</p><p className="mt-1 text-xl font-black text-violet-900">{summary.unique_plates}</p></div>
              <div className="rounded-xl bg-cyan-50 p-3"><p className="text-xs font-bold uppercase text-cyan-700">Unique Cards</p><p className="mt-1 text-xl font-black text-cyan-900">{summary.unique_cards}</p></div>
              <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs font-bold uppercase text-slate-500">Entrance Guards</p><p className="mt-1 text-xl font-black text-ink">{summary.entrance_guards}</p></div>
              <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs font-bold uppercase text-slate-500">Exit Guards</p><p className="mt-1 text-xl font-black text-ink">{summary.exit_guards}</p></div>
            </div>
          )}
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{error}</p>}
          <div className="mt-5">
            {loading ? <div className="py-16 text-center font-semibold text-slate-500">Loading latest transactions…</div> : sortedRows.length === 0 ? <div className="py-16 text-center font-semibold text-slate-500">No transactions found.</div> : (
              <>
                <div className="space-y-3 md:hidden">
                  {sortedRows.map(row => (
                    <article key={row.id} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="break-words font-mono font-bold">{row.card_code || "—"}</p><p className="break-words text-lg font-black text-ink">{row.plate_no}</p></div>
                        <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black uppercase ${row.status === "paid" ? "bg-emerald-100 text-emerald-700" : row.status === "lost" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{row.status}</span>
                      </div>
                      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                        <div><dt className="text-slate-500">Entry</dt><dd className="break-words font-semibold">{formatDate(row.entry_time)}</dd></div>
                        <div><dt className="text-slate-500">Exit</dt><dd className="break-words font-semibold">{formatDate(row.exit_time)}</dd></div>
                        <div><dt className="text-slate-500">Amount</dt><dd className="font-black text-blue-700">₱{Number(row.amount_paid ?? row.amount_due).toFixed(2)}</dd></div>
                        <div className="min-w-0 break-words"><dt className="text-slate-500">Entrance Guard</dt><dd><StaffBadge staff={row.entrance_guard} /></dd></div>
                        <div className="min-w-0 break-words"><dt className="text-slate-500">Exit Guard</dt><dd><StaffBadge staff={row.exit_guard} /></dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/45 shadow-inner md:block">
                  <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100/95 text-xs font-black uppercase text-slate-500">
                      <tr>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("card", "Card")}</th>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("plate", "Plate")}</th>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("entry", "Entry")}</th>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("exit", "Exit")}</th>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("status", "Status")}</th>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("amount", "Amount")}</th>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("entrance", "Entrance Guard")}</th>
                        <th className="border-b border-slate-200/80 p-2">{sortHeader("exitGuard", "Exit Guard")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map(row => (
                        <tr key={row.id} className="group transition hover:bg-white/75">
                          <td className="border-b border-slate-100 px-4 py-3 font-mono font-bold text-slate-700">{row.card_code || "—"}</td>
                          <td className="border-b border-slate-100 px-4 py-3 font-bold text-ink">{row.plate_no}</td>
                          <td className="border-b border-slate-100 px-4 py-3 text-slate-600">{formatDate(row.entry_time)}</td>
                          <td className="border-b border-slate-100 px-4 py-3 text-slate-600">{formatDate(row.exit_time)}</td>
                          <td className="border-b border-slate-100 px-4 py-3"><span className={`rounded-full px-3 py-1.5 text-xs font-black uppercase ${row.status === "paid" ? "bg-emerald-100 text-emerald-700" : row.status === "lost" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{row.status}</span></td>
                          <td className="border-b border-slate-100 px-4 py-3 font-black text-blue-700">₱{Number(row.amount_paid ?? row.amount_due).toFixed(2)}</td>
                          <td className="max-w-44 border-b border-slate-100 px-4 py-3"><StaffBadge staff={row.entrance_guard} /></td>
                          <td className="max-w-44 border-b border-slate-100 px-4 py-3"><StaffBadge staff={row.exit_guard} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </Protected>
  );
}
