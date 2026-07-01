import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Returns a configured Stripe client, or null when no secret key is present.
 * Callers must handle the null case so the app builds and runs with zero env.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Stripe(key, { apiVersion: "2024-06-20" });
  return cached;
}
