"use client";

import { Ticket, formatDate } from "../lib/api";

export function TicketCard({ ticket, receipt = false }: { ticket: Ticket; receipt?: boolean }) {
  return (
    <section className="app-surface overflow-hidden p-5 print:shadow-none">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="mb-2 h-12 w-12 rounded-full bg-emerald-100 p-3 text-emerald-600">✓</div>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{receipt ? "Payment successful" : "Entry recorded"}</p>
        <p className="text-3xl font-black">{ticket.plate_no}</p>
        <p className="font-mono text-lg font-bold">{ticket.card_code || "Legacy ticket"}</p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-slate-500">Vehicle</dt><dd className="font-bold">{ticket.vehicle_type}</dd></div>
        <div><dt className="text-slate-500">Status</dt><dd className="font-bold uppercase">{ticket.status}</dd></div>
        <div><dt className="text-slate-500">Entry</dt><dd className="font-bold">{formatDate(ticket.entry_time)}</dd></div>
        <div><dt className="text-slate-500">Exit</dt><dd className="font-bold">{formatDate(ticket.exit_time)}</dd></div>
      </dl>
      {receipt && <p className="mt-6 text-center text-4xl font-black text-ink">₱{ticket.amount_paid?.toFixed(2)}</p>}
      <button onClick={() => window.print()} className="no-print mt-5 w-full rounded-xl bg-ink py-3 font-bold text-white">Print</button>
    </section>
  );
}
