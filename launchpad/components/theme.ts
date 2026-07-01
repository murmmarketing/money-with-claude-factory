import type { CSSProperties } from 'react';
import type { Brand } from './types';
import { fontVars } from './fonts';

/**
 * Map a Brand to CSS custom properties (with COALESCE defaults) so a wrapper
 * <div style={brandToCssVars(brand)}> themes every child via var(--*).
 */
export function brandToCssVars(brand: Brand = {}): CSSProperties {
  const radius =
    typeof brand.radius === 'number' ? `${brand.radius}px` : brand.radius || '12px';
  const f = fontVars(brand.fontKey);

  const vars: Record<string, string> = {
    '--accent': brand.accent || '#2f6df6',
    '--accent-ink': brand.accentInk || '#ffffff',
    '--bg': brand.bg || '#ffffff',
    '--surface': brand.surface || '#f8fafc',
    '--ink': brand.ink || '#101828',
    '--muted': brand.muted || '#475467',
    '--border': brand.border || '#e5e7eb',
    '--radius': radius,
    '--font-display': f.display,
    '--font-text': f.text,
  };

  return vars as CSSProperties;
}

/** Derive a 1-2 char monogram from an explicit override or a headline/id. */
export function monogramFor(brand: Brand | undefined, headline?: string, id?: string): string {
  if (brand?.monogram) return brand.monogram.slice(0, 2).toUpperCase();
  const src = (headline || id || '').trim();
  if (!src) return '·';
  const words = src.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
