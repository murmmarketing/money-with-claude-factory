import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client built from the service-role key.
 * NEVER import this from a client component — FACTORY_SERVICE_ROLE_KEY must
 * never reach the browser. All privileged writes (signups, events,
 * conversions, tool compute reads) go through this client so RLS anon
 * INSERT grants can be revoked (db item 0002).
 *
 * Falls back to the anon key ONLY if the service-role key is absent, so a
 * misconfigured deploy degrades to the old behaviour instead of throwing at
 * import time. Routes should treat a null return as a 503.
 */
let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.FACTORY_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('supabase server client not configured');
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-factory-source': 'launchpad-server' } },
  });
  return cached;
}

/** True when a real service-role key is present (not falling back to anon). */
export function hasServiceRole(): boolean {
  return Boolean(
    process.env.FACTORY_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
