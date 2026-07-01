import { NextResponse } from 'next/server';
import { getSessionEmail, hasEntitlement } from '../../../lib/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns the caller's login + ownership state for client components. */
export async function GET() {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ loggedIn: false, owns: false });
  const owns = await hasEntitlement(email);
  return NextResponse.json({ loggedIn: true, owns, email });
}
