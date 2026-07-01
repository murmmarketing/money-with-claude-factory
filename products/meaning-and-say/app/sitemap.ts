import type { MetadataRoute } from "next";
import { getAllTerms, CATEGORIES } from "@/lib/terms";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/search`, lastModified: now, priority: 0.5 },
    { url: `${base}/pricing`, lastModified: now, priority: 0.6 },
    { url: `${base}/faq`, lastModified: now, priority: 0.4 }
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: now,
    priority: 0.8
  }));

  const termPages: MetadataRoute.Sitemap = getAllTerms().map((t) => ({
    url: `${base}/term/${t.slug}`,
    lastModified: now,
    priority: 0.7
  }));

  return [...staticPages, ...categoryPages, ...termPages];
}
