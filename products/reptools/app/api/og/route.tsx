import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { computeLandedCost } from '../../../lib/haulCompute';
import { AGENTS, CUSTOMS_RULES, DEFAULT_USD_PER_CNY } from '../../../lib/referenceData';
import { money } from '../../../lib/format';

export const runtime = 'edge';

const size = { width: 1200, height: 630 };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  let title = 'Price your reps haul';
  let sub = 'Real landed cost · cheapest-agent compare · shareable lists';
  let landed = '';
  let currency = 'USD';
  let itemCount = 0;

  if (slug) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const sb = createClient(url, key, { auth: { persistSession: false } });
        const { data: haul } = await sb
          .from('hauls')
          .select('id,title,currency,fx_rate,agent,shipping_line,destination_country')
          .eq('slug', slug)
          .eq('is_public', true)
          .maybeSingle();
        if (haul) {
          const h = haul as any;
          const { data: items } = await sb
            .from('haul_items')
            .select('cny_price,qty,weight_grams')
            .eq('haul_id', h.id);
          const its = (items as any[]) || [];
          itemCount = its.length;
          const agent = AGENTS.find((a) => a.id === h.agent);
          const line =
            agent?.shipping_lines.find((l) => l.line === h.shipping_line) ||
            agent?.shipping_lines[0];
          const rule = CUSTOMS_RULES.find((c) => c.country_code === h.destination_country) || CUSTOMS_RULES[0];
          const result = computeLandedCost({
            items: its.map((it) => ({
              cny_price: Number(it.cny_price),
              qty: Number(it.qty),
              weight_grams: Number(it.weight_grams),
            })),
            fxRate: Number(h.fx_rate),
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
          currency = h.currency || 'USD';
          title = h.title || 'Reps haul';
          landed = money(result.landedTarget, currency);
          sub = `${itemCount} items · ${agent?.name || h.agent} · landed to ${rule?.country_name || h.destination_country}`;
        }
      }
    } catch {
      /* fall back to generic card */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0d12',
          padding: 64,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 34, fontWeight: 800, color: '#e8edf2' }}>
          Haul<span style={{ color: '#b6ff3c' }}>HQ</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#e8edf2', lineHeight: 1.05, maxWidth: 1000 }}>
            {title}
          </div>
          <div style={{ fontSize: 30, color: '#8a94a3', marginTop: 18 }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {landed ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 22, color: '#8a94a3', textTransform: 'uppercase', letterSpacing: 2 }}>
                Landed total
              </div>
              <div style={{ fontSize: 76, fontWeight: 800, color: '#b6ff3c' }}>{landed}</div>
            </div>
          ) : (
            <div style={{ fontSize: 28, color: '#35e0e0' }}>haulhq.app</div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: '#0a0d12',
              background: '#b6ff3c',
              padding: '14px 26px',
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            Price your own →
          </div>
        </div>
      </div>
    ),
    size
  );
}
