import { NextResponse } from 'next/server';
import { serviceClient } from '../../../../lib/serverSupabase';
import { sendWatchReminder, emailConfigured } from '../../../../lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Weekly price-watch reminder cron (wired in vercel.json). Groups active watches
 * by owner and emails each owner a "re-check these" nudge. v1 does NOT scrape
 * live prices — it's an honest reminder loop. Protected by CRON_SECRET when set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { data: watches, error } = await sb
    .from('price_watches')
    .select('id,owner_email,label,product_url,target_price_cny')
    .eq('active', true);
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });

  const byOwner = new Map<string, any[]>();
  for (const w of watches || []) {
    const list = byOwner.get((w as any).owner_email) || [];
    list.push(w);
    byOwner.set((w as any).owner_email, list);
  }

  let emailsSent = 0;
  const canEmail = emailConfigured();
  const nowIso = new Date().toISOString();

  for (const [email, list] of byOwner) {
    if (canEmail) {
      const res = await sendWatchReminder(email, list);
      if (res.sent) emailsSent++;
    }
    const ids = list.map((w) => w.id);
    await sb.from('price_watches').update({ last_checked_at: nowIso }).in('id', ids);
  }

  return NextResponse.json({
    ok: true,
    owners: byOwner.size,
    watches: (watches || []).length,
    emailsSent,
    emailConfigured: canEmail,
  });
}
