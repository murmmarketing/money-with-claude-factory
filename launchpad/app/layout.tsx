import type { ReactNode } from 'react';
import './globals.css';
import { fontVariableClasses } from '../components/fonts';

export const metadata = {
  title: 'Lab',
  robots: { index: false, follow: false },
};

// Previously there was NO viewport meta, so mobile rendered at 980px. Fix that.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariableClasses}>
      <body>{children}</body>
    </html>
  );
}
