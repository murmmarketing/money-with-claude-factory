import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Signature-verified Stripe webhook. When STRIPE_WEBHOOK_SECRET is absent
// (e.g. local build with no Stripe), it responds 200 without processing so
// nothing breaks. Extend the switch to persist subscriptions if you add a DB.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ received: true, skipped: 'stripe not configured' });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Subscription is active. If you add persistence, record it here:
      // grant Pro to session.customer_details?.email / session.customer.
      console.log('[quickconvert] Pro subscription started:', session.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      console.log('[quickconvert] Pro subscription cancelled:', sub.id);
      break;
    }
    default:
      // Ignore other events.
      break;
  }

  return NextResponse.json({ received: true });
}
