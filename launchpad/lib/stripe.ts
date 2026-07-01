import Stripe from 'stripe';

/**
 * Server-only Stripe client. Uses STRIPE_SECRET_KEY (test key first; the live
 * key is only ever set behind the Telegram approval card, pipeline P4).
 * Returns null when unconfigured so routes degrade to a clean 503 instead of
 * throwing at module load.
 */
let cached: Stripe | null = null;

export function stripeClient(): Stripe | null {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // No explicit apiVersion → use the SDK's pinned default (avoids version-literal drift).
  cached = new Stripe(key);
  return cached;
}

/** Absolute origin for Stripe success/cancel URLs. */
export function siteOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return `${proto}://${host}`;
}
