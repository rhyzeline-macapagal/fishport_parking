"use client";

import { FormEvent, useCallback, useState } from "react";
import { apiFetch, Ticket } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { TicketCard } from "../../components/TicketCard";
import { QrScanner } from "../../components/QrScanner";

export default function EntrancePage() {
  const [cardCode, setCardCode] = useState("");
  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const scan = useCallback((value: string) => {
    setCardCode(value.trim().toUpperCase());
    setCardLocked(true);
    setError("");
  }, []);

  function changeCard() {
    setCardLocked(false);
    setCardCode("");
    setError("");
    setScannerKey(key => key + 1);
  }

  function startAnotherTransaction() {
    setTicket(null);
    setCardCode("");
    setPlate("");
    setVehicleType("Car");
    setError("");
    setCardLocked(false);
    setScannerKey(key => key + 1);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!cardCode || loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await apiFetch<{ ticket: Ticket }>("/tickets/entry", {
        method: "POST",
        body: JSON.stringify({ card_code: cardCode, plate_no: plate, vehicle_type: vehicleType }),
      });
      setTicket(result.ticket);
      setCardLocked(true);
      setPlate("");
    } catch (e) {
      setCardLocked(false);
      setError(e instanceof Error ? e.message : "Could not assign card.");
    } finally {
      setLoading(false);
    }
  }
  return <Protected roles={["guard_entrance", "admin"]}>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
      <form onSubmit={submit} className="app-surface p-5 sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-accent">Entrance lane</p>
          <h1 className="page-title mt-1">Vehicle entry</h1>
          <p className="mt-1 text-sm text-slate-500">Scan a reusable card and register the vehicle.</p>
        </div>
        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {!cardLocked && <QrScanner key={scannerKey} onScan={scan} />}
        {cardLocked
          ? <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><span>QR recognized · Camera paused</span><button type="button" onClick={changeCard} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-sm">Change card</button></div>
          : <p className="mt-3 text-sm font-semibold text-slate-500">Camera active · Position the card QR inside the frame</p>}
        <label className="field-label mt-5">Card code
          <input value={cardCode} onChange={e => setCardCode(e.target.value.toUpperCase())} disabled={cardLocked} className="input-control font-mono text-xl uppercase disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" placeholder="PF-0001" required />
        </label>
        <label className="field-label">Plate number<input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="input-control text-xl uppercase" maxLength={20} required /></label>
        <label className="field-label">Vehicle type<select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="input-control"><option>Car</option><option>Motorcycle</option><option>Van</option></select></label>
        <button disabled={loading || !cardCode || ticket !== null} className="guard-action bg-ink text-lg text-white">{loading ? "Assigning…" : "Assign card"}</button>
      </form>
      {ticket ? <div className="space-y-4"><TicketCard ticket={ticket} /><button type="button" onClick={startAnotherTransaction} className="guard-action bg-blue-600 text-lg text-white">＋ Scan another QR</button></div> : <div className="app-surface flex min-h-48 items-center justify-center border-dashed p-8 text-center text-slate-500">Scan a reusable card, then give it to the driver.</div>}
    </div>
  </Protected>;
}
