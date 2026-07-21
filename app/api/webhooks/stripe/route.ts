import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function subscriptionStatus(status?: string | null) {
  if (status === "active") return "ACTIVE";
  if (status === "trialing") return "TRIALING";
  if (status === "past_due" || status === "unpaid") return "PAST_DUE";
  if (status === "canceled" || status === "incomplete_expired") return "CANCELED";
  return "TRIALING";
}

export async function POST(request: Request) {
  if (!env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Webhook Stripe nao configurado." }, { status: 503 });
  }

  const stripe = createStripeClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Assinatura invalida." }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const organizationId = session.metadata?.organization_id;
    const planId = session.metadata?.plan_id;
    const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

    if (organizationId && planId) {
      await supabase
        .from("organizations")
        .update({
          plan_id: planId,
          access_status: "active",
          subscription_status: "ACTIVE",
          stripe_customer_id: stripeCustomerId ?? null
        })
        .eq("id", organizationId);

      await supabase.from("subscriptions").insert({
        organization_id: organizationId,
        plan_id: planId,
        status: "ACTIVE",
        stripe_subscription_id: stripeSubscriptionId ?? null,
        stripe_customer_id: stripeCustomerId ?? null,
        stripe_checkout_session_id: session.id,
        current_period_start: new Date().toISOString(),
        provider_payload: { event_id: event.id, type: event.type }
      });

      await supabase.from("audit_logs").insert({
        organization_id: organizationId,
        action: "billing.checkout_completed",
        entity_type: "subscription",
        metadata: {
          stripe_session_id: session.id,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId
        }
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const organizationId = subscription.metadata?.organization_id;
    const planId = subscription.metadata?.plan_id;
    const status = subscriptionStatus(subscription.status);

    if (organizationId && planId) {
      await supabase
        .from("organizations")
        .update({
          plan_id: planId,
          subscription_status: status,
          access_status: status === "ACTIVE" || status === "TRIALING" ? "active" : status === "PAST_DUE" ? "overdue" : "cancelled",
          stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
        })
        .eq("id", organizationId);

      await supabase
        .from("subscriptions")
        .update({
          status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          provider_payload: { event_id: event.id, type: event.type }
        })
        .eq("stripe_subscription_id", subscription.id);
    }
  }

  return NextResponse.json({ received: true });
}
