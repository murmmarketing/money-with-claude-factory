import { createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { serviceClient } from './serverSupabase';

/**
 * Deliberately lightweight auth: an HMAC-signed, httpOnly cookie carrying
 * { email, exp }. No passwords, no session table. The same signing scheme also
 * powers emailed magic links (a token in a URL that, when opened, mints the
 * cookie). Access to the reader/downloads is decided by looking up an
 * entitlement row for the cookie's email — no plans, just "owns the Playbook".
 */

export const SESSION_COOKIE = 'trp_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year — lifetime access
const MAGIC_TTL_SECONDS = 60 * 60 * 24 * 14; // magic links valid 14 days
export const PRODUCT = 'playbook';

interface SessionPayload {
  email: string;
  exp: number; // unix seconds
}

function secret(): string {
  return process.env.ENTITLEMENT_SECRET || 'repplaybook-dev-entitlement-secret';
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(data: string): string {
  return b64url(createHmac('sha256', secret()).update(data).digest());
}

function mint(email: string, ttlSeconds: number): string {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/** Create a signed session token for an email (used by verify + magic routes). */
export function mintToken(email: string): { token: string; maxAge: number } {
  return { token: mint(email, SESSION_TTL_SECONDS), maxAge: SESSION_TTL_SECONDS };
}

/** Create a shorter-lived token to embed in an emailed magic link. */
export function mintMagicToken(email: string): string {
  return mint(email, MAGIC_TTL_SECONDS);
}

/** Verify + decode any token minted above, returning the email or null. */
export function verifyToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as SessionPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.email;
  } catch {
    return null;
  }
}

/** Read the current session email from the request cookies (server-side). */
export function getSessionEmail(): string | null {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** True when an entitlement row exists for this email (owns the Playbook). */
export async function hasEntitlement(email: string): Promise<boolean> {
  const sb = serviceClient();
  if (!sb) return false;
  const { data } = await sb
    .from('repplaybook_entitlements')
    .select('email')
    .eq('email', email)
    .eq('product', PRODUCT)
    .maybeSingle();
  return Boolean(data);
}

/** Grant (idempotent) an entitlement for an email. Server-only. */
export async function grantEntitlement(
  email: string,
  source: 'stripe' | 'manual' | 'gumroad'
): Promise<boolean> {
  const sb = serviceClient();
  if (!sb) return false;
  const { error } = await sb.from('repplaybook_entitlements').upsert(
    { email, product: PRODUCT, source, granted_at: new Date().toISOString() },
    { onConflict: 'email' }
  );
  return !error;
}

/**
 * The single gate every members-only route/page calls first.
 * Returns the caller's email when they are logged in AND own the Playbook.
 */
export async function requireOwner(): Promise<
  | { ok: true; email: string }
  | { ok: false; status: number; error: string }
> {
  const email = getSessionEmail();
  if (!email) return { ok: false, status: 401, error: 'not_logged_in' };
  const owns = await hasEntitlement(email);
  if (!owns) return { ok: false, status: 403, error: 'no_access' };
  return { ok: true, email };
}
