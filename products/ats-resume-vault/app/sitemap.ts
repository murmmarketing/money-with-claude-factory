import type { MetadataRoute } from "next";
import { industrySlugs } from "@/data/industries";
import { siteUrl } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 }
  ];
  const industryPages: MetadataRoute.Sitemap = industrySlugs.map((slug) => ({
    url: `${base}/resume/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9
  }));
  return [...staticPages, ...industryPages];
}
