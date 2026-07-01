import { NextResponse } from 'next/server';
import {
  stripeClient,
  siteOrigin,
  playbookPriceId,
  normalizeAmountCents,
} from '../../../lib/stripe';
import { normalizeEmail } from '../../../lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Create a one-time Stripe Checkout session for The Rep Playbook.
 * - Pay-what-you-want: the client sends an amount (cents), clamped to the $9
 *   floor. If a pre-created STRIPE_PRICE_PLAYBOOK exists and the buyer took the
 *   default price, we use it; otherwise we build the line item on the fly with
 *   price_data so PWYW works without pre-creating a Price.
 * - Requires an email so the webhook can grant + email the entitlement.
 * - Returns 503 { error: 'coming_soon' } when Stripe is absent, which the UI
 *   turns into a waitlist capture.
 */
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const parsed = normalizeEmail(body?.email);
  if (!parsed.ok) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  const email = parsed.email;

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'coming_soon' }, { status: 503 });
  }

  const amount = normalizeAmountCents(body?.amount);
  const usePresetPrice = body?.usePreset === true && playbookPriceId();

  const origin = siteOrigin(req);
  try {
    const line_items = usePresetPrice
      ? [{ price: playbookPriceId() as string, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: amount,
              product_data: {
                name: 'The Rep Playbook',
                description:
                  'Complete rep-buying field manual (PDF + 4 cheat-sheets) with lifetime web access and free updates.',
              },
            },
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items,
      allow_promotion_codes: true,
      client_reference_id: email,
      metadata: { email, product: 'playbook' },
      payment_intent_data: { metadata: { email, product: 'playbook' } },
      success_url: `${origin}/thanks?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 });
  }
}
