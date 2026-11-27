"use client";

import { Ticket, formatDate, formatTime, vehicleLabel } from "../lib/api";
import { StaffBadge } from "./StaffBadge";

export function TicketCard({ ticket, receipt = false }: { ticket: Ticket; receipt?: boolean }) {
  const statusLabel = ticket.status === "active" ? "Inside" : ticket.status === "paid" ? "Exited" : "Lost";
  const statusClass = ticket.status === "paid"
    ? "bg-emerald-100 text-emerald-700"
    : ticket.status === "lost"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  return (
    <section className="app-surface overflow-hidden p-5 print:shadow-none">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="mb-2 h-12 w-12 rounded-full bg-emerald-100 p-3 text-emerald-600">✓</div>
        {ticket.ticket_type === "vip" && <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">VIP</p>}
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{receipt ? "Payment successful" : "Entry recorded"}</p>
        {receipt && <p className="text-3xl font-black">{ticket.plate_no}</p>}
        <p className="break-all font-mono text-sm font-bold text-slate-500">{ticket.card_code || "Legacy ticket"}</p>
      </div>
      {receipt ? <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm max-[420px]:grid-cols-1">
        {ticket.ticket_type === "vip" && <div className="min-w-0"><dt className="text-slate-500">VIP Name</dt><dd className="break-words font-bold">{ticket.vip_name || "—"}</dd></div>}
        {ticket.ticket_type === "vip" && <div className="min-w-0"><dt className="text-slate-500">Purpose</dt><dd className="break-words font-bold">{ticket.vip_purpose || "—"}</dd></div>}
        {ticket.vehicle_type && <div className="min-w-0"><dt className="text-slate-500">Vehicle</dt><dd className="break-words font-bold">{vehicleLabel(ticket.vehicle_type)}</dd></div>}
        <div className="min-w-0"><dt className="text-slate-500">Status</dt><dd className="break-words font-bold uppercase">{ticket.status}</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">Entry</dt><dd className="break-words font-bold">{formatDate(ticket.entry_time)}</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">Exit</dt><dd className="break-words font-bold">{formatDate(ticket.exit_time)}</dd></div>
        <div className="min-w-0 break-words"><dt className="text-slate-500">Entrance Guard</dt><dd><StaffBadge staff={ticket.entrance_guard} /></dd></div>
        <div className="min-w-0 break-words"><dt className="text-slate-500">{ticket.status === "lost" ? "Processed By (Exit Guard)" : "Exit Guard"}</dt><dd><StaffBadge staff={ticket.exit_guard} /></dd></div>
      </dl> : <dl className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">Vehicle</dt>
          <dd className="break-words text-sm font-bold sm:text-base">{ticket.plate_no}</dd>
          <dd className="break-words text-sm font-bold text-slate-700 sm:text-base">{ticket.vehicle_type ? vehicleLabel(ticket.vehicle_type) : "—"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">Status</dt>
          <dd><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${statusClass}`}>{statusLabel}</span></dd>
        </div>
        <div className="min-w-0 break-words">
          <dt className="text-xs text-slate-500">Entry</dt>
          <dd className="break-words text-sm font-bold sm:text-base">{formatTime(ticket.entry_time)}</dd>
          <dt className="mt-2 text-xs text-slate-500">Scanned by</dt>
          <dd className="break-words text-sm font-bold sm:text-base">{ticket.entrance_guard?.name || "—"}</dd>
        </div>
        <div className="min-w-0 break-words">
          <dt className="text-xs text-slate-500">Exit</dt>
          <dd className="break-words text-sm font-bold sm:text-base">{formatTime(ticket.exit_time)}</dd>
          <dt className="mt-2 text-xs text-slate-500">Scanned by</dt>
          <dd className="break-words text-sm font-bold sm:text-base">{ticket.exit_guard?.name || "—"}</dd>
        </div>
        {ticket.ticket_type === "vip" && <>
          <div className="min-w-0 break-words"><dt className="text-xs text-slate-500">VIP Name</dt><dd className="text-sm font-bold sm:text-base">{ticket.vip_name || "—"}</dd></div>
          <div className="min-w-0 break-words"><dt className="text-xs text-slate-500">Purpose</dt><dd className="text-sm font-bold sm:text-base">{ticket.vip_purpose || "—"}</dd></div>
        </>}
      </dl>}
      {receipt && <p className="mt-6 text-center text-4xl font-black text-ink">{ticket.ticket_type === "vip" ? "VIP – Exempt" : `₱${ticket.amount_paid?.toFixed(2)}`}</p>}
      {receipt && <button onClick={() => window.print()} className="no-print mt-5 min-h-11 w-full rounded-xl bg-ink py-3 font-bold text-white">Print</button>}
    </section>
  );
}
