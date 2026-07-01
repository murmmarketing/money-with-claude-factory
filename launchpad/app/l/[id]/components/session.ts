// Shared client helpers for anonymous session id + first-touch UTM capture.
// Kept in one module so the form, deposit CTA, and beacon all agree on the sid.

export function getSid(): string {
  try {
    let s = localStorage.getItem('_fsid');
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('_fsid', s);
    }
    return s;
  } catch {
    return 'nosid';
  }
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

/** First-touch UTM: capture once into localStorage, then always prefer it. */
export function firstTouchUtm(): Record<string, string> {
  try {
    const stored = localStorage.getItem('_ft');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Object.keys(parsed).length) return parsed;
    }
    const p = new URLSearchParams(location.search);
    const o: Record<string, string> = {};
    UTM_KEYS.forEach((k) => {
      const v = p.get(k);
      if (v) o[k] = v;
    });
    if (Object.keys(o).length) {
      localStorage.setItem('_ft', JSON.stringify(o));
    }
    return o;
  } catch {
    return {};
  }
}

/** Referral id from ?ref=... on the current URL. */
export function referrer(): string | null {
  try {
    return new URLSearchParams(location.search).get('ref');
  } catch {
    return null;
  }
}
