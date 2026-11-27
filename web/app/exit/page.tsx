"use client";

import { useCallback, useState } from "react";
import { apiFetch, Billing, Ticket, formatDateOnly, formatTime, vehicleLabel } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { QrScanner } from "../../components/QrScanner";
import { TicketCard } from "../../components/TicketCard";
import { useAuth } from "../../components/AuthProvider";

export default function ExitPage() {
  const { user } = useAuth();
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
      await apiFetch<{ code: string; card_type: string; status: string }>(`/cards/lookup?code=${encodeURIComponent(clean)}`);
      const result = await apiFetch<{ ticket: Ticket; billing: Billing; exit_time: string }>(`/cards/${encodeURIComponent(clean)}/active`);
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

  async function confirmExit() {
    if (!cardCode || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch<{ ticket: Ticket; billing: Billing; exit_time: string }>(`/cards/${encodeURIComponent(cardCode)}/checkout`, {
        method: "POST",
        body: JSON.stringify({ confirm_payment: true }),
      });
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

  const vip = ticket?.ticket_type === "vip";

  return <Protected roles={["guard_exit", "admin"]}>
    <div className={ticket && billing ? "space-y-5" : "grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"}>
      {!ticket && <section className="app-surface space-y-5 p-5 sm:p-7">
        <div><p className="text-xs font-black uppercase tracking-widest text-accent">Exit lane</p><h1 className="page-title mt-1">Vehicle exit</h1></div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {!cardLocked && <QrScanner key={scannerKey} onScan={scan => void lookup(scan)} />}
        {cardLocked ? <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <span>{loading ? "Looking up card…" : "QR recognized · Camera paused"}</span>
          <button type="button" onClick={changeCard} disabled={loading} className="min-h-11 rounded-lg bg-white px-3 text-xs font-black">Change card</button>
        </div> : <p className="text-sm font-semibold text-slate-500">Camera active · Position the card QR inside the frame</p>}
        <div className="border-t pt-5">
          <label className="field-label">Card code<input value={cardCode} onChange={e => setCardCode(e.target.value.toUpperCase())} disabled={cardLocked} autoCapitalize="characters" autoComplete="off" className="input-control font-mono text-xl" placeholder="PF-0001" /></label>
          <button onClick={() => void lookup(cardCode)} disabled={loading || !cardCode || cardLocked} className="guard-action bg-ink text-white">Look up card</button>
        </div>
      </section>}
      {ticket && ticket.status === "paid" ? <div className="mx-auto w-full max-w-md space-y-4"><TicketCard ticket={ticket} receipt resultLayout showPrint={false} /><button type="button" onClick={changeCard} className="guard-action bg-blue-600 text-lg text-white sm:w-auto">＋ Scan next card</button></div>
        : ticket && billing ? <section className="app-surface mx-auto w-full max-w-md rounded-3xl p-5 sm:p-7 lg:max-w-lg">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-500">Total Amount</p>
            <p className="text-3xl font-black text-ink sm:text-4xl">₱{billing.total.toFixed(2)}</p>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Plate Number</dt>
              <dd className="break-words text-sm font-bold sm:text-base">{ticket.plate_no}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Vehicle Type</dt>
              <dd className="break-words text-sm font-bold sm:text-base">{ticket.vehicle_type ? vehicleLabel(ticket.vehicle_type) : "—"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Entry</dt>
              <dd className="break-words text-sm font-bold sm:text-base">
                <span className="block">{formatDateOnly(ticket.entry_time)}</span>
                <span className="block">{formatTime(ticket.entry_time)}</span>
              </dd>
              {ticket.entrance_guard?.name && <dd className="mt-1 break-words text-xs text-slate-500">By: {ticket.entrance_guard.name}</dd>}
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Exit</dt>
              <dd className="break-words text-sm font-bold sm:text-base">
                <span className="block">{formatDateOnly(exitTime)}</span>
                <span className="block">{formatTime(exitTime)}</span>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Duration</dt>
              <dd className="break-words text-sm font-bold sm:text-base">{billing.duration_minutes ? `${Math.floor(billing.duration_minutes / 60)}h ${billing.duration_minutes % 60}m` : "—"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Staff</dt>
              <dd className="break-words text-sm font-bold sm:text-base">{ticket.exit_guard?.name || user?.name || "—"}</dd>
            </div>
          </dl>
          {vip && <dl className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0"><dt className="text-xs text-slate-500">VIP Name</dt><dd className="break-words text-sm font-bold sm:text-base">{ticket.vip_name || "—"}</dd></div>
            <div className="min-w-0"><dt className="text-xs text-slate-500">Purpose</dt><dd className="break-words text-sm font-bold sm:text-base">{ticket.vip_purpose || "—"}</dd></div>
          </dl>}
          {vip ? <p className="my-6 rounded-xl bg-amber-50 p-4 text-center font-black text-amber-900">VIP – No fee</p>
            : billing.rule_applied === "overnight" ? <p className="my-6 rounded-xl bg-slate-100 p-4 text-center text-sm font-bold">Overnight fee × {billing.overnights} night{billing.overnights === 1 ? "" : "s"}</p>
            : billing.rule_applied === "grace" ? <p className="my-6 rounded-xl bg-slate-100 p-4 text-center text-sm font-bold">Grace period: 30 minutes or less</p>
            : billing.rule_applied === "lost" ? <p className="my-6 rounded-xl bg-slate-100 p-4 text-center text-sm font-bold">Lost ticket fee: ₱100</p>
            : billing.rule_applied === "regular" ? <p className="my-6 rounded-xl bg-slate-100 p-4 text-center text-sm font-bold">First 3 hours: ₱{billing.base_fee.toFixed(2)}{billing.succeeding_hours > 0 ? ` + ${billing.succeeding_hours} succeeding hour(s): ₱${billing.succeeding_fee.toFixed(2)}` : ""}</p> : null}
          {ticket.status === "active" && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => void confirmExit()} disabled={loading} className="guard-action bg-green-600 text-lg text-white sm:w-auto">{loading ? "Processing…" : vip ? "Confirm exit" : "Confirm payment"}</button>
            <button type="button" onClick={changeCard} className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700 sm:w-auto">Change card</button>
          </div>}
        </section> : <div className="app-surface flex min-h-48 items-center justify-center border-dashed p-8 text-center text-slate-500">Scan a card or enter its code manually.</div>}
    </div>
  </Protected>;
}
