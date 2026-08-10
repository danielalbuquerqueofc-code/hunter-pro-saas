import { env } from "@/lib/env";

type AsaasEnvironment = "sandbox" | "production";

type AsaasRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
};

export type AsaasCustomerInput = {
  name: string;
  email?: string | null;
  mobilePhone?: string | null;
  cpfCnpj?: string | null;
  externalReference: string;
};

export type AsaasSubscriptionInput = {
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  externalReference: string;
};

export type BillingProvider = {
  createCustomer(input: AsaasCustomerInput): Promise<{ id: string }>;
  updateCustomer(customerId: string, input: Partial<AsaasCustomerInput>): Promise<{ id: string }>;
  createSubscription(input: AsaasSubscriptionInput): Promise<{ id: string; customer: string; status?: string; invoiceUrl?: string; bankSlipUrl?: string }>;
  updateSubscription(subscriptionId: string, input: Partial<AsaasSubscriptionInput>): Promise<{ id: string; status?: string }>;
  cancelSubscription(subscriptionId: string): Promise<{ id: string; status?: string }>;
  reactivateSubscription(subscriptionId: string): Promise<{ id: string; status?: string }>;
  getSubscription(subscriptionId: string): Promise<{ id: string; status?: string }>;
  listPayments(subscriptionId: string): Promise<{ data?: unknown[] }>;
  getPayment(paymentId: string): Promise<{ id: string; status?: string; invoiceUrl?: string; bankSlipUrl?: string }>;
  createPaymentLink(input: Record<string, unknown>): Promise<{ id: string; url?: string }>;
};

export function getAsaasEnvironment(): AsaasEnvironment {
  return env.asaasEnvironment === "production" ? "production" : "sandbox";
}

export function hasAsaasEnv() {
  return Boolean(env.asaasApiKey);
}

export function getAsaasBaseUrl() {
  if (process.env.ASAAS_BASE_URL) return process.env.ASAAS_BASE_URL.replace(/\/$/, "");
  return getAsaasEnvironment() === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

function asaasHeaders() {
  if (!env.asaasApiKey) {
    throw new Error("ASAAS_API_KEY nao configurada.");
  }

  return {
    "Content-Type": "application/json",
    "User-Agent": `HunterPro/1.0 (${getAsaasEnvironment()})`,
    access_token: env.asaasApiKey
  };
}

export async function asaasRequest<T>(path: string, options: AsaasRequestOptions = {}) {
  const response = await fetch(`${getAsaasBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: asaasHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errors = Array.isArray(payload.errors)
      ? payload.errors.map((item: { description?: string }) => item.description).filter(Boolean).join(" ")
      : "";
    throw new Error(errors || `Asaas retornou HTTP ${response.status}.`);
  }

  return payload as T;
}

export async function createAsaasCustomer(input: AsaasCustomerInput) {
  return asaasRequest<{ id: string }>("/customers", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email || undefined,
      mobilePhone: input.mobilePhone || undefined,
      cpfCnpj: input.cpfCnpj || undefined,
      externalReference: input.externalReference
    }
  });
}

export async function updateAsaasCustomer(customerId: string, input: Partial<AsaasCustomerInput>) {
  return asaasRequest<{ id: string }>(`/customers/${customerId}`, {
    method: "PUT",
    body: {
      name: input.name,
      email: input.email || undefined,
      mobilePhone: input.mobilePhone || undefined,
      cpfCnpj: input.cpfCnpj || undefined,
      externalReference: input.externalReference
    }
  });
}

export async function createAsaasSubscription(input: AsaasSubscriptionInput) {
  return asaasRequest<{
    id: string;
    customer: string;
    status?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
  }>("/subscriptions", {
    method: "POST",
    body: input
  });
}

export async function updateAsaasSubscription(subscriptionId: string, input: Partial<AsaasSubscriptionInput>) {
  return asaasRequest<{ id: string; status?: string }>(`/subscriptions/${subscriptionId}`, {
    method: "PUT",
    body: input
  });
}

export async function cancelAsaasSubscription(subscriptionId: string) {
  return asaasRequest<{ id: string; status?: string }>(`/subscriptions/${subscriptionId}`, {
    method: "DELETE"
  });
}

export async function reactivateAsaasSubscription(subscriptionId: string) {
  return asaasRequest<{ id: string; status?: string }>(`/subscriptions/${subscriptionId}/restore`, {
    method: "POST"
  });
}

export async function getAsaasSubscription(subscriptionId: string) {
  return asaasRequest<{ id: string; status?: string }>(`/subscriptions/${subscriptionId}`);
}

export async function listAsaasPayments(subscriptionId: string) {
  return asaasRequest<{ data?: unknown[] }>(`/payments?subscription=${encodeURIComponent(subscriptionId)}`);
}

export async function getAsaasPayment(paymentId: string) {
  return asaasRequest<{ id: string; status?: string; invoiceUrl?: string; bankSlipUrl?: string }>(`/payments/${paymentId}`);
}

export async function createAsaasPaymentLink(input: Record<string, unknown>) {
  return asaasRequest<{ id: string; url?: string }>("/paymentLinks", {
    method: "POST",
    body: input
  });
}

export const asaasBillingProvider: BillingProvider = {
  createCustomer: createAsaasCustomer,
  updateCustomer: updateAsaasCustomer,
  createSubscription: createAsaasSubscription,
  updateSubscription: updateAsaasSubscription,
  cancelSubscription: cancelAsaasSubscription,
  reactivateSubscription: reactivateAsaasSubscription,
  getSubscription: getAsaasSubscription,
  listPayments: listAsaasPayments,
  getPayment: getAsaasPayment,
  createPaymentLink: createAsaasPaymentLink
};
