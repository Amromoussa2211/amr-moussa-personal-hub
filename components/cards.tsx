import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { ArticleMeta, TiltMeta } from "@/lib/content";
import type { ProjectMeta } from "@/lib/github";

export function ArticleCard({ a, big = false }: { a: ArticleMeta; big?: boolean }) {
  return (
    <article className="group relative flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em]">
        <Link
          href={`/categories/${a.category}`}
          className="text-accent-ink transition-opacity hover:opacity-70"
        >
          {a.categoryDisplay}
        </Link>
        <span className="text-faint">{formatDate(a.date)}</span>
      </div>

      <Link href={`/articles/${a.slug}`} className="focus:outline-none">
        <h3
          className={
            big
              ? "font-display text-2xl font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink sm:text-[1.75rem]"
              : "font-display text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink"
          }
        >
          {a.title}
        </h3>
        <p className={`mt-1.5 leading-relaxed text-muted ${big ? "text-[15px]" : "text-sm"}`}>
          {a.excerpt.length > 168 ? a.excerpt.slice(0, 165) + "…" : a.excerpt}
        </p>
        <span className="absolute inset-0" aria-hidden />
      </Link>

      <div className="mt-1 flex items-center gap-3 text-[12px] text-faint">
        <span className="rounded-full border border-hairline px-2 py-0.5">{a.difficulty}</span>
        <span>{a.readingTime} min read</span>
        {a.tags.length > 0 && <span className="truncate">#{a.tags[0]}</span>}
      </div>
    </article>
  );
}

export function TiltItem({ t }: { t: TiltMeta }) {
  return (
    <article className="group relative flex flex-col gap-1 border-b border-hairline py-4 last:border-0">
      <div className="flex items-baseline gap-3">
        <time className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-faint">
          {formatDate(t.date)}
        </time>
        <Link href={`/til/${t.slug}`} className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-medium text-ink transition-colors group-hover:text-accent-ink">
            {t.title}
          </h3>
          <span className="absolute inset-0" aria-hidden />
        </Link>
      </div>
      <div className="ps-[108px] text-[12px] text-faint">{t.readingTime} min · {t.tags.join(" · ")}</div>
    </article>
  );
}

export function ProjectCard({ p }: { p: ProjectMeta }) {
  return (
    <a
      href={p.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-2xl border border-hairline bg-surface p-5 transition-all hover:border-hairline-strong hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-ink">
          {p.areaOfFocus}
        </span>
        {p.language && <span className="text-[12px] text-faint">{p.language}</span>}
      </div>
      <h3 className="font-mono text-sm font-medium text-ink transition-colors group-hover:text-accent-ink">
        {p.name}
      </h3>
      <p className="text-[13px] leading-relaxed text-muted line-clamp-3">{p.blurb}</p>
      <div className="mt-auto flex items-center gap-3 pt-2 text-[12px] text-faint">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0">
          <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 3 22l1.5-4.5L17 3Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Source on GitHub</span>
        {p.stars > 0 && <span>★ {p.stars}</span>}
      </div>
    </a>
  );
}
