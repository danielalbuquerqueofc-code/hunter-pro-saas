import { OWNER_ROLES, type Role } from "@/lib/constants/roles";

export function canManageOrganization(role?: Role | null) {
  return Boolean(role && OWNER_ROLES.includes(role));
}

export function canViewDashboard(role?: Role | null) {
  return Boolean(role);
}
