'use client';

import { useState } from 'react';

export default function LoginClient() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  async function requestCode() {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('code');
        if (data.devCode) setDevCode(data.devCode);
      } else {
        setError(data.error === 'invalid_email' ? 'Enter a valid email.' : 'Could not send a code. Try again.');
      }
    } catch {
      setError('Network error. Try again.');
    }
    setLoading(false);
  }

  async function verify() {
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/read';
        return;
      }
      const map: Record<string, string> = {
        wrong_code: 'That code is incorrect.',
        expired: 'That code expired — request a new one.',
        no_code: 'No active code — request a new one.',
      };
      setError(map[data.error] || 'Could not verify. Try again.');
    } catch {
      setError('Network error. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="buybox" style={{ margin: '0 auto' }}>
      {step === 'email' ? (
        <>
          <label className="muted" style={{ fontSize: '.9rem' }}>
            Purchase email
          </label>
          <input
            className="field"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ margin: '8px 0 14px' }}
          />
          <button className="btn btn-primary btn-block" onClick={requestCode} disabled={loading}>
            {loading ? 'Sending…' : 'Send me a code'}
          </button>
        </>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            We sent a 6-digit code to <b>{email}</b>.
          </p>
          {devCode ? (
            <p className="note" style={{ color: 'var(--accent)' }}>
              Dev mode (email not configured): your code is <b>{devCode}</b>.
            </p>
          ) : null}
          <input
            className="field mono"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            style={{ margin: '8px 0 14px', fontSize: '1.3rem', letterSpacing: '.3em', textAlign: 'center' }}
          />
          <button className="btn btn-primary btn-block" onClick={verify} disabled={loading}>
            {loading ? 'Verifying…' : 'Open my library'}
          </button>
          <button
            className="btn btn-ghost btn-block btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => {
              setStep('email');
              setCode('');
              setDevCode('');
            }}
          >
            Use a different email
          </button>
        </>
      )}
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
