import Stripe from 'stripe';

// Lazily construct a Stripe client only when a secret key is present.
// This keeps the app fully buildable and runnable with zero env set:
// callers check `isStripeEnabled()` and degrade to a waitlist state.

let cached: Stripe | null = null;

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!cached) {
    cached = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return cached;
}

export function proPriceId(interval: 'monthly' | 'yearly'): string | undefined {
  if (interval === 'yearly') {
    return process.env.STRIPE_PRO_PRICE_ID_YEARLY || process.env.STRIPE_PRO_PRICE_ID;
  }
  return process.env.STRIPE_PRO_PRICE_ID;
}
