"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/categories";
import { formatDate } from "@/lib/format";

export type ArticleListItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryDisplay: string;
  date: string;
  difficulty: string;
  readingTime: number;
  tags: string[];
};

export function ArticleFilterList({ articles }: { articles: ArticleListItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const usedCategories = useMemo(() => {
    const slugs = new Set(articles.map((a) => a.category));
    return CATEGORIES.filter((c) => slugs.has(c.slug));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [articles, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:w-72">
          <span className="sr-only">Search articles</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-full border border-hairline bg-surface py-2 pl-9 pr-4 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
              category === null
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-hairline text-muted hover:border-hairline-strong hover:text-ink"
            }`}
          >
            All
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(category === c.slug ? null : c.slug)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                category === c.slug
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-hairline text-muted hover:border-hairline-strong hover:text-ink"
              }`}
            >
              {c.short}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-faint">
          Nothing published under this filter yet.
        </p>
      ) : (
        <div className="mt-10 divide-y divide-hairline">
          {filtered.map((a) => (
            <article key={a.slug} className="group relative py-6 first:pt-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                <Link href={`/articles/${a.slug}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em]">
                    <span className="text-accent-ink">{a.categoryDisplay}</span>
                    <span className="text-faint">{formatDate(a.date)}</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
                    {a.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {a.excerpt.length > 220 ? a.excerpt.slice(0, 218) + "…" : a.excerpt}
                  </p>
                  <span className="absolute inset-0" aria-hidden />
                </Link>
                <div className="flex shrink-0 items-center gap-3 text-[12px] text-faint sm:flex-col sm:items-end sm:gap-1.5">
                  <span className="rounded-full border border-hairline px-2 py-0.5">
                    {a.difficulty}
                  </span>
                  <span>{a.readingTime} min</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
