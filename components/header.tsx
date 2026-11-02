import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopicsDropdown } from "@/components/topics-dropdown";

const PRIMARY = [
  { href: "/articles", label: "Articles" },
  { href: "/projects", label: "Projects" },
  { href: "/til", label: "TIL" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="group inline-flex items-baseline gap-1.5">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Amr&nbsp;Moussa
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-accent sm:inline">
            QA
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {PRIMARY.slice(0, 2).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
          <TopicsDropdown />
          {PRIMARY.slice(2).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav — zero-JS disclosure */}
      <details className="border-t border-hairline md:hidden">
        <summary className="flex h-11 cursor-pointer list-none items-center justify-between px-5 text-sm text-muted [&::-webkit-details-marker]:hidden">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em]">Menu</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4.5h12M2 8h12M2 11.5h12" strokeLinecap="round" />
          </svg>
        </summary>
        <nav className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 pb-4" aria-label="Mobile">
          {PRIMARY.map((l) => (
            <Link key={l.href} href={l.href} className="py-1.5 text-sm text-ink-soft">
              {l.label}
            </Link>
          ))}
          {CATEGORIES.filter((c) => c.inNav).map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="py-1.5 text-sm text-muted">
              {c.name}
            </Link>
          ))}
        </nav>
      </details>
    </header>
  );
}
