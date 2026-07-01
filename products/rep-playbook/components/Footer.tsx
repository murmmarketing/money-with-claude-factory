import Link from 'next/link';
import { HAULHQ_URL, MURMREPS_URL } from '../lib/content';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col" style={{ maxWidth: 320 }}>
          <span className="brand">
            The Rep <span className="mk">Playbook</span>
          </span>
          <p className="faint" style={{ fontSize: 14 }}>
            The field manual for buying reps without getting scammed — finds,
            agents, QC, sizing, shipping and customs in one place.
          </p>
          <p className="faint" style={{ fontSize: 12 }}>
            © {year} The Rep Playbook. Educational content only. Cost and customs
            figures are 2026 estimates — always confirm with your agent and local
            authority.
          </p>
        </div>
        <div className="footer-col">
          <b>Playbook</b>
          <Link href="/read">Read online</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/download">Downloads</Link>
          <Link href="/login">Log in</Link>
        </div>
        <div className="footer-col">
          <b>Free guides</b>
          <Link href="/read/start-here">Chapter 1 (free)</Link>
          <Link href="/read/slang-decoder">Slang glossary</Link>
          <Link href="/guides">All guides</Link>
        </div>
        <div className="footer-col">
          <b>Tools & finds</b>
          <a href={HAULHQ_URL} target="_blank" rel="noopener noreferrer">
            HaulHQ (cost calc)
          </a>
          <a href={MURMREPS_URL} target="_blank" rel="noopener noreferrer">
            MurmReps (finds)
          </a>
          <Link href="/pricing#faq">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}
