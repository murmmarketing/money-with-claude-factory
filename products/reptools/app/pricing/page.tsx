import type { Metadata } from 'next';
import PricingClient from './PricingClient';
import { stripeConfigured } from '../../lib/stripe';

export const metadata: Metadata = {
  title: 'Pricing — HaulHQ Pro is $6/mo',
  description:
    'HaulHQ Pro: cloud-saved hauls, multi-agent cheapest-total compare, de-minimis split planner, shareable haul pages, QC photos, CSV export and a price watchlist. $6/mo or $48/yr.',
  alternates: { canonical: '/pricing' },
};

const FREE = [
  'Landed-cost calculator (agent fee + shipping + customs/VAT)',
  'Haul Builder Lite — unlimited items, saved to your browser',
  'CNY → USD / EUR / GBP converter',
  'Shipping-line estimator with volumetric warning',
  'Customs quick-check (VAT % + de-minimis) for 10 countries',
  'Copy / print a haul summary for Discord',
];

const PRO = [
  'Everything in Free',
  'Save unlimited hauls to the cloud, synced across devices',
  'Multi-agent compare — cheapest total landed cost across 5 agents',
  'De-minimis split-shipment planner with tax-saved estimate',
  'Shareable public haul pages with QC photos + W2C links',
  'QC photo storage per item',
  'CSV / Excel export of any haul',
  'Price / restock watchlist with email nudges',
  'No item caps + custom FX & agent-fee presets',
];

export default function PricingPage() {
  const configured = stripeConfigured();
  return (
    <div className="container container-narrow section">
      <div className="center" style={{ marginBottom: 34 }}>
        <span className="eyebrow">Pricing</span>
        <h1 style={{ fontSize: 38 }}>
          Free tools forever. Pro for <span className="accent">$6/mo</span>.
        </h1>
        <p className="muted" style={{ marginTop: 10, maxWidth: '52ch', marginInline: 'auto' }}>
          If Pro doesn&apos;t save you more than it costs on a single haul, it&apos;s not
          doing its job. 7-day money-back promise.
        </p>
      </div>

      <div className="price-grid">
        <div className="card price-card">
          <span className="pill">Free</span>
          <div style={{ margin: '14px 0' }}>
            <span className="price-amt">
              $0<small> / forever</small>
            </span>
          </div>
          <ul className="price-list free">
            {FREE.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <a href="/haul" className="btn btn-block">
            Start building — no login
          </a>
        </div>

        <div className="card price-card featured">
          <span className="pill pill-accent">Pro</span>
          <PricingClient configured={configured} />
          <ul className="price-list">
            {PRO.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="faint center" style={{ fontSize: 13, marginTop: 22 }}>
        Prices in USD. Cancel anytime from your account. Payments handled by
        Stripe.
      </p>
    </div>
  );
}
