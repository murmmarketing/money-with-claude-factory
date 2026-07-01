import { NextResponse } from 'next/server';
import { getSessionEmail, getEntitlement, isEntitlementActive } from '../../../lib/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns the current session email + Pro state. Never throws. */
export async function GET() {
  const email = getSessionEmail();
  if (!email) {
    return NextResponse.json({ email: null, pro: false, entitlement: null });
  }
  const entitlement = await getEntitlement(email);
  return NextResponse.json({
    email,
    pro: isEntitlementActive(entitlement),
    entitlement: entitlement
      ? {
          plan: entitlement.plan,
          status: entitlement.status,
          current_period_end: entitlement.current_period_end,
        }
      : null,
  });
}
