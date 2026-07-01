import Link from "next/link";
import { industries } from "@/data/industries";
import { KIT_PRICE_CENTS, VAULT_PRICE_CENTS, usd } from "@/lib/config";

const FAQ = [
  {
    q: "What exactly do I get?",
    a: "Per industry: a clean, ATS-safe resume template (opens in Word and Google Docs), a bullet-point library written for that field, a cover-letter pack with a full template and swappable snippets, an ATS keyword list, and a one-page beat-the-ATS checklist."
  },
  {
    q: "What does 'ATS-proof' actually mean?",
    a: "Applicant Tracking Systems parse your resume before a human sees it. Fancy templates with columns, tables, and graphics confuse them and can silently drop your info. Our templates use a single-column, standard-font layout parsers read cleanly — plus keyword lists so you rank."
  },
  {
    q: "Is this a subscription?",
    a: "No. It's a one-time purchase. Buy a single industry kit for " + usd(KIT_PRICE_CENTS) + ", or the all-industries vault for " + usd(VAULT_PRICE_CENTS) + ". Yours to keep and reuse."
  },
  {
    q: "Can I edit the files?",
    a: "Yes. The resume template opens in Microsoft Word or Google Docs and is fully editable. The libraries and checklists are plain text you can copy from freely."
  },
  {
    q: "Will this guarantee I get the job?",
    a: "Nothing can. What these kits do is remove the technical reasons good candidates get filtered out — and give you strong, quantified starting-point bullets so a human recruiter actually reads you."
  }
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">ATS-Proof Resume Kits</span>
          <h1>Get past the resume robots.<br />Built for your industry.</h1>
          <p className="lead">
            75% of resumes are filtered by software before a human sees them. Our
            industry-specific kits give you an ATS-safe template, a bullet library, cover
            letters, and a keyword list — so you rank, then get read.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/pricing" className="btn">Get your kit — from {usd(KIT_PRICE_CENTS)}</Link>
            <Link href={`/resume/${industries[0].slug}`} className="btn btn-ghost">
              Try the free bullet picker
            </Link>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="section">
        <div className="container">
          <h2>What&apos;s in every kit</h2>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            <div className="card">
              <h3>ATS-safe template</h3>
              <p>Single-column, standard-font resume that parses cleanly. Opens in Word and Google Docs. No columns or graphics that break the robots.</p>
            </div>
            <div className="card">
              <h3>Bullet-point library</h3>
              <p>Dozens of quantified, ready-to-tailor bullets written for your field, sorted by seniority and theme. Swap in your numbers and go.</p>
            </div>
            <div className="card">
              <h3>Cover-letter pack</h3>
              <p>A full 3-paragraph template plus swappable snippets tuned to your industry, so you never stare at a blank page again.</p>
            </div>
            <div className="card">
              <h3>ATS keyword list</h3>
              <p>The exact keywords hiring software looks for in your role — weave them in to rank higher in the pile.</p>
            </div>
            <div className="card">
              <h3>Beat-the-ATS checklist</h3>
              <p>A printable one-pager covering formatting, keywords, and content so nothing gets you silently filtered out.</p>
            </div>
            <div className="card">
              <h3>Free bullet picker</h3>
              <p>Preview real bullets for your role and seniority on any industry page before you buy. See the quality first.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="section section-soft" id="industries">
        <div className="container">
          <h2>Pick your industry</h2>
          <p style={{ marginBottom: 24 }}>
            Each page has a free live bullet picker. Every kit is {usd(KIT_PRICE_CENTS)}, or
            get them all in the vault for {usd(VAULT_PRICE_CENTS)}.
          </p>
          <div className="grid grid-3">
            {industries.map((ind) => (
              <Link key={ind.slug} href={`/resume/${ind.slug}`} className="card" style={{ display: "block" }}>
                <h3>{ind.name}</h3>
                <p>{ind.hero}</p>
                <span style={{ display: "inline-block", marginTop: 12, color: "var(--accent)", fontWeight: 600 }}>
                  Try the bullet picker →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="section" id="pricing">
        <div className="container">
          <h2>Simple, one-time pricing</h2>
          <div className="price-grid" style={{ marginTop: 24 }}>
            <div className="price-card">
              <h3>Single industry kit</h3>
              <div className="price-tag">{usd(KIT_PRICE_CENTS)}</div>
              <p style={{ marginTop: 4 }}>Everything for one field.</p>
              <ul className="check-list">
                <li>ATS-safe resume template</li>
                <li>Full bullet-point library</li>
                <li>Cover-letter pack</li>
                <li>Keyword list + ATS checklist</li>
              </ul>
              <Link href="/pricing" className="btn btn-ghost">Choose your industry</Link>
            </div>
            <div className="price-card featured">
              <span className="price-badge">Best value</span>
              <h3>All-industries vault</h3>
              <div className="price-tag">{usd(VAULT_PRICE_CENTS)}</div>
              <p style={{ marginTop: 4 }}>Every current and future kit.</p>
              <ul className="check-list">
                <li>All {industries.length} industry kits</li>
                <li>Great for career changers</li>
                <li>Every template + library</li>
                <li>One download, yours forever</li>
              </ul>
              <Link href="/pricing" className="btn">Get the vault</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-soft" id="faq">
        <div className="narrow">
          <h2>Frequently asked</h2>
          <div style={{ marginTop: 16 }}>
            {FAQ.map((f) => (
              <div key={f.q} className="faq-item">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ schema for organic ranking */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a }
            }))
          })
        }}
      />
    </>
  );
}
