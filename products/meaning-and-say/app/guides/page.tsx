import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Guides on slang meanings and how to pronounce the words, names, and brands people get wrong.",
  alternates: { canonical: `${siteUrl()}/guides` }
};

export default function GuidesPage() {
  const articles = getAllArticles();
  return (
    <section className="block">
      <div className="container">
        <h1 className="section-title">Guides</h1>
        <p className="section-sub">
          Deep-dives on meaning and pronunciation — plus links to the words
          themselves.
        </p>
        <div className="grid cols-2">
          {articles.map((a) => (
            <Link key={a.slug} href={`/guides/${a.slug}`} className="card">
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <span className="count">Read the guide →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
