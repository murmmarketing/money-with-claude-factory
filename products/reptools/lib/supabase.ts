import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Anon Supabase client for public reads only: reference tables (agents,
 * customs_rules) and public share pages (hauls where is_public = true). Safe to
 * use from server components. Returns null when env is unconfigured so callers
 * fall back to the bundled reference constants instead of throwing.
 */
let cached: SupabaseClient | null = null;

export function anonClient(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
