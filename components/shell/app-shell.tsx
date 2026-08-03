import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus, ShieldAlert } from "lucide-react";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { canSeeNavItem, shellNavItems } from "@/components/shell/navigation";
import { Topbar } from "@/components/shell/topbar";
import { endImpersonationAction } from "@/features/admin/actions";
import type { Role } from "@/lib/constants/roles";

type AppShellProps = {
  children: ReactNode;
  email?: string | null;
  userName?: string | null;
  organizationName: string;
  organizationSlug?: string | null;
  role?: Role | null;
  isSuperAdmin?: boolean;
  impersonation?: {
    sessionId: string;
    organizationId: string;
    reason: string;
    expiresAt: string;
  } | null;
};

export function AppShell({
  children,
  email,
  userName,
  organizationName,
  organizationSlug,
  role,
  isSuperAdmin = false,
  impersonation = null
}: AppShellProps) {
  const visibleNav = shellNavItems.filter((item) => canSeeNavItem(role, item));
  const publicHref = organizationSlug ? `/p/${organizationSlug}` : "/vitrine";

  return (
    <div className="min-h-screen bg-[var(--hp-bg)] text-[var(--hp-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--hp-line)] bg-[var(--hp-surface)] text-[var(--hp-text)] shadow-sm backdrop-blur-xl">
        {impersonation ? (
          <div className="flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-black">Modo suporte ativo: voce esta visualizando {organizationName}.</p>
                <p className="text-xs font-semibold text-amber-800">Motivo: {impersonation.reason}</p>
              </div>
            </div>
            <form action={endImpersonationAction}>
              <input type="hidden" name="sessionId" value={impersonation.sessionId} />
              <input type="hidden" name="organizationId" value={impersonation.organizationId} />
              <button className="rounded-full bg-amber-950 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-900">
                Encerrar suporte
              </button>
            </form>
          </div>
        ) : null}
        <Topbar email={email} userName={userName} organizationName={organizationName} publicHref={publicHref} isSuperAdmin={isSuperAdmin} />
        <AppSidebar items={visibleNav} />
      </header>

      <main className="min-w-0 pb-28 lg:pb-8">{children}</main>

      <MobileNavigation
        items={visibleNav.map((item) => ({ href: item.href, label: item.label }))}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="fixed bottom-24 right-5 z-40 lg:bottom-8">
        <Link
          href="/agenda"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hp-accent)] text-[#04100a] shadow-2xl shadow-emerald-500/30 transition hover:scale-105"
          aria-label="Novo agendamento"
        >
          <CalendarPlus className="h-7 w-7" />
        </Link>
      </div>

      <div className="sr-only">Usuario logado: {email}</div>
    </div>
  );
}
