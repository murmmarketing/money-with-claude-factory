import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { serviceClient } from '../../../../lib/serverSupabase';
import { stripeClient } from '../../../../lib/stripe';
import { grantEntitlement, mintMagicToken } from '../../../../lib/entitlement';
import { sendPurchaseLink, emailConfigured } from '../../../../lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Signature-verified Stripe webhook — the ONLY writer of the entitlements table
 * for real purchases. On a completed one-time checkout it: records the order,
 * grants the entitlement (idempotent), and emails a magic link that logs the
 * buyer straight into their library. Idempotent via the repplaybook_events
 * ledger (unique event_id): replays are ignored. Raw body is required.
 */
export async function POST(req: Request) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'no signature' }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 500 });

  // Idempotency: record the event id first; if it already exists, skip.
  const { error: dupErr } = await sb
    .from('repplaybook_events')
    .insert({ event_id: event.id, type: event.type });
  if (dupErr) {
    if ((dupErr as any).code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: 'db' }, { status: 500 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode === 'payment' && s.payment_status === 'paid') {
        const email = (
          s.metadata?.email ||
          s.client_reference_id ||
          s.customer_details?.email ||
          (typeof s.customer_email === 'string' ? s.customer_email : '') ||
          ''
        ).toLowerCase();
        if (email) {
          await sb.from('repplaybook_orders').insert({
            email,
            stripe_session_id: s.id,
            amount_cents: s.amount_total ?? null,
            currency: s.currency ?? 'usd',
            status: 'paid',
          });
          await grantEntitlement(email, 'stripe');

          // Email a magic link into the library.
          const origin = originFromEnvOrReq(req);
          const token = mintMagicToken(email);
          const magicUrl = `${origin}/api/auth/magic?token=${encodeURIComponent(token)}`;
          if (emailConfigured()) {
            await sendPurchaseLink(email, magicUrl);
          }
        }
      }
      return NextResponse.json({ received: true });
    }
    // Acknowledge everything else so Stripe stops retrying.
    return NextResponse.json({ received: true, ignored: event.type });
  } catch {
    return NextResponse.json({ error: 'handler' }, { status: 500 });
  }
}

function originFromEnvOrReq(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return `${proto}://${host}`;
}
