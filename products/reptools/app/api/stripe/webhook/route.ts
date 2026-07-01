import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { serviceClient } from '../../../../lib/serverSupabase';
import { stripeClient, planForPriceId } from '../../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Signature-verified Stripe webhook — the ONLY writer of the entitlements table.
 * Handles subscription lifecycle + checkout completion, keyed by email.
 * Idempotent via the stripe_events ledger (unique event_id): replays are ignored.
 * Raw body is required for signature verification.
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
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type });
  if (dupErr) {
    // Unique violation => already processed. Any other error => let Stripe retry.
    if ((dupErr as any).code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: 'db' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode !== 'subscription' || !s.subscription) break;
        const email =
          s.metadata?.email ||
          s.client_reference_id ||
          s.customer_details?.email ||
          (typeof s.customer_email === 'string' ? s.customer_email : null);
        const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertFromSubscription(sb, stripe, sub, email);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertFromSubscription(sb, stripe, sub, sub.metadata?.email || null);
        break;
      }
      default:
        // Acknowledge unhandled events so Stripe stops retrying.
        return NextResponse.json({ received: true, ignored: event.type });
    }
  } catch {
    return NextResponse.json({ error: 'handler' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function resolveEmail(
  stripe: Stripe,
  sub: Stripe.Subscription,
  fallback: string | null
): Promise<string | null> {
  if (fallback) return fallback.toLowerCase();
  const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!custId) return null;
  try {
    const cust = await stripe.customers.retrieve(custId);
    if (cust && !(cust as any).deleted) {
      const email = (cust as Stripe.Customer).email;
      return email ? email.toLowerCase() : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function upsertFromSubscription(
  sb: NonNullable<ReturnType<typeof serviceClient>>,
  stripe: Stripe,
  sub: Stripe.Subscription,
  emailHint: string | null
) {
  const email = await resolveEmail(stripe, sub, emailHint);
  if (!email) return;

  const priceId = sub.items?.data?.[0]?.price?.id;
  const plan = planForPriceId(priceId);
  const periodEnd = (sub as any).current_period_end as number | undefined;
  const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

  // deleted event => force canceled; otherwise use Stripe status.
  const status = sub.status === 'canceled' ? 'canceled' : sub.status;

  await sb.from('entitlements').upsert(
    {
      email,
      plan: plan || undefined,
      status,
      stripe_customer_id: custId || null,
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );
}
