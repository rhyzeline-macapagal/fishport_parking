"use client";

import { useCallback, useState } from "react";
import { apiFetch, Billing, Ticket, formatDate } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { QrScanner } from "../../components/QrScanner";
import { TicketCard } from "../../components/TicketCard";

export default function ExitPage() {
  const [cardCode, setCardCode] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [exitTime, setExitTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const lookup = useCallback(async (value: string) => {
    const clean = value.trim().toUpperCase();
    if (!clean || loading) return;
    setCardCode(clean);
    setCardLocked(true);
    setError("");
    setLoading(true);
    try {
      const result = await apiFetch<{ ticket: Ticket; billing: Billing; exit_time: string }>(`/cards/${encodeURIComponent(clean)}/active`, { method: "GET" });
      setTicket(result.ticket);
      setBilling(result.billing);
      setExitTime(result.exit_time);
    } catch (e) {
      setCardLocked(false);
      setError(e instanceof Error ? e.message : "Card lookup failed.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  async function pay() {
    if (!cardCode || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch<{ ticket: Ticket; billing: Billing; exit_time: string }>(`/cards/${encodeURIComponent(cardCode)}/checkout`, { method: "POST", body: JSON.stringify({ confirm_payment: true }) });
      setTicket(result.ticket);
      setBilling(result.billing);
      setExitTime(result.exit_time);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  function changeCard() {
    setCardCode("");
    setTicket(null);
    setBilling(null);
    setExitTime("");
    setError("");
    setCardLocked(false);
    setScannerKey(key => key + 1);
  }

  function startNextTransaction() {
    changeCard();
  }
  return <Protected roles={["guard_exit", "admin"]}>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <section className="app-surface space-y-5 p-5 sm:p-7">
        <div><p className="text-xs font-black uppercase tracking-widest text-accent">Exit lane</p><h1 className="page-title mt-1">Vehicle exit</h1><p className="mt-1 text-sm text-slate-500">Scan the card to calculate the current amount due.</p></div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {!cardLocked && <QrScanner key={scannerKey} onScan={lookup} />}
        {cardLocked
          ? <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><span>{loading ? "Looking up card…" : "QR recognized · Camera paused"}</span><button type="button" onClick={changeCard} disabled={loading} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-sm disabled:opacity-50">Change card</button></div>
          : <p className="text-sm font-semibold text-slate-500">Camera active · Position the card QR inside the frame</p>}
        <div className="border-t pt-5">
          <label className="field-label">Card code
            <input value={cardCode} onChange={e => setCardCode(e.target.value.toUpperCase())} disabled={cardLocked} className="input-control font-mono text-xl disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" placeholder="PF-0001" />
          </label>
          <button onClick={() => lookup(cardCode)} disabled={loading || !cardCode || cardLocked} className="guard-action bg-ink text-white">Look up card</button>
        </div>
      </section>
      {ticket && billing ? <section className="app-surface p-5 sm:p-7">
        <h2 className="mb-5 text-2xl font-black text-ink">Billing summary</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-500">Card</dt><dd className="font-bold">{ticket.card_code}</dd></div>
          <div><dt className="text-slate-500">Plate</dt><dd className="font-bold">{ticket.plate_no}</dd></div>
          <div><dt className="text-slate-500">Vehicle</dt><dd className="font-bold">{ticket.vehicle_type}</dd></div>
          <div><dt className="text-slate-500">Entry</dt><dd className="font-bold">{formatDate(ticket.entry_time)}</dd></div>
          <div><dt className="text-slate-500">Exit</dt><dd className="font-bold">{formatDate(exitTime)}</dd></div>
          <div><dt className="text-slate-500">Duration</dt><dd className="font-bold">{billing.duration_minutes ? `${Math.floor(billing.duration_minutes / 60)}h ${billing.duration_minutes % 60}m` : "—"}</dd></div>
        </dl>
        <p className="my-6 rounded-xl bg-slate-100 p-4 text-center text-sm font-bold">{billing.computation}</p>
        <p className="text-center text-5xl font-black text-ink">₱{billing.total.toFixed(2)}</p>
        {ticket.status === "active" && <button onClick={pay} disabled={loading} className="guard-action mt-6 bg-green-600 text-lg text-white">{loading ? "Processing…" : "Confirm cash payment"}</button>}
        {ticket.status === "paid" && <div className="mt-6 space-y-4"><TicketCard ticket={ticket} receipt /><button type="button" onClick={startNextTransaction} className="guard-action bg-blue-600 text-lg text-white">＋ Scan next card</button></div>}
      </section> : <div className="app-surface flex min-h-48 items-center justify-center border-dashed p-8 text-center text-slate-500">Scan a card or enter its code manually.</div>}
    </div>
  </Protected>;
}
