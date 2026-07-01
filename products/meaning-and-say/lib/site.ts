export const SITE = {
  name: "MeaningAndSay",
  tagline: "What It Means & How to Say It",
  description:
    "Look up any slang word, foreign phrase, tricky name, or brand — get the plain-English meaning, an example, a syllable breakdown, and tap to hear it said out loud.",
  accent: "#6d28d9", // deep violet
  accentSoft: "#ede9fe",
  ink: "#1f2937",
  packPrice: "$4",
  packPriceCents: 400
};

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export function adsEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT && process.env.NEXT_PUBLIC_ADSENSE_SLOT
  );
}
