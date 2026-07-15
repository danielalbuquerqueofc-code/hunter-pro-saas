export const ROLES = [
  "SUPER_ADMIN",
  "OWNER",
  "ADMIN",
  "MANAGER",
  "SALES",
  "ATTENDANT",
  "PROFESSIONAL",
  "FINANCIAL"
] as const;

export type Role = (typeof ROLES)[number];

export const OWNER_ROLES: Role[] = ["OWNER", "ADMIN"];
export const STAFF_ROLES: Role[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "SALES",
  "ATTENDANT",
  "PROFESSIONAL",
  "FINANCIAL"
];
