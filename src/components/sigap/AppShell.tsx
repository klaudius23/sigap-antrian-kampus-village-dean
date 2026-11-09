import { Link, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { USE_MOCK } from "@/lib/api";

export interface NavItem { to: string; label: string; icon: ReactNode }

export function RoleLayout({ role, nav, wide }: { role: Role; nav: NavItem[]; wide?: boolean }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (!ready) return <div className="mx-auto max-w-5xl space-y-4 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    logout();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className={`mx-auto flex h-16 items-center gap-4 px-4 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
          <Link to={homeFor(role)} className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>
            <span className="leading-tight">SIGAP-VD<span className="block text-[11px] font-medium text-muted-foreground">Universitas Klabat</span></span>
          </Link>
          <nav className="ml-4 hidden gap-1 md:flex" aria-label="Navigasi utama">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-secondary text-primary" }}>
                {n.icon}{n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {USE_MOCK && <span className="hidden rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning-foreground sm:inline">Mode demo</span>}
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Keluar"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Keluar</span></Button>
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-6 ${wide ? "max-w-7xl" : "max-w-5xl"}`}><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-card md:hidden" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }} aria-label="Navigasi bawah">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}>
            {n.icon}{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
