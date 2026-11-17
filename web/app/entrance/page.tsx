"use client";

import { FormEvent, useCallback, useState } from "react";
import { apiFetch, Ticket } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { TicketCard } from "../../components/TicketCard";
import { QrScanner } from "../../components/QrScanner";

export default function EntrancePage() {
  const [cardCode, setCardCode] = useState(""); const [plate, setPlate] = useState(""); const [vehicleType, setVehicleType] = useState("Car"); const [ticket, setTicket] = useState<Ticket | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const scan = useCallback((value: string) => setCardCode(value.trim().toUpperCase()), []);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); setLoading(true); try { const result = await apiFetch<{ ticket: Ticket }>("/tickets/entry", { method: "POST", body: JSON.stringify({ card_code: cardCode, plate_no: plate, vehicle_type: vehicleType }) }); setTicket(result.ticket); setCardCode(""); setPlate(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not assign card."); } finally { setLoading(false); } }
  return <Protected roles={["guard_entrance", "admin"]}><div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]"><form onSubmit={submit} className="app-surface p-5 sm:p-7"><div className="mb-6"><p className="text-xs font-black uppercase tracking-widest text-accent">Entrance lane</p><h1 className="page-title mt-1">Vehicle entry</h1><p className="mt-1 text-sm text-slate-500">Scan a reusable card and register the vehicle.</p></div>{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<QrScanner onScan={scan} /><label className="field-label mt-5">Card code<input value={cardCode} onChange={e => setCardCode(e.target.value.toUpperCase())} className="input-control font-mono text-xl uppercase" placeholder="PF-0001" required /></label><label className="field-label">Plate number<input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="input-control text-xl uppercase" maxLength={20} required /></label><label className="field-label">Vehicle type<select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="input-control"><option>Car</option><option>Motorcycle</option><option>Van</option></select></label><button disabled={loading} className="guard-action bg-ink text-lg text-white">{loading ? "Assigning…" : "Assign card"}</button></form>{ticket ? <TicketCard ticket={ticket} /> : <div className="app-surface flex min-h-48 items-center justify-center border-dashed p-8 text-center text-slate-500">Scan a reusable card, then give it to the driver.</div>}</div></Protected>;
}
