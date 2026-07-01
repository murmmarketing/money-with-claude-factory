import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section center">
      <div className="narrow">
        <span className="eyebrow">404</span>
        <h1>That page took a different shipping line.</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          It&rsquo;s not here. Let&rsquo;s get you back on track.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">
            Home
          </Link>
          <Link href="/read/start-here" className="btn btn-ghost">
            Read Chapter 1 free
          </Link>
        </div>
      </div>
    </section>
  );
}
