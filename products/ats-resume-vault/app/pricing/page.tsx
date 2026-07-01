import type { Metadata } from "next";
import { industries } from "@/data/industries";
import { KIT_PRICE_CENTS, VAULT_PRICE_CENTS, usd } from "@/lib/config";
import BuyButton from "../resume/[industry]/BuyButton";

export const metadata: Metadata = {
  title: "Pricing — ATS Resume Kits",
  description: `One-time pricing: ${usd(KIT_PRICE_CENTS)} per industry kit, or ${usd(VAULT_PRICE_CENTS)} for the all-industries vault.`
};

export default function PricingPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Pricing</span>
          <h1>One-time. No subscription.</h1>
          <p className="lead">
            Buy the kit for your field, or get every industry in the vault. Yours to keep and reuse for every application.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="price-grid">
            <div className="price-card">
              <h3>Single industry kit</h3>
              <div className="price-tag">{usd(KIT_PRICE_CENTS)}</div>
              <p style={{ marginTop: 4 }}>Everything for one field.</p>
              <ul className="check-list">
                <li>ATS-safe resume template (.doc)</li>
                <li>Full bullet-point library</li>
                <li>Cover-letter pack</li>
                <li>Keyword list</li>
                <li>Beat-the-ATS checklist</li>
              </ul>
              <p style={{ fontWeight: 600 }}>Choose your industry below ↓</p>
            </div>
            <div className="price-card featured">
              <span className="price-badge">Best value</span>
              <h3>All-industries vault</h3>
              <div className="price-tag">{usd(VAULT_PRICE_CENTS)}</div>
              <p style={{ marginTop: 4 }}>
                Every one of the {industries.length} kits — save {usd(industries.length * KIT_PRICE_CENTS - VAULT_PRICE_CENTS)}+ versus buying separately.
              </p>
              <ul className="check-list">
                <li>All {industries.length} industry kits</li>
                <li>Every template + bullet library</li>
                <li>Perfect for career changers</li>
                <li>One download, yours forever</li>
              </ul>
              <BuyButton product="all" label={`Get the vault — ${usd(VAULT_PRICE_CENTS)}`} />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <h2>Buy a single industry kit</h2>
          <p style={{ marginBottom: 20 }}>Each kit is {usd(KIT_PRICE_CENTS)}, one-time.</p>
          <div className="grid grid-2">
            {industries.map((ind) => (
              <div key={ind.slug} className="download-row">
                <div>
                  <strong>{ind.name}</strong>
                  <div className="meta">{ind.roles.slice(0, 3).join(" · ")}</div>
                </div>
                <BuyButton product={ind.slug} label={`Get — ${usd(KIT_PRICE_CENTS)}`} variant="ghost" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
