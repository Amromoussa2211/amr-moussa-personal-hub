import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/cards";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getArticleMetas } from "@/lib/content";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  return { title: cat.name, description: cat.description };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const articles = getArticleMetas().filter((a) => a.category === slug);
  const others = CATEGORIES.filter((c) => c.slug !== slug);

  return (
    <div className="mx-auto max-w-4xl px-5 pt-14">
      <header className="mb-12 border-b border-hairline pb-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-[12px] text-faint">
          <Link href="/articles" className="hover:text-ink">Articles</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted">{cat.name}</span>
        </nav>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">{cat.name}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{cat.description}</p>
      </header>

      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-faint">
          Nothing published in this category yet — check back soon.
        </p>
      ) : (
        <div className="divide-y divide-hairline">
          {articles.map((a) => (
            <div key={a.slug} className="py-7 first:pt-0">
              <ArticleCard a={a} />
            </div>
          ))}
        </div>
      )}

      <section className="pt-20">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Other topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {others.map((c) => (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="rounded-full border border-hairline px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent-ink"
            >
              {c.short}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
