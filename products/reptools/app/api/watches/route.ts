import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import { requirePro } from '../../../lib/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list the caller's price/restock watches. */
export async function GET() {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { data } = await sb
    .from('price_watches')
    .select('id,label,product_url,target_price_cny,last_price_cny,active,last_checked_at')
    .eq('owner_email', auth.email)
    .order('created_at', { ascending: false });
  return NextResponse.json({ watches: data || [] });
}

/** POST: add a watch. */
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
  const product_url = typeof body?.product_url === 'string' ? body.product_url.slice(0, 1000) : '';
  if (!product_url) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const label = typeof body?.label === 'string' ? body.label.slice(0, 160) : '';
  const target = Number(body?.target_price_cny);

  const { data, error } = await sb
    .from('price_watches')
    .insert({
      owner_email: auth.email,
      product_url,
      label,
      target_price_cny: Number.isFinite(target) ? target : null,
      active: true,
    })
    .select('id,label,product_url,target_price_cny,active')
    .single();
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });
  return NextResponse.json({ watch: data });
}

/** DELETE ?id=... : remove a watch. */
export async function DELETE(req: Request) {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { error } = await sb
    .from('price_watches')
    .delete()
    .eq('id', id)
    .eq('owner_email', auth.email);
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
