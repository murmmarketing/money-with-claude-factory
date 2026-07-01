import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/app/components/AdSlot";
import {
  CATEGORIES,
  getCategory,
  getTermsByCategory,
  type CategorySlug
} from "@/lib/terms";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({
  params
}: {
  params: { slug: string };
}): Metadata {
  const cat = getCategory(params.slug);
  if (!cat) return { title: "Not found" };
  return {
    title: `${cat.name} — meanings & pronunciations`,
    description: cat.blurb,
    alternates: { canonical: `${siteUrl()}/category/${cat.slug}` }
  };
}

export default function CategoryPage({
  params
}: {
  params: { slug: string };
}) {
  const cat = getCategory(params.slug);
  if (!cat) notFound();

  const terms = getTermsByCategory(cat.slug as CategorySlug);

  // Group A–Z for scannability.
  const groups = new Map<string, typeof terms>();
  for (const t of terms) {
    const letter = t.term[0].toUpperCase().replace(/[^A-Z]/, "#");
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(t);
  }
  const letters = [...groups.keys()].sort();

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="breadcrumb" style={{ paddingTop: 0 }}>
            <Link href="/">Home</Link> › {cat.name}
          </div>
          <h1 style={{ fontSize: 34, marginTop: 10 }}>{cat.name}</h1>
          <p className="lead">{cat.blurb}</p>
          <span className="pill">{terms.length} entries · tap any to hear it</span>
        </div>
      </section>

      <section className="block">
        <div className="container">
          {letters.map((letter) => (
            <div key={letter} style={{ marginBottom: 26 }}>
              <h2
                className="section-title"
                style={{ fontSize: 20, color: "var(--accent-dark)" }}
              >
                {letter}
              </h2>
              <ul className="term-list">
                {groups.get(letter)!.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/term/${t.slug}`}>
                      <span>{t.term}</span>
                      <span className="say">{t.phonetic}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <AdSlot />

          <div className="notice">
            Get all {terms.length} of these as a printable cheat-sheet — see the{" "}
            <Link href="/pricing">{cat.short} Pronunciation Pack</Link>.
          </div>
        </div>
      </section>
    </>
  );
}
