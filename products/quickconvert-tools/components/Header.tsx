import Link from 'next/link';
import { SITE } from '@/lib/tools';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container inner">
        <Link href="/" className="brand">
          <span className="logo-mark">Q</span>
          {SITE.name}
        </Link>
        <nav className="nav">
          <Link href="/#tools">Tools</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/pricing" className="btn btn-primary" style={{ padding: '8px 14px' }}>
            Go Pro
          </Link>
        </nav>
      </div>
    </header>
  );
}
