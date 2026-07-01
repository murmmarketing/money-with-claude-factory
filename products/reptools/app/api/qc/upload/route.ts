import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { serviceClient } from '../../../../lib/serverSupabase';
import { requirePro } from '../../../../lib/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = process.env.QC_BUCKET || 'qc-photos';
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

/**
 * Issue a one-time signed upload URL for a QC photo. The browser PUTs the file
 * directly to Supabase Storage (bytes never touch this function), then stores
 * the returned publicUrl on the haul item.
 */
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
  const contentType = typeof body?.contentType === 'string' ? body.contentType : '';
  if (contentType && !ALLOWED.has(contentType)) {
    return NextResponse.json({ error: 'bad_type' }, { status: 400 });
  }
  const rawName = typeof body?.filename === 'string' ? body.filename : 'photo';
  const ext = (rawName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';

  // Namespace by a hash of the email so paths don't leak the raw address.
  const folder = Buffer.from(auth.email).toString('hex').slice(0, 16);
  const path = `${folder}/${randomUUID()}.${ext}`;

  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
  });
}
