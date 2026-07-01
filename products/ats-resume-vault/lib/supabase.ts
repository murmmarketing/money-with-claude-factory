// Optional persistence via Supabase REST (no SDK dependency). Used to store waitlist
// emails and recorded purchases. All calls are no-ops when env is missing, so the
// app builds and runs with zero configuration.
//
// Expected tables (create in the factory project tcatgldshmpgttmputzo if you want
// persistence):
//   rv_waitlist:  id (uuid, default gen_random_uuid), email text, product text, created_at timestamptz default now()
//   rv_purchases: id (uuid, default gen_random_uuid), email text, product text, session_id text, created_at timestamptz default now()

function creds(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function supabaseEnabled(): boolean {
  return creds() !== null;
}

async function insert(table: string, row: Record<string, unknown>): Promise<boolean> {
  const c = creds();
  if (!c) return false;
  try {
    const res = await fetch(`${c.url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(row)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function recordWaitlist(email: string, product: string): Promise<boolean> {
  return insert("rv_waitlist", { email, product });
}

export async function recordPurchase(email: string, product: string, sessionId: string): Promise<boolean> {
  return insert("rv_purchases", { email, product, session_id: sessionId });
}
