'use client';
import { useState, type FormEvent } from 'react';

export default function WaitlistForm({
  ideaId,
  accent,
  ctaLabel,
}: {
  ideaId: string;
  accent: string;
  ctaLabel: string;
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const sid = getSid();
      const r = await fetch('/api/wait', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idea_id: ideaId, email, session_id: sid, utm: utm() }),
      });
      setState(r.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return <p style={{ color: accent, fontWeight: 600, fontSize: 18 }}>You&apos;re on the list. 🎉</p>;
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{ flex: 1, minWidth: 220, padding: '12px 14px', border: '1px solid #d0d5dd', borderRadius: 8, fontSize: 16 }}
      />
      <button
        disabled={state === 'loading'}
        style={{ background: accent, color: '#fff', border: 0, borderRadius: 8, padding: '12px 22px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {state === 'loading' ? '…' : ctaLabel}
      </button>
      {state === 'error' && <p style={{ color: '#d92d20', width: '100%' }}>Something went wrong — please try again.</p>}
    </form>
  );
}

function getSid(): string {
  try {
    let s = localStorage.getItem('_fsid');
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('_fsid', s);
    }
    return s;
  } catch {
    return 'nosid';
  }
}

function utm(): Record<string, string> {
  try {
    const p = new URLSearchParams(location.search);
    const o: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => {
      const v = p.get(k);
      if (v) o[k] = v;
    });
    return o;
  } catch {
    return {};
  }
}
