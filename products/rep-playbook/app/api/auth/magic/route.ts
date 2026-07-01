import { NextResponse } from 'next/server';
import { verifyToken, mintToken, SESSION_COOKIE } from '../../../../lib/entitlement';
import { siteOrigin } from '../../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Magic-link consumer. The purchase email links here with a signed token.
 * If valid, we mint a full-length session cookie and redirect into the library.
 * This is the zero-friction path buyers use right after paying.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const email = verifyToken(token);
  const origin = siteOrigin(req);

  if (!email) {
    return NextResponse.redirect(`${origin}/login?magic=expired`);
  }

  const { token: session, maxAge } = mintToken(email);
  const res = NextResponse.redirect(`${origin}/read?welcome=1`);
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return res;
}
