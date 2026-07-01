import Link from "next/link";
import SearchBox from "@/app/components/SearchBox";
import AdSlot from "@/app/components/AdSlot";
import { CATEGORIES, getAllTerms, termStats } from "@/lib/terms";
import { SITE } from "@/lib/site";

export default function HomePage() {
  const stats = termStats();
  const all = getAllTerms();
  const trending = all.filter((t) =>
    ["rizz", "hermes", "saoirse", "gnocchi", "delulu", "nike", "acai", "aoife"].includes(
      t.slug
    )
  );

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="pill">
            {stats.total} words · tap to hear every one
          </span>
          <h1>What does it mean, and how do you say it?</h1>
          <p className="lead">
            Look up any slang word, foreign phrase, tricky name, or brand. Get
            the plain-English meaning, an example, a syllable breakdown, and{" "}
            <strong>tap to hear it out loud</strong> — free.
          </p>
          <SearchBox />
        </div>
      </section>

      <section className="block">
        <div className="container">
          <h2 className="section-title">Browse by category</h2>
          <p className="section-sub">
            Four hubs, hundreds of entries, growing every build.
          </p>
          <div className="grid cols-2">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="card">
                <h3>{c.name}</h3>
                <p>{c.blurb}</p>
                <span className="count">
                  {stats.byCat[c.slug]} entries →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <AdSlot />
      </div>

      <section className="block alt">
        <div className="container">
          <h2 className="section-title">Trending look-ups</h2>
          <p className="section-sub">The words people always get wrong.</p>
          <ul className="term-list">
            {trending.map((t) => (
              <li key={t.slug}>
                <Link href={`/term/${t.slug}`}>
                  <span>{t.term}</span>
                  <span className="say">{t.phonetic}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <div className="grid cols-3">
            <div className="card">
              <h3>1. Search or browse</h3>
              <p>
                Find any term by name, or explore a category hub. Every page is
                one clean, focused answer.
              </p>
            </div>
            <div className="card">
              <h3>2. Read the meaning</h3>
              <p>
                Plain-English definition, a real example sentence, the syllable
                split, and a phonetic respelling.
              </p>
            </div>
            <div className="card">
              <h3>3. Tap to hear it</h3>
              <p>
                Press “Hear it” and your browser reads the word aloud — no app,
                no sign-up, works on mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="container">
          <h2 className="section-title">Want a whole category, offline?</h2>
          <p className="section-sub">
            Grab a printable {SITE.packPrice} Pronunciation Pack — every term in
            a category as a clean cheat-sheet you can print or keep on your
            phone.
          </p>
          <Link href="/pricing" className="btn">
            See the packs
          </Link>
        </div>
      </section>
    </>
  );
}
