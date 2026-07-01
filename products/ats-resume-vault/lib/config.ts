export const BRAND = {
  name: "ResumeVault",
  tagline: "ATS-Proof Resume Kits by Industry",
  accent: "#2563eb",
  accentDark: "#1e40af",
  ink: "#0f172a",
  muted: "#475569",
  bg: "#ffffff",
  soft: "#f1f5f9",
  border: "#e2e8f0",
  support: "hello@resumevault.example"
};

export const KIT_PRICE_CENTS = 1900; // $19 per industry kit
export const VAULT_PRICE_CENTS = 5900; // $59 all-industries vault

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function usd(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
