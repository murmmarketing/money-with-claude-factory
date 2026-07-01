import type { Metadata } from 'next';
import HaulBuilder from './HaulBuilder';
import { loadAgents, loadCustoms } from '../../lib/loadReference';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Rep Haul Builder & landed-cost calculator (free)',
  description:
    'Build your reps haul and see the true landed cost: goods + agent service fee + shipping line + customs/VAT for the US, UK, EU, Canada and Australia. Free, no login.',
  alternates: { canonical: '/haul' },
};

export default async function HaulPage() {
  const [agents, customs] = await Promise.all([loadAgents(), loadCustoms()]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'HaulHQ Rep Haul Builder',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description:
      'Free landed-cost calculator for reps hauls: agent fees, shipping lines and customs/VAT.',
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">Haul Builder</span>
        <h1 style={{ fontSize: 32 }}>Price your haul, honestly.</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: '60ch' }}>
          Add items in CNY, pick your agent, line and destination — the landed
          total updates live. Saved to your browser automatically. Go Pro to save
          to the cloud, compare every agent, and share it.
        </p>
      </div>
      <HaulBuilder agents={agents} customs={customs} />
    </div>
  );
}
