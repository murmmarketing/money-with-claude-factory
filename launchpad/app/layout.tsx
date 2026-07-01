import type { ReactNode } from 'react';

export const metadata = {
  title: 'Lab',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', background: '#fff', color: '#101828' }}>
        {children}
      </body>
    </html>
  );
}
