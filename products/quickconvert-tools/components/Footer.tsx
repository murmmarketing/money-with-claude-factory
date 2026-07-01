import Link from 'next/link';
import { SITE, TOOLS } from '@/lib/tools';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cols">
          <div>
            <div className="brand" style={{ marginBottom: 10 }}>
              <span className="logo-mark">Q</span>
              {SITE.name}
            </div>
            <p style={{ maxWidth: 320, margin: 0 }}>
              {SITE.tagline} Every converter runs entirely in your browser —
              your files never leave your device.
            </p>
          </div>
          <div>
            <h4>Converters</h4>
            {TOOLS.map((t) => (
              <Link key={t.slug} href={`/convert/${t.slug}`}>
                {t.short}
              </Link>
            ))}
          </div>
          <div>
            <h4>QuickConvert</h4>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/blog">Guides</Link>
            <Link href="/#tools">All tools</Link>
          </div>
        </div>
        <p style={{ marginTop: 28 }}>
          © {year} {SITE.name}. Private by design — no uploads, no tracking of
          your file contents.
        </p>
      </div>
    </footer>
  );
}
