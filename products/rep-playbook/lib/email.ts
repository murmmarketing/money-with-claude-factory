/**
 * Thin Resend wrapper via fetch (no SDK dependency). Every function degrades
 * gracefully: when RESEND_API_KEY is absent it returns { sent: false } instead
 * of throwing, so login + purchase flows keep working in dev / pre-launch.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  return process.env.RESEND_FROM || 'The Rep Playbook <onboarding@resend.dev>';
}

async function send(
  to: string,
  subject: string,
  html: string
): Promise<{ sent: boolean; error?: string }> {
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
  } catch {
    return { sent: false, error: 'network' };
  }
}

const shell = (inner: string) => `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#fbf6ec;color:#211c16;padding:36px;border-radius:14px;max-width:520px;margin:0 auto;border:1px solid #e3d8c2">
    <div style="font-weight:700;font-size:22px;letter-spacing:-0.01em;margin-bottom:22px;color:#c1432a">
      The Rep&nbsp;Playbook
    </div>
    ${inner}
    <div style="margin-top:30px;font-size:12px;color:#8a8172;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
      The Rep Playbook — the field manual for buying reps without getting scammed.
    </div>
  </div>`;

const btn = (href: string, label: string) => `
  <a href="${escapeHtml(href)}" style="display:inline-block;background:#c1432a;color:#fff;text-decoration:none;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-weight:600;font-size:15px;padding:14px 22px;border-radius:10px">
    ${escapeHtml(label)}
  </a>`;

/** Sent by the Stripe webhook right after a successful purchase. */
export function sendPurchaseLink(to: string, magicUrl: string) {
  return send(
    to,
    `Your Rep Playbook is ready — open it here`,
    shell(`
      <p style="margin:0 0 14px;font-size:16px;line-height:1.5">Thanks for grabbing the Playbook. You now have lifetime access to the full guide, all four cheat-sheets, and every future update.</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.5">Tap below to open your library and download everything. This link signs you in for two weeks — after that, just enter your email on the login page to get back in on any device.</p>
      <p style="margin:0 0 22px">${btn(magicUrl, 'Open my Playbook')}</p>
      <p style="margin:0;font-size:13px;color:#8a8172;font-family:-apple-system,Segoe UI,Roboto,sans-serif">If the button doesn't work, paste this into your browser:<br><span style="word-break:break-all;color:#c1432a">${escapeHtml(magicUrl)}</span></p>
    `)
  );
}

/** Passwordless re-login code for buyers returning on a new device. */
export function sendLoginCode(to: string, code: string) {
  return send(
    to,
    `${code} is your Rep Playbook login code`,
    shell(`
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5">Enter this code to sign in and open your Playbook. It expires in 10 minutes.</p>
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:8px;color:#c1432a;background:#fff;border:1px solid #e3d8c2;border-radius:10px;padding:16px;text-align:center">
        ${code}
      </div>
      <p style="margin:16px 0 0;color:#8a8172;font-size:13px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">If you didn't request this, ignore this email.</p>
    `)
  );
}

/** Confirmation for the free Chapter 1 lead magnet. */
export function sendFreeChapter(to: string, readerUrl: string) {
  return send(
    to,
    `Chapter 1 of The Rep Playbook (free)`,
    shell(`
      <p style="margin:0 0 14px;font-size:16px;line-height:1.5">Here's your free first chapter plus the full slang glossary — everything you need to stop feeling lost in the rep world.</p>
      <p style="margin:0 0 22px">${btn(readerUrl, 'Read Chapter 1')}</p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#57503f;font-family:-apple-system,Segoe UI,Roboto,sans-serif">When you're ready to do your first haul without the scam anxiety, the full Playbook takes it from here.</p>
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
