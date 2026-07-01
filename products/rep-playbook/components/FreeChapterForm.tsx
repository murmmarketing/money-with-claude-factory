'use client';

import { useState } from 'react';

export default function FreeChapterForm({ source = 'site' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (data.ok) {
        setDone(true);
      } else {
        setError('Something went wrong. Try again.');
      }
    } catch {
      setError('Network error. Try again.');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Check your inbox</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Chapter 1 and the full slang glossary are yours. Or just start reading
          now:
        </p>
        <a className="btn btn-primary" href="/read/start-here">
          Read Chapter 1 now
        </a>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Free: Chapter 1 + the slang glossary</h3>
      <p className="muted" style={{ marginBottom: 14 }}>
        Not ready to buy? Get the first chapter and the complete W2C/QC/GL slang
        decoder free. No fluff, unsubscribe anytime.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          className="field"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Sending…' : 'Send me Chapter 1'}
        </button>
      </div>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
