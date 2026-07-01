import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { SITE, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: siteUrl(),
    siteName: SITE.name,
    type: "website"
  },
  twitter: {
    card: "summary",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              <span className="logo-mark" aria-hidden="true">
                M
              </span>
              <span>{SITE.name}</span>
            </Link>
            <nav className="nav">
              <Link href="/category/slang">Slang</Link>
              <Link href="/category/foreign-words">Foreign</Link>
              <Link href="/category/baby-names">Names</Link>
              <Link href="/category/brand-names">Brands</Link>
              <Link href="/pricing">Packs</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <div className="cols">
              <div>
                <h4>Browse</h4>
                <Link href="/category/slang">Slang & internet words</Link>
                <Link href="/category/foreign-words">Foreign & loan words</Link>
                <Link href="/category/baby-names">Names & baby names</Link>
                <Link href="/category/brand-names">Brand names</Link>
              </div>
              <div>
                <h4>Site</h4>
                <Link href="/">Home</Link>
                <Link href="/search">Search</Link>
                <Link href="/guides">Guides</Link>
                <Link href="/pricing">Pronunciation packs</Link>
                <Link href="/faq">FAQ</Link>
              </div>
              <div>
                <h4>{SITE.name}</h4>
                <span>{SITE.tagline}.</span>
                <span>Tap any word to hear it.</span>
              </div>
            </div>
            <div>
              © {new Date().getFullYear()} {SITE.name}. Pronunciations are a
              guide; regional accents vary.
            </div>
          </div>
        </footer>
        {adsClient ? (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
