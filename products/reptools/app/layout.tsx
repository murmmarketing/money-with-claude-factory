import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { fontVariableClasses } from '../components/fonts';
import { siteUrl } from '../lib/stripe';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const SITE = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'HaulHQ — the command center for your reps hauls',
    template: '%s — HaulHQ',
  },
  description:
    'Real landed cost, cheapest-agent compare, and shareable haul lists for rep buyers. Free landed-cost calculator with agent fees + customs/VAT built in.',
  keywords: [
    'reps landed cost calculator',
    'rep haul calculator',
    'cnfans shipping calculator',
    'kakobuy customs vat',
    'reps de minimis',
  ],
  openGraph: {
    title: 'HaulHQ — the command center for your reps hauls',
    description:
      'Real landed cost, cheapest-agent compare, and shareable haul lists for rep buyers.',
    url: SITE,
    siteName: 'HaulHQ',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0d12',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariableClasses}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
