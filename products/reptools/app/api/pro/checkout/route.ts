import { NextResponse } from 'next/server';
import { stripeClient, siteOrigin, priceIdFor } from '../../../../lib/stripe';
import { getSessionEmail } from '../../../../lib/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Create a Stripe Checkout subscription session for the monthly/annual price.
 * - Requires a logged-in email (so the webhook can key the entitlement to it).
 * - Returns 503 { error: 'coming_soon' } when Stripe or the price id is absent,
 *   which the pricing UI turns into a waitlist capture.
 */
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const plan = body?.plan === 'annual' ? 'annual' : 'monthly';

  const email = getSessionEmail();
  if (!email) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 });

  const stripe = stripeClient();
  const price = priceIdFor(plan);
  if (!stripe || !price) {
    return NextResponse.json({ error: 'coming_soon' }, { status: 503 });
  }

  const origin = siteOrigin(req);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: email,
      subscription_data: { metadata: { email, plan } },
      metadata: { email, plan },
      success_url: `${origin}/account?pro=1`,
      cancel_url: `${origin}/pricing`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 });
  }
}
