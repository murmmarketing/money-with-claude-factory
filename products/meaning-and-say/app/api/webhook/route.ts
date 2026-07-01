import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Signature-verified Stripe webhook. Records completed purchases.
 * The pack deliverable itself is unlocked on the success page by verifying
 * the session, so this endpoint is for the owner's records / future email
 * fulfilment. It fails safe (200 no-op) when Stripe isn't configured.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json({ received: true, configured: false });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      customer_details?: { email?: string | null } | null;
      metadata?: Record<string, string> | null;
    };
    // Owner-facing record. Swap this console line for an email send or a
    // Supabase insert when ready — the verified data is all here.
    console.log(
      `[MeaningAndSay] Paid pack: category=${
        session.metadata?.category ?? "unknown"
      } email=${session.customer_details?.email ?? "n/a"} session=${session.id}`
    );
  }

  return NextResponse.json({ received: true });
}
