import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Welcome to Pro — QuickConvert',
  description: 'Your QuickConvert Pro subscription is active.',
  robots: { index: false },
};

export default function SuccessPage() {
  return (
    <section className="block">
      <div className="container-narrow" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <h2 className="section-title">You’re Pro now</h2>
        <p className="section-sub">
          Thank you for subscribing. Batch conversion, higher limits and an
          ad-free experience are unlocked. Everything still runs privately in your
          browser.
        </p>
        <Link href="/#tools" className="btn btn-primary">
          Start converting
        </Link>
      </div>
    </section>
  );
}
