import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionEmail, hasEntitlement } from '../../lib/entitlement';
import { CHAPTERS, CHEAT_SHEETS } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Read the Playbook',
  description: 'The full Rep Playbook web reader — chapters and cheat-sheets.',
};

export const dynamic = 'force-dynamic';

export default async function ReadIndex() {
  const email = getSessionEmail();
  const owns = email ? await hasEntitlement(email) : false;

  return (
    <section className="section">
      <div className="container">
        <div className="kicker">The web reader</div>
        <h1>The Rep Playbook</h1>
        {owns ? (
          <p className="muted">
            You own the Playbook — full access. Prefer files?{' '}
            <Link href="/download">Download the PDF &amp; cheat-sheets →</Link>
          </p>
        ) : (
          <p className="muted">
            Chapters 1–2 are free. Unlock the rest with a one-time purchase.{' '}
            <Link href="/pricing">See pricing →</Link>
            {email ? null : (
              <>
                {' '}
                Already bought? <Link href="/login">Log in</Link>.
              </>
            )}
          </p>
        )}

        <ul className="toc-list" style={{ marginTop: 24 }}>
          {CHAPTERS.map((c) => {
            const unlocked = c.free || owns;
            return (
              <li className="toc-item" key={c.slug}>
                <span className="n">{String(c.number).padStart(2, '0')}</span>
                <span style={{ flex: 1 }}>
                  {unlocked ? (
                    <Link href={`/read/${c.slug}`} className="t">
                      {c.title}
                    </Link>
                  ) : (
                    <span className="t">{c.title}</span>
                  )}
                  <br />
                  <span className="s">{c.summary}</span>
                </span>
                <span className={`badge ${unlocked ? 'badge-free' : 'badge-lock'}`}>
                  {c.free ? 'Free' : unlocked ? 'Open' : 'Locked'}
                </span>
              </li>
            );
          })}
        </ul>

        <h2 style={{ marginTop: 40 }}>Cheat-sheets</h2>
        <ul className="toc-list" style={{ marginTop: 16 }}>
          {CHEAT_SHEETS.map((s) => (
            <li className="toc-item" key={s.slug}>
              <span className="n">★</span>
              <span style={{ flex: 1 }}>
                {owns ? (
                  <Link href={`/read/cheat/${s.slug}`} className="t">
                    {s.title}
                  </Link>
                ) : (
                  <span className="t">{s.title}</span>
                )}
                <br />
                <span className="s">{s.summary}</span>
              </span>
              <span className={`badge ${owns ? 'badge-free' : 'badge-lock'}`}>
                {owns ? 'Open' : 'Locked'}
              </span>
            </li>
          ))}
        </ul>

        {!owns ? (
          <div className="center" style={{ marginTop: 40 }}>
            <Link href="/pricing" className="btn btn-primary btn-lg">
              Unlock everything
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
