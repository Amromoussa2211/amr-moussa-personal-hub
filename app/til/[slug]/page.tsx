import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodeBlockEnhancer } from "@/components/code-block-enhancer";
import { getTiltBySlug, getTiltMetas } from "@/lib/content";
import { formatDateLong } from "@/lib/format";

export function generateStaticParams() {
  return getTiltMetas().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const til = await getTiltBySlug(slug);
  if (!til) return {};
  return {
    title: `TIL: ${til.title}`,
    description: `${til.title} — Today I Learned, ${til.tags.join(", ")}`,
    alternates: { canonical: `/til/${slug}` },
  };
}

export default async function TiltPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const til = await getTiltBySlug(slug);
  if (!til) notFound();
  const others = getTiltMetas().filter((t) => t.slug !== slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: til.title,
    datePublished: til.date,
    author: { "@type": "Person", name: "Amr Moussa" },
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-[12px] text-faint">
        <Link href="/til" className="hover:text-ink">Today I Learned</Link>
      </nav>

      <header className="mt-4 border-b border-hairline pb-6">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
          {til.title}
        </h1>
        <p className="mt-3 text-[13px] text-muted">
          <time dateTime={til.date}>{formatDateLong(til.date)}</time> · {til.readingTime} min ·{" "}
          {til.tags.join(" · ")}
        </p>
      </header>

      <article className="editorial py-8">
        <div dangerouslySetInnerHTML={{ __html: til.html }} />
      </article>
      <CodeBlockEnhancer />

      {others.length > 0 && (
        <section className="border-t border-hairline pt-8">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            More TILs
          </h2>
          <ul className="space-y-2.5">
            {others.map((t) => (
              <li key={t.slug}>
                <Link href={`/til/${t.slug}`} className="group font-display text-[15px] font-medium text-ink-soft transition-colors hover:text-accent-ink">
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
