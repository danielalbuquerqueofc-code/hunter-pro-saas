import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { getDashboardData } from "@/features/dashboard/queries";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const dashboard = await getDashboardData(user.id);

  return (
    <AppShell
      email={user.email}
      organizationName={dashboard.organization?.name ?? "Minha empresa"}
      organizationSlug={dashboard.organization?.slug}
      role={dashboard.role}
    >
      {children}
    </AppShell>
  );
}
