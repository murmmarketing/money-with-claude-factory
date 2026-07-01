import type { Metadata } from 'next';
import Link from 'next/link';
import BuyBox from '../../components/BuyBox';
import { stripeConfigured } from '../../lib/stripe';
import { CHAPTERS, CHEAT_SHEETS } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Pricing — one-time, lifetime access',
  description:
    'The Rep Playbook is a one-time purchase from $9 (most pay $19): the full guide, four cheat-sheets, lifetime web access and free updates.',
};

// Dynamic so the buy/waitlist state reflects whether Stripe is connected now.
export const dynamic = 'force-dynamic';

export default function PricingPage() {
  const ready = stripeConfigured();
  return (
    <>
      <section className="section">
        <div className="container">
          <div className="center" style={{ marginBottom: 32 }}>
            <span className="eyebrow">Simple, one-time pricing</span>
            <h1>Buy it once. Keep it forever.</h1>
            <p className="muted" style={{ maxWidth: 560, margin: '0 auto' }}>
              No subscription. Pay what the Playbook is worth to you — the floor is
              $9, most people pay $19, and every price gets the same complete
              package and free lifetime updates.
            </p>
          </div>

          <div className="grid grid-2" style={{ alignItems: 'start', gap: 40, maxWidth: 900, margin: '0 auto' }}>
            <div>
              <BuyBox stripeReady={ready} />
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Everything included</h3>
              <ul className="list-check">
                <li>
                  The full guide — {CHAPTERS.length} chapters, ~60–80 pages
                  (instant PDF download)
                </li>
                <li>
                  {CHEAT_SHEETS.length} printable cheat-sheets: QC red-flags,
                  agent vetting, sizing, customs
                </li>
                <li>Lifetime online web reader on any device</li>
                <li>Free updates as the market changes</li>
                <li>Magic-link delivery + passwordless re-login</li>
                <li>Pay-what-you-want from $9</li>
              </ul>
              <hr className="rule" style={{ margin: '18px 0' }} />
              <p className="muted" style={{ margin: 0, fontSize: '.92rem' }}>
                Prefer to try before you buy?{' '}
                <Link href="/read/start-here">Read Chapter 1 free</Link> — no card,
                no catch.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq" style={{ background: 'var(--paper-2)' }}>
        <div className="narrow">
          <div className="kicker">FAQ</div>
          <h2>Common questions</h2>
          <div className="faq" style={{ marginTop: 20 }}>
            <details>
              <summary>Is it really one-time (no subscription)?</summary>
              <p>
                Yes. One payment, lifetime access, free updates. It&rsquo;s a book,
                not a SaaS.
              </p>
            </details>
            <details>
              <summary>What if I lose the download?</summary>
              <p>
                You never really lose it — your purchase is tied to your email. Go
                to the login page, enter your email, get a one-time code, and
                you&rsquo;re back in your library on any device where you can
                re-download everything.
              </p>
            </details>
            <details>
              <summary>Can I pay more than $19?</summary>
              <p>
                Absolutely, and thank you. Suggested tiers are $19 / $29 / $49, or
                type any custom amount. It all unlocks the same complete package.
              </p>
            </details>
            <details>
              <summary>Refunds?</summary>
              <p>
                Because it&rsquo;s an instant digital download you keep, sales are
                final — which is exactly why the entire first chapter and glossary
                are free to read first. Try before you buy.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
