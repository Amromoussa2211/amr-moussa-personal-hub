import type { MetadataRoute } from "next";

import { CATEGORIES } from "@/lib/categories";
import { getArticleMetas, getTiltMetas } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/articles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/til`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
  ];

  const categories: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${base}/categories/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const articles: MetadataRoute.Sitemap = getArticleMetas().map((a) => ({
    url: `${base}/articles/${a.slug}`,
    lastModified: a.updated ? new Date(a.updated) : new Date(a.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const tils: MetadataRoute.Sitemap = getTiltMetas().map((t) => ({
    url: `${base}/til/${t.slug}`,
    lastModified: new Date(t.date),
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  return [...statics, ...categories, ...articles, ...tils];
}
