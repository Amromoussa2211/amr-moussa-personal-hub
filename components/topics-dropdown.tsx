"use client";

import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";

/** Zero-JS-dependent dropdown (details/summary), with a click handler only
 *  to close after navigation — runs on the client, safe in server-rendered HTML. */
export function TopicsDropdown() {
  const inNav = CATEGORIES.filter((c) => c.inNav);
  const rest = CATEGORIES.filter((c) => !c.inNav);

  function close(e: React.MouseEvent<HTMLAnchorElement>) {
    const parent = e.currentTarget.closest("details");
    if (parent) parent.open = false;
  }

  return (
    <details className="relative group">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-sm text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        Topics
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5">
          <path d="M2 3.5 5 6.5 8 3.5" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border border-hairline bg-surface p-2 shadow-lg shadow-black/5">
        {inNav.map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            onClick={close}
            className="block rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            {c.name}
          </Link>
        ))}
        <div className="my-1 border-t border-hairline" />
        {rest.map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            onClick={close}
            className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-accent-soft hover:text-ink"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </details>
  );
}
