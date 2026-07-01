import type { Metadata } from "next";
import Link from "next/link";
import BuyPack from "@/app/components/BuyPack";
import { CATEGORIES, termStats } from "@/lib/terms";
import { SITE, stripeEnabled } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pronunciation Packs",
  description:
    "Printable pronunciation cheat-sheets — every term in a category with meaning, syllables, and phonetics. One-time $4."
};

export default function PricingPage() {
  const enabled = stripeEnabled();
  const stats = termStats();
  const cats = CATEGORIES.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <section className="block">
      <div className="container">
        <h1 className="section-title">Pronunciation Packs</h1>
        <p className="section-sub">
          The whole site is free to browse. Packs are for when you want a
          category in one place — printable, offline, and yours to keep.
        </p>

        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="price-card">
            <span className="cat-tag" style={{ color: "var(--accent-dark)" }}>
              One-time
            </span>
            <div className="price">
              {SITE.packPrice} <small>/ pack</small>
            </div>
            <ul className="check-list">
              <li>Every term in the category, in one printable cheat-sheet</li>
              <li>Meaning, example, syllable split & phonetic spelling</li>
              <li>Tap-to-hear still works on the delivered page</li>
              <li>Print to PDF or download as a text file</li>
              <li>Free lifetime updates as the category grows</li>
            </ul>
            <BuyPack
              stripeEnabled={enabled}
              categories={cats}
              price={SITE.packPrice}
            />
            {!enabled ? (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14 }}>
                Checkout goes live the moment the owner connects Stripe. Until
                then, join the list above.
              </p>
            ) : null}
          </div>

          <div>
            <h2 className="section-title" style={{ fontSize: 22 }}>
              What&apos;s in each pack
            </h2>
            <ul className="term-list">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`}>
                    <span>{c.name}</span>
                    <span className="say">{stats.byCat[c.slug]} terms</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="notice" style={{ marginTop: 20 }}>
              Not sure yet? Every one of these terms is already free to read and
              hear — <Link href="/">start browsing</Link>.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
