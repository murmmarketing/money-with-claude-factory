import { notFound } from 'next/navigation';
import { sb } from '../../../lib/supabase';
import type { Brand, LandingPage, TemplateVariant } from '../../../components/types';
import { brandToCssVars } from '../../../components/theme';
import Hero from './components/Hero';
import ProofBar from './components/ProofBar';
import FeatureGrid from './components/FeatureGrid';
import FaqAccordion from './components/FaqAccordion';
import CTASection from './components/CTASection';
import StickyCTA from './components/StickyCTA';
import DepositCTA from './components/DepositCTA';
import ViewBeacon from './components/ViewBeacon';
import WaitlistForm from './WaitlistForm';

export const revalidate = 60;
export const dynamicParams = true;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

async function getPage(id: string): Promise<LandingPage | null> {
  const { data } = await sb()
    .from('landing_pages')
    .select('*')
    .eq('id', id)
    .eq('live', true)
    .maybeSingle();
  return (data as LandingPage) || null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const page = await getPage(params.id);
  if (!page) {
    return { title: 'Lab', robots: { index: false, follow: false } };
  }
  const title = page.headline || 'Lab';
  const description = page.subhead || '';
  const ogImage = `${SITE}/api/og/${page.id}`;
  const url = `${SITE}/l/${page.id}`;
  // Promotion flips indexing automatically; noindex until then.
  const promoted = !!page.promoted;
  return {
    title,
    description,
    robots: { index: promoted, follow: promoted },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function LandingPage({ params }: { params: { id: string } }) {
  const page = await getPage(params.id);
  if (!page) notFound();

  const brand: Brand = page.brand || {};
  const bullets: string[] = page.bullets || [];
  const faq = page.faq || [];
  const ctaLabel = page.cta_label || 'Join the waitlist';
  const template: TemplateVariant = page.template || 'centered';
  const deposit = page.deposit_cents && page.deposit_cents > 0 ? page.deposit_cents : 0;
  const currency = page.deposit_currency || 'EUR';
  const count = page.live_signup_count ?? page.signup_count ?? 0;
  const threshold = page.proof_threshold ?? 10;

  const cta = (
    <CTASection>
      {deposit ? (
        <div style={{ marginBottom: 16 }}>
          <DepositCTA
            ideaId={page.id}
            depositCents={deposit}
            currency={currency}
            trustLine="Refundable anytime · No charge until launch"
          />
        </div>
      ) : null}
      <WaitlistForm
        ideaId={page.id}
        ctaLabel={ctaLabel}
        depositCents={deposit || undefined}
        depositCurrency={currency}
        shareIncentive={page.share_incentive || undefined}
      />
      {page.trust_line ? <p className="trust-line">{page.trust_line}</p> : null}
    </CTASection>
  );

  const hero = (
    <Hero
      headline={page.headline}
      subhead={page.subhead}
      eyebrow={page.eyebrow}
      logo={brand.logo}
    />
  );

  const proof = <ProofBar count={count} threshold={threshold} note={page.proof_note} />;
  const features = <FeatureGrid bullets={bullets} />;
  const faqBlock = <FaqAccordion items={faq} />;

  // Template variants reorder the same components.
  let body;
  if (template === 'split') {
    body = (
      <div className="tpl-body">
        <div>
          {hero}
          {proof}
          {features}
        </div>
        <div>
          {cta}
          {faqBlock}
        </div>
      </div>
    );
  } else if (template === 'left-rail') {
    body = (
      <div className="tpl-body">
        <aside>
          {hero}
          {cta}
          {proof}
        </aside>
        <div>
          {features}
          {faqBlock}
        </div>
      </div>
    );
  } else {
    // centered (default)
    body = (
      <div className="tpl-body">
        {hero}
        {proof}
        {cta}
        {features}
        {faqBlock}
      </div>
    );
  }

  return (
    <div style={brandToCssVars(brand)}>
      <ViewBeacon ideaId={page.id} />
      <main className={`container has-sticky-cta tpl-${template}`}>
        {body}
        <footer
          style={{
            marginTop: 56,
            fontSize: 12,
            color: 'var(--muted)',
            borderTop: '1px solid var(--border)',
            paddingTop: 16,
          }}
        >
          This is an early experiment. We&apos;ll only email you about this product. No spam,
          unsubscribe anytime.
        </footer>
      </main>
      <StickyCTA label={ctaLabel} targetId="signup" />
    </div>
  );
}
