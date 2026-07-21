import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { getDashboardData } from "@/features/dashboard/queries";
import { redirectIfOrganizationCannotUseApp } from "@/features/organizations/access-control";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();
  const dashboard = await getDashboardData(user.id);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  redirectIfOrganizationCannotUseApp(dashboard.organization);

  return (
    <AppShell
      email={user.email}
      userName={profile?.full_name ?? user.user_metadata?.full_name ?? null}
      organizationName={dashboard.organization?.name ?? "Minha empresa"}
      organizationSlug={dashboard.organization?.slug}
      role={dashboard.role}
      isSuperAdmin={Boolean(profile?.is_super_admin)}
    >
      {children}
    </AppShell>
  );
}
