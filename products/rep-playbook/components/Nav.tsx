import Link from 'next/link';

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          The Rep <span className="mk">Playbook</span>
        </Link>
        <nav className="nav-links">
          <Link href="/read" className="nav-hide-sm">
            Read
          </Link>
          <Link href="/guides" className="nav-hide-sm">
            Guides
          </Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/pricing" className="btn btn-primary btn-sm">
            Get the Playbook
          </Link>
        </nav>
      </div>
    </header>
  );
}
