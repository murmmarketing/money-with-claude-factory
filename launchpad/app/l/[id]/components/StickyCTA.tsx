'use client';
import { getSid } from './session';

// Sticky bottom bar shown only on small screens (CSS-gated). Mirrors the primary
// CTA: scrolls to the signup section and focuses the email field.
export default function StickyCTA({
  label,
  targetId = 'signup',
}: {
  label: string;
  targetId?: string;
}) {
  function go() {
    try {
      fetch('/api/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ name: 'sticky_cta_click', session_id: getSid() }),
      }).catch(() => {});
    } catch {
      /* no-op */
    }
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input[type="email"]') as HTMLInputElement | null;
      if (input) setTimeout(() => input.focus(), 350);
    }
  }

  return (
    <div className="sticky-cta">
      <button type="button" className="btn-primary" onClick={go}>
        {label}
      </button>
    </div>
  );
}
