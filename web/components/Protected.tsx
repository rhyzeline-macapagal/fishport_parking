"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { AppShell } from "./AppShell";

export function Protected({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (roles && !roles.includes(user.role)))) router.replace("/login");
  }, [loading, roles, router, user]);

  if (loading || !user || (roles && !roles.includes(user.role))) return <div className="p-8 text-center">Loading…</div>;
  return <AppShell>{children}</AppShell>;
}
