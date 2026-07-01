import { NextResponse } from 'next/server';
import { serviceClient } from '../../../../lib/serverSupabase';
import { normalizeEmail, genLoginCode, hashCode } from '../../../../lib/security';
import { sendLoginCode, emailConfigured } from '../../../../lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Passwordless re-login step 1: email a 6-digit code so an existing buyer can
 * get back into their library on any device.
 * - Stores a salted hash of the code with a 10-minute TTL.
 * - When Resend is unconfigured (dev/pre-launch) the code is returned as
 *   `devCode` so the owner can still test end to end.
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
  const email = parsed.email;

  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const code = genLoginCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await sb
    .from('repplaybook_login_codes')
    .update({ consumed: true })
    .eq('email', email)
    .eq('consumed', false);
  const { error } = await sb.from('repplaybook_login_codes').insert({
    email,
    code_hash: hashCode(code),
    expires_at: expiresAt,
  });
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });

  if (emailConfigured()) {
    const res = await sendLoginCode(email, code);
    if (!res.sent) return NextResponse.json({ ok: true, delivered: false, devCode: code });
    return NextResponse.json({ ok: true, delivered: true });
  }
  return NextResponse.json({ ok: true, delivered: false, devCode: code });
}
