import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodeBlockEnhancer } from "@/components/code-block-enhancer";
import { ShareButtons } from "@/components/share-buttons";
import { TocList } from "@/components/toc";
import { getCategory } from "@/lib/categories";
import {
  getAdjacentArticles,
  getArticleBySlug,
  getArticleMetas,
} from "@/lib/content";
import { formatDate, formatDateLong } from "@/lib/format";

export function generateStaticParams() {
  return getArticleMetas().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description || article.excerpt,
    alternates: { canonical: `/articles/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description || article.excerpt,
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
      tags: article.tags,
    },
  };
}

const difficultyTone: Record<string, string> = {
  Beginner: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  Intermediate: "border-amber-500/30 text-amber-700 dark:text-amber-300",
  Advanced: "border-rose-500/30 text-rose-700 dark:text-rose-300",
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const { newer, older } = getAdjacentArticles(slug);
  const related = getArticleMetas()
    .filter((a) => a.slug !== slug && a.category === article.category)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.description || article.excerpt,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    author: {
      "@type": "Person",
      name: "Amr Moussa",
      jobTitle: "Senior QA Engineer",
      url: "https://x.com/amro_kaza",
    },
  };

  const breadcrumb = getCategory(article.category);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[12px] text-faint">
        <Link href="/articles" className="hover:text-ink">Articles</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/categories/${article.category}`} className="hover:text-ink">
          {article.categoryDisplay}
        </Link>
      </nav>

      {/* Header */}
      <header className="mt-5 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/categories/${article.category}`}
            className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink"
          >
            {article.categoryDisplay}
          </Link>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${difficultyTone[article.difficulty] ?? ""}`}
          >
            {article.difficulty}
          </span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.18] tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.15]">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mt-3 font-display text-lg text-muted">{article.subtitle}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline pb-5 text-[13px] text-muted">
          <span className="font-medium text-ink">Amr Moussa</span>
          <span aria-hidden>·</span>
          <span>
            Published <time dateTime={article.date}>{formatDateLong(article.date)}</time>
          </span>
          {article.updated && article.updated !== article.date && (
            <>
              <span aria-hidden>·</span>
              <span>
                Updated <time dateTime={article.updated}>{formatDateLong(article.updated)}</time>
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{article.readingTime} min read</span>
        </div>
      </header>

      {/* Share */}
      <div className="max-w-3xl pt-4">
        <ShareButtons title={article.title} path={`/articles/${slug}`} />
      </div>

      {/* Body + TOC */}
      <div className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <article className="editorial min-w-0 max-w-3xl">
          {/* Mobile TOC */}
          <details className="mb-8 rounded-xl border border-hairline bg-surface p-4 lg:hidden">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              Table of contents
            </summary>
            <div className="mt-3">
              <TocList items={article.toc} variant="inline" />
            </div>
          </details>

          {/* Rendered markdown (Sanitized: built from my own content pipeline) */}
          <div dangerouslySetInnerHTML={{ __html: article.html }} />
          <CodeBlockEnhancer />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-hairline px-3 py-1 text-[12px] text-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Desktop TOC */}
        <aside className="sticky top-24 hidden self-start lg:block">
          <TocList items={article.toc} />
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-3xl pt-16">
          <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            Related in {article.categoryDisplay}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/articles/${r.slug}`} className="group">
                <h3 className="font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
                  {r.title}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {r.readingTime} min · {formatDate(r.date)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Prev / next */}
      {(newer || older) && (
        <nav className="mx-auto mt-14 grid max-w-3xl gap-3 border-t border-hairline pt-8 sm:grid-cols-2">
          {older && (
            <Link
              href={`/articles/${older.slug}`}
              className="group rounded-2xl border border-hairline p-4 transition-colors hover:border-hairline-strong"
            >
              <span className="text-[11px] uppercase tracking-[0.14em] text-faint">
                ← Older
              </span>
              <p className="mt-1 font-display text-[15px] font-medium text-ink transition-colors group-hover:text-accent-ink">
                {older.title}
              </p>
            </Link>
          )}
          {newer && (
            <Link
              href={`/articles/${newer.slug}`}
              className="group rounded-2xl border border-hairline p-4 text-right transition-colors hover:border-hairline-strong sm:col-start-2"
            >
              <span className="text-[11px] uppercase tracking-[0.14em] text-faint">Newer →</span>
              <p className="mt-1 font-display text-[15px] font-medium text-ink transition-colors group-hover:text-accent-ink">
                {newer.title}
              </p>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
