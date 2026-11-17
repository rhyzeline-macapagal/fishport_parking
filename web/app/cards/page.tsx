"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, apiFetch } from "../../lib/api";
import { Protected } from "../../components/Protected";

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [count, setCount] = useState(100);
  const [prefix, setPrefix] = useState("PF-");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setCards((await apiFetch<{ cards: Card[] }>("/cards")).cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load cards.");
    }
  }
  useEffect(() => { load(); }, []);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    try {
      const result = await apiFetch<{ cards: Card[] }>("/cards", { method: "POST", body: JSON.stringify({ count, prefix }) });
      await load();
      setMessage(`${result.cards.length} cards generated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate cards.");
    }
  }

  async function changeStatus(card: Card) {
    const status = card.status === "disabled" ? "available" : "disabled";
    try {
      const result = await apiFetch<{ card: Card }>(`/cards/${encodeURIComponent(card.card_code)}`, { method: "PUT", body: JSON.stringify({ status }) });
      setCards(cards.map(item => item.id === card.id ? result.card : item));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update card.");
    }
  }

  async function printSheet() {
    const printable = cards.filter(card => card.status !== "lost");
    const html = await Promise.all(printable.map(async card => {
      const qr = await QRCode.toDataURL(card.card_code, { margin: 1, width: 140 });
      return `<article><img src="${qr}" alt="${card.card_code}"><strong>${card.card_code}</strong></article>`;
    }));
    const windowRef = window.open("", "_blank");
    if (!windowRef) return;
    windowRef.document.write(`<title>ParkFlow QR cards</title><style>body{font-family:Arial;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:20px}article{border:1px dashed #555;padding:10px;text-align:center;break-inside:avoid}img{width:140px;height:140px;display:block;margin:auto}strong{display:block;font:700 18px monospace;margin-top:8px}</style>${html.join("")}`);
    windowRef.document.close(); windowRef.focus(); windowRef.print();
  }

  return <Protected roles={["admin"]}><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-black">Cards</h1><button onClick={printSheet} className="rounded-xl bg-accent px-4 py-3 font-bold">Print QR sheet</button></div>{message && <p className="mt-4 rounded-lg bg-green-100 p-3 text-green-700">{message}</p>}{error && <p className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}<form onSubmit={generate} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-3"><label className="font-bold">Batch size<input type="number" min="1" max="1000" value={count} onChange={e => setCount(Number(e.target.value))} className="mt-1 w-full rounded-xl border p-3" /></label><label className="font-bold">Prefix<input value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border p-3 font-mono" /></label><button className="self-end rounded-xl bg-ink py-3 font-bold text-white">Generate cards</button></form><section className="mt-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b"><th className="p-2">Card code</th><th className="p-2">Status</th><th className="p-2">Created</th><th className="p-2">Action</th></tr></thead><tbody>{cards.map(card => <tr key={card.id} className="border-b"><td className="p-2 font-mono font-bold">{card.card_code}</td><td className="p-2 uppercase">{card.status}</td><td className="p-2">{card.created_at || "—"}</td><td className="p-2">{(card.status === "available" || card.status === "disabled") && <button onClick={() => changeStatus(card)} className="rounded-lg bg-slate-200 px-3 py-2 font-bold">{card.status === "disabled" ? "Enable" : "Disable"}</button>}</td></tr>)}</tbody></table></section></Protected>;
}
