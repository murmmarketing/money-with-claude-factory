import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import { normalizeEmail, ipHash } from '../../../lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Waitlist capture — shown when Stripe is not yet connected. Stores the email so
 * the owner can notify buyers the moment checkout goes live. Idempotent on
 * email. Degrades to { ok: true, stored: false } when Supabase is absent so the
 * UI never dead-ends pre-launch.
 */
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const parsed = normalizeEmail(body?.email);
  if (!parsed.ok) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });

  const sb = serviceClient();
  if (!sb) return NextResponse.json({ ok: true, stored: false });

  await sb.from('repplaybook_waitlist').upsert(
    { email: parsed.email, ip_hash: ipHash(req) },
    { onConflict: 'email' }
  );
  return NextResponse.json({ ok: true, stored: true });
}
