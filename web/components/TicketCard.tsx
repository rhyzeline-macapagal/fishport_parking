"use client";

import { Ticket, formatDate, vehicleLabel } from "../lib/api";
import { StaffBadge } from "./StaffBadge";

export function TicketCard({ ticket, receipt = false }: { ticket: Ticket; receipt?: boolean }) {
  return (
    <section className="app-surface overflow-hidden p-5 print:shadow-none">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="mb-2 h-12 w-12 rounded-full bg-emerald-100 p-3 text-emerald-600">✓</div>
        {ticket.ticket_type === "vip" && <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">VIP</p>}
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{receipt ? "Payment successful" : "Entry recorded"}</p>
        <p className="text-3xl font-black">{ticket.plate_no}</p>
        <p className="font-mono text-lg font-bold">{ticket.card_code || "Legacy ticket"}</p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm max-[420px]:grid-cols-1">
        {ticket.ticket_type === "vip" && <div className="min-w-0"><dt className="text-slate-500">VIP Name</dt><dd className="break-words font-bold">{ticket.vip_name || "—"}</dd></div>}
        {ticket.ticket_type === "vip" && <div className="min-w-0"><dt className="text-slate-500">Purpose</dt><dd className="break-words font-bold">{ticket.vip_purpose || "—"}</dd></div>}
        {ticket.vehicle_type && <div className="min-w-0"><dt className="text-slate-500">Vehicle</dt><dd className="break-words font-bold">{vehicleLabel(ticket.vehicle_type)}</dd></div>}
        <div className="min-w-0"><dt className="text-slate-500">Status</dt><dd className="break-words font-bold uppercase">{ticket.status}</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">Entry</dt><dd className="break-words font-bold">{formatDate(ticket.entry_time)}</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">Exit</dt><dd className="break-words font-bold">{formatDate(ticket.exit_time)}</dd></div>
        <div className="min-w-0 break-words"><dt className="text-slate-500">Entrance Guard</dt><dd><StaffBadge staff={ticket.entrance_guard} /></dd></div>
        {receipt && <div className="min-w-0 break-words"><dt className="text-slate-500">{ticket.status === "lost" ? "Processed By (Exit Guard)" : "Exit Guard"}</dt><dd><StaffBadge staff={ticket.exit_guard} /></dd></div>}
      </dl>
      {receipt && <p className="mt-6 text-center text-4xl font-black text-ink">{ticket.ticket_type === "vip" ? "VIP – Exempt" : `₱${ticket.amount_paid?.toFixed(2)}`}</p>}
      <button onClick={() => window.print()} className="no-print mt-5 w-full rounded-xl bg-ink py-3 font-bold text-white">Print</button>
    </section>
  );
}
