import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/app/components/AdSlot";
import { getAllArticles, getArticle, renderMarkdown } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({
  params
}: {
  params: { slug: string };
}): Metadata {
  const article = getArticle(params.slug);
  if (!article) return { title: "Not found" };
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `${siteUrl()}/guides/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article"
    }
  };
}

export default function ArticlePage({
  params
}: {
  params: { slug: string };
}) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    mainEntityOfPage: `${siteUrl()}/guides/${article.slug}`
  };

  return (
    <section className="block">
      <div className="container prose">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="breadcrumb" style={{ paddingTop: 0 }}>
          <Link href="/">Home</Link> › <Link href="/guides">Guides</Link>
        </div>
        <article
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
        />
        <AdSlot />
        <div className="notice" style={{ marginTop: 24 }}>
          <Link href="/">Look up any word →</Link>
        </div>
      </div>
    </section>
  );
}
