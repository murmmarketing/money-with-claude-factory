// docs/lib/factory-db.mjs
// Tiny, dependency-free Supabase REST helper for the factory pipeline.
// Service-role writes are BEST-EFFORT and FAIL-CLOSED: if the service-role key
// is absent (it is "pending"), every write degrades to a no-op {ok:false,skipped:true}
// instead of throwing. On-disk evidence remains the source of truth either way.
//
// Env (read from process.env, never hard-coded):
//   FACTORY_SUPABASE_URL                 e.g. https://tcatgldshmpgttmputzo.supabase.co
//   FACTORY_SUPABASE_SERVICE_ROLE_KEY    service-role JWT (runner-only; pending)
//   FACTORY_SUPABASE_ANON_KEY            anon key (fallback for reads only)

const URL = process.env.FACTORY_SUPABASE_URL || '';
const SERVICE =
  process.env.FACTORY_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  '';
const ANON = process.env.FACTORY_SUPABASE_ANON_KEY || '';

export function haveService() {
  return Boolean(URL && SERVICE);
}

function restUrl(path) {
  return `${URL.replace(/\/$/, '')}/rest/v1/${path}`;
}

async function withTimeout(promiseFactory, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await promiseFactory(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

// Upsert one or more rows. `onConflict` is a comma-separated unique-column list.
// Returns {ok, status, skipped?, error?} and NEVER throws.
export async function upsert(table, rows, onConflict) {
  if (!haveService()) return { ok: false, skipped: true, reason: 'no_service_key' };
  const body = JSON.stringify(Array.isArray(rows) ? rows : [rows]);
  const qs = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
  try {
    const res = await withTimeout((signal) =>
      fetch(restUrl(table + qs), {
        method: 'POST',
        signal,
        headers: {
          apikey: SERVICE,
          Authorization: `Bearer ${SERVICE}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body,
      })
    );
    return { ok: res.ok, status: res.status, error: res.ok ? undefined : await safeText(res) };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

// Service-role SELECT. Returns {ok, rows, status} and never throws.
export async function select(table, query = '') {
  const key = SERVICE || ANON;
  if (!URL || !key) return { ok: false, skipped: true, rows: [], reason: 'no_key' };
  try {
    const res = await withTimeout((signal) =>
      fetch(restUrl(table + (query ? `?${query}` : '')), {
        method: 'GET',
        signal,
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
    );
    const rows = res.ok ? await res.json().catch(() => []) : [];
    return { ok: res.ok, status: res.status, rows: Array.isArray(rows) ? rows : [] };
  } catch (e) {
    return { ok: false, rows: [], error: String(e && e.message ? e.message : e) };
  }
}

// PATCH rows matching a filter query. Returns {ok,status}.
export async function patch(table, query, patchBody) {
  if (!haveService()) return { ok: false, skipped: true, reason: 'no_service_key' };
  try {
    const res = await withTimeout((signal) =>
      fetch(restUrl(`${table}?${query}`), {
        method: 'PATCH',
        signal,
        headers: {
          apikey: SERVICE,
          Authorization: `Bearer ${SERVICE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(patchBody),
      })
    );
    const rows = res.ok ? await res.json().catch(() => []) : [];
    return { ok: res.ok, status: res.status, rows: Array.isArray(rows) ? rows : [] };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

async function safeText(res) {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return `http_${res.status}`;
  }
}
