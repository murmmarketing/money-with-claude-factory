import type { MetadataRoute } from 'next';
import { siteUrl } from '../lib/stripe';
import { CHAPTERS } from '../lib/content';
import { ARTICLES } from '../lib/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticPages = ['', '/pricing', '/read', '/guides'].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.8,
  }));

  // Only free chapters are indexable; locked ones are noindex.
  const chapterPages = CHAPTERS.filter((c) => c.free).map((c) => ({
    url: `${base}/read/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const articlePages = ARTICLES.map((a) => ({
    url: `${base}/guides/${a.slug}`,
    lastModified: new Date(a.updated),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...chapterPages, ...articlePages];
}
