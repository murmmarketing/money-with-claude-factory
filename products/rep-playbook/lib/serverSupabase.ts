import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client built from the service-role key. NEVER import from
 * a client component — the service-role key must never reach the browser. All
 * privileged writes (orders, entitlements, leads, waitlist, login codes) go
 * through this client. Returns null when unconfigured; routes treat null as a
 * clean 503 so the app still builds and deploys with no env set.
 */
let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.FACTORY_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-repplaybook-source': 'server' } },
  });
  return cached;
}

export function hasServiceRole(): boolean {
  return Boolean(
    process.env.FACTORY_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
