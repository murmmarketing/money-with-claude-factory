import type { Metadata } from 'next';
import { siteUrl } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'FAQ — QuickConvert',
  description:
    'Answers about how QuickConvert keeps your files private, what runs in the browser, offline use, and the Pro plan.',
  alternates: { canonical: `${siteUrl()}/faq` },
};

const FAQS = [
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. Every converter runs entirely in your browser using the Canvas API, FileReader and plain JavaScript. Your images, spreadsheets and text never leave your device, and we never see their contents — including on the Pro plan.',
  },
  {
    q: 'Do I need an account?',
    a: 'No account is required to use any tool. You only create an account if you choose to subscribe to Pro, so that we can manage your subscription.',
  },
  {
    q: 'Does it work offline?',
    a: 'Once a tool page has loaded, the conversion logic runs locally, so most tools keep working even if your connection drops.',
  },
  {
    q: 'What do I get with Pro?',
    a: 'Pro removes the single ad on free pages and unlocks batch conversion (processing many files at once) plus higher internal size limits. It is $5 per month or $39 per year.',
  },
  {
    q: 'Can I cancel Pro anytime?',
    a: 'Yes. Pro is a standard Stripe subscription you can cancel at any time; you keep access until the end of the billing period.',
  },
  {
    q: 'Is the free tier really free forever?',
    a: 'Yes. The core converters cost us almost nothing to run because there is no server-side processing, so the free tier is sustainable and here to stay.',
  },
  {
    q: 'Which browsers are supported?',
    a: 'Any modern browser — Chrome, Edge, Firefox, Safari — on desktop or mobile. The tools rely on standard web APIs that all current browsers support.',
  },
];

export default function FaqPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <section className="block">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="container-narrow">
        <h2 className="section-title">Frequently asked questions</h2>
        <p className="section-sub">Everything about privacy, offline use and Pro.</p>
        {FAQS.map((f) => (
          <div className="faq-item" key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
