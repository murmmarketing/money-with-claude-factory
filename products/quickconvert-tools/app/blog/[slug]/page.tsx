import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles, getArticle } from '@/lib/content';
import { getTool, siteUrl } from '@/lib/tools';

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArticle(params.slug);
  if (!a) return { title: 'Not found' };
  const url = `${siteUrl()}/blog/${a.slug}`;
  return {
    title: `${a.title} | QuickConvert`,
    description: a.description,
    alternates: { canonical: url },
    openGraph: { title: a.title, description: a.description, url, type: 'article' },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();

  const tool = a.tool ? getTool(a.tool) : undefined;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    author: { '@type': 'Organization', name: 'QuickConvert' },
    mainEntityOfPage: `${siteUrl()}/blog/${a.slug}`,
  };

  return (
    <article className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="breadcrumb">
        <Link href="/">Home</Link> · <Link href="/blog">Guides</Link>
      </div>
      <h1>{a.title}</h1>
      <div className="meta">{a.date}</div>
      <div dangerouslySetInnerHTML={{ __html: a.html }} />

      {tool && (
        <p style={{ marginTop: 32 }}>
          <Link className="btn btn-primary" href={`/convert/${tool.slug}`}>
            Open the {tool.short} →
          </Link>
        </p>
      )}
    </article>
  );
}
