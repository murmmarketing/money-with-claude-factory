export default function FeatureGrid({ bullets }: { bullets: string[] }) {
  if (!bullets || bullets.length === 0) return null;
  return (
    <ul className="feature-grid">
      {bullets.map((b, i) => (
        <li key={i} className="feature-card">
          <span className="feature-check" aria-hidden>
            ✓
          </span>
          {b}
        </li>
      ))}
    </ul>
  );
}
