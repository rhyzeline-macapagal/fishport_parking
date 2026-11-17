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
  return <Protected roles={["guard_entrance", "admin"]}><div className="grid gap-6 md:grid-cols-2"><form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="mb-6 text-3xl font-black">Vehicle entry</h1>{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}<QrScanner onScan={scan} /><label className="mt-4 mb-4 block font-bold">Card code<input value={cardCode} onChange={e => setCardCode(e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border p-3 font-mono text-xl uppercase" placeholder="PF-0001" required /></label><label className="mb-4 block font-bold">Plate number<input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border p-3 text-xl uppercase" maxLength={20} required /></label><label className="mb-6 block font-bold">Vehicle type<select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="mt-1 w-full rounded-xl border p-3"><option>Car</option><option>Motorcycle</option><option>Van</option></select></label><button disabled={loading} className="w-full rounded-xl bg-ink py-4 text-lg font-black text-white disabled:opacity-50">{loading ? "Assigning…" : "Assign card"}</button></form>{ticket ? <TicketCard ticket={ticket} /> : <div className="rounded-2xl border-2 border-dashed p-8 text-center text-slate-500">Scan a reusable card, then give it to the driver.</div>}</div></Protected>;
}
