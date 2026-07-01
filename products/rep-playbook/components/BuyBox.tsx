'use client';

import { useState } from 'react';

const TIERS = [
  { cents: 900, label: '$9' },
  { cents: 1900, label: '$19', suggested: true },
  { cents: 2900, label: '$29' },
  { cents: 4900, label: '$49' },
];

export default function BuyBox({ stripeReady }: { stripeReady: boolean }) {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(1900);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitlisted, setWaitlisted] = useState(false);
  const [mode, setMode] = useState<'buy' | 'waitlist'>(stripeReady ? 'buy' : 'waitlist');

  const effectiveAmount = custom ? Math.round(parseFloat(custom) * 100) : amount;

  async function buy() {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email — your Playbook is delivered there.');
      return;
    }
    if (custom && (isNaN(effectiveAmount) || effectiveAmount < 900)) {
      setError('Minimum is $9.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, amount: effectiveAmount }),
      });
      if (res.status === 503) {
        setMode('waitlist');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError('Could not start checkout. Try again in a moment.');
    } catch {
      setError('Network error. Try again.');
    }
    setLoading(false);
  }

  async function joinWaitlist() {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setWaitlisted(true);
    } catch {
      setError('Network error. Try again.');
    }
    setLoading(false);
  }

  if (waitlisted) {
    return (
      <div className="buybox" id="buy">
        <h3 style={{ marginTop: 0 }}>You&rsquo;re on the list</h3>
        <p className="muted">
          We&rsquo;ll email <b>{email}</b> the moment the Playbook is live. First
          buyers get the launch price.
        </p>
      </div>
    );
  }

  return (
    <div className="buybox" id="buy">
      {mode === 'buy' ? (
        <>
          <div className="price">
            ${(effectiveAmount / 100).toFixed(0)} <small>one-time · lifetime access</small>
          </div>
          <p className="muted" style={{ marginTop: 6, marginBottom: 0, fontSize: '.9rem' }}>
            Pay what it&rsquo;s worth to you (from $9). Most people pay $19.
          </p>

          <div className="pwyw-tiers">
            {TIERS.map((t) => (
              <button
                key={t.cents}
                type="button"
                className={`tier ${!custom && amount === t.cents ? 'active' : ''}`}
                onClick={() => {
                  setAmount(t.cents);
                  setCustom('');
                }}
              >
                {t.label}
                {t.suggested ? <div style={{ fontSize: '.62rem', color: 'var(--muted)' }}>popular</div> : null}
              </button>
            ))}
          </div>

          <input
            className="field"
            inputMode="decimal"
            placeholder="Or enter a custom amount ($)"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ''))}
            style={{ marginBottom: 10 }}
          />
          <input
            className="field"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button className="btn btn-primary btn-block btn-lg" onClick={buy} disabled={loading}>
            {loading ? 'Starting checkout…' : 'Get instant access'}
          </button>
          <p className="note">
            Secure checkout via Stripe. Instant email delivery + lifetime web
            access and free updates.
          </p>
        </>
      ) : (
        <>
          <span className="eyebrow">Launching soon</span>
          <h3 style={{ marginTop: 8 }}>Get first access</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            The Playbook drops shortly. Join the list and you&rsquo;ll get the
            launch price before anyone else.
          </p>
          <input
            className="field"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={joinWaitlist}
            disabled={loading}
          >
            {loading ? 'Adding you…' : 'Join the waitlist'}
          </button>
          <p className="note">No spam. One email when it&rsquo;s live.</p>
        </>
      )}
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
