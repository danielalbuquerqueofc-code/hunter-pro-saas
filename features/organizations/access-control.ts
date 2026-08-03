import { redirect } from "next/navigation";

export const ORGANIZATION_ACCESS_STATUSES = [
  "trial",
  "active",
  "suspended",
  "trial_expired",
  "blocked",
  "cancelled"
] as const;

export type OrganizationAccessStatus = (typeof ORGANIZATION_ACCESS_STATUSES)[number];

export type OrganizationAccessFields = {
  id: string;
  name?: string | null;
  status?: string | null;
  subscription_status?: string | null;
  access_status?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  activated_at?: string | null;
  blocked_at?: string | null;
  blocked_reason?: string | null;
};

export type OrganizationAccessState = {
  status: OrganizationAccessStatus;
  allowed: boolean;
  label: string;
  reason: string;
  trialEndsAt: string | null;
  daysRemaining: number | null;
};

const BLOCKING_STATUSES = new Set<OrganizationAccessStatus>([
  "suspended",
  "trial_expired",
  "blocked",
  "cancelled"
]);

function normalizeStatus(value: string | null | undefined): OrganizationAccessStatus {
  if (value && ORGANIZATION_ACCESS_STATUSES.includes(value as OrganizationAccessStatus)) {
    return value as OrganizationAccessStatus;
  }

  return "active";
}

function getDaysRemaining(trialEndsAt: string | null | undefined, now = new Date()) {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function getOrganizationAccessState(
  organization: OrganizationAccessFields,
  now = new Date()
): OrganizationAccessState {
  let status = normalizeStatus(organization.access_status);

  if (organization.status === "SUSPENDED") status = "suspended";
  if (organization.status === "CANCELED") status = "cancelled";
  if (organization.subscription_status === "PAST_DUE") status = "suspended";
  if (organization.subscription_status === "CANCELED") status = "cancelled";

  const trialEndsAt = organization.trial_ends_at ?? null;
  if (status === "trial" && trialEndsAt && new Date(trialEndsAt) <= now) {
    status = "trial_expired";
  }

  const daysRemaining = getDaysRemaining(trialEndsAt, now);

  const labels: Record<OrganizationAccessStatus, string> = {
    trial: `Teste gratis${daysRemaining !== null ? `: ${daysRemaining} dia(s) restante(s)` : ""}`,
    active: "Ativa",
    suspended: "Suspensa",
    trial_expired: "Teste gratis encerrado",
    blocked: "Bloqueada",
    cancelled: "Cancelada"
  };

  const reasons: Record<OrganizationAccessStatus, string> = {
    trial: "A empresa esta no periodo gratis de 5 dias.",
    active: "A empresa esta liberada para uso.",
    suspended: "O acesso foi suspenso pela administracao.",
    trial_expired: "O periodo gratis de 5 dias terminou.",
    blocked: organization.blocked_reason || "O acesso foi bloqueado pela administracao.",
    cancelled: "A assinatura ou conta foi cancelada."
  };

  return {
    status,
    allowed: !BLOCKING_STATUSES.has(status),
    label: labels[status],
    reason: reasons[status],
    trialEndsAt,
    daysRemaining
  };
}

export function redirectIfOrganizationCannotUseApp(organization: OrganizationAccessFields | null) {
  if (!organization) return;

  const access = getOrganizationAccessState(organization);
  if (!access.allowed) {
    redirect(`/acesso-bloqueado?status=${encodeURIComponent(access.status)}`);
  }
}
