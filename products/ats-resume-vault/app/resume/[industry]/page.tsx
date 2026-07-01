import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getIndustry, industrySlugs } from "@/data/industries";
import { KIT_PRICE_CENTS, VAULT_PRICE_CENTS, usd } from "@/lib/config";
import BulletPicker from "./BulletPicker";
import BuyButton from "./BuyButton";

export function generateStaticParams() {
  return industrySlugs.map((industry) => ({ industry }));
}

export function generateMetadata({ params }: { params: { industry: string } }): Metadata {
  const ind = getIndustry(params.industry);
  if (!ind) return { title: "Not found" };
  return {
    title: `${ind.name} Resume Template + Bullet Points (ATS-Safe)`,
    description: `ATS-safe ${ind.searchName} resume template, bullet-point library, cover letters, and keyword list. Try the free bullet picker, then get the full kit for ${usd(KIT_PRICE_CENTS)}.`,
    alternates: { canonical: `/resume/${ind.slug}` }
  };
}

export default function IndustryPage({ params }: { params: { industry: string } }) {
  const ind = getIndustry(params.industry);
  if (!ind) notFound();

  const categories = Array.from(new Set(ind.bullets.map((b) => b.category)));

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">{ind.name} · ATS-Proof Kit</span>
          <h1>{ind.name} Resume Template &amp; Bullet Points</h1>
          <p className="lead">{ind.hero} Beat the applicant tracking system with a clean template, a full bullet library, cover letters, and the exact keywords recruiters&apos; software scans for.</p>
          <div style={{ marginTop: 24 }}>
            <BuyButton product={ind.slug} label={`Get the ${ind.name} kit — ${usd(KIT_PRICE_CENTS)}`} />
          </div>
        </div>
      </section>

      {/* Free bullet picker */}
      <section className="section">
        <div className="container">
          <BulletPicker bullets={ind.bullets} categories={categories} industryName={ind.name} />
        </div>
      </section>

      {/* Keywords */}
      <section className="section section-soft">
        <div className="container">
          <h2>ATS keywords for {ind.searchName} roles</h2>
          <p>Applicant tracking systems rank resumes on keyword match. These are the terms hiring software looks for in {ind.name.toLowerCase()} applications — weave in the ones that are true for you.</p>
          <div style={{ marginTop: 12 }}>
            {ind.atsKeywords.map((k) => (
              <span key={k} className="pill">{k}</span>
            ))}
          </div>
          <h3 style={{ marginTop: 28 }}>Roles this kit covers</h3>
          <div style={{ marginTop: 8 }}>
            {ind.roles.map((r) => (
              <span key={r} className="pill">{r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ATS tips */}
      <section className="section">
        <div className="narrow">
          <h2>How to beat the ATS as a {ind.searchName}</h2>
          <div className="faq-item">
            <h3>1. Use a single-column, parser-friendly layout</h3>
            <p>Multi-column templates and text boxes look great to humans but scramble in the parser. The {ind.name} template in this kit uses one column and standard fonts so every line is read correctly.</p>
          </div>
          <div className="faq-item">
            <h3>2. Match the job description&apos;s exact keywords</h3>
            <p>Mirror the phrasing in the posting. If it says &quot;{ind.atsKeywords[0]}&quot;, use that exact term — not a synonym. Your keyword list makes this fast.</p>
          </div>
          <div className="faq-item">
            <h3>3. Quantify every bullet</h3>
            <p>Action verb + what you did + a number. The bullet library gives you dozens of quantified {ind.name.toLowerCase()} examples; swap in your real figures.</p>
          </div>
          <div className="faq-item">
            <h3>4. Submit as .docx unless told otherwise</h3>
            <p>Most ATS parse Word documents most reliably. The template downloads ready to open and edit in Word or Google Docs.</p>
          </div>
        </div>
      </section>

      {/* Buy / pricing */}
      <section className="section section-soft">
        <div className="container">
          <h2>Get the full {ind.name} kit</h2>
          <div className="price-grid" style={{ marginTop: 20 }}>
            <div className="price-card featured">
              <span className="price-badge">This industry</span>
              <h3>{ind.name} kit</h3>
              <div className="price-tag">{usd(KIT_PRICE_CENTS)}</div>
              <ul className="check-list">
                <li>ATS-safe resume template (.doc)</li>
                <li>Full {ind.name} bullet library</li>
                <li>Cover-letter pack</li>
                <li>Keyword list + ATS checklist</li>
              </ul>
              <BuyButton product={ind.slug} label={`Get the ${ind.name} kit`} />
            </div>
            <div className="price-card">
              <h3>All-industries vault</h3>
              <div className="price-tag">{usd(VAULT_PRICE_CENTS)}</div>
              <p style={{ marginTop: 4 }}>Every industry kit — ideal for career changers.</p>
              <ul className="check-list">
                <li>All industry kits included</li>
                <li>Every template + library</li>
                <li>One download, yours forever</li>
              </ul>
              <BuyButton product="all" label="Get the vault" variant="ghost" />
            </div>
          </div>
          <p style={{ marginTop: 16 }}>
            <Link href="/pricing">See all pricing →</Link>
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${ind.name} ATS Resume Kit`,
            description: `ATS-safe ${ind.searchName} resume template, bullet library, cover letters, and keyword list.`,
            offers: {
              "@type": "Offer",
              price: (KIT_PRICE_CENTS / 100).toFixed(2),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock"
            }
          })
        }}
      />
    </>
  );
}
