import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Blocks from '../../../components/Blocks';
import { getSessionEmail, hasEntitlement } from '../../../lib/entitlement';
import { CHAPTERS, getChapter } from '../../../lib/content';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const ch = getChapter(params.slug);
  if (!ch) return { title: 'Not found' };
  return {
    title: ch.title,
    description: ch.summary,
    robots: ch.free ? undefined : { index: false },
  };
}

export default async function ChapterPage({ params }: { params: { slug: string } }) {
  const ch = getChapter(params.slug);
  if (!ch) notFound();

  const email = getSessionEmail();
  const owns = email ? await hasEntitlement(email) : false;
  const unlocked = ch.free || owns;

  const idx = CHAPTERS.findIndex((c) => c.slug === ch.slug);
  const prev = idx > 0 ? CHAPTERS[idx - 1] : null;
  const next = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;

  return (
    <article className="section">
      <div className="narrow">
        <p className="muted" style={{ marginBottom: 4 }}>
          <Link href="/read">← All chapters</Link> · Chapter {ch.number} ·{' '}
          {ch.minutes} min read
        </p>
        <h1>{ch.title}</h1>
        <p className="lede" style={{ fontSize: '1.1rem' }}>
          {ch.summary}
        </p>
        <hr className="rule" />

        {unlocked ? (
          <>
            <Blocks blocks={ch.blocks} />
            <hr className="rule" />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              {prev ? (
                <Link href={`/read/${prev.slug}`} className="btn btn-ghost btn-sm">
                  ← {prev.title}
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/read/${next.slug}`} className="btn btn-ghost btn-sm">
                  {next.title} →
                </Link>
              ) : (
                <span />
              )}
            </div>
            {!owns ? (
              <div className="card center" style={{ marginTop: 32 }}>
                <h3>Enjoying it? The other {CHAPTERS.length - 2} chapters go deep.</h3>
                <p className="muted">
                  QC, sizing, agents, shipping, customs and legit-checking — plus
                  four printable cheat-sheets.
                </p>
                <Link href="/pricing" className="btn btn-primary">
                  Get the full Playbook
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className="locked">
            <span className="badge badge-lock">Locked chapter</span>
            <h3 style={{ marginTop: 12 }}>This chapter is part of the full Playbook.</h3>
            <p className="muted" style={{ maxWidth: 460, margin: '0 auto 18px' }}>
              Unlock all {CHAPTERS.length} chapters and the four cheat-sheets with
              a one-time purchase, or read the free chapters first.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/pricing" className="btn btn-primary">
                Unlock the Playbook
              </Link>
              <Link href="/login" className="btn btn-ghost">
                I already bought it
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
