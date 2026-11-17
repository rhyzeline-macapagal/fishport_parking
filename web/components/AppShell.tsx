"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const links = user?.role === "admin"
    ? [["/dashboard", "Dashboard"], ["/transactions", "Transactions"], ["/cards", "Cards"], ["/settings", "Settings"]]
    : user?.role === "guard_entrance"
      ? [["/entrance", "Entrance"]]
      : [["/exit", "Exit"], ["/lost-ticket", "Lost ticket"]];

  const isAdmin = user?.role === "admin";
  return (
    <div className={`min-h-screen ${isAdmin ? "lg:flex" : ""}`}>
      {isAdmin && <aside className="no-print hidden w-72 shrink-0 border-r border-slate-200 bg-white p-6 lg:block">
        <Link href="/dashboard" className="block text-lg font-black leading-tight text-ink">Mercedes Municipal<br />Fishport Parking</Link>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">Administration</p>
        <nav className="mt-8 space-y-2">
          {links.map(([href, label]) => <Link key={href} href={href} className={`block rounded-xl px-4 py-3 text-sm font-bold transition ${pathname === href ? "bg-accent text-ink" : "text-slate-600 hover:bg-slate-100"}`}>{label}</Link>)}
        </nav>
        <button onClick={() => { logout(); router.push("/login"); }} className="mt-10 w-full rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-700">Log out</button>
      </aside>}
      <div className="min-w-0 flex-1">
        <header className="no-print border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 lg:px-8">
            <div className="min-w-0">
              <Link href="/dashboard" className="block truncate text-base font-black text-ink sm:text-lg">{isAdmin ? "Mercedes Municipal Fishport Parking System" : "Fishport Parking"}</Link>
              <p className="hidden text-xs font-semibold text-slate-500 sm:block">{isAdmin ? "Operations dashboard" : user?.role === "guard_entrance" ? "Entrance operations" : "Exit operations"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 sm:inline">{user?.name}</span>
              {!isAdmin && <button onClick={() => { logout(); router.push("/login"); }} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Log out</button>}
            </div>
          </div>
          {!isAdmin && <nav className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:flex lg:px-8">
            {links.map(([href, label]) => <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold ${pathname === href ? "bg-accent text-ink" : "bg-slate-100 text-slate-600"}`}>{label}</Link>)}
          </nav>}
        </header>
        <main className={`mx-auto max-w-7xl px-4 py-5 sm:py-7 lg:px-8 ${!isAdmin ? "pb-24 sm:pb-7" : ""}`}>{children}</main>
        {!isAdmin && <nav className="no-print safe-bottom fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-slate-200 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur sm:hidden">
          {links.map(([href, label]) => <Link key={href} href={href} className={`rounded-xl px-2 py-3 text-center text-xs font-black ${pathname === href ? "bg-accent text-ink" : "text-slate-500"}`}>{label}</Link>)}
        </nav>}
      </div>
    </div>
  );
}
