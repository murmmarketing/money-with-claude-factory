import { notFound } from 'next/navigation';
import { sb } from '../../../lib/supabase';
import WaitlistForm from './WaitlistForm';

export const revalidate = 60;
export const dynamicParams = true;

type Brand = { accent?: string; logo?: string };
type Faq = { q: string; a: string };

async function getPage(id: string) {
  const { data } = await sb()
    .from('landing_pages')
    .select('*')
    .eq('id', id)
    .eq('live', true)
    .maybeSingle();
  return data as any;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const page = await getPage(params.id);
  return {
    title: page?.headline ?? 'Lab',
    robots: { index: false, follow: false },
  };
}

export default async function LandingPage({ params }: { params: { id: string } }) {
  const page = await getPage(params.id);
  if (!page) notFound();

  const brand: Brand = page.brand || {};
  const accent = brand.accent || '#2f6df6';
  const bullets: string[] = page.bullets || [];
  const faq: Faq[] = page.faq || [];

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '56px 20px' }}>
      <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: '0 0 12px' }}>{page.headline}</h1>
      <p style={{ fontSize: 20, color: '#475467', margin: '0 0 28px' }}>{page.subhead}</p>

      <WaitlistForm ideaId={page.id} accent={accent} ctaLabel={page.cta_label || 'Join the waitlist'} />

      {bullets.length > 0 && (
        <ul style={{ marginTop: 36, lineHeight: 1.9, color: '#101828', paddingLeft: 20 }}>
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      {faq.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22 }}>FAQ</h2>
          {faq.map((f, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <strong>{f.q}</strong>
              <p style={{ margin: '4px 0', color: '#475467' }}>{f.a}</p>
            </div>
          ))}
        </section>
      )}

      <footer style={{ marginTop: 56, fontSize: 12, color: '#98a2b3', borderTop: '1px solid #eaecf0', paddingTop: 16 }}>
        This is an early experiment. We&apos;ll only email you about this product. No spam, unsubscribe anytime.
      </footer>
    </main>
  );
}
