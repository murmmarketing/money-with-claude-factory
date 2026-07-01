import type { Metadata } from 'next';
import Link from 'next/link';
import PricingActions from '@/components/PricingActions';
import { isStripeEnabled } from '@/lib/stripe';
import { siteUrl } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'Pricing — QuickConvert Free & Pro',
  description:
    'QuickConvert is free forever. Go Pro for $5/mo or $39/yr to remove ads and unlock batch conversion and higher limits.',
  alternates: { canonical: `${siteUrl()}/pricing` },
};

export default function PricingPage() {
  const stripeEnabled = isStripeEnabled();

  return (
    <section className="block">
      <div className="container">
        <h2 className="section-title">Simple, honest pricing</h2>
        <p className="section-sub">
          Every converter is free forever. Upgrade only if you want batch mode,
          bigger files and an ad-free workspace.
        </p>

        <div className="pricing-grid">
          <div className="price-card">
            <h3>Free</h3>
            <div className="price">
              $0<small> / forever</small>
            </div>
            <ul>
              <li>All 7 converters, unlimited use</li>
              <li>100% in-browser — nothing uploaded</li>
              <li>Copy &amp; download results</li>
              <li>Works offline once loaded</li>
              <li>Supported by a single, unobtrusive ad</li>
            </ul>
            <Link href="/#tools" className="btn btn-secondary" style={{ width: '100%' }}>
              Start converting
            </Link>
          </div>

          <div className="price-card featured">
            <span className="badge">Pro</span>
            <h3>Pro</h3>
            <div className="price">
              $5<small> / month</small>
            </div>
            <ul>
              <li>Everything in Free</li>
              <li>Batch conversion (many files at once)</li>
              <li>Higher file-size &amp; input limits</li>
              <li>No ads, ever</li>
              <li>Priority for new converters</li>
            </ul>
            <PricingActions stripeEnabled={stripeEnabled} />
          </div>
        </div>

        <p className="note">
          Questions? See the <Link href="/faq">FAQ</Link>. Because conversions run
          on your device, even Pro never sees the contents of your files.
        </p>
      </div>
    </section>
  );
}
