import crypto from "crypto";

// Minimal Stripe integration via the REST API + fetch — no SDK dependency, so the
// project builds clean with zero packages beyond Next/React. When STRIPE_SECRET_KEY
// is absent, callers fall back to the waitlist flow.

const STRIPE_API = "https://api.stripe.com/v1";

function form(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export interface CheckoutArgs {
  product: string; // "all" for vault, otherwise industry slug
  productName: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
  email?: string;
}

export async function createCheckoutSession(args: CheckoutArgs): Promise<{ url: string } | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  const params: Record<string, string> = {
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(args.amountCents),
    "line_items[0][price_data][product_data][name]": args.productName,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    "metadata[product]": args.product,
    allow_promotion_codes: "true"
  };
  if (args.email) params.customer_email = args.email;

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form(params)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe checkout failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) return null;
  return { url: data.url };
}

export interface RetrievedSession {
  paid: boolean;
  product: string | null;
  email: string | null;
}

export async function retrieveCheckoutSession(sessionId: string): Promise<RetrievedSession | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const res = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    payment_status?: string;
    metadata?: { product?: string };
    customer_details?: { email?: string };
    customer_email?: string;
  };
  return {
    paid: data.payment_status === "paid",
    product: data.metadata?.product ?? null,
    email: data.customer_details?.email ?? data.customer_email ?? null
  };
}

// Verifies a Stripe webhook signature (t=,v1= scheme) without the SDK.
export function verifyStripeSignature(payload: string, sigHeader: string | null, secret: string): boolean {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k, v];
    })
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;

  const signedPayload = `${parts.t}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  const a = Buffer.from(parts.v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  // reject events older than 5 minutes to mitigate replay
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  return age < 300;
}
