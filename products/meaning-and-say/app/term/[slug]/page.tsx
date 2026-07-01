import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PronounceButton from "@/app/components/PronounceButton";
import AdSlot from "@/app/components/AdSlot";
import {
  getAllTerms,
  getTermBySlug,
  getRelatedTerms,
  getCategory
} from "@/lib/terms";
import { siteUrl, SITE } from "@/lib/site";

export function generateStaticParams() {
  return getAllTerms().map((t) => ({ slug: t.slug }));
}

export function generateMetadata({
  params
}: {
  params: { slug: string };
}): Metadata {
  const term = getTermBySlug(params.slug);
  if (!term) return { title: "Not found" };
  const title = `What does “${term.term}” mean & how to pronounce it`;
  const description = `${term.term} (${term.phonetic}): ${term.meaning}`.slice(
    0,
    155
  );
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}/term/${term.slug}` },
    openGraph: { title, description, type: "article" }
  };
}

export default function TermPage({ params }: { params: { slug: string } }) {
  const term = getTermBySlug(params.slug);
  if (!term) notFound();

  const category = getCategory(term.category);
  const related = getRelatedTerms(term);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        name: term.term,
        description: term.meaning,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: category?.name ?? "Glossary"
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What does ${term.term} mean?`,
            acceptedAnswer: { "@type": "Answer", text: term.meaning }
          },
          {
            "@type": "Question",
            name: `How do you pronounce ${term.term}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${term.term} is pronounced ${term.phonetic} (${term.syllables}).`
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link> ›{" "}
          {category ? (
            <Link href={`/category/${category.slug}`}>{category.name}</Link>
          ) : null}{" "}
          › {term.term}
        </div>
      </div>

      <section className="term-hero">
        <div className="container">
          {category ? (
            <span className="cat-tag">{category.short}</span>
          ) : null}
          <h1>{term.term}</h1>
          <div className="pron">
            {term.phonetic}
            {term.partOfSpeech ? (
              <span style={{ color: "var(--muted)" }}> · {term.partOfSpeech}</span>
            ) : null}
          </div>
          <div className="pron-row">
            <PronounceButton text={term.term} label={`Hear “${term.term}”`} />
            <span className="speak-hint">
              Plays in your browser — no download, works on mobile.
            </span>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="def-block">
          <p className="label">What it means</p>
          <p className="val">{term.meaning}</p>

          <p className="label">Used in a sentence</p>
          <p className="val" style={{ fontStyle: "italic" }}>
            “{term.example}”
          </p>

          <p className="label">Syllable breakdown</p>
          <div className="val syllable-chips">
            {term.syllables.split(/[-\s]+/).map((s, i) => (
              <span className="chip" key={i}>
                {s}
              </span>
            ))}
          </div>

          <p className="label" style={{ marginTop: 18 }}>
            Phonetic spelling
          </p>
          <p className="val">{term.phonetic}</p>

          {term.origin ? (
            <>
              <p className="label">Origin</p>
              <p className="val">{term.origin}</p>
            </>
          ) : null}
        </div>

        <AdSlot />

        <h2 className="section-title" style={{ fontSize: 22 }}>
          Related look-ups
        </h2>
        <ul className="term-list" style={{ marginBottom: 40 }}>
          {related.map((r) => (
            <li key={r.slug}>
              <Link href={`/term/${r.slug}`}>
                <span>{r.term}</span>
                <span className="say">{r.phonetic}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="notice" style={{ marginBottom: 44 }}>
          Want every {category?.short ?? "category"} word as a printable
          cheat-sheet? See the {SITE.packPrice}{" "}
          <Link href="/pricing">Pronunciation Packs</Link>.
        </div>
      </div>
    </>
  );
}
