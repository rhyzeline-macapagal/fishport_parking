"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Card, apiFetch, formatDate } from "../../lib/api";
import { Protected } from "../../components/Protected";

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]); const [count, setCount] = useState(100); const [prefix, setPrefix] = useState("PF-"); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [search, setSearch] = useState(""); const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<{ key: "card" | "status" | "created"; direction: "asc" | "desc" }>({ key: "created", direction: "desc" });
  async function load() { try {
    const result = await apiFetch<{ cards: Card[] }>("/cards");
    setCards(result.cards);
  } catch (e) { setError(e instanceof Error ? e.message : "Could not load cards."); } }
  useEffect(() => { load(); }, []);
  async function generate(event: React.FormEvent) { event.preventDefault(); setError(""); setMessage(""); try { const result = await apiFetch<{ cards: Card[] }>("/cards", { method: "POST", body: JSON.stringify({ count, prefix }) }); await load(); setMessage(`${result.cards.length} cards generated.`); } catch (e) { setError(e instanceof Error ? e.message : "Could not generate cards."); } }
  async function changeStatus(card: Card) { try { const status = card.status === "disabled" ? "available" : "disabled"; const result = await apiFetch<{ card: Card }>(`/cards/${encodeURIComponent(card.card_code)}`, { method: "PUT", body: JSON.stringify({ status }) }); setCards(cards.map(item => item.id === card.id ? result.card : item)); } catch (e) { setError(e instanceof Error ? e.message : "Could not update card."); } }
  async function printSheet() { const html = await Promise.all(cards.filter(card => card.status !== "lost").map(async card => `<article><img src="${await QRCode.toDataURL(card.card_code, { margin: 1, width: 140 })}"><strong>${card.card_code}</strong></article>`)); const popup = window.open("", "_blank"); if (!popup) return; popup.document.write(`<title>QR Cards</title><style>body{font-family:'Bricolage Grotesque',sans-serif;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:20px}article{border:1px dashed #555;padding:10px;text-align:center}img{width:140px}strong{display:block;font:700 18px 'Bricolage Grotesque',sans-serif;margin-top:8px}</style>${html.join("")}`); popup.document.close(); popup.print(); }
  const filteredCards = cards.filter(card =>
    card.card_code.toLowerCase().includes(search.trim().toLowerCase())
    && (statusFilter === "all" || card.status === statusFilter)
  );
  function toggleSort(key: typeof sort.key) {
    setSort(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }
  const visibleCards = useMemo(() => [...filteredCards].sort((a, b) => {
    let aValue = "";
    let bValue = "";
    if (sort.key === "card") { aValue = a.card_code; bValue = b.card_code; }
    if (sort.key === "status") { aValue = a.status; bValue = b.status; }
    if (sort.key === "created") { aValue = a.created_at || ""; bValue = b.created_at || ""; }
    const comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [filteredCards, sort]);
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
  return <Protected roles={["admin"]}><div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">Generate, manage and monitor QR cards.</p><h1 className="page-title">Cards Management</h1></div><button onClick={printSheet} className="accent-button w-full sm:w-auto">＋ Print QR Cards</button></div>{message && <p className="rounded-xl bg-emerald-50/90 p-3 font-semibold text-emerald-700">{message}</p>}{error && <p className="rounded-xl bg-red-50/90 p-3 font-semibold text-red-700">{error}</p>}<section className="app-surface grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto]"><form onSubmit={generate}><h2 className="mb-4 text-xl font-black">Generate New Cards</h2><div className="grid gap-3 sm:grid-cols-3"><label className="field-label">Quantity<input type="number" min="1" max="1000" value={count} onChange={e => setCount(Number(e.target.value))} className="input-control" /></label><label className="field-label">Prefix<input value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())} className="input-control font-mono" /></label><button className="primary-button self-end">Generate</button></div></form><div className="rounded-2xl border border-blue-100/80 bg-blue-50/80 p-5 text-center text-sm font-semibold text-blue-900">▦<br />Each QR card contains only the card code<br /><span className="font-mono">(e.g. PF-0001).</span></div></section><section className="app-surface overflow-hidden p-4 sm:p-5"><div className="mb-4 flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center"><h2 className="text-xl font-black">Cards List</h2><div className="grid gap-2 sm:flex"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="⌕ Search card code..." className="input-control mt-0 px-3 py-2 text-sm sm:min-w-52" /><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-control mt-0 px-3 py-2 text-sm sm:min-w-36"><option value="all">All Statuses</option><option value="available">Available</option><option value="in_use">In use</option><option value="lost">Lost</option><option value="disabled">Disabled</option></select></div></div><div className="space-y-3 md:hidden">{visibleCards.map(card => <article key={card.id} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4"><div className="flex items-start justify-between gap-3"><p className="break-all font-mono font-bold">{card.card_code}</p><span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${card.status === "available" ? "bg-emerald-100 text-emerald-700" : card.status === "lost" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>● {card.status.replace("_", " ")}</span></div><p className="mt-3 text-sm text-slate-500">Created: <span className="font-semibold text-slate-700">{formatDate(card.created_at || null)}</span></p>{(card.status === "available" || card.status === "disabled") && <button onClick={() => changeStatus(card)} className="mt-4 min-h-11 w-full rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{card.status === "disabled" ? "Enable Card" : "Disable Card"}</button>}</article>)}</div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[650px] text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-100/95 text-xs uppercase text-slate-500"><tr><th className="p-2 first:rounded-l-xl">{sortHeader("card", "Card Code")}</th><th className="p-2">{sortHeader("status", "Status")}</th><th className="p-2">{sortHeader("created", "Created Date")}</th><th className="p-3 last:rounded-r-xl">Action</th></tr></thead><tbody>{visibleCards.map(card => <tr key={card.id} className="border-b border-slate-200/70 transition hover:bg-white/60"><td className="p-3 font-mono font-bold">{card.card_code}</td><td className="p-3"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${card.status === "available" ? "bg-emerald-100 text-emerald-700" : card.status === "lost" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>● {card.status.replace("_", " ")}</span></td><td className="p-3">{formatDate(card.created_at || null)}</td><td className="p-3">{(card.status === "available" || card.status === "disabled") && <button onClick={() => changeStatus(card)} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">{card.status === "disabled" ? "Enable" : "Disable"}</button>}</td></tr>)}</tbody></table></div>{visibleCards.length === 0 && <p className="py-10 text-center text-sm font-semibold text-slate-500">No cards match the current filters.</p>}</section></div></Protected>;
}
