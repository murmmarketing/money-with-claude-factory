import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Waitlist capture. If a Supabase REST endpoint + key are configured, the
 * email is inserted into the `meaningandsay_waitlist` table. Otherwise the
 * request still succeeds (logged server-side) so the UX never breaks with
 * zero env. No SDK dependency — plain fetch to Supabase's REST API.
 */
export async function POST(req: Request) {
  let email = "";
  let category = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim();
    category = String(body?.category ?? "").trim();
  } catch {
    /* ignore */
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    try {
      await fetch(`${url}/rest/v1/meaningandsay_waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify([
          { email, category, created_at: new Date().toISOString() }
        ])
      });
    } catch {
      /* fall through — never block the user */
    }
  } else {
    console.log(`[MeaningAndSay] Waitlist signup: ${email} (${category})`);
  }

  return NextResponse.json({ ok: true });
}
