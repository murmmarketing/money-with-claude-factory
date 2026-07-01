import Link from 'next/link';
import { TOOLS, SITE, siteUrl } from '@/lib/tools';

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: siteUrl(),
    description:
      'A suite of single-purpose converters that run 100% in your browser — images, units, CSV to JSON, timestamps, colors, Base64 and text case.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="hero">
        <div className="container">
          <span className="pill">100% in your browser · nothing uploaded</span>
          <h1>Fast, private converters that never touch a server</h1>
          <p className="sub">
            Convert images, units, CSV, timestamps, colors, Base64 and text case
            in one click. Every tool runs on your device, so your files stay
            private — and it works even offline.
          </p>
          <div className="cta-row">
            <Link href="#tools" className="btn btn-primary">
              Browse the tools
            </Link>
            <Link href="/pricing" className="btn btn-secondary">
              See Pro
            </Link>
          </div>
        </div>
      </section>

      <section className="block" id="tools">
        <div className="container">
          <h2 className="section-title">Pick a converter</h2>
          <p className="section-sub">
            Each one is a focused, single-purpose tool. No account required.
          </p>
          <div className="tool-grid">
            {TOOLS.map((t) => (
              <Link key={t.slug} href={`/convert/${t.slug}`} className="tool-card">
                <span className="emoji">{t.emoji}</span>
                <h3>{t.short}</h3>
                <p>{t.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="container">
          <h2 className="section-title">Why QuickConvert</h2>
          <p className="section-sub">Built for speed, privacy and zero friction.</p>
          <div className="features">
            <div className="feature">
              <div className="ico">🔒</div>
              <h3>Truly private</h3>
              <p>
                Conversions run with the browser Canvas, FileReader and plain
                JavaScript. Your files never leave your machine — there is no
                upload and no server log of your data.
              </p>
            </div>
            <div className="feature">
              <div className="ico">⚡</div>
              <h3>Instant</h3>
              <p>
                No round-trip to a server means results appear as fast as you can
                type or drop a file. Once loaded, most tools even work offline.
              </p>
            </div>
            <div className="feature">
              <div className="ico">🎯</div>
              <h3>One job each</h3>
              <p>
                Every converter does exactly one thing well, with a clean UI and
                copy-to-clipboard everywhere. No clutter, no dark patterns.
              </p>
            </div>
            <div className="feature">
              <div className="ico">💸</div>
              <h3>Free forever</h3>
              <p>
                The core tools are free. Pro ($5/mo) removes ads and unlocks batch
                conversion and higher limits when you need them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container-narrow" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Ready when you are</h2>
          <p className="section-sub">
            Start with any tool — no sign-up, no upload, no waiting.
          </p>
          <Link href="#tools" className="btn btn-primary">
            Choose a converter
          </Link>
        </div>
      </section>
    </>
  );
}
