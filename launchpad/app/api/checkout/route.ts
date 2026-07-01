import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import { stripeClient, siteOrigin } from '../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Creates a refundable-deposit Stripe Checkout Session for an idea. The deposit
// amount is read server-side from landing_pages.deposit_cents so the client can
// never set the price. capture_method='manual' places a hold we can release,
// which keeps the "paid conversion" real without permanently charging early
// validators. The session's completion is the ONLY thing that (via the webhook)
// writes the promote numerator.
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const ideaId = body?.idea_id;
  const sessionId =
    typeof body?.session_id === 'string' ? body.session_id.slice(0, 80) : null;
  if (!ideaId || typeof ideaId !== 'string') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  let supabase;
  try {
    supabase = serviceClient();
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const { data: lp, error: lpErr } = await supabase
    .from('landing_pages')
    .select('id,headline,deposit_cents,currency,live')
    .eq('id', ideaId)
    .eq('live', true)
    .maybeSingle();

  if (lpErr || !lp) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const depositCents = Number((lp as any).deposit_cents);
  if (!Number.isFinite(depositCents) || depositCents < 50) {
    // Stripe minimum + guards against a misconfigured / free idea.
    return NextResponse.json({ error: 'no_deposit' }, { status: 400 });
  }
  const currency = ((lp as any).currency || 'usd').toLowerCase();
  const origin = siteOrigin(req);

  let checkout;
  try {
    checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual',
        // Mirror metadata so payment_intent.succeeded also resolves idea/session.
        metadata: { idea_id: ideaId, session_id: sessionId || '' },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.round(depositCents),
            product_data: {
              name: `Refundable deposit — ${(lp as any).headline || ideaId}`,
            },
          },
        },
      ],
      metadata: { idea_id: ideaId, session_id: sessionId || '' },
      success_url: `${origin}/l/${encodeURIComponent(ideaId)}?paid=1`,
      cancel_url: `${origin}/l/${encodeURIComponent(ideaId)}`,
    });
  } catch {
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 });
  }

  // Funnel signal (best-effort).
  await supabase
    .from('events')
    .insert({ idea_id: ideaId, session_id: sessionId, name: 'checkout_start' })
    .then(
      () => undefined,
      () => undefined
    );

  return NextResponse.json({ url: checkout.url });
}
