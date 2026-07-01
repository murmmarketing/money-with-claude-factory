import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Blocks from '../../../../components/Blocks';
import { requireOwner } from '../../../../lib/entitlement';
import { CHEAT_SHEETS, getCheatSheet } from '../../../../lib/content';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = getCheatSheet(params.slug);
  return { title: s ? s.title : 'Not found', robots: { index: false } };
}

export default async function CheatSheetPage({ params }: { params: { slug: string } }) {
  const sheet = getCheatSheet(params.slug);
  if (!sheet) notFound();

  const gate = await requireOwner();
  if (!gate.ok) {
    return (
      <section className="section">
        <div className="narrow">
          <div className="locked">
            <span className="badge badge-lock">Owners only</span>
            <h3 style={{ marginTop: 12 }}>{sheet.title}</h3>
            <p className="muted" style={{ maxWidth: 440, margin: '0 auto 18px' }}>
              {sheet.summary} Cheat-sheets are included with the full Playbook.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/pricing" className="btn btn-primary">
                Get the Playbook
              </Link>
              <Link href="/login" className="btn btn-ghost">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <article className="section">
      <div className="narrow">
        <p className="muted">
          <Link href="/read">← All chapters</Link> · Cheat-sheet
        </p>
        <h1>{sheet.title}</h1>
        <p className="lede" style={{ fontSize: '1.1rem' }}>
          {sheet.summary}
        </p>
        <a className="btn btn-ghost btn-sm" href={`/api/download?doc=${sheet.slug}`}>
          Download this cheat-sheet (PDF)
        </a>
        <hr className="rule" />
        <Blocks blocks={sheet.blocks} />
        <hr className="rule" />
        <p className="muted">
          Other cheat-sheets:{' '}
          {CHEAT_SHEETS.filter((c) => c.slug !== sheet.slug).map((c, i) => (
            <span key={c.slug}>
              {i > 0 ? ' · ' : ''}
              <Link href={`/read/cheat/${c.slug}`}>{c.title}</Link>
            </span>
          ))}
        </p>
      </div>
    </article>
  );
}
