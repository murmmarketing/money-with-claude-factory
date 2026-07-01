import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in to HaulHQ with a one-time email code — no password.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="container container-narrow section">
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <span className="eyebrow">Account</span>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Sign in to HaulHQ</h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          No password. We email you a 6-digit code. Use the same email you paid
          with to unlock Pro.
        </p>
        <Suspense fallback={<div className="card">Loading…</div>}>
          <LoginClient />
        </Suspense>
      </div>
    </div>
  );
}
