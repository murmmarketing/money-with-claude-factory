import { NextRequest, NextResponse } from "next/server";
import { recordWaitlist, supabaseEnabled } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let email = "";
  let product = "";
  try {
    const body = await req.json();
    email = String(body.email || "").trim();
    product = String(body.product || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !email.includes("@") || email.length > 200) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  if (supabaseEnabled()) {
    await recordWaitlist(email, product || "unknown");
  } else {
    // No persistence configured — log so the owner can still capture interest.
    console.log(`[waitlist] ${email} — ${product || "unknown"}`);
  }

  return NextResponse.json({ ok: true });
}
