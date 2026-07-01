import { NextResponse } from 'next/server';
import { serviceClient } from '../../../../../lib/serverSupabase';
import { requirePro } from '../../../../../lib/entitlement';
import { makeSlug } from '../../../../../lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Toggle a haul between public (shareable /h/[slug]) and private. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePro();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* default to toggling on */
  }
  const makePublic = body?.is_public !== false;

  const { data: haul } = await sb
    .from('hauls')
    .select('id,slug,title,is_public')
    .eq('id', params.id)
    .eq('owner_email', auth.email)
    .maybeSingle();
  if (!haul) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Ensure a slug exists before going public.
  let slug = (haul as any).slug as string | null;
  if (makePublic && !slug) slug = makeSlug((haul as any).title || 'haul');

  const { error } = await sb
    .from('hauls')
    .update({ is_public: makePublic, slug, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('owner_email', auth.email);
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });

  return NextResponse.json({ ok: true, is_public: makePublic, slug });
}
