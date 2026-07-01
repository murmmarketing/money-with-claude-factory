import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col" style={{ maxWidth: 300 }}>
          <span className="brand">
            Haul<b>HQ</b>
          </span>
          <p className="muted" style={{ fontSize: 14 }}>
            The command center for your reps hauls — real landed cost,
            cheapest-agent compare, and shareable haul lists.
          </p>
          <p className="faint" style={{ fontSize: 12 }}>
            © {year} HaulHQ. Estimates are for planning only — always confirm
            fees, shipping and customs with your agent and local authority.
          </p>
        </div>
        <div className="footer-col">
          <b>Tools</b>
          <Link href="/haul">Haul Builder</Link>
          <Link href="/tools">CNY converter</Link>
          <Link href="/tools">Shipping estimator</Link>
          <Link href="/tools">Customs quick-check</Link>
        </div>
        <div className="footer-col">
          <b>Product</b>
          <Link href="/pricing">Pricing</Link>
          <Link href="/account">Account</Link>
          <Link href="/login">Log in</Link>
        </div>
        <div className="footer-col">
          <b>Guides</b>
          <Link href="/#faq">FAQ</Link>
          <Link href="/haul">Landed cost 101</Link>
          <Link href="/tools">De-minimis by country</Link>
        </div>
      </div>
    </footer>
  );
}
