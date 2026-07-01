'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginClient() {
  const params = useSearchParams();
  const next = params.get('next') || '/account';
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      setStage('code');
      if (j.devCode) setDevCode(j.devCode); // only present when email isn't configured (dev)
    } catch (e: any) {
      setErr(e.message === 'invalid_email' ? 'Please enter a valid email.' : 'Could not send code. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      window.location.href = next;
    } catch {
      setErr('That code is wrong or expired. Request a new one.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      {stage === 'email' ? (
        <form className="stack" style={{ gap: 12 }} onSubmit={requestCode}>
          <div>
            <label>Email</label>
            <input
              className="field"
              type="email"
              required
              autoFocus
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <span className="spin" /> : 'Email me a code'}
          </button>
        </form>
      ) : (
        <form className="stack" style={{ gap: 12 }} onSubmit={verify}>
          <div>
            <label>6-digit code sent to {email}</label>
            <input
              className="field field-num mono"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
            />
          </div>
          {devCode && (
            <div className="notice cyan" style={{ fontSize: 13 }}>
              Email isn&apos;t configured, so here&apos;s your code for testing:{' '}
              <b className="mono accent">{devCode}</b>
            </div>
          )}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <span className="spin" /> : 'Verify & sign in'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStage('email')}>
            ← Use a different email
          </button>
        </form>
      )}
      {err && (
        <p className="notice danger" style={{ marginTop: 12, fontSize: 13 }}>
          {err}
        </p>
      )}
    </div>
  );
}
