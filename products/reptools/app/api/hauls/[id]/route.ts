import { NextResponse } from 'next/server';
import { serviceClient } from '../../../../lib/serverSupabase';
import { requirePro } from '../../../../lib/entitlement';
import { sanitizeHaul } from '../../../../lib/haulApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

/** GET: fetch one of the caller's own hauls (with items) for editing. */
export async function GET(_req: Request, { params }: Ctx) {
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

  return NextResponse.json({ haul: { ...(haul as any), items: items || [] } });
}

/** PUT: replace a haul's fields + items (owner only). */
export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { data: existing } = await sb
    .from('hauls')
    .select('id,slug')
    .eq('id', params.id)
    .eq('owner_email', auth.email)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const payload = sanitizeHaul(body);
  if (!payload) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { error: upErr } = await sb
    .from('hauls')
    .update({
      title: payload.title,
      destination_country: payload.destination_country,
      currency: payload.currency,
      fx_rate: payload.fx_rate,
      agent: payload.agent,
      shipping_line: payload.shipping_line,
      notes: payload.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('owner_email', auth.email);
  if (upErr) return NextResponse.json({ error: 'db' }, { status: 500 });

  // Replace items wholesale (simplest correct sync for a small item set).
  await sb.from('haul_items').delete().eq('haul_id', params.id);
  if (payload.items.length) {
    const rows = payload.items.map((it) => ({ ...it, haul_id: params.id }));
    const { error: itemErr } = await sb.from('haul_items').insert(rows);
    if (itemErr) return NextResponse.json({ error: 'db_items' }, { status: 500 });
  }

  return NextResponse.json({ haul: { id: params.id, slug: (existing as any).slug } });
}

/** DELETE: remove a haul (items cascade). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { error } = await sb
    .from('hauls')
    .delete()
    .eq('id', params.id)
    .eq('owner_email', auth.email);
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
