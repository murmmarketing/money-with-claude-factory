'use client';
import { useEffect, useState, type FormEvent } from 'react';
import DepositCTA from './components/DepositCTA';
import { getSid, firstTouchUtm, referrer } from './components/session';

const TURNSTILE_SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;

declare global {
  interface Window {
    __turnstileCb?: (token: string) => void;
  }
}

export default function WaitlistForm({
  ideaId,
  ctaLabel,
  depositCents,
  depositCurrency = 'EUR',
  shareIncentive = 'Share your link — skip ahead in the queue for every friend who joins.',
}: {
  ideaId: string;
  ctaLabel: string;
  depositCents?: number;
  depositCurrency?: string;
  shareIncentive?: string;
}) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Capture first-touch UTM as early as possible.
  useEffect(() => {
    firstTouchUtm();
  }, []);

  // Load Cloudflare Turnstile (only if a sitekey is configured).
  useEffect(() => {
    if (!TURNSTILE_SITEKEY) return;
    window.__turnstileCb = (t: string) => setToken(t);
    const existing = document.querySelector('script[data-turnstile]');
    if (existing) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-turnstile', '1');
    document.head.appendChild(s);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (TURNSTILE_SITEKEY && !token) return; // block until human-verified
    setState('loading');
    const sid = getSid();

    // Fire-and-forget CTA click event.
    fetch('/api/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, session_id: sid, name: 'cta_click' }),
    }).catch(() => {});

    try {
      const r = await fetch('/api/wait', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          idea_id: ideaId,
          email,
          session_id: sid,
          utm: firstTouchUtm(),
          company, // honeypot — server rejects if filled
          turnstile_token: token || undefined,
          referred_by: referrer() || undefined,
        }),
      });
      if (r.ok) {
        try {
          setShareUrl(`${location.origin}/l/${ideaId}?ref=${sid}`);
        } catch {
          setShareUrl('');
        }
        setState('done');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  }

  if (state === 'done') {
    return (
      <div className="share-block">
        <strong style={{ fontSize: 18 }}>You&apos;re on the list. 🎉</strong>
        <p className="trust-line" style={{ marginTop: 6 }}>{shareIncentive}</p>
        {shareUrl ? (
          <div className="share-row">
            <input className="field" readOnly value={shareUrl} aria-label="Your referral link" />
            <button type="button" className="btn-ghost" onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
        ) : null}
        {depositCents && depositCents > 0 ? (
          <div style={{ marginTop: 16 }}>
            <DepositCTA
              ideaId={ideaId}
              depositCents={depositCents}
              currency={depositCurrency}
              label={undefined}
              trustLine="Lock your spot — refundable anytime, no charge until launch"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="waitlist-form" noValidate={false}>
      {/* Honeypot: hidden from users, bots tend to fill it. */}
      <div className="sr-only" aria-hidden>
        <label htmlFor={`company-${ideaId}`}>Company</label>
        <input
          id={`company-${ideaId}`}
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <input
        required
        type="email"
        className="field"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
      />

      {TURNSTILE_SITEKEY ? (
        <div
          className="cf-turnstile"
          data-sitekey={TURNSTILE_SITEKEY}
          data-callback="__turnstileCb"
          style={{ width: '100%' }}
        />
      ) : null}

      <button
        type="submit"
        className="btn-primary"
        disabled={state === 'loading' || (!!TURNSTILE_SITEKEY && !token)}
      >
        {state === 'loading' ? '…' : ctaLabel}
      </button>

      {state === 'error' && (
        <p style={{ color: '#d92d20', width: '100%', margin: '6px 0 0', fontSize: 14 }}>
          Something went wrong — please try again.
        </p>
      )}
    </form>
  );
}
