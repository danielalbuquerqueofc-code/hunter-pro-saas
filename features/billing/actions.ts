"use server";

import { redirect } from "next/navigation";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { createAsaasCustomer, createAsaasSubscription, hasAsaasEnv } from "@/lib/asaas";
import { env } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function createBillingCheckoutAction(formData: FormData) {
  const { user, organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const planCode = String(formData.get("planCode") ?? "");
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("id,code,name,description,price_cents,stripe_price_id,billing_provider,asaas_billing_type,asaas_cycle,trial_days")
    .eq("code", planCode)
    .eq("is_active", true)
    .maybeSingle();

  if (!plan) {
    redirect(`/plano-assinatura?error=${encodeURIComponent("Plano nao encontrado ou inativo.")}`);
  }

  const provider = String(formData.get("provider") || env.billingProvider || plan.billing_provider || "stripe").toLowerCase();

  if (provider === "asaas") {
    if (!hasAsaasEnv()) {
      redirect(`/plano-assinatura?error=${encodeURIComponent("Asaas ainda nao esta configurado no ambiente de producao.")}`);
    }

    try {
      const existingCustomerId = organization.asaas_customer_id || "";
      const customer = existingCustomerId
        ? { id: existingCustomerId }
        : await createAsaasCustomer({
            name: organization.name,
            email: user.email,
            mobilePhone: organization.billing_phone || organization.phone || organization.whatsapp,
            cpfCnpj: organization.document,
            externalReference: organization.id
          });

      if (!existingCustomerId) {
        await supabase
          .from("organizations")
          .update({ asaas_customer_id: customer.id, billing_provider: "ASAAS" })
          .eq("id", organization.id);
      }

      const subscription = await createAsaasSubscription({
        customer: customer.id,
        billingType: plan.asaas_billing_type ?? "PIX",
        value: Number(plan.price_cents ?? 0) / 100,
        nextDueDate: toDateOnly(addDays(new Date(), Math.max(Number(plan.trial_days ?? 0), 1))),
        cycle: plan.asaas_cycle ?? "MONTHLY",
        description: plan.description || plan.name,
        externalReference: `${organization.id}:${plan.id}`
      });

      await supabase.from("subscriptions").insert({
        organization_id: organization.id,
        plan_id: plan.id,
        status: "TRIALING",
        billing_provider: "ASAAS",
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscription.id,
        asaas_invoice_url: subscription.invoiceUrl ?? null,
        asaas_bank_slip_url: subscription.bankSlipUrl ?? null,
        asaas_status: subscription.status ?? null,
        provider_payload: subscription
      });

      await supabase.from("audit_logs").insert({
        organization_id: organization.id,
        actor_id: user.id,
        user_id: user.id,
        action: "billing.asaas_subscription_created",
        entity_type: "subscription",
        metadata: {
          plan_code: plan.code,
          asaas_subscription_id: subscription.id
        }
      });

      const targetUrl = subscription.invoiceUrl || subscription.bankSlipUrl || "/plano-assinatura?success=asaas";
      redirect(targetUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel criar a assinatura Asaas.";
      redirect(`/plano-assinatura?error=${encodeURIComponent(message)}`);
    }
  }

  if (!plan?.stripe_price_id) {
    redirect(`/plano-assinatura?error=${encodeURIComponent("Este plano ainda nao possui preco Stripe configurado.")}`);
  }

  let stripe;
  try {
    stripe = createStripeClient();
  } catch {
    redirect(`/plano-assinatura?error=${encodeURIComponent("Stripe ainda nao esta configurado no ambiente de producao.")}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email ?? undefined,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${env.appUrl.replace(/\/$/, "")}/plano-assinatura?success=checkout`,
    cancel_url: `${env.appUrl.replace(/\/$/, "")}/plano-assinatura?error=${encodeURIComponent("Checkout cancelado.")}`,
    metadata: {
      organization_id: organization.id,
      plan_id: plan.id,
      plan_code: plan.code,
      actor_id: user.id
    },
    subscription_data: {
      metadata: {
        organization_id: organization.id,
        plan_id: plan.id,
        plan_code: plan.code
      }
    }
  });

  if (!session.url) {
    redirect(`/plano-assinatura?error=${encodeURIComponent("Nao foi possivel iniciar o checkout.")}`);
  }

  redirect(session.url);
}
