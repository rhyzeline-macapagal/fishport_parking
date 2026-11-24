"use client";

import { FormEvent, useCallback, useState } from "react";
import { apiFetch, Ticket, VEHICLE_TYPES, VehicleTypeCode } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { TicketCard } from "../../components/TicketCard";
import { QrScanner } from "../../components/QrScanner";

type CardLookup = { code: string; card_type: "regular" | "vip"; status: string };

export default function EntrancePage() {
  const [cardCode, setCardCode] = useState("");
  const [card, setCard] = useState<CardLookup | null>(null);
  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleTypeCode | "">("");
  const [vipName, setVipName] = useState("");
  const [vipPurpose, setVipPurpose] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const lookup = useCallback(async (value: string) => {
    const clean = value.trim().toUpperCase();
    if (!clean || loading) return;
    setCardCode(clean);
    setError("");
    setLoading(true);
    try {
      const result = await apiFetch<CardLookup>(`/cards/lookup?code=${encodeURIComponent(clean)}`);
      setCard(result);
      setVehicleType(result.card_type === "regular" ? "4W" : "");
      if (result.status !== "available") throw new Error(`Card is ${result.status} and cannot be issued.`);
    } catch (e) {
      setCard(null);
      setError(e instanceof Error ? e.message : "Could not look up card.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const scan = useCallback((value: string) => {
    void lookup(value);
  }, [lookup]);

  function resetCard() {
    setCard(null);
    setCardCode("");
    setPlate("");
    setVipName("");
    setVipPurpose("");
    setVehicleType("");
    setError("");
    setScannerKey(key => key + 1);
  }

  function startAnotherTransaction() {
    setTicket(null);
    resetCard();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!card || loading) return;
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { card_code: cardCode, plate_no: plate };
      if (card.card_type === "vip") {
        body.vip_name = vipName;
        body.vip_purpose = vipPurpose;
        if (vehicleType) body.vehicle_type = vehicleType;
      } else {
        body.vehicle_type = vehicleType;
      }
      const result = await apiFetch<{ ticket: Ticket }>("/tickets/entry", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setTicket(result.ticket);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign card.");
    } finally {
      setLoading(false);
    }
  }

  return <Protected roles={["guard_entrance", "admin"]}>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
      {!ticket && <form onSubmit={submit} className="app-surface p-4 sm:p-7">
        <div className="mb-3"><p className="text-xs font-black uppercase tracking-widest text-accent">Entrance lane</p><h1 className="page-title mt-1">Vehicle entry</h1></div>
        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {!card && <><QrScanner key={scannerKey} onScan={scan} /><p className="mt-3 text-sm font-semibold text-slate-500">Camera active · Position the card QR inside the frame</p></>}
        {card && <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 sm:px-4 sm:text-sm">
          <span>{card.card_type === "vip" ? "VIP card recognized" : "Regular card recognized"} · Camera paused</span>
          <button type="button" onClick={resetCard} className="min-h-11 shrink-0 rounded-lg bg-white px-2 text-xs font-black sm:px-3">Change</button>
        </div>}
        {!card && <><label className="field-label mt-4">Card code
          <input value={cardCode} onChange={e => setCardCode(e.target.value.toUpperCase())} onBlur={() => !card && cardCode && lookup(cardCode)} autoCapitalize="characters" autoComplete="off" className="input-control font-mono text-xl uppercase" placeholder="PF-0001" required />
        </label><button type="button" onClick={() => lookup(cardCode)} disabled={loading || !cardCode} className="guard-action mt-3 bg-ink text-white">Look up card</button></>}
        {card && <>
          {card.card_type === "vip" && <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="field-label">Name<input value={vipName} onChange={e => setVipName(e.target.value)} maxLength={120} autoComplete="off" className="input-control text-base" required /></label>
            <label className="field-label">Purpose<input value={vipPurpose} onChange={e => setVipPurpose(e.target.value)} maxLength={255} className="input-control text-base" required /></label>
          </div>}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <label className="field-label min-w-0">Card code<input value={cardCode} readOnly autoComplete="off" className="input-control min-w-0 px-2 font-mono text-base uppercase" /></label>
            <label className="field-label min-w-0">Plate number<input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} maxLength={20} autoCapitalize="characters" autoComplete="off" className="input-control min-w-0 px-2 text-base uppercase" required /></label>
          </div>
          <fieldset className="mt-3"><legend className="field-label">Vehicle type {card.card_type === "vip" && "(optional)"}</legend>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
              {VEHICLE_TYPES.map(type => <button type="button" key={type.code} onClick={() => setVehicleType(type.code)} className={`min-h-11 rounded-xl border px-3 py-3 text-sm font-black ${vehicleType === type.code ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>{type.label}</button>)}
              {card.card_type === "vip" && <button type="button" onClick={() => setVehicleType("")} className={`min-h-11 rounded-xl border px-3 py-3 text-sm font-black ${vehicleType === "" ? "border-slate-500 bg-slate-100 text-slate-700" : "border-slate-200 bg-white text-slate-700"}`}>No vehicle type</button>}
            </div>
          </fieldset>
          <button disabled={loading} className="guard-action mt-4 bg-ink text-lg text-white">{loading ? "Assigning…" : "Confirm entry"}</button>
        </>}
      </form>}
      {ticket && <div className="mx-auto w-full max-w-md space-y-4"><TicketCard ticket={ticket} /><button type="button" onClick={startAnotherTransaction} className="guard-action bg-blue-600 text-lg text-white">＋ Scan another QR</button></div>}
    </div>
  </Protected>;
}
