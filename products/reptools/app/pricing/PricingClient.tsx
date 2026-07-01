'use client';

import { useEffect, useState } from 'react';

interface Props {
  configured: boolean;
}

export default function PricingClient({ configured }: Props) {
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [waitBusy, setWaitBusy] = useState(false);
  const [waitDone, setWaitDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setLoggedIn(!!j.email))
      .catch(() => {});
  }, []);

  async function checkout() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch('/api/pro/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (r.status === 401) {
        // need to log in first — bounce to login with a return hint
        window.location.href = `/login?next=${encodeURIComponent('/pricing')}`;
        return;
      }
      const j = await r.json();
      if (r.status === 503) {
        setErr('coming_soon');
        return;
      }
      if (!r.ok || !j.url) throw new Error(j.error || 'failed');
      window.location.href = j.url;
    } catch (e: any) {
      setErr('generic');
    } finally {
      setBusy(false);
    }
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWaitBusy(true);
    try {
      const r = await fetch('/api/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'pro_waitlist', meta: { email } }),
      });
      if (r.ok) setWaitDone(true);
    } catch {
      /* best effort */
    } finally {
      setWaitBusy(false);
    }
  }

  const showWaitlist = !configured || err === 'coming_soon';

  return (
    <div>
      {/* plan toggle */}
      <div className="row" style={{ gap: 8, margin: '10px 0' }}>
        <button
          className={`btn btn-sm ${plan === 'annual' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setPlan('annual')}
        >
          Annual · save 33%
        </button>
        <button
          className={`btn btn-sm ${plan === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setPlan('monthly')}
        >
          Monthly
        </button>
      </div>

      <div style={{ margin: '6px 0 14px' }}>
        {plan === 'annual' ? (
          <span className="price-amt">
            $48<small> / yr · ~$4/mo</small>
          </span>
        ) : (
          <span className="price-amt">
            $6<small> / mo</small>
          </span>
        )}
      </div>

      {!showWaitlist ? (
        <>
          <button className="btn btn-primary btn-block" onClick={checkout} disabled={busy}>
            {busy ? <span className="spin" /> : loggedIn ? 'Upgrade to Pro' : 'Get Pro'}
          </button>
          {err === 'generic' && (
            <p className="notice danger" style={{ marginTop: 10, fontSize: 13 }}>
              Something went wrong starting checkout. Please try again.
            </p>
          )}
          <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
            Secure checkout via Stripe · 7-day money-back promise.
          </p>
        </>
      ) : (
        <div className="notice" style={{ padding: 16 }}>
          {waitDone ? (
            <p className="accent" style={{ margin: 0, fontWeight: 600 }}>
              You&apos;re on the list — we&apos;ll email you the moment Pro opens. 🎉
            </p>
          ) : (
            <>
              <b style={{ display: 'block', marginBottom: 6 }}>Pro is launching soon</b>
              <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                Payments aren&apos;t live yet. Drop your email and you&apos;ll be first in
                when Pro opens (founder price locked in).
              </p>
              <form className="copybox" onSubmit={joinWaitlist}>
                <input
                  className="field"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" disabled={waitBusy}>
                  {waitBusy ? '…' : 'Join'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
