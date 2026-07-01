import { NextResponse } from 'next/server';
import { serviceClient } from '../../../../lib/serverSupabase';
import { compute, type ToolSpec } from '../../../../lib/toolCompute';
import { ipHash } from '../../../../lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// curl-testable compute endpoint for a single live tool. Loads the spec from
// tool_specs (db item 0004) with the service client and runs the whitelisted,
// no-eval evaluator. Same lib the browser ToolRunner uses, so results match.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const inputs =
    body?.inputs && typeof body.inputs === 'object' && !Array.isArray(body.inputs)
      ? body.inputs
      : {};

  let supabase;
  try {
    supabase = serviceClient();
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('tool_specs')
    .select('idea_id,spec,live')
    .eq('idea_id', id)
    .eq('live', true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const spec = (data as any).spec as ToolSpec;
  let result;
  try {
    result = compute(spec, inputs);
  } catch {
    // Bad user input or a malformed spec — never leak internals.
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  // Best-effort compute signal (allowlisted event name).
  const sessionId =
    typeof body?.session_id === 'string' ? body.session_id.slice(0, 80) : null;
  await supabase
    .from('events')
    .insert({
      idea_id: id,
      session_id: sessionId,
      name: 'tool_compute',
      ip_hash: ipHash(req),
    })
    .then(
      () => undefined,
      () => undefined
    );

  return NextResponse.json({ ok: true, ...result });
}
