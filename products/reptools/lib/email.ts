/**
 * Thin Resend wrapper via fetch (no SDK dependency). Every function degrades
 * gracefully: when RESEND_API_KEY is absent it returns { sent: false } instead
 * of throwing, so login and cron flows keep working in dev / pre-launch.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  return process.env.RESEND_FROM || 'HaulHQ <onboarding@resend.dev>';
}

async function send(to: string, subject: string, html: string): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, error: 'not_configured' };
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ from: fromAddress(), to, subject, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { sent: false, error: `resend_${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: 'network' };
  }
}

const shell = (inner: string) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0d12;color:#e8edf2;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
    <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;margin-bottom:20px">
      Haul<span style="color:#b6ff3c">HQ</span>
    </div>
    ${inner}
    <div style="margin-top:28px;font-size:12px;color:#8a94a3">
      HaulHQ — the command center for your reps hauls.
    </div>
  </div>`;

export function sendLoginCode(to: string, code: string) {
  return send(
    to,
    `${code} is your HaulHQ login code`,
    shell(`
      <p style="margin:0 0 12px;color:#8a94a3">Enter this code to sign in. It expires in 10 minutes.</p>
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#b6ff3c;background:#12171f;border:1px solid #232c38;border-radius:10px;padding:16px;text-align:center">
        ${code}
      </div>
      <p style="margin:16px 0 0;color:#8a94a3;font-size:13px">If you didn't request this, ignore this email.</p>
    `)
  );
}

export function sendWatchReminder(
  to: string,
  watches: Array<{ label: string; product_url: string; target_price_cny: number | null }>
) {
  const rows = watches
    .map(
      (w) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #232c38">${escapeHtml(w.label || 'Item')}</td>
        <td style="padding:8px 0;border-bottom:1px solid #232c38;color:#b6ff3c;font-family:ui-monospace,monospace">${
          w.target_price_cny != null ? '¥' + w.target_price_cny : '—'
        }</td>
        <td style="padding:8px 0;border-bottom:1px solid #232c38"><a href="${escapeHtml(
          w.product_url
        )}" style="color:#35e0e0">Check</a></td>
      </tr>`
    )
    .join('');
  return send(
    to,
    `Re-check ${watches.length} watched item${watches.length === 1 ? '' : 's'} on HaulHQ`,
    shell(`
      <p style="margin:0 0 12px;color:#8a94a3">Time to re-check your watched items for restocks or price drops:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <p style="margin:16px 0 0;color:#8a94a3;font-size:12px">HaulHQ v1 reminds you to re-check manually — no live scraping yet.</p>
    `)
  );
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
