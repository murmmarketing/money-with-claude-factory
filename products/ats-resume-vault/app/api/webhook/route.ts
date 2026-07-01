import { NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/stripe";
import { recordPurchase, supabaseEnabled } from "@/lib/supabase";

export const runtime = "nodejs";

// Stripe webhook. Signature-verified. Records completed purchases when Supabase is
// configured. Access to downloads does NOT depend on this endpoint (the success page
// verifies the session directly), so it is safe to leave unwired during preview.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!secret) {
    // Not configured — acknowledge so Stripe doesn't retry endlessly in test mode.
    return NextResponse.json({ received: true, note: "webhook secret not set" });
  }

  if (!verifyStripeSignature(payload, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const obj = event.data?.object || {};
    const product = ((obj.metadata as Record<string, string>)?.product) || "unknown";
    const details = obj.customer_details as { email?: string } | undefined;
    const email = details?.email || (obj.customer_email as string) || "unknown";
    const sessionId = (obj.id as string) || "unknown";
    if (supabaseEnabled()) {
      await recordPurchase(email, product, sessionId);
    } else {
      console.log(`[purchase] ${email} bought ${product} (${sessionId})`);
    }
  }

  return NextResponse.json({ received: true });
}
