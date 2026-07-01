import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '../../lib/entitlement';
import { CHEAT_SHEETS } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Downloads',
  description: 'Download the Rep Playbook PDF and printable cheat-sheets.',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

export default async function DownloadPage() {
  const gate = await requireOwner();

  if (!gate.ok) {
    return (
      <section className="section">
        <div className="narrow">
          <div className="locked">
            <span className="badge badge-lock">Owners only</span>
            <h3 style={{ marginTop: 12 }}>Your downloads live here</h3>
            <p className="muted" style={{ maxWidth: 440, margin: '0 auto 18px' }}>
              Log in with your purchase email to download the full PDF and the
              cheat-sheets, or grab the Playbook if you haven&rsquo;t yet.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" className="btn btn-primary">
                Log in
              </Link>
              <Link href="/pricing" className="btn btn-ghost">
                Get the Playbook
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="kicker">Your library · {gate.email}</div>
        <h1>Downloads</h1>
        <p className="muted">
          Everything is generated fresh and always up to date. Also readable
          online in the <Link href="/read">web reader</Link>.
        </p>

        <div className="grid grid-2" style={{ marginTop: 24 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>The full guide</h3>
            <p className="muted">
              All chapters in one PDF — the complete field manual.
            </p>
            <a className="btn btn-primary" href="/api/download?doc=guide">
              Download the guide (PDF)
            </a>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>All cheat-sheets</h3>
            <p className="muted">
              All four printable one-pagers in a single PDF.
            </p>
            <a className="btn btn-primary" href="/api/download?doc=cheatsheets">
              Download cheat-sheets (PDF)
            </a>
          </div>
        </div>

        <h2 style={{ marginTop: 36 }}>Individual cheat-sheets</h2>
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          {CHEAT_SHEETS.map((s) => (
            <div className="card" key={s.slug}>
              <h3 style={{ marginTop: 0, fontSize: '1.05rem' }}>{s.title}</h3>
              <p className="muted" style={{ fontSize: '.9rem' }}>
                {s.summary}
              </p>
              <a className="btn btn-ghost btn-sm" href={`/api/download?doc=${s.slug}`}>
                Download PDF
              </a>{' '}
              <Link className="btn btn-ghost btn-sm" href={`/read/cheat/${s.slug}`}>
                Read online
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
