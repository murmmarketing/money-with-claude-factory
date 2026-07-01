import Link from 'next/link';
import type { Metadata } from 'next';
import BuyBox from '../components/BuyBox';
import FreeChapterForm from '../components/FreeChapterForm';
import { stripeConfigured } from '../lib/stripe';
import { CHAPTERS, CHEAT_SHEETS, HAULHQ_URL, MURMREPS_URL } from '../lib/content';

export const metadata: Metadata = {
  title: 'The Rep Playbook — everything before your first rep haul',
  description:
    'The consolidated field manual for buying reps without getting scammed: finds, agents, QC photos, sizing, shipping, customs and legit-checking. One-time purchase, lifetime access, free updates.',
};

// Dynamic so the buy/waitlist state reflects whether Stripe is connected now.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const ready = stripeConfigured();
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">The complete field manual · 2026 edition</span>
          <h1>Everything you wish someone told you before your first rep haul.</h1>
          <p className="lede">
            The rep world hides its know-how in scattered Discords, dead Reddit
            threads and paywalled Telegrams. This is the one trustworthy manual
            that walks you through finds, agents, QC, sizing, shipping and customs
            — so your first haul lands right instead of costing you a lesson.
          </p>
          <div className="hero-cta">
            <Link href="/pricing" className="btn btn-primary btn-lg">
              Get the Playbook
            </Link>
            <Link href="/read/start-here" className="btn btn-ghost btn-lg">
              Read Chapter 1 free
            </Link>
          </div>
          <div className="trust">
            <span>
              <b>9 chapters</b> + 4 printable cheat-sheets
            </span>
            <span>
              <b>Instant</b> download + web reader
            </span>
            <span>
              <b>Lifetime</b> access & free updates
            </span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section-tight">
        <div className="narrow">
          <div className="card">
            <p style={{ margin: 0, fontSize: '1.05rem' }}>
              &ldquo;What&rsquo;s a W2C? Which agent? Is my QC good or am I about
              to waste $150? What size do I even order? Will it get seized at
              customs?&rdquo; — every beginner, at 2am, in six browser tabs.
            </p>
            <p style={{ margin: '12px 0 0', color: 'var(--muted)' }}>
              The Playbook answers all of it, in order, once.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="section">
        <div className="container">
          <div className="kicker">What you get</div>
          <h2>A real book, not a thread dump.</h2>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            <div className="card">
              <div className="num">01</div>
              <h3>The full guide</h3>
              <p className="muted">
                A ~60–80 page illustrated PDF covering the entire journey — from
                your first find to legit-checking the parcel on arrival.
              </p>
            </div>
            <div className="card">
              <div className="num">02</div>
              <h3>4 cheat-sheets</h3>
              <p className="muted">
                Printable one-pagers: QC red-flags, agent vetting scorecard,
                sizing conversion, and customs-by-country. Keep them open while
                you order.
              </p>
            </div>
            <div className="card">
              <div className="num">03</div>
              <h3>Lifetime web reader</h3>
              <p className="muted">
                Read the whole thing online on any device, forever, with free
                updates as agents, lines and customs rules change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOC */}
      <section className="section" style={{ background: 'var(--paper-2)' }}>
        <div className="container">
          <div className="kicker">Table of contents</div>
          <h2>The whole journey, in order.</h2>
          <ul className="toc-list" style={{ marginTop: 24 }}>
            {CHAPTERS.map((c) => (
              <li className="toc-item" key={c.slug}>
                <span className="n">{String(c.number).padStart(2, '0')}</span>
                <span style={{ flex: 1 }}>
                  <span className="t">{c.title}</span>
                  <br />
                  <span className="s">{c.summary}</span>
                </span>
                <span className={`badge ${c.free ? 'badge-free' : 'badge-lock'}`}>
                  {c.free ? 'Free' : `${c.minutes} min`}
                </span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: 16 }}>
            Plus cheat-sheets:{' '}
            {CHEAT_SHEETS.map((s, i) => (
              <span key={s.slug}>
                {i > 0 ? ' · ' : ''}
                {s.title}
              </span>
            ))}
            .
          </p>
        </div>
      </section>

      {/* SAMPLE + BUY */}
      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'start', gap: 40 }}>
            <div>
              <div className="kicker">A sample spread</div>
              <h2>Written like a friend who actually buys reps.</h2>
              <div className="prose" style={{ marginTop: 16 }}>
                <div className="callout">
                  <span className="ct">The fee trap</span>
                  <span>
                    Beginners pick the agent with &ldquo;no service fee&rdquo; and
                    assume it&rsquo;s cheapest. It often isn&rsquo;t — a zero-fee
                    agent with a pricey shipping line can cost more than a
                    small-fee agent with a cheap line. Compare the full landed
                    cost of your actual cart, not the headline fee.
                  </span>
                </div>
                <p>
                  Every chapter is like this: plain language, real vocabulary, and
                  the specific mistakes that cost beginners money — with a
                  checklist you can actually follow.
                </p>
              </div>
              <Link href="/read/start-here" className="btn btn-ghost">
                Read a full free chapter
              </Link>
            </div>
            <div>
              <BuyBox stripeReady={ready} />
              <ul className="list-check">
                <li>Instant delivery — magic link to your library</li>
                <li>Full PDF + all four printable cheat-sheets</li>
                <li>Lifetime web reader on any device</li>
                <li>Free updates as the market changes</li>
                <li>Pay what it&rsquo;s worth (from $9)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CROSS-SELL */}
      <section className="section" style={{ background: 'var(--paper-2)' }}>
        <div className="container">
          <div className="kicker">Works with your tools</div>
          <h2>The Playbook teaches. These do the doing.</h2>
          <div className="grid grid-2" style={{ marginTop: 20 }}>
            <div className="card">
              <h3>Run the numbers in HaulHQ</h3>
              <p className="muted">
                The cost &amp; customs chapter hands off to HaulHQ — a free
                calculator that shows your true landed cost and compares agents on
                your actual cart, so you never guess.
              </p>
              <a className="btn btn-ghost btn-sm" href={HAULHQ_URL} target="_blank" rel="noopener noreferrer">
                Open HaulHQ →
              </a>
            </div>
            <div className="card">
              <h3>Find vetted products on MurmReps</h3>
              <p className="muted">
                The sourcing chapter points to MurmReps — ~19.5K filterable finds,
                a sane on-ramp before you go spelunking on raw marketplaces.
              </p>
              <a className="btn btn-ghost btn-sm" href={MURMREPS_URL} target="_blank" rel="noopener noreferrer">
                Browse MurmReps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FREE CHAPTER */}
      <section className="section">
        <div className="narrow">
          <FreeChapterForm source="home" />
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="narrow">
          <div className="kicker">FAQ</div>
          <h2>Straight answers.</h2>
          <div className="faq" style={{ marginTop: 20 }}>
            <details>
              <summary>Is this just stuff I could Google?</summary>
              <p>
                In theory — if you had 40 hours, knew which Discords to trust, and
                could tell good advice from confident nonsense. The Playbook is
                that research already done, verified, de-jargoned and put in the
                right order so your first haul goes right the first time.
              </p>
            </details>
            <details>
              <summary>What format is it?</summary>
              <p>
                A downloadable PDF (the full guide) plus four printable one-page
                cheat-sheets, and a lifetime web reader you can open on any
                device. You get free updates as agents, shipping lines and customs
                rules change.
              </p>
            </details>
            <details>
              <summary>Is it up to date for 2026?</summary>
              <p>
                Yes. It reflects 2026 realities — including the end of the US
                de-minimis exemption for China and current EU/UK VAT thresholds —
                framed as estimates you confirm with your agent and local
                authority. Updates are free for owners.
              </p>
            </details>
            <details>
              <summary>How does delivery work?</summary>
              <p>
                After checkout you get an email with a magic link straight into
                your library. Returning later? Just enter your email on the login
                page for a one-time code — no passwords, works on any device.
              </p>
            </details>
            <details>
              <summary>Do I need HaulHQ or MurmReps to use this?</summary>
              <p>
                No. The Playbook stands alone. It points to HaulHQ for cost math
                and MurmReps for finds because they&rsquo;re genuinely useful and
                free to start, but nothing here depends on them.
              </p>
            </details>
            <details>
              <summary>Is buying reps legal / safe?</summary>
              <p>
                This is educational content about a market that exists. It does
                not tell you to break your country&rsquo;s laws — it explains real
                thresholds and risks honestly so you can make your own informed
                decisions. There&rsquo;s a whole chapter on staying out of trouble.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section center">
        <div className="narrow">
          <h2>Stop guessing. Do your first haul like you&rsquo;ve done ten.</h2>
          <p className="muted" style={{ marginBottom: 24 }}>
            One-time purchase. Lifetime access. Pay what it&rsquo;s worth.
          </p>
          <Link href="/pricing" className="btn btn-primary btn-lg">
            Get the Playbook
          </Link>
        </div>
      </section>
    </>
  );
}
