/**
 * Pure, dependency-free landed-cost engine. Single source of truth used by the
 * client Haul Builder, the Pro multi-agent compare, the public share page, and
 * the CSV export — so a haul's numbers are identical everywhere.
 *
 * Currency model: item prices are entered in CNY. `fxRate` converts CNY -> the
 * buyer's target currency (units of target per 1 CNY). Shipping-line presets are
 * also in CNY. The de-minimis check is done in USD via `usdPerCny` because
 * thresholds are published in USD.
 */

import {
  DEFAULT_USD_PER_CNY,
  type Agent,
  type CustomsRule,
  type ShippingLine,
} from './referenceData';

export interface HaulItemInput {
  name?: string;
  product_url?: string;
  cny_price: number;
  qty: number;
  weight_grams: number;
}

export interface ShippingInput {
  baseCost: number; // CNY
  perKg: number; // CNY per kg
  volumetricDivisor: number; // cm³ per kg
  /** Optional total parcel volume in cm³ for a dimensional-weight warning. */
  volumeCm3?: number;
}

export interface LandedCostInput {
  items: HaulItemInput[];
  fxRate: number; // target currency per 1 CNY
  usdPerCny?: number; // USD per 1 CNY (de-minimis check)
  serviceFeePct: number;
  shipping: ShippingInput;
  vatPct: number;
  deMinimisUsd: number;
}

export interface LandedCostResult {
  itemCount: number;
  totalQty: number;
  totalWeightG: number;
  volumetricWeightG: number;
  chargeableWeightG: number;
  volumetricApplies: boolean;
  goodsCny: number;
  goodsTarget: number;
  serviceFeeTarget: number;
  shippingTarget: number;
  taxableUsd: number;
  overDeMinimis: boolean;
  taxTarget: number;
  landedTarget: number;
  /** Effective all-in cost per unit shipped, in target currency. */
  perUnitTarget: number;
  /** Landed cost as a multiple of raw goods cost (e.g. 1.42 = +42% overhead). */
  markup: number;
}

function n(v: unknown, fallback = 0): number {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export function computeLandedCost(input: LandedCostInput): LandedCostResult {
  const fx = n(input.fxRate, 0.14) || 0.14;
  const usdPerCny = n(input.usdPerCny, DEFAULT_USD_PER_CNY) || DEFAULT_USD_PER_CNY;
  const items = Array.isArray(input.items) ? input.items : [];

  let goodsCny = 0;
  let totalQty = 0;
  let totalWeightG = 0;
  for (const it of items) {
    const price = Math.max(0, n(it.cny_price));
    const qty = Math.max(0, Math.floor(n(it.qty, 1)));
    const weight = Math.max(0, n(it.weight_grams));
    goodsCny += price * qty;
    totalQty += qty;
    totalWeightG += weight * qty;
  }

  // Volumetric (dimensional) weight, if the buyer supplied parcel volume.
  const divisor = n(input.shipping.volumetricDivisor, 6000) || 6000;
  const volumeCm3 = Math.max(0, n(input.shipping.volumeCm3, 0));
  const volumetricWeightG = volumeCm3 > 0 ? (volumeCm3 / divisor) * 1000 : 0;
  const chargeableWeightG = Math.max(totalWeightG, volumetricWeightG);
  const volumetricApplies = volumetricWeightG > totalWeightG && volumeCm3 > 0;

  // Shipping in CNY: base + marginal per chargeable kg.
  const chargeableKg = chargeableWeightG / 1000;
  const shippingCny =
    goodsCny > 0 || chargeableKg > 0
      ? Math.max(0, n(input.shipping.baseCost)) +
        Math.max(0, n(input.shipping.perKg)) * chargeableKg
      : 0;

  const serviceFeeCny = goodsCny * (Math.max(0, n(input.serviceFeePct)) / 100);

  // De-minimis is assessed on goods value in USD.
  const taxableUsd = goodsCny * usdPerCny;
  const overDeMinimis = taxableUsd > Math.max(0, n(input.deMinimisUsd));

  // VAT/GST (when taxed) applies to goods + shipping, converted to target.
  const goodsTarget = goodsCny * fx;
  const shippingTarget = shippingCny * fx;
  const serviceFeeTarget = serviceFeeCny * fx;
  const vatPct = Math.max(0, n(input.vatPct));
  const taxTarget =
    overDeMinimis && vatPct > 0 ? (goodsTarget + shippingTarget) * (vatPct / 100) : 0;

  const landedTarget = goodsTarget + serviceFeeTarget + shippingTarget + taxTarget;

  return {
    itemCount: items.length,
    totalQty,
    totalWeightG: Math.round(totalWeightG),
    volumetricWeightG: Math.round(volumetricWeightG),
    chargeableWeightG: Math.round(chargeableWeightG),
    volumetricApplies,
    goodsCny: round2(goodsCny),
    goodsTarget: round2(goodsTarget),
    serviceFeeTarget: round2(serviceFeeTarget),
    shippingTarget: round2(shippingTarget),
    taxableUsd: round2(taxableUsd),
    overDeMinimis,
    taxTarget: round2(taxTarget),
    landedTarget: round2(landedTarget),
    perUnitTarget: totalQty > 0 ? round2(landedTarget / totalQty) : 0,
    markup: goodsTarget > 0 ? round2(landedTarget / goodsTarget) : 0,
  };
}

export interface AgentQuote {
  agentId: string;
  agentName: string;
  line: string;
  serviceFeePct: number;
  landedTarget: number;
  shippingTarget: number;
  serviceFeeTarget: number;
  result: LandedCostResult;
}

/**
 * Score the SAME haul across every agent's cheapest shipping line and return the
 * quotes sorted by cheapest total landed cost. Powers the Pro compare view.
 */
export function compareAgents(
  base: Omit<LandedCostInput, 'serviceFeePct' | 'shipping'>,
  agents: Agent[]
): AgentQuote[] {
  const quotes: AgentQuote[] = [];
  for (const agent of agents) {
    if (!agent.active) continue;
    let best: AgentQuote | null = null;
    for (const line of agent.shipping_lines) {
      const result = computeLandedCost({
        ...base,
        serviceFeePct: agent.service_fee_pct,
        shipping: {
          baseCost: line.base_cost,
          perKg: line.per_kg,
          volumetricDivisor: line.volumetric_divisor,
        },
      });
      const quote: AgentQuote = {
        agentId: agent.id,
        agentName: agent.name,
        line: line.line,
        serviceFeePct: agent.service_fee_pct,
        landedTarget: result.landedTarget,
        shippingTarget: result.shippingTarget,
        serviceFeeTarget: result.serviceFeeTarget,
        result,
      };
      if (!best || quote.landedTarget < best.landedTarget) best = quote;
    }
    if (best) quotes.push(best);
  }
  return quotes.sort((a, b) => a.landedTarget - b.landedTarget);
}

export interface SplitPlan {
  recommended: boolean;
  parcels: number;
  perParcelGoodsUsd: number;
  estTaxSavedTarget: number;
  reason: string;
}

/**
 * De-minimis split-shipment planner. If a single haul is over the destination
 * threshold, work out how many parcels would keep each under de minimis and
 * estimate the VAT/GST saved (honest: ignores extra shipping base costs, which
 * the UI surfaces separately).
 */
export function planSplit(
  input: LandedCostInput,
  rule: Pick<CustomsRule, 'de_minimis_usd' | 'vat_pct'>
): SplitPlan {
  const usdPerCny = n(input.usdPerCny, DEFAULT_USD_PER_CNY) || DEFAULT_USD_PER_CNY;
  const goodsCny = input.items.reduce(
    (s, it) => s + Math.max(0, n(it.cny_price)) * Math.max(0, Math.floor(n(it.qty, 1))),
    0
  );
  const goodsUsd = goodsCny * usdPerCny;
  const deMinimis = Math.max(0, n(rule.de_minimis_usd));

  if (deMinimis <= 1) {
    return {
      recommended: false,
      parcels: 1,
      perParcelGoodsUsd: Math.round(goodsUsd),
      estTaxSavedTarget: 0,
      reason:
        'Your destination has no VAT de minimis — splitting will not avoid VAT (each parcel is still taxed from the first unit). Consolidate to minimise shipping instead.',
    };
  }
  if (goodsUsd <= deMinimis) {
    return {
      recommended: false,
      parcels: 1,
      perParcelGoodsUsd: Math.round(goodsUsd),
      estTaxSavedTarget: 0,
      reason: `Your haul (~$${Math.round(goodsUsd)}) is already under the $${deMinimis} de-minimis threshold — one parcel, no import tax expected.`,
    };
  }

  const parcels = Math.max(2, Math.ceil(goodsUsd / deMinimis));
  const current = computeLandedCost(input);
  const estTaxSavedTarget = current.taxTarget; // splitting under de minimis removes VAT

  return {
    recommended: estTaxSavedTarget > 0,
    parcels,
    perParcelGoodsUsd: Math.round(goodsUsd / parcels),
    estTaxSavedTarget: round2(estTaxSavedTarget),
    reason: `Splitting into ${parcels} parcels of ~$${Math.round(
      goodsUsd / parcels
    )} each keeps every parcel under the $${deMinimis} de-minimis line — estimated tax avoided ≈ ${round2(
      estTaxSavedTarget
    )}. Weigh this against paying the shipping base cost ${parcels}×.`,
  };
}
