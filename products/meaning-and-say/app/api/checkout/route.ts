import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getCategory } from "@/lib/terms";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Payments are not configured yet.", enabled: false },
      { status: 503 }
    );
  }

  let category = "slang";
  try {
    const body = await req.json();
    if (typeof body?.category === "string") category = body.category;
  } catch {
    /* keep default */
  }

  const cat = getCategory(category);
  if (!cat) {
    return NextResponse.json({ error: "Unknown pack." }, { status: 400 });
  }

  try {
    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { category: cat.slug },
      success_url: `${base}/pack/${cat.slug}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pricing?canceled=1`
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
