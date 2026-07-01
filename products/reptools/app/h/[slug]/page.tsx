import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { anonClient } from '../../../lib/supabase';
import { loadAgents, loadCustoms } from '../../../lib/loadReference';
import { computeLandedCost } from '../../../lib/haulCompute';
import { DEFAULT_USD_PER_CNY } from '../../../lib/referenceData';
import { money, cny, grams } from '../../../lib/format';
import { siteUrl } from '../../../lib/stripe';

export const revalidate = 120;
export const dynamicParams = true;

interface PublicHaul {
  id: string;
  title: string;
  slug: string;
  destination_country: string;
  currency: string;
  fx_rate: number;
  agent: string;
  shipping_line: string | null;
  notes: string | null;
  is_public: boolean;
  updated_at: string;
}

interface PublicItem {
  name: string;
  product_url: string;
  cny_price: number;
  qty: number;
  weight_grams: number;
  category: string;
  qc_photo_url: string;
  notes: string;
  sort_order: number;
}

async function getHaul(slug: string): Promise<{ haul: PublicHaul; items: PublicItem[] } | null> {
  const sb = anonClient();
  if (!sb) return null;
  const { data: haul } = await sb
    .from('hauls')
    .select('id,title,slug,destination_country,currency,fx_rate,agent,shipping_line,notes,is_public,updated_at')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();
  if (!haul) return null;
  const { data: items } = await sb
    .from('haul_items')
    .select('name,product_url,cny_price,qty,weight_grams,category,qc_photo_url,notes,sort_order')
    .eq('haul_id', (haul as any).id)
    .order('sort_order', { ascending: true });
  return { haul: haul as PublicHaul, items: (items as PublicItem[]) || [] };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getHaul(params.slug);
  if (!data) return { title: 'Haul not found', robots: { index: false, follow: false } };
  const { haul } = data;
  const og = `${siteUrl()}/api/og?slug=${encodeURIComponent(haul.slug)}`;
  return {
    title: `${haul.title} — a reps haul`,
    description: `A shared reps haul with real landed cost, W2C links and QC photos. Priced with HaulHQ.`,
    alternates: { canonical: `/h/${haul.slug}` },
    openGraph: {
      title: `${haul.title} — reps haul`,
      description: 'Real landed cost, W2C links and QC photos. Priced with HaulHQ.',
      url: `${siteUrl()}/h/${haul.slug}`,
      images: [{ url: og, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', images: [og] },
  };
}

export default async function PublicHaulPage({ params }: { params: { slug: string } }) {
  const data = await getHaul(params.slug);
  if (!data) notFound();
  const { haul, items } = data;

  const [agents, customs] = await Promise.all([loadAgents(), loadCustoms()]);
  const agent = agents.find((a) => a.id === haul.agent);
  const line = agent?.shipping_lines.find((l) => l.line === haul.shipping_line) || agent?.shipping_lines[0];
  const rule = customs.find((c) => c.country_code === haul.destination_country) || customs[0];

  const result = computeLandedCost({
    items: items.map((it) => ({ cny_price: it.cny_price, qty: it.qty, weight_grams: it.weight_grams })),
    fxRate: haul.fx_rate,
    usdPerCny: DEFAULT_USD_PER_CNY,
    serviceFeePct: agent?.service_fee_pct ?? 0,
    shipping: {
      baseCost: line?.base_cost ?? 0,
      perKg: line?.per_kg ?? 0,
      volumetricDivisor: line?.volumetric_divisor ?? 6000,
    },
    vatPct: rule?.vat_pct ?? 0,
    deMinimisUsd: rule?.de_minimis_usd ?? 0,
  });

  const cur = haul.currency;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: haul.title,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name || `Item ${i + 1}`,
      url: it.product_url || undefined,
    })),
  };

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="row spread wrap" style={{ gap: 12, marginBottom: 18 }}>
        <div>
          <span className="eyebrow">Shared haul</span>
          <h1 style={{ fontSize: 30 }}>{haul.title}</h1>
          <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
            <span className="pill">{rule?.country_name}</span>
            {agent && <span className="pill">{agent.name}</span>}
            {line && <span className="pill">{line.line}</span>}
            <span className="pill pill-accent">{items.length} items</span>
          </div>
        </div>
        <Link href="/haul" className="btn btn-primary">
          Price your own haul →
        </Link>
      </div>

      <div className="builder-grid">
        {/* items */}
        <div className="stack" style={{ gap: 10 }}>
          {items.map((it, i) => (
            <div key={i} className="card card-2">
              <div className="row spread wrap" style={{ gap: 12, alignItems: 'flex-start' }}>
                <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  {it.qc_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.qc_photo_url}
                      alt={`QC photo for ${it.name || 'item'}`}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 8, border: '1px dashed var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="faint mono">
                      no QC
                    </div>
                  )}
                  <div>
                    <b>{it.name || `Item ${i + 1}`}</b>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {cny(it.cny_price)} × {it.qty}
                      {it.weight_grams ? ` · ${grams(it.weight_grams)}` : ''}
                      {it.category ? ` · ${it.category}` : ''}
                    </div>
                    {it.product_url && (
                      <a href={it.product_url} target="_blank" rel="noreferrer nofollow" className="mono" style={{ fontSize: 13 }}>
                        W2C link →
                      </a>
                    )}
                  </div>
                </div>
                <span className="mono" style={{ fontWeight: 600 }}>
                  {money(it.cny_price * it.qty * haul.fx_rate, cur)}
                </span>
              </div>
              {it.notes && <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>{it.notes}</p>}
            </div>
          ))}
        </div>

        {/* landed total */}
        <div className="stack sticky-col" style={{ gap: 16 }}>
          <div className="card">
            <div className="ledger">
              <div className="ledger-row"><span className="k">Goods ({cny(result.goodsCny)})</span><span className="v">{money(result.goodsTarget, cur)}</span></div>
              <div className="ledger-row"><span className="k">Service fee</span><span className="v">{money(result.serviceFeeTarget, cur)}</span></div>
              <div className="ledger-row"><span className="k">Shipping · {grams(result.chargeableWeightG)}</span><span className="v">{money(result.shippingTarget, cur)}</span></div>
              <div className="ledger-row"><span className="k">Customs/VAT</span><span className="v">{money(result.taxTarget, cur)}</span></div>
              <div className="ledger-row total"><span className="k">Landed total</span><span className="v">{money(result.landedTarget, cur)}</span></div>
            </div>
            <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
              <span className="pill">{money(result.perUnitTarget, cur)}/unit</span>
              <span className={`pill ${result.overDeMinimis ? 'pill-warn' : 'pill-accent'}`}>
                {result.overDeMinimis ? 'likely taxed' : 'likely tax-free'}
              </span>
            </div>
          </div>
          <div className="notice">
            Priced with <b>HaulHQ</b>. Numbers are planning estimates —{' '}
            <Link href="/haul">build your own →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
