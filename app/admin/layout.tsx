import { AdminShell } from "@/components/admin/admin-shell";
import { requireSuperAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  return <AdminShell>{children}</AdminShell>;
}
