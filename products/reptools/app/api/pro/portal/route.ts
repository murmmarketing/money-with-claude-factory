import { NextResponse } from 'next/server';
import { stripeClient, siteOrigin } from '../../../../lib/stripe';
import { getSessionEmail, getEntitlement } from '../../../../lib/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Open the Stripe Billing Portal so customers can manage / cancel Pro. */
export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 });

  const stripe = stripeClient();
  if (!stripe) return NextResponse.json({ error: 'coming_soon' }, { status: 503 });

  const entitlement = await getEntitlement(email);
  if (!entitlement?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_customer' }, { status: 404 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: entitlement.stripe_customer_id,
      return_url: `${siteOrigin(req)}/account`,
    });
    return NextResponse.json({ url: portal.url });
  } catch {
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 });
  }
}
