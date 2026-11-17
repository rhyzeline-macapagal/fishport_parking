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

  return (
    <div className="min-h-screen">
      <header className="no-print bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/dashboard" className="text-xl font-black">ParkFlow</Link>
          <nav className="flex flex-wrap gap-2">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-bold ${pathname === href ? "bg-accent text-ink" : "bg-white/10"}`}>{label}</Link>
            ))}
            <button onClick={() => { logout(); router.push("/login"); }} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-bold">Log out</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
