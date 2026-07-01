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
    default: 'The Rep Playbook — the field manual for buying reps without getting scammed',
    template: '%s — The Rep Playbook',
  },
  description:
    'Everything you wish someone told you before your first rep haul: finds & W2C, choosing an agent, reading QC photos, sizing across factories, shipping, customs and legit-checking. Instant download.',
  keywords: [
    'how to buy reps for beginners',
    'rep playbook',
    'how to read qc photos',
    'rep sizing guide',
    'best rep agents',
    'rep slang glossary w2c qc',
    'is buying reps safe',
  ],
  openGraph: {
    title: 'The Rep Playbook — everything before your first rep haul',
    description:
      'The consolidated field manual for buying reps: finds, agents, QC, sizing, shipping, customs and legit-checking. One-time purchase, lifetime access.',
    url: SITE,
    siteName: 'The Rep Playbook',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f3ea',
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
