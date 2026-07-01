import { NextResponse } from 'next/server';
import { serviceClient } from '../../../../lib/serverSupabase';
import { normalizeEmail, hashCode, safeEqualHex } from '../../../../lib/security';
import { mintToken, SESSION_COOKIE } from '../../../../lib/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Passwordless login step 2: verify the code and set the signed session cookie.
 * The code row is consumed on success so it cannot be replayed.
 */
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const parsed = normalizeEmail(body?.email);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!parsed.ok || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const email = parsed.email;

  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { data: rows } = await sb
    .from('login_codes')
    .select('id,code_hash,expires_at,consumed')
    .eq('email', email)
    .eq('consumed', false)
    .order('created_at', { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row) return NextResponse.json({ error: 'no_code' }, { status: 400 });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'expired' }, { status: 400 });
  }
  if (!safeEqualHex(hashCode(code), row.code_hash)) {
    return NextResponse.json({ error: 'wrong_code' }, { status: 400 });
  }

  await sb.from('login_codes').update({ consumed: true }).eq('id', row.id);

  const { token, maxAge } = mintToken(email);
  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return res;
}
