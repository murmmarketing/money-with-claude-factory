import { anonClient } from './supabase';
import {
  AGENTS,
  CUSTOMS_RULES,
  type Agent,
  type CustomsRule,
} from './referenceData';

/**
 * Load reference data (agents + customs) from Supabase, falling back to the
 * bundled TS constants when the DB is empty or unreachable. This keeps the free
 * tools working even before the schema is seeded, while letting the owner edit
 * fees/thresholds in the DB without a redeploy.
 */
export async function loadAgents(): Promise<Agent[]> {
  const sb = anonClient();
  if (!sb) return AGENTS;
  try {
    const { data } = await sb.from('agents').select('*').eq('active', true);
    if (data && data.length) {
      return data.map((r: any) => ({
        id: r.id,
        name: r.name,
        service_fee_pct: Number(r.service_fee_pct) || 0,
        shipping_lines: Array.isArray(r.shipping_lines) ? r.shipping_lines : [],
        notes: r.notes || undefined,
        active: r.active !== false,
      }));
    }
  } catch {
    /* fall through to bundled constants */
  }
  return AGENTS;
}

export async function loadCustoms(): Promise<CustomsRule[]> {
  const sb = anonClient();
  if (!sb) return CUSTOMS_RULES;
  try {
    const { data } = await sb.from('customs_rules').select('*');
    if (data && data.length) {
      return data.map((r: any) => ({
        country_code: r.country_code,
        country_name: r.country_name,
        currency: r.currency || 'USD',
        vat_pct: Number(r.vat_pct) || 0,
        de_minimis_usd: Number(r.de_minimis_usd) || 0,
        duty_notes: r.duty_notes || '',
      }));
    }
  } catch {
    /* fall through */
  }
  return CUSTOMS_RULES;
}
