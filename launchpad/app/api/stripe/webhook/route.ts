import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { serviceClient } from '../../../../lib/serverSupabase';
import { stripeClient } from '../../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Signature-verified Stripe webhook. This is the ONLY writer of the
// paid-conversion numerator (conversions table). Idempotency is enforced by the
// UNIQUE stripe_event_id column (db item 0002): a replayed event upserts to the
// same row and is ignored. Raw body is required for signature verification, so
// we read req.text() and never parse JSON before constructEvent.
export async function POST(req: Request) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'no signature' }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  let conversion: {
    idea_id: string;
    session_id: string | null;
    amount_cents: number | null;
    currency: string | null;
    email: string | null;
  } | null = null;

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    const ideaId = s.metadata?.idea_id;
    if (ideaId) {
      conversion = {
        idea_id: ideaId,
        session_id: s.metadata?.session_id || null,
        amount_cents:
          typeof s.amount_total === 'number' ? s.amount_total : null,
        currency: s.currency || null,
        email:
          s.customer_details?.email ||
          (typeof s.customer_email === 'string' ? s.customer_email : null),
      };
    }
  } else if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const ideaId = pi.metadata?.idea_id;
    if (ideaId) {
      conversion = {
        idea_id: ideaId,
        session_id: pi.metadata?.session_id || null,
        amount_cents:
          typeof pi.amount_received === 'number'
            ? pi.amount_received
            : typeof pi.amount === 'number'
            ? pi.amount
            : null,
        currency: pi.currency || null,
        email: pi.receipt_email || null,
      };
    }
  } else {
    // Acknowledge unhandled event types so Stripe stops retrying.
    return NextResponse.json({ received: true, ignored: event.type });
  }

  if (!conversion) {
    // Valid event, but no idea_id metadata — nothing to record.
    return NextResponse.json({ received: true });
  }

  let supabase;
  try {
    supabase = serviceClient();
  } catch {
    // 500 so Stripe retries once the service key is wired up.
    return NextResponse.json({ error: 'unavailable' }, { status: 500 });
  }

  const { error } = await supabase.from('conversions').upsert(
    {
      idea_id: conversion.idea_id,
      session_id: conversion.session_id,
      stripe_event_id: event.id,
      amount_cents: conversion.amount_cents,
      currency: conversion.currency,
      kind: 'deposit',
      email: conversion.email,
    },
    { onConflict: 'stripe_event_id', ignoreDuplicates: true }
  );

  if (error) {
    // Let Stripe retry on a transient DB failure.
    return NextResponse.json({ error: 'db' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
