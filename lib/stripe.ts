import Stripe from "stripe";
import { env } from "@/lib/env";

export function hasStripeEnv() {
  return Boolean(env.stripeSecretKey);
}

export function createStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("Stripe nao esta configurado.");
  }

  return new Stripe(env.stripeSecretKey, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true
  });
}
