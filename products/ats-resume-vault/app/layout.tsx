import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BRAND, siteUrl } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`
  },
  description:
    "Downloadable ATS-safe resume kits by industry: a clean template, a bullet-point library, cover-letter snippets, and a beat-the-ATS checklist. Try the free bullet picker.",
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "ATS-safe resume templates, bullet libraries, and cover letters built for your specific industry.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="container nav-inner">
            <Link href="/" className="logo">
              <span className="logo-mark">RV</span>
              {BRAND.name}
            </Link>
            <nav className="nav-links">
              <Link href="/#industries">Industries</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/#faq">FAQ</Link>
              <Link href="/pricing" className="btn">Get your kit</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            <div className="logo" style={{ marginBottom: 12 }}>
              <span className="logo-mark">RV</span>
              {BRAND.name}
            </div>
            <p style={{ maxWidth: 520 }}>
              {BRAND.tagline}. Built to get you past the resume robots and in front of a
              human. Not affiliated with any specific ATS vendor.
            </p>
            <p style={{ marginTop: 16 }}>
              <Link href="/pricing">Pricing</Link> &nbsp;·&nbsp;
              <Link href="/#industries">Industries</Link> &nbsp;·&nbsp;
              <Link href="/#faq">FAQ</Link> &nbsp;·&nbsp;
              <a href={`mailto:${BRAND.support}`}>Support</a>
            </p>
            <p style={{ marginTop: 16, fontSize: "0.82rem" }}>
              © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
