import type { MetadataRoute } from 'next';
import { TOOLS, siteUrl } from '@/lib/tools';
import { getAllArticles } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticPages = ['', '/pricing', '/faq', '/blog'].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: p === '' ? 1 : 0.6,
  }));

  const toolPages = TOOLS.map((t) => ({
    url: `${base}/convert/${t.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const blogPages = getAllArticles().map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: a.date ? new Date(a.date) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...toolPages, ...blogPages];
}
