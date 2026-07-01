import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '@/lib/content';
import { siteUrl } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'Guides — QuickConvert',
  description:
    'Practical guides on converting files and data privately in your browser: PNG to JPG, CSV to JSON and more.',
  alternates: { canonical: `${siteUrl()}/blog` },
};

export default function BlogIndex() {
  const articles = getAllArticles();
  return (
    <section className="block">
      <div className="container-narrow">
        <h2 className="section-title">Guides</h2>
        <p className="section-sub">
          Short, practical how-tos for private, in-browser conversion.
        </p>
        {articles.map((a) => (
          <div className="faq-item" key={a.slug}>
            <h3>
              <Link href={`/blog/${a.slug}`}>{a.title}</Link>
            </h3>
            <p>{a.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
