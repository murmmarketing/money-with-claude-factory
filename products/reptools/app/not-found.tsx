import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container section center">
      <span className="eyebrow">404</span>
      <h1 style={{ fontSize: 40, marginBottom: 12 }}>Not found</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        That page (or that haul) doesn&apos;t exist or isn&apos;t public.
      </p>
      <Link href="/haul" className="btn btn-primary">
        Build a haul →
      </Link>
    </div>
  );
}
