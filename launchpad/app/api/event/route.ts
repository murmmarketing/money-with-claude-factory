import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import { ipHash } from '../../../lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Server-authoritative analytics event sink. The browser can only ask to record
// events from this allowlist — arbitrary names (and anything that would inflate
// the paid-conversion numerator) are rejected. Conversions are written ONLY by
// the Stripe webhook, never here.
const ALLOWED = new Set(['view', 'page_view', 'cta_click', 'tool_compute']);

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { idea_id, session_id, name, variant } = body || {};
  if (!idea_id || typeof idea_id !== 'string') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (typeof name !== 'string' || !ALLOWED.has(name)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    idea_id,
    session_id: typeof session_id === 'string' ? session_id.slice(0, 80) : null,
    name,
    ip_hash: ipHash(req),
  };
  if (typeof variant === 'string' && variant.length <= 40) {
    row.variant = variant;
  }

  let supabase;
  try {
    supabase = serviceClient();
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const { error } = await supabase.from('events').insert(row);
  if (error) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
