import Stripe from 'stripe';

/**
 * Server-only Stripe client. Reads STRIPE_SECRET_KEY from env and returns null
 * when unconfigured, so every payment route degrades to a clean "Pro coming
 * soon" 503 instead of throwing at module load. Live keys are only ever set by
 * the owner at publish time.
 */
let cached: Stripe | null = null;

export function stripeClient(): Stripe | null {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  cached = new Stripe(key);
  return cached;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface PricePlan {
  id: string;
  interval: 'month' | 'year';
}

/** Map a plan slug to the env-configured Stripe price id. */
export function priceIdFor(plan: string): string | null {
  if (plan === 'annual') return process.env.STRIPE_PRICE_ANNUAL || null;
  if (plan === 'monthly') return process.env.STRIPE_PRICE_MONTHLY || null;
  return null;
}

/** Reverse-map a Stripe price id back to our plan slug (for webhook writes). */
export function planForPriceId(priceId: string | null | undefined): 'monthly' | 'annual' | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ANNUAL) return 'annual';
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return 'monthly';
  return null;
}

/** Absolute origin for Stripe success/cancel URLs and share links. */
export function siteOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return `${proto}://${host}`;
}

/** Canonical site URL for server components (no request in scope). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://haulhq.app').replace(/\/+$/, '');
}
