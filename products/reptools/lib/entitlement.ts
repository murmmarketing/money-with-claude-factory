import { createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { serviceClient } from './serverSupabase';

/**
 * Deliberately lightweight auth: an HMAC-signed, httpOnly cookie carrying
 * { email, exp }. No passwords, no session table. A login code (emailed) is the
 * only way to mint one. Pro API routes verify the cookie, then read the
 * entitlements table for the email to decide access.
 */

export const SESSION_COOKIE = 'hhq_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface SessionPayload {
  email: string;
  exp: number; // unix seconds
}

function secret(): string {
  return process.env.ENTITLEMENT_SECRET || 'haulhq-dev-entitlement-secret';
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

/** Create a signed token for an email (used by the verify route). */
export function mintToken(email: string): { token: string; maxAge: number } {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64url(JSON.stringify(payload));
  const token = `${body}.${sign(body)}`;
  return { token, maxAge: SESSION_TTL_SECONDS };
}

/** Verify + decode a token, returning the email or null. */
export function verifyToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  // constant-time-ish compare on equal-length strings
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

export interface Entitlement {
  email: string;
  plan: 'monthly' | 'annual' | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

/** True when the entitlement grants active Pro access right now. */
export function isEntitlementActive(e: Entitlement | null): boolean {
  if (!e) return false;
  if (e.status !== 'active' && e.status !== 'trialing') return false;
  if (e.current_period_end) {
    const end = new Date(e.current_period_end).getTime();
    // small grace window for clock skew / renewal lag
    if (Number.isFinite(end) && end + 60_000 < Date.now()) return false;
  }
  return true;
}

/** Look up the entitlement row for an email (server-only). */
export async function getEntitlement(email: string): Promise<Entitlement | null> {
  const sb = serviceClient();
  if (!sb) return null;
  const { data } = await sb
    .from('entitlements')
    .select('email,plan,status,stripe_customer_id,stripe_subscription_id,current_period_end')
    .eq('email', email)
    .maybeSingle();
  return (data as Entitlement) || null;
}

/**
 * Resolve the caller: returns their email and whether they have active Pro.
 * The single gate every Pro API route calls first.
 */
export async function requirePro(): Promise<
  | { ok: true; email: string; entitlement: Entitlement }
  | { ok: false; status: number; error: string }
> {
  const email = getSessionEmail();
  if (!email) return { ok: false, status: 401, error: 'not_logged_in' };
  const entitlement = await getEntitlement(email);
  if (!isEntitlementActive(entitlement)) {
    return { ok: false, status: 403, error: 'not_pro' };
  }
  return { ok: true, email, entitlement: entitlement as Entitlement };
}
