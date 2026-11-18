"use client";

import { FormEvent, useState } from "react";
import { apiFetch, Ticket } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { TicketCard } from "../../components/TicketCard";

export default function LostTicketPage() {
  const [plate, setPlate] = useState(""); const [ticket, setTicket] = useState<Ticket | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); setLoading(true); try { const result = await apiFetch<{ ticket: Ticket }>("/tickets/lost", { method: "POST", body: JSON.stringify({ plate_no: plate }) }); setTicket(result.ticket); } catch (e) { setError(e instanceof Error ? e.message : "Could not process lost ticket."); } finally { setLoading(false); } }
  return <Protected roles={["guard_exit", "admin"]}><div className="mx-auto max-w-xl"><form onSubmit={submit} className="app-surface p-6"><h1 className="mb-6 text-3xl font-black text-ink">Lost ticket</h1>{error && <p className="mb-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{error}</p>}<label className="field-label">Plate number<input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="input-control text-xl uppercase" required /></label><button disabled={loading} className="guard-action mt-5 bg-red-600 text-white">{loading ? "Applying fee…" : "Apply lost ticket fee"}</button></form>{ticket && <div className="mt-6"><TicketCard ticket={ticket} receipt /></div>}</div></Protected>;
}
