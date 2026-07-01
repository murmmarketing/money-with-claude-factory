/**
 * Seed reference data for HaulHQ, shipped as TypeScript constants so the FREE
 * client-side tools work with ZERO database calls and zero login. The exact same
 * rows are seeded into Supabase (db/schema.sql) for Pro server-side compare /
 * multi-agent scoring, but the DB is treated as an optional override — if it is
 * empty or unreachable, everything falls back to these constants.
 *
 * All shipping-line costs are expressed in CNY (Chinese buying agents quote
 * international lines in RMB by chargeable weight). The calculator converts to
 * the buyer's currency with their editable FX rate. These are community-typical
 * ballpark numbers for planning, NOT live quotes — always confirm on the agent.
 */

export interface ShippingLine {
  line: string;
  /** Fixed handling/first-weight cost in CNY. */
  base_cost: number;
  /** Marginal CNY per additional kg of chargeable weight. */
  per_kg: number;
  /** cm³ per kg used to derive volumetric (dimensional) weight. */
  volumetric_divisor: number;
}

export interface Agent {
  id: string;
  name: string;
  /** Service fee as a percentage of goods value (CNY). */
  service_fee_pct: number;
  shipping_lines: ShippingLine[];
  notes?: string;
  active: boolean;
}

export interface CustomsRule {
  country_code: string;
  country_name: string;
  currency: string;
  /** Import VAT / GST percentage applied to (goods + shipping) when taxed. */
  vat_pct: number;
  /** Value (in USD) below which a parcel is unlikely to be taxed. */
  de_minimis_usd: number;
  duty_notes: string;
}

/** Approximate USD per 1 CNY, used only for the de-minimis threshold check. */
export const DEFAULT_USD_PER_CNY = 0.14;

/** Default FX presets (target currency units per 1 CNY). Editable in the UI. */
export const FX_PRESETS: Record<string, number> = {
  USD: 0.14,
  EUR: 0.13,
  GBP: 0.11,
  CAD: 0.19,
  AUD: 0.21,
};

export const AGENTS: Agent[] = [
  {
    id: 'cnfans',
    name: 'CNFans',
    service_fee_pct: 0,
    active: true,
    notes: 'No per-item service fee; earns on shipping margin. Popular for spreadsheet imports.',
    shipping_lines: [
      { line: 'GD-EUB (Economy)', base_cost: 40, per_kg: 55, volumetric_divisor: 8000 },
      { line: 'CNE Standard', base_cost: 55, per_kg: 68, volumetric_divisor: 6000 },
      { line: 'YunExpress', base_cost: 60, per_kg: 78, volumetric_divisor: 6000 },
      { line: 'DHL Express', base_cost: 120, per_kg: 145, volumetric_divisor: 5000 },
    ],
  },
  {
    id: 'kakobuy',
    name: 'Kakobuy',
    service_fee_pct: 0,
    active: true,
    notes: 'No service fee; frequent shipping coupons. Good default for beginners.',
    shipping_lines: [
      { line: 'Global Economy', base_cost: 38, per_kg: 52, volumetric_divisor: 8000 },
      { line: 'GD-EUB', base_cost: 45, per_kg: 60, volumetric_divisor: 6000 },
      { line: 'EMS', base_cost: 90, per_kg: 110, volumetric_divisor: 6000 },
      { line: 'DHL', base_cost: 118, per_kg: 140, volumetric_divisor: 5000 },
    ],
  },
  {
    id: 'superbuy',
    name: 'Superbuy',
    service_fee_pct: 3,
    active: true,
    notes: 'Charges a service fee but strong QC photos and warehouse tools.',
    shipping_lines: [
      { line: 'Economy Air', base_cost: 50, per_kg: 62, volumetric_divisor: 8000 },
      { line: 'SAL', base_cost: 65, per_kg: 75, volumetric_divisor: 6000 },
      { line: 'EMS', base_cost: 95, per_kg: 118, volumetric_divisor: 6000 },
      { line: 'DHL', base_cost: 130, per_kg: 150, volumetric_divisor: 5000 },
    ],
  },
  {
    id: 'sugargoo',
    name: 'Sugargoo',
    service_fee_pct: 0,
    active: true,
    notes: 'No service fee; broad line selection, decent consolidation.',
    shipping_lines: [
      { line: 'Economy Line', base_cost: 42, per_kg: 54, volumetric_divisor: 8000 },
      { line: 'GD-EUB', base_cost: 50, per_kg: 63, volumetric_divisor: 6000 },
      { line: 'YunExpress', base_cost: 58, per_kg: 74, volumetric_divisor: 6000 },
      { line: 'DHL', base_cost: 122, per_kg: 143, volumetric_divisor: 5000 },
    ],
  },
  {
    id: 'acbuy',
    name: 'ACBuy',
    service_fee_pct: 2,
    active: true,
    notes: 'Small service fee; supports spreadsheet + affiliate imports.',
    shipping_lines: [
      { line: 'Economy', base_cost: 40, per_kg: 56, volumetric_divisor: 8000 },
      { line: 'CNE', base_cost: 52, per_kg: 66, volumetric_divisor: 6000 },
      { line: 'EMS', base_cost: 92, per_kg: 112, volumetric_divisor: 6000 },
      { line: 'DHL', base_cost: 120, per_kg: 142, volumetric_divisor: 5000 },
    ],
  },
];

export const CUSTOMS_RULES: CustomsRule[] = [
  {
    country_code: 'US',
    country_name: 'United States',
    currency: 'USD',
    vat_pct: 0,
    de_minimis_usd: 800,
    duty_notes:
      'Section 321 de minimis is $800 per person per day — shipments under that value normally clear with no duty and no federal VAT. State sales/use tax is not collected at import. (De minimis rules for China-origin goods are under active review — verify before large hauls.)',
  },
  {
    country_code: 'GB',
    country_name: 'United Kingdom',
    currency: 'GBP',
    vat_pct: 20,
    de_minimis_usd: 170,
    duty_notes:
      'Import VAT of 20% applies to goods over ~£135 (~$170). Duty is generally 0% under £135 and only bites above ~£135 of goods value depending on category.',
  },
  {
    country_code: 'EU',
    country_name: 'European Union (generic)',
    currency: 'EUR',
    vat_pct: 21,
    de_minimis_usd: 1,
    duty_notes:
      'Since July 2021 there is NO VAT de minimis in the EU — VAT applies from the first euro. The €150 threshold only exempts customs DUTY, not VAT. Pick your specific country for the exact VAT rate.',
  },
  {
    country_code: 'DE',
    country_name: 'Germany',
    currency: 'EUR',
    vat_pct: 19,
    de_minimis_usd: 1,
    duty_notes: 'VAT 19% from the first euro. Duty exempt under €150 of goods value.',
  },
  {
    country_code: 'FR',
    country_name: 'France',
    currency: 'EUR',
    vat_pct: 20,
    de_minimis_usd: 1,
    duty_notes: 'VAT 20% from the first euro. Duty exempt under €150 of goods value.',
  },
  {
    country_code: 'NL',
    country_name: 'Netherlands',
    currency: 'EUR',
    vat_pct: 21,
    de_minimis_usd: 1,
    duty_notes: 'VAT 21% from the first euro. Duty exempt under €150 of goods value.',
  },
  {
    country_code: 'ES',
    country_name: 'Spain',
    currency: 'EUR',
    vat_pct: 21,
    de_minimis_usd: 1,
    duty_notes: 'VAT 21% from the first euro. Duty exempt under €150 of goods value.',
  },
  {
    country_code: 'IT',
    country_name: 'Italy',
    currency: 'EUR',
    vat_pct: 22,
    de_minimis_usd: 1,
    duty_notes: 'VAT 22% from the first euro. Duty exempt under €150 of goods value.',
  },
  {
    country_code: 'CA',
    country_name: 'Canada',
    currency: 'CAD',
    vat_pct: 12,
    de_minimis_usd: 15,
    duty_notes:
      'De minimis for courier shipments is CA$20 (~$15). GST/HST + provincial tax averages ~12% and applies above that; couriers usually add a brokerage fee.',
  },
  {
    country_code: 'AU',
    country_name: 'Australia',
    currency: 'AUD',
    vat_pct: 10,
    de_minimis_usd: 660,
    duty_notes:
      'GST of 10% applies. Low-value threshold is AU$1000 (~$660) for duty; GST is often collected at checkout for larger sellers but casual imports under AU$1000 usually clear without duty.',
  },
];

export function getAgent(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getCustomsRule(code: string): CustomsRule | undefined {
  return CUSTOMS_RULES.find((c) => c.country_code === code);
}
