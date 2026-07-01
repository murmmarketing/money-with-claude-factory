import { createHmac, randomInt, timingSafeEqual } from 'crypto';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Small disposable-domain blocklist so throwaway inboxes can't claim Pro trials. */
export const DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com', 'guerrillamail.com', 'sharklasers.com', 'grr.la',
  '10minutemail.com', 'temp-mail.org', 'tempmail.com', 'tempmailo.com',
  'throwawaymail.com', 'getnada.com', 'yopmail.com', 'trashmail.com',
  'maildrop.cc', 'mailcatch.com', 'fakeinbox.com', 'discard.email',
  'inboxkitten.com', 'burnermail.io', 'mohmal.com', 'moakt.com',
  'emailondeck.com', 'spam4.me', 'dispostable.com', 'mintemail.com',
]);

export type EmailResult = { ok: true; email: string; domain: string } | { ok: false };

export function normalizeEmail(raw: unknown): EmailResult {
  if (typeof raw !== 'string') return { ok: false };
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false };
  const domain = email.slice(email.lastIndexOf('@') + 1);
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) return { ok: false };
  return { ok: true, email, domain };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || '0.0.0.0';
}

export function ipHash(req: Request): string {
  const salt = process.env.SERVER_SALT || 'haulhq-dev-salt';
  return createHmac('sha256', salt).update(clientIp(req)).digest('hex');
}

/** Cryptographically-random 6-digit login code. */
export function genLoginCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** Salted SHA-256 of a login code, so plaintext codes are never stored. */
export function hashCode(code: string): string {
  const salt = process.env.SERVER_SALT || 'haulhq-dev-salt';
  return createHmac('sha256', salt).update(code).digest('hex');
}

/** Constant-time hex-hash comparison. */
export function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ab.length !== bb.length || ab.length === 0) return false;
  return timingSafeEqual(ab, bb);
}
