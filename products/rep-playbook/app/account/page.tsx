import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionEmail, hasEntitlement } from '../../lib/entitlement';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const email = getSessionEmail();
  const owns = email ? await hasEntitlement(email) : false;

  if (!email) {
    return (
      <section className="section">
        <div className="narrow center">
          <h1>Log in to your account</h1>
          <p className="muted" style={{ marginBottom: 20 }}>
            Enter your purchase email to access your library.
          </p>
          <Link href="/login" className="btn btn-primary">
            Log in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="narrow">
        <div className="kicker">Account</div>
        <h1>Your library</h1>
        <div className="card">
          <p style={{ margin: 0 }}>
            Signed in as <b>{email}</b>
          </p>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {owns
              ? 'You own The Rep Playbook — lifetime access.'
              : 'No purchase found on this email. If you bought with a different email, log out and use that one.'}
          </p>
        </div>

        {owns ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <Link href="/read" className="btn btn-primary">
              Read online
            </Link>
            <Link href="/download" className="btn btn-ghost">
              Downloads
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <Link href="/pricing" className="btn btn-primary">
              Get the Playbook
            </Link>
          </div>
        )}

        <hr className="rule" />
        <AccountClient />
      </div>
    </section>
  );
}
