import Stripe from 'stripe';

/**
 * Server-only Stripe client. Reads STRIPE_SECRET_KEY from env and returns null
 * when unconfigured, so every payment route degrades to a clean "coming soon"
 * 503 instead of throwing at module load. Live keys are only ever set by the
 * owner at publish time.
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

/** Optional pre-created one-time Price id for the default button. */
export function playbookPriceId(): string | null {
  return process.env.STRIPE_PRICE_PLAYBOOK || null;
}

// Pay-what-you-want bounds (USD cents).
export const PWYW_FLOOR_CENTS = 900; // $9 floor
export const PWYW_DEFAULT_CENTS = 1900; // $19 launch price
export const PWYW_MAX_CENTS = 20000; // sane upper guard for the custom field

/** Clamp/validate a requested PWYW amount (in cents) to the allowed range. */
export function normalizeAmountCents(input: unknown): number {
  const n = typeof input === 'number' ? input : parseInt(String(input ?? ''), 10);
  if (!Number.isFinite(n)) return PWYW_DEFAULT_CENTS;
  const rounded = Math.round(n);
  if (rounded < PWYW_FLOOR_CENTS) return PWYW_FLOOR_CENTS;
  if (rounded > PWYW_MAX_CENTS) return PWYW_MAX_CENTS;
  return rounded;
}

/** Absolute origin for Stripe success/cancel URLs and magic links. */
export function siteOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return `${proto}://${host}`;
}

/** Canonical site URL for server components (no request in scope). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://therepplaybook.com').replace(/\/+$/, '');
}
