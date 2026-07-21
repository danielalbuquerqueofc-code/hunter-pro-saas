"use server";

import { redirect } from "next/navigation";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { env } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function createBillingCheckoutAction(formData: FormData) {
  const { user, organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const planCode = String(formData.get("planCode") ?? "");
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("id,code,name,stripe_price_id")
    .eq("code", planCode)
    .eq("is_active", true)
    .maybeSingle();

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
