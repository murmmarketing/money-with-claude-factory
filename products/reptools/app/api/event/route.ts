import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import { ipHash } from '../../../lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lightweight analytics + waitlist sink. Only allowlisted event names are
// accepted; writes are best-effort and never block the UI.
const ALLOWED = new Set([
  'page_view',
  'tool_compute',
  'haul_saved',
  'haul_shared',
  'checkout_start',
  'pro_waitlist',
]);

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const name = typeof body?.name === 'string' ? body.name : '';
  if (!ALLOWED.has(name)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const sb = serviceClient();
  if (!sb) return NextResponse.json({ ok: true, stored: false });

  const meta = body?.meta && typeof body.meta === 'object' ? body.meta : null;
  const session_id = typeof body?.session_id === 'string' ? body.session_id.slice(0, 80) : null;

  const { error } = await sb.from('hh_events').insert({
    name,
    session_id,
    meta,
    ip_hash: ipHash(req),
  });
  // Table may not exist yet pre-migration — treat as best-effort.
  return NextResponse.json({ ok: true, stored: !error });
}
