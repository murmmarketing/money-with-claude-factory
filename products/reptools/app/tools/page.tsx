import type { Metadata } from 'next';
import Link from 'next/link';
import ToolsHub from './ToolsHub';
import { loadAgents, loadCustoms } from '../../lib/loadReference';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Free reps tools: CNY converter, shipping & customs calculators',
  description:
    'Free rep-buyer calculators: CNY → USD/EUR/GBP converter, agent shipping-line estimator with volumetric weight, and a customs/VAT de-minimis quick-check by country.',
  alternates: { canonical: '/tools' },
};

export default async function ToolsPage() {
  const [agents, customs] = await Promise.all([loadAgents(), loadCustoms()]);
  return (
    <div className="container">
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">Free tools</span>
        <h1 style={{ fontSize: 32 }}>The rep-buyer calculators</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: '60ch' }}>
          Quick single-purpose tools. For a full multi-item haul with a live
          landed total, use the{' '}
          <Link href="/haul">Haul Builder</Link>.
        </p>
      </div>
      <ToolsHub agents={agents} customs={customs} />
    </div>
  );
}
