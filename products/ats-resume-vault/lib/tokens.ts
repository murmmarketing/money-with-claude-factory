import crypto from "crypto";

// Signed, expiring download tokens. A buyer receives a token after Checkout that
// unlocks their kit on /download without any login. Verified server-side.

function secret(): string {
  return process.env.DOWNLOAD_TOKEN_SECRET || "resumevault-dev-secret-change-me";
}

export interface TokenPayload {
  // "all" = full vault, otherwise an industry slug
  product: string;
  exp: number; // unix seconds
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signToken(product: string, ttlDays = 365): string {
  const payload: TokenPayload = {
    product,
    exp: Math.floor(Date.now() / 1000) + ttlDays * 86400
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token: string | null | undefined): TokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as TokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
