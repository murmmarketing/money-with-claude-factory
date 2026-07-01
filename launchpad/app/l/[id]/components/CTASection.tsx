import type { ReactNode } from 'react';

export default function CTASection({
  id = 'signup',
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="cta-section">
      {children}
    </section>
  );
}
