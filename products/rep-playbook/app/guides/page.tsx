import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES } from '../../lib/articles';

export const metadata: Metadata = {
  title: 'Rep buying guides',
  description:
    'Free beginner guides to buying reps: how to buy reps, reading QC photos, sizing, choosing an agent, slang glossary, and staying safe from scams and seizures.',
};

export default function GuidesIndex() {
  return (
    <section className="section">
      <div className="container">
        <div className="kicker">Free guides</div>
        <h1>Rep buying, explained.</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          Free, no-nonsense answers to the questions every beginner asks. When
          you want it all in order — with cheat-sheets — grab{' '}
          <Link href="/pricing">The Rep Playbook</Link>.
        </p>
        <div className="grid grid-2" style={{ marginTop: 24 }}>
          {ARTICLES.map((a) => (
            <Link key={a.slug} href={`/guides/${a.slug}`} className="card" style={{ textDecoration: 'none' }}>
              <h3 style={{ marginBottom: 6 }}>{a.title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {a.description}
              </p>
              <p className="faint" style={{ margin: '10px 0 0', fontSize: '.82rem' }}>
                {a.readMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
