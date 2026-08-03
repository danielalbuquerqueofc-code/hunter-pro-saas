import type { OrganizationAccessStatus } from "@/features/organizations/access-control";

export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export function mapSubscriptionToAccessStatus(status: SubscriptionStatus): OrganizationAccessStatus {
  if (status === "ACTIVE" || status === "TRIALING") return "active";
  if (status === "PAST_DUE") return "suspended";
  return "cancelled";
}

export function normalizeStripeSubscriptionStatus(status?: string | null): SubscriptionStatus {
  if (status === "active") return "ACTIVE";
  if (status === "trialing") return "TRIALING";
  if (status === "past_due" || status === "unpaid") return "PAST_DUE";
  if (status === "canceled" || status === "incomplete_expired") return "CANCELED";
  return "TRIALING";
}
