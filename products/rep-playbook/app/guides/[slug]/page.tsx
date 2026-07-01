import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Blocks from '../../../components/Blocks';
import { ARTICLES, getArticle } from '../../../lib/articles';
import { getChapter, HAULHQ_URL, MURMREPS_URL } from '../../../lib/content';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArticle(params.slug);
  if (!a) return { title: 'Not found' };
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    openGraph: { title: a.title, description: a.description, type: 'article' },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();
  const chapter = a.ctaChapter ? getChapter(a.ctaChapter) : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    dateModified: a.updated,
    author: { '@type': 'Organization', name: 'The Rep Playbook' },
  };

  return (
    <article className="section">
      <div className="narrow">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <p className="muted">
          <Link href="/guides">← All guides</Link> · {a.readMinutes} min read
        </p>
        <h1>{a.title}</h1>
        <p className="lede" style={{ fontSize: '1.15rem' }}>
          {a.description}
        </p>
        <hr className="rule" />
        <Blocks blocks={a.blocks} />

        <div className="card" style={{ marginTop: 32 }}>
          <h3 style={{ marginTop: 0 }}>Want this all in one place?</h3>
          <p className="muted">
            The Rep Playbook is the complete field manual — every step in order,
            plus four printable cheat-sheets.
            {chapter ? (
              <>
                {' '}
                This topic goes deeper in the chapter &ldquo;{chapter.title}
                &rdquo;.
              </>
            ) : null}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/pricing" className="btn btn-primary">
              Get the Playbook
            </Link>
            <Link href="/read/start-here" className="btn btn-ghost">
              Read Chapter 1 free
            </Link>
          </div>
          <p className="faint" style={{ margin: '14px 0 0', fontSize: '.85rem' }}>
            Handy tools:{' '}
            <a href={HAULHQ_URL} target="_blank" rel="noopener noreferrer">
              HaulHQ
            </a>{' '}
            for landed-cost math ·{' '}
            <a href={MURMREPS_URL} target="_blank" rel="noopener noreferrer">
              MurmReps
            </a>{' '}
            for vetted finds.
          </p>
        </div>
      </div>
    </article>
  );
}
