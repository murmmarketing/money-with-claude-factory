import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeEnabled, proPriceId } from '@/lib/stripe';
import { siteUrl } from '@/lib/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: 'Checkout is not enabled yet. Please join the waitlist.' },
      { status: 503 }
    );
  }

  let interval: 'monthly' | 'yearly' = 'monthly';
  try {
    const body = await req.json();
    if (body?.interval === 'yearly') interval = 'yearly';
  } catch {
    // default to monthly
  }

  const price = proPriceId(interval);
  if (!price) {
    return NextResponse.json({ error: 'No price configured.' }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pricing`,
      metadata: { product: 'quickconvert-pro', interval },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
