'use client';
import { useState } from 'react';
import { getSid } from './session';

function formatMoney(cents: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
  }
}

/**
 * Deposit-first primary CTA. Posts to /api/checkout (backend B2) and redirects
 * to the returned Stripe/checkout url. Fully refundable framing.
 */
export default function DepositCTA({
  ideaId,
  depositCents,
  currency = 'EUR',
  label,
  trustLine = 'Refundable anytime · No charge until launch',
  variant = 'primary',
}: {
  ideaId: string;
  depositCents: number;
  currency?: string;
  label?: string;
  trustLine?: string;
  variant?: 'primary' | 'secondary';
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const amount = formatMoney(depositCents, currency);
  const text = label || `Reserve for ${amount} — fully refundable`;

  async function reserve() {
    setState('loading');
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idea_id: ideaId, session_id: getSid() }),
      });
      if (!r.ok) throw new Error('checkout');
      const data = await r.json().catch(() => ({}));
      if (data && data.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error('no url');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <button
        type="button"
        onClick={reserve}
        disabled={state === 'loading'}
        className={variant === 'primary' ? 'btn-primary' : 'btn-ghost'}
      >
        {state === 'loading' ? 'Opening secure checkout…' : text}
      </button>
      {trustLine ? <span className="trust-line">{trustLine}</span> : null}
      {state === 'error' ? (
        <span className="trust-line" style={{ color: '#d92d20' }}>
          Couldn&apos;t open checkout — please try again.
        </span>
      ) : null}
    </div>
  );
}
