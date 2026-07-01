import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import {
  normalizeEmail,
  verifyTurnstile,
  honeypotTripped,
  ipHash,
  userAgent,
} from '../../../lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generic response used for every validation failure so bots learn nothing.
const INVALID = NextResponse.json({ error: 'invalid' }, { status: 400 });

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return INVALID;
  }

  // (a) Honeypot: pretend success, write nothing.
  if (honeypotTripped(body?.company)) {
    return NextResponse.json({ ok: true });
  }

  const ideaId = body?.idea_id;
  if (!ideaId || typeof ideaId !== 'string') return INVALID;

  // (b) Turnstile bot defense (skipped only when secret is unset / dev).
  const human = await verifyTurnstile(body?.turnstile_token, req);
  if (!human) return INVALID;

  // (c) Normalize + disposable-domain rejection.
  const emailRes = normalizeEmail(body?.email);
  if (!emailRes.ok) return INVALID;
  const { email } = emailRes;

  const sessionId =
    typeof body?.session_id === 'string' ? body.session_id.slice(0, 80) : null;
  const utm =
    body?.utm && typeof body.utm === 'object' && !Array.isArray(body.utm)
      ? body.utm
      : {};
  const referredBy =
    typeof body?.referred_by === 'string' ? body.referred_by.slice(0, 80) : null;

  // (d) IP hash (HMAC(SERVER_SALT, first XFF ip)) — no raw PII stored.
  const ip_hash = ipHash(req);
  const ua = userAgent(req);

  let supabase;
  try {
    supabase = serviceClient();
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  // (e) Idempotent insert. We use a plain INSERT (not upsert) because anon upsert
  // trips RLS; the (idea_id, email) unique index from 0002 makes a re-submit raise
  // 23505, which we treat as success so a returning visitor never double-counts or
  // 500s. Works identically once the service-role key is set (it bypasses RLS).
  const { error } = await supabase.from('signups').insert({
    idea_id: ideaId,
    email,
    session_id: sessionId,
    utm,
    referred_by: referredBy,
    ip_hash,
    ua,
  });

  if (error && (error as any).code !== '23505') {
    // Do not leak DB internals; treat as generic failure.
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  // (f) Best-effort signal event — failure here must not fail the signup.
  await supabase
    .from('events')
    .insert({ idea_id: ideaId, session_id: sessionId, name: 'signup', ip_hash })
    .then(
      () => undefined,
      () => undefined
    );

  return NextResponse.json({ ok: true });
}
