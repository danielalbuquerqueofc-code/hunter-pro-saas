import { redirect } from "next/navigation";
import { getCurrentOrganization } from "@/features/organizations/current";
import { requireUser } from "@/lib/auth";
import type { Role } from "@/lib/constants/roles";

type OrganizationAccess = {
  user: Awaited<ReturnType<typeof requireUser>>;
  organization: NonNullable<Awaited<ReturnType<typeof getCurrentOrganization>>["organization"]>;
  role: Role;
};

export async function requireOrganizationAccess(allowedRoles?: Role[]): Promise<OrganizationAccess> {
  const user = await requireUser();
  const current = await getCurrentOrganization(user.id);
  const role = current.role as Role | null;

  if (!current.organization || !role) {
    redirect("/configuracoes");
  }

  if (role !== "SUPER_ADMIN" && allowedRoles?.length && !allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  return {
    user,
    organization: current.organization,
    role
  };
}
