import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Enter your purchase email to get a one-time code and open your Playbook library.',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <section className="section">
      <div className="narrow">
        <div className="center" style={{ marginBottom: 24 }}>
          <span className="eyebrow">Owner login</span>
          <h1>Open your library</h1>
          <p className="muted" style={{ maxWidth: 480, margin: '0 auto' }}>
            No passwords. Enter the email you purchased with and we&rsquo;ll send a
            one-time code. Works on any device.
          </p>
        </div>
        <LoginClient />
      </div>
    </section>
  );
}
