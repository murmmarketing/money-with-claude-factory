import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Thank you — your Playbook is ready',
  robots: { index: false },
};

export default function ThanksPage() {
  return (
    <section className="section">
      <div className="narrow center">
        <span className="eyebrow">Payment received</span>
        <h1>Thanks — the Playbook is yours.</h1>
        <p className="muted" style={{ maxWidth: 540, margin: '0 auto 24px' }}>
          We&rsquo;ve emailed you a magic link that opens your library and signs
          you in. It can take a minute to arrive — check spam if you don&rsquo;t
          see it. You can also open your library directly below (log in with your
          purchase email if prompted).
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/read" className="btn btn-primary btn-lg">
            Open my library
          </Link>
          <Link href="/login" className="btn btn-ghost btn-lg">
            Log in with my email
          </Link>
        </div>
        <p className="note" style={{ marginTop: 20 }}>
          Your access is tied to your email forever — you can re-download on any
          device from the login page.
        </p>
      </div>
    </section>
  );
}
