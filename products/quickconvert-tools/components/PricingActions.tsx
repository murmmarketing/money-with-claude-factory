'use client';

import { useState } from 'react';

export default function PricingActions({ stripeEnabled }: { stripeEnabled: boolean }) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not start checkout. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (stripeEnabled) {
    return (
      <div>
        <div className="seg" style={{ marginBottom: 16 }}>
          <button
            className={interval === 'monthly' ? 'active' : ''}
            onClick={() => setInterval('monthly')}
          >
            $5 / month
          </button>
          <button
            className={interval === 'yearly' ? 'active' : ''}
            onClick={() => setInterval('yearly')}
          >
            $39 / year (save 35%)
          </button>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={startCheckout}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : 'Upgrade to Pro'}
        </button>
        {error && <p className="hint" style={{ color: '#dc2626' }}>{error}</p>}
        <p className="note">Secure checkout by Stripe. Cancel anytime.</p>
      </div>
    );
  }

  // Graceful fallback when Stripe keys are not configured yet.
  if (joined) {
    return (
      <div>
        <p style={{ fontWeight: 600 }}>You’re on the list ✓</p>
        <p className="note">
          We’ll email {email} the moment Pro opens. Thanks for the interest!
        </p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontWeight: 600, marginTop: 0 }}>Pro is coming soon</p>
      <p className="note" style={{ textAlign: 'left', marginTop: 4, marginBottom: 12 }}>
        Join the waitlist and be first to know when batch mode and higher limits
        go live.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes('@')) setJoined(true);
        }}
      >
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <button className="btn btn-primary" style={{ width: '100%' }} type="submit">
          Join the waitlist
        </button>
      </form>
    </div>
  );
}
