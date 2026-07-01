import { NextResponse } from 'next/server';
import { serviceClient } from '../../../lib/serverSupabase';
import { normalizeEmail } from '../../../lib/security';
import { sendFreeChapter, emailConfigured } from '../../../lib/email';
import { siteOrigin } from '../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Free-chapter lead magnet. Captures an email for the free Chapter 1 + glossary,
 * stores it as a lead, and emails the read link. Returns { ok: true } even if
 * Supabase/Resend are absent, and always hands back the reader URL so the client
 * can unlock the free chapters immediately.
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
  const source = typeof body?.source === 'string' ? body.source.slice(0, 40) : 'site';

  const origin = siteOrigin(req);
  const readerUrl = `${origin}/read/start-here?free=1`;

  const sb = serviceClient();
  if (sb) {
    await sb
      .from('repplaybook_leads')
      .upsert({ email, source }, { onConflict: 'email' });
  }

  let delivered = false;
  if (emailConfigured()) {
    const res = await sendFreeChapter(email, readerUrl);
    delivered = res.sent;
  }

  return NextResponse.json({ ok: true, delivered, readerUrl });
}
