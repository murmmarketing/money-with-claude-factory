import { NextRequest, NextResponse } from "next/server";
import { getIndustry } from "@/data/industries";
import { createCheckoutSession } from "@/lib/stripe";
import { KIT_PRICE_CENTS, VAULT_PRICE_CENTS, siteUrl, stripeEnabled } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let product = "";
  try {
    const body = await req.json();
    product = String(body.product || "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const isVault = product === "all";
  const ind = isVault ? null : getIndustry(product);
  if (!isVault && !ind) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  // No Stripe configured -> tell the client to show the waitlist flow.
  if (!stripeEnabled()) {
    return NextResponse.json({ waitlist: true });
  }

  const amountCents = isVault ? VAULT_PRICE_CENTS : KIT_PRICE_CENTS;
  const productName = isVault
    ? "ResumeVault — All-Industries Vault"
    : `ResumeVault — ${ind!.name} ATS Resume Kit`;

  try {
    const session = await createCheckoutSession({
      product,
      productName,
      amountCents,
      successUrl: `${siteUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: isVault ? `${siteUrl()}/pricing` : `${siteUrl()}/resume/${product}`
    });
    if (!session) return NextResponse.json({ waitlist: true });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
