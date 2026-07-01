import { NextResponse } from 'next/server';
import { serviceClient } from '../../../../../lib/serverSupabase';
import { requirePro } from '../../../../../lib/entitlement';
import { loadAgents, loadCustoms } from '../../../../../lib/loadReference';
import { computeLandedCost } from '../../../../../lib/haulCompute';
import { DEFAULT_USD_PER_CNY } from '../../../../../lib/referenceData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET: download a haul as CSV (items + a landed-cost summary block). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { data: haul } = await sb
    .from('hauls')
    .select('*')
    .eq('id', params.id)
    .eq('owner_email', auth.email)
    .maybeSingle();
  if (!haul) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: items } = await sb
    .from('haul_items')
    .select('*')
    .eq('haul_id', params.id)
    .order('sort_order', { ascending: true });

  const [agents, customs] = await Promise.all([loadAgents(), loadCustoms()]);
  const h = haul as any;
  const its = (items as any[]) || [];
  const agent = agents.find((a) => a.id === h.agent);
  const line = agent?.shipping_lines.find((l) => l.line === h.shipping_line) || agent?.shipping_lines[0];
  const rule = customs.find((c) => c.country_code === h.destination_country) || customs[0];

  const result = computeLandedCost({
    items: its.map((it) => ({ cny_price: Number(it.cny_price), qty: Number(it.qty), weight_grams: Number(it.weight_grams) })),
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

  const lines: string[] = [];
  lines.push(['name', 'product_url', 'cny_price', 'qty', 'weight_grams', 'category', 'line_total_cny'].join(','));
  for (const it of its) {
    lines.push(
      [
        csvCell(it.name),
        csvCell(it.product_url),
        csvCell(it.cny_price),
        csvCell(it.qty),
        csvCell(it.weight_grams),
        csvCell(it.category),
        csvCell(Number(it.cny_price) * Number(it.qty)),
      ].join(',')
    );
  }
  lines.push('');
  lines.push(['SUMMARY', '', '', '', '', '', ''].join(','));
  lines.push(['title', csvCell(h.title)].join(','));
  lines.push(['destination', csvCell(h.destination_country)].join(','));
  lines.push(['agent', csvCell(agent?.name || h.agent)].join(','));
  lines.push(['shipping_line', csvCell(line?.line || h.shipping_line)].join(','));
  lines.push(['currency', csvCell(h.currency)].join(','));
  lines.push(['fx_rate', csvCell(h.fx_rate)].join(','));
  lines.push([`goods_${h.currency}`, csvCell(result.goodsTarget)].join(','));
  lines.push([`service_fee_${h.currency}`, csvCell(result.serviceFeeTarget)].join(','));
  lines.push([`shipping_${h.currency}`, csvCell(result.shippingTarget)].join(','));
  lines.push([`customs_vat_${h.currency}`, csvCell(result.taxTarget)].join(','));
  lines.push([`landed_total_${h.currency}`, csvCell(result.landedTarget)].join(','));

  const csv = lines.join('\n');
  const filename = `${(h.slug || h.title || 'haul').replace(/[^a-z0-9-]/gi, '-')}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
