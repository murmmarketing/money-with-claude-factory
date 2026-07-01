import Link from 'next/link';

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          Haul<b>HQ</b>
        </Link>
        <nav className="nav-links">
          <Link href="/haul" className="nav-hide-sm">
            Haul Builder
          </Link>
          <Link href="/tools" className="nav-hide-sm">
            Tools
          </Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/account" className="nav-hide-sm">
            Account
          </Link>
          <Link href="/haul" className="btn btn-primary btn-sm">
            Start a haul
          </Link>
        </nav>
      </div>
    </header>
  );
}
