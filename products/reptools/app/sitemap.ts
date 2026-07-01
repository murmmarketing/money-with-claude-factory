import type { MetadataRoute } from 'next';
import { siteUrl } from '../lib/stripe';
import { anonClient } from '../lib/supabase';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/haul`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Public haul pages are long-tail UGC/SEO surface.
  try {
    const sb = anonClient();
    if (sb) {
      const { data } = await sb
        .from('hauls')
        .select('slug,updated_at')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(500);
      for (const h of data || []) {
        if ((h as any).slug) {
          staticRoutes.push({
            url: `${base}/h/${(h as any).slug}`,
            lastModified: new Date((h as any).updated_at || now),
            changeFrequency: 'monthly',
            priority: 0.5,
          });
        }
      }
    }
  } catch {
    /* sitemap still valid with static routes only */
  }

  return staticRoutes;
}
