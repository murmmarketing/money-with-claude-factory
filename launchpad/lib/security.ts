import { createHmac } from 'crypto';

/** RFC-ish email shape check; real validation is the domain + disposable pass. */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Inline disposable / temp-mail domain blocklist. Real paid-conversion gating
 * means we care about signup quality; throwaway inboxes poison the numerator.
 * Kept as a Set for O(1) lookup; extend as new throwaway providers appear.
 */
export const DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.net',
  'sharklasers.com',
  'grr.la',
  '10minutemail.com',
  '10minutemail.net',
  'temp-mail.org',
  'tempmail.com',
  'tempmailo.com',
  'tempr.email',
  'throwawaymail.com',
  'getnada.com',
  'nada.email',
  'dispostable.com',
  'yopmail.com',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'mailnesia.com',
  'maildrop.cc',
  'mailcatch.com',
  'fakeinbox.com',
  'fake-mail.net',
  'spamgourmet.com',
  'mytemp.email',
  'mohmal.com',
  'moakt.com',
  'emailondeck.com',
  'mintemail.com',
  'tempinbox.com',
  'discard.email',
  'discardmail.com',
  'inboxkitten.com',
  'burnermail.io',
  'wegwerfmail.de',
  'einrot.com',
  'tempmailaddress.com',
  'mailtemp.net',
  'anonbox.net',
  'spam4.me',
]);

export type EmailResult =
  | { ok: true; email: string; domain: string }
  | { ok: false };

/** Trim + lowercase, validate shape, reject disposable domains. */
export function normalizeEmail(raw: unknown): EmailResult {
  if (typeof raw !== 'string') return { ok: false };
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false };
  const domain = email.slice(email.lastIndexOf('@') + 1);
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) return { ok: false };
  return { ok: true, email, domain };
}

/** First hop from X-Forwarded-For, falling back to a stable placeholder. */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('cf-connecting-ip')?.trim() ||
    '0.0.0.0'
  );
}

/**
 * HMAC-SHA256 of the client IP keyed by SERVER_SALT. We store the hash, never
 * the raw IP, so per-IP rate reasoning stays possible without holding PII.
 */
export function ipHash(req: Request): string {
  const salt = process.env.SERVER_SALT || 'factory-dev-salt';
  return createHmac('sha256', salt).update(clientIp(req)).digest('hex');
}

/**
 * Cloudflare Turnstile server-side verification. When TURNSTILE_SECRET is
 * absent (local/dev) we skip the check and return true so the form still works;
 * in production the secret gates every write.
 */
export async function verifyTurnstile(
  token: unknown,
  req: Request
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // graceful degrade: not configured
  if (typeof token !== 'string' || !token) return false;
  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    body.set('remoteip', clientIp(req));
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        // never let a slow captcha endpoint hang the request forever
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return false;
    const json: any = await res.json();
    return json?.success === true;
  } catch {
    return false;
  }
}

/** Non-empty honeypot => silent bot. */
export function honeypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Coarse UA capture, trimmed to keep rows small. */
export function userAgent(req: Request): string {
  return (req.headers.get('user-agent') || '').slice(0, 400);
}
