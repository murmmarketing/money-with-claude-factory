import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import { requirePro } from '../../../lib/entitlement';
import { sanitizeHaul } from '../../../lib/haulApi';
import { makeSlug } from '../../../lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list the caller's hauls (with item counts). */
export async function GET() {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { data: hauls, error } = await sb
    .from('hauls')
    .select('id,title,slug,is_public,currency,destination_country,updated_at')
    .eq('owner_email', auth.email)
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });

  const ids = (hauls || []).map((h: any) => h.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: itemRows } = await sb.from('haul_items').select('haul_id').in('haul_id', ids);
    for (const r of itemRows || []) {
      counts[(r as any).haul_id] = (counts[(r as any).haul_id] || 0) + 1;
    }
  }

  return NextResponse.json({
    hauls: (hauls || []).map((h: any) => ({ ...h, item_count: counts[h.id] || 0 })),
  });
}

/** POST: create a new haul + items. */
export async function POST(req: Request) {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const payload = sanitizeHaul(body);
  if (!payload) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const slug = makeSlug(payload.title);
  const { data: haul, error } = await sb
    .from('hauls')
    .insert({
      owner_email: auth.email,
      title: payload.title,
      slug,
      destination_country: payload.destination_country,
      currency: payload.currency,
      fx_rate: payload.fx_rate,
      agent: payload.agent,
      shipping_line: payload.shipping_line,
      notes: payload.notes,
      is_public: false,
    })
    .select('id,slug')
    .single();
  if (error || !haul) return NextResponse.json({ error: 'db' }, { status: 500 });

  if (payload.items.length) {
    const rows = payload.items.map((it) => ({ ...it, haul_id: (haul as any).id }));
    const { error: itemErr } = await sb.from('haul_items').insert(rows);
    if (itemErr) return NextResponse.json({ error: 'db_items' }, { status: 500 });
  }

  return NextResponse.json({ haul: { id: (haul as any).id, slug: (haul as any).slug } });
}
