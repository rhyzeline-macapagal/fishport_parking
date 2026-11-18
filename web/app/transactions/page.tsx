"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, formatDate } from "../../lib/api";
import { Protected } from "../../components/Protected";

type Transaction = { id: number; card_code: string | null; plate_no: string; vehicle_type: string; entry_time: string; exit_time: string | null; status: string; amount_due: number; amount_paid: number | null };
export default function TransactionsPage() {
  const [filters, setFilters] = useState({ plate: "", status: "", date: "" }); const [rows, setRows] = useState<Transaction[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<{ key: "card" | "plate" | "entry" | "exit" | "status" | "amount"; direction: "asc" | "desc" }>({ key: "entry", direction: "desc" });
  async function search() { setError(""); setLoading(true); try { const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)); const result = await apiFetch<{ transactions: Transaction[] }>(`/transactions?${query}`); setRows(result.transactions); } catch (e) { setError(e instanceof Error ? e.message : "Could not load transactions."); } finally { setLoading(false); } }
  useEffect(() => { void search(); }, []);
  function exportCsv() { const header = "Card,Plate,Vehicle,Entry,Exit,Status,Amount\n"; const csv = header + rows.map(row => [row.card_code || "", row.plate_no, row.vehicle_type, formatDate(row.entry_time), formatDate(row.exit_time), row.status, row.amount_paid ?? row.amount_due].map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "parking-transactions.csv"; link.click(); }
  function toggleSort(key: typeof sort.key) {
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
    const comparison = typeof aValue === "number" && typeof bValue === "number"
      ? aValue - bValue
      : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [rows, sort]);
  const sortHeader = (key: typeof sort.key, label: string) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/70"
      aria-label={`Sort by ${label}`}
    >
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
          <div className="grid gap-3 md:grid-cols-4">
            <input aria-label="Plate number" placeholder="Plate number" value={filters.plate} onChange={e => setFilters({ ...filters, plate: e.target.value.toUpperCase() })} className="input-control mt-0" />
            <select aria-label="Transaction status" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="input-control mt-0">
              <option value="">All statuses</option><option>active</option><option>paid</option><option>lost</option>
            </select>
            <input aria-label="Transaction date" type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className="input-control mt-0" />
            <div className="flex gap-2">
              <button onClick={search} disabled={loading} className="primary-button flex-1">{loading ? "Loading…" : "Search"}</button>
              <button onClick={exportCsv} disabled={!rows.length} className="accent-button disabled:opacity-50">CSV</button>
            </div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{error}</p>}
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/45 shadow-inner">
            {loading ? (
              <div className="py-16 text-center font-semibold text-slate-500">Loading latest transactions…</div>
            ) : sortedRows.length === 0 ? (
              <div className="py-16 text-center font-semibold text-slate-500">No transactions found.</div>
            ) : (
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-slate-100/90 text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200/80 p-2 first:rounded-tl-2xl">{sortHeader("card", "Card")}</th>
                    <th className="border-b border-slate-200/80 p-2">{sortHeader("plate", "Plate")}</th>
                    <th className="border-b border-slate-200/80 p-2">{sortHeader("entry", "Entry")}</th>
                    <th className="border-b border-slate-200/80 p-2">{sortHeader("exit", "Exit")}</th>
                    <th className="border-b border-slate-200/80 p-2">{sortHeader("status", "Status")}</th>
                    <th className="border-b border-slate-200/80 p-2 last:rounded-tr-2xl">{sortHeader("amount", "Amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(row => (
                    <tr key={row.id} className="group transition hover:bg-white/75">
                      <td className="border-b border-slate-100 px-4 py-3 font-mono font-bold text-slate-700">{row.card_code || "—"}</td>
                      <td className="border-b border-slate-100 px-4 py-3 font-bold text-ink">{row.plate_no}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-600">{formatDate(row.entry_time)}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-600">{formatDate(row.exit_time)}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-black uppercase ${row.status === "paid" ? "bg-emerald-100 text-emerald-700" : row.status === "lost" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{row.status}</span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 font-black text-blue-700">₱{Number(row.amount_paid ?? row.amount_due).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </Protected>
  );
}
