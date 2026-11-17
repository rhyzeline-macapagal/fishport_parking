"use client";

import { FormEvent, useState } from "react";
import { apiFetch, Ticket } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { TicketCard } from "../../components/TicketCard";

export default function LostTicketPage() {
  const [plate, setPlate] = useState(""); const [ticket, setTicket] = useState<Ticket | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); setLoading(true); try { const result = await apiFetch<{ ticket: Ticket }>("/tickets/lost", { method: "POST", body: JSON.stringify({ plate_no: plate }) }); setTicket(result.ticket); } catch (e) { setError(e instanceof Error ? e.message : "Could not process lost ticket."); } finally { setLoading(false); } }
  return <Protected roles={["guard_exit", "admin"]}><div className="mx-auto max-w-xl"><form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="mb-6 text-3xl font-black">Lost ticket</h1>{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}<label className="font-bold">Plate number<input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border p-3 text-xl uppercase" required /></label><button disabled={loading} className="mt-5 w-full rounded-xl bg-red-600 py-4 font-black text-white">{loading ? "Applying fee…" : "Apply lost ticket fee"}</button></form>{ticket && <div className="mt-6"><TicketCard ticket={ticket} receipt /></div>}</div></Protected>;
}
