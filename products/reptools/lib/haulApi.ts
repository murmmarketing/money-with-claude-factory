import type { HaulItem } from './types';

/** Sanitize an incoming haul payload from an authenticated Pro user. */
export interface HaulPayload {
  title: string;
  destination_country: string;
  currency: string;
  fx_rate: number;
  agent: string;
  shipping_line: string;
  notes: string;
  items: HaulItem[];
}

const MAX_ITEMS = 200;

function str(v: unknown, max = 500): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}
function n(v: unknown, fallback = 0): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

export function sanitizeHaul(body: any): HaulPayload | null {
  if (!body || typeof body !== 'object') return null;
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const items: HaulItem[] = rawItems.map((it: any, idx: number) => ({
    name: str(it?.name, 200),
    product_url: str(it?.product_url, 1000),
    cny_price: Math.max(0, n(it?.cny_price)),
    qty: Math.max(1, Math.floor(n(it?.qty, 1))),
    weight_grams: Math.max(0, Math.floor(n(it?.weight_grams))),
    category: str(it?.category, 80),
    agent: str(it?.agent, 60),
    shipping_line: str(it?.shipping_line, 80),
    qc_photo_url: str(it?.qc_photo_url, 1000),
    notes: str(it?.notes, 1000),
    sort_order: Number.isFinite(it?.sort_order) ? Number(it.sort_order) : idx,
  }));

  return {
    title: str(body.title, 160) || 'Untitled haul',
    destination_country: str(body.destination_country, 4) || 'US',
    currency: (str(body.currency, 4) || 'USD').toUpperCase(),
    fx_rate: n(body.fx_rate, 0.14) || 0.14,
    agent: str(body.agent, 60),
    shipping_line: str(body.shipping_line, 80),
    notes: str(body.notes, 2000),
    items,
  };
}
