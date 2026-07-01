/** Formatting + slug helpers shared across server and client. */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
};

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code?.toUpperCase()] || (code ? code + ' ' : '$');
}

export function money(amount: number, currency = 'USD'): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${currencySymbol(currency)}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function cny(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `¥${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function grams(g: number): string {
  const n = Number.isFinite(g) ? g : 0;
  return n >= 1000 ? `${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg` : `${Math.round(n)} g`;
}

/** URL-safe slug from a title + short random suffix for uniqueness. */
export function makeSlug(title: string): string {
  const base = (title || 'haul')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'haul';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
