"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const links = user?.role === "admin"
    ? [["/dashboard", "Dashboard"], ["/transactions", "Transactions"], ["/cards", "Cards"], ["/settings", "Settings"]]
    : user?.role === "guard_entrance"
      ? [["/entrance", "Entrance"]]
      : [["/exit", "Exit"], ["/lost-ticket", "Lost ticket"]];

  const isAdmin = user?.role === "admin";
  const pageLabel = isAdmin
    ? links.find(([href]) => pathname === href)?.[1] || "Dashboard"
    : "";
  return (
    <div className={`min-h-screen ${isAdmin ? "lg:flex" : ""}`}>
      {isAdmin && <aside className="admin-sidebar no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col p-5 text-white lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/20 pb-5">
          <Image src="/images/mercedes_logo.jpg" alt="Mercedes logo" width={56} height={56} className="h-14 w-14 shrink-0 rounded-full object-cover" />
          <span className="text-lg font-black leading-tight">Mercedes<br />Municipal Fishport<br /><span className="text-sm font-medium text-blue-200">Parking System</span></span>
        </Link>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-blue-200">Main menu</p>
        <nav className="mt-8 flex-1 space-y-2">
          {links.map(([href, label]) => <Link key={href} href={href} className={`block rounded-xl border px-4 py-3 text-sm font-bold transition ${pathname === href ? "border-white/20 bg-white/20 text-white shadow-lg backdrop-blur-lg" : "border-transparent text-blue-100 hover:border-white/10 hover:bg-white/10"}`}>{label}</Link>)}
        </nav>
        <p className="mb-2 border-t border-white/20 pt-4 text-xs font-semibold text-white/90">System Administrator</p>
        <button onClick={() => setLogoutOpen(true)} className="w-full text-left text-sm font-bold text-blue-100">↪ Log out</button>
      </aside>}
      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 lg:px-8">
            <div className="min-w-0">
              {isAdmin && <div className="flex min-w-0 items-center gap-2">
                <Image src="/images/mercedes_logo.jpg" alt="Mercedes logo" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover lg:hidden" />
                <span className="truncate text-sm font-black text-ink sm:text-base"><span className="lg:hidden">{pageLabel}</span><span className="hidden lg:inline">Parking Dashboard</span></span>
              </div>}
              {!isAdmin && <><Link href="/dashboard" className="block truncate text-base font-black text-ink sm:text-lg">Fishport Parking</Link><p className="hidden text-xs font-semibold text-slate-500 sm:block">{user?.role === "guard_entrance" ? "Entrance operations" : "Exit operations"}</p></>}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && <button onClick={() => setLogoutOpen(true)} className="min-h-10 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 lg:hidden">Log out</button>}
              {!isAdmin && <><span className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 sm:inline">{user?.name}</span><button onClick={() => setLogoutOpen(true)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Log out</button></>}
            </div>
          </div>
          {!isAdmin && <nav className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:flex lg:px-8">
            {links.map(([href, label]) => <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold ${pathname === href ? "bg-accent text-ink" : "bg-slate-100 text-slate-600"}`}>{label}</Link>)}
          </nav>}
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:py-7 sm:pb-7 lg:px-8 lg:pb-7">{children}</main>
        {isAdmin && <nav className="no-print safe-bottom fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-1 pt-1 shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur lg:hidden">
          {links.map(([href, label]) => <Link key={href} href={href} className={`min-h-14 rounded-xl px-1 py-2 text-center text-[10px] font-black leading-tight ${pathname === href ? "bg-accent text-ink" : "text-slate-500"}`}>
            {label}
          </Link>)}
        </nav>}
        {!isAdmin && <nav className="no-print safe-bottom fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-slate-200 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur sm:hidden">
          {links.map(([href, label]) => <Link key={href} href={href} className={`rounded-xl px-2 py-3 text-center text-xs font-black ${pathname === href ? "bg-accent text-ink" : "text-slate-500"}`}>{label}</Link>)}
        </nav>}
      </div>
      {logoutOpen && <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/75 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">↪</div>
          <h2 id="logout-title" className="text-xl font-black text-ink">Are you sure you want to log out?</h2>
          <p className="mt-2 text-sm text-slate-500">You will need to sign in again to access the parking system.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => setLogoutOpen(false)} className="min-h-12 rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700">Cancel</button>
            <button onClick={() => { logout(); setLogoutOpen(false); router.push("/login"); }} className="min-h-12 rounded-xl bg-red-600 px-4 py-3 font-bold text-white">Log out</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
