import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TOOLS, getTool, relatedTools, siteUrl } from '@/lib/tools';
import Converter from '@/components/Converters';
import AdSlot from '@/components/AdSlot';

export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }));
}

export function generateMetadata({ params }: { params: { tool: string } }): Metadata {
  const tool = getTool(params.tool);
  if (!tool) return { title: 'Not found' };
  const url = `${siteUrl()}/convert/${tool.slug}`;
  return {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: tool.title,
      description: tool.description,
      url,
      type: 'website',
    },
  };
}

export default function ToolPage({ params }: { params: { tool: string } }) {
  const tool = getTool(params.tool);
  if (!tool) notFound();

  const url = `${siteUrl()}/convert/${tool.slug}`;

  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use the ${tool.short}`,
    description: tool.description,
    step: tool.howTo.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: s,
    })),
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() },
      { '@type': 'ListItem', position: 2, name: tool.short, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="container-narrow tool-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link> · <Link href="/#tools">Tools</Link> ·{' '}
          <span>{tool.short}</span>
        </div>
        <h1>
          {tool.emoji} {tool.name}
        </h1>
        <p className="lead">{tool.intro}</p>
      </div>

      <div className="container-narrow" style={{ marginTop: 24 }}>
        <Converter tool={tool} />

        <AdSlot />

        <div className="prose">
          <h2>How to use the {tool.short}</h2>
          <ol>
            {tool.howTo.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <h2>Frequently asked questions</h2>
          {tool.faqs.map((f) => (
            <div className="faq-item" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}

          <h2>Related converters</h2>
          <div className="tool-grid" style={{ marginTop: 8 }}>
            {relatedTools(tool.slug).map((t) => (
              <Link key={t.slug} href={`/convert/${t.slug}`} className="tool-card">
                <span className="emoji">{t.emoji}</span>
                <h3>{t.short}</h3>
                <p>{t.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
