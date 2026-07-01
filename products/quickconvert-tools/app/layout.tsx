import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { siteUrl, SITE } from '@/lib/tools';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'QuickConvert — Fast, Private, In-Browser Converters',
    template: '%s',
  },
  description:
    'A suite of single-purpose converters that run 100% in your browser. Convert images, units, CSV to JSON, timestamps, colors, Base64 and text case — no uploads, no sign-up.',
  applicationName: SITE.name,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: 'QuickConvert — Fast, Private, In-Browser Converters',
    description:
      'Convert images, units, CSV to JSON, timestamps, colors, Base64 and text case — all in your browser. Private by design.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickConvert — Fast, Private, In-Browser Converters',
    description:
      'Convert images, units, CSV to JSON, timestamps, colors and more, entirely in your browser.',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
