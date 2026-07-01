import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const { idea_id, email, session_id, utm } = body || {};
  if (!idea_id || typeof email !== 'string' || !EMAIL.test(email)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from('signups')
    .insert({ idea_id, email: email.toLowerCase().trim(), session_id: session_id || null, utm: utm || {} });

  if (error) {
    return NextResponse.json({ error: 'db' }, { status: 500 });
  }

  // best-effort event; ignore failure
  await supabase.from('events').insert({ idea_id, session_id: session_id || null, name: 'signup' });

  return NextResponse.json({ ok: true });
}
