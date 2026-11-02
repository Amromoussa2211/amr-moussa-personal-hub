import type { Metadata } from "next";

import { ArticleFilterList } from "@/components/article-filter-list";
import { getArticleMetas } from "@/lib/content";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Original, practical writing on QA engineering, Playwright, Python, performance testing, and AI-powered testing — from real projects.",
};

export default function ArticlesPage() {
  const articles = getArticleMetas().map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    categoryDisplay: a.categoryDisplay,
    date: a.date,
    difficulty: a.difficulty,
    readingTime: a.readingTime,
    tags: a.tags,
  }));

  return (
    <div className="mx-auto max-w-4xl px-5 pt-14">
      <header className="mb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Articles</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Deep, practical, original — no textbook regurgitation. Every article written against
          problems met in real suites.
        </p>
      </header>
      <ArticleFilterList articles={articles} />
    </div>
  );
}
