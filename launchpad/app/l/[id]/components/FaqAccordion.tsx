import type { Faq } from '../../../../components/types';

// Native <details> accordion: fully accessible + keyboard-operable with no JS.
export default function FaqAccordion({ items }: { items: Faq[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="faq">
      <h2>Frequently asked</h2>
      {items.map((f, i) => (
        <details key={i} className="faq-item">
          <summary>{f.q}</summary>
          <div className="faq-answer">{f.a}</div>
        </details>
      ))}
    </section>
  );
}
