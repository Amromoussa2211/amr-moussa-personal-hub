import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/Amromoussa2211",
    viewBox: "0 0 16 16",
    icon:
      "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/amr-moussa-88a9676b/",
    viewBox: "0 0 24 24",
    icon:
      "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45Z",
  },
  {
    label: "X",
    href: "https://x.com/amro_kaza",
    viewBox: "0 0 24 24",
    icon:
      "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z",
  },
];

export function SocialButtons({ size = "sm" }: { size?: "sm" | "lg" }) {
  const dims = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const icon = size === "lg" ? 18 : 15;
  return (
    <div className="flex items-center gap-2">
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className={`inline-flex ${dims} items-center justify-center rounded-full border border-hairline text-muted transition-all hover:border-accent hover:text-accent`}
        >
          <svg width={icon} height={icon} viewBox={s.viewBox} fill="currentColor" aria-hidden>
            <path d={s.icon} />
          </svg>
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="font-display text-lg font-semibold text-ink">Amr Moussa</p>
          <p className="text-sm leading-relaxed text-muted">
            Senior QA Engineer · Test Automation Lead.
            <br />
            Engineering Quality. Automating Confidence. Exploring AI.
          </p>
          <SocialButtons />
        </div>

        <nav aria-label="Footer — write">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Write</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/articles" className="text-muted hover:text-ink">Articles</Link></li>
            <li><Link href="/til" className="text-muted hover:text-ink">Today I Learned</Link></li>
            <li><Link href="/categories/tutorials" className="text-muted hover:text-ink">Tutorials</Link></li>
          </ul>
        </nav>

        <nav aria-label="Footer — topics">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Topics</p>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.filter((c) => c.inNav).slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="text-muted hover:text-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer — elsewhere">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Elsewhere</p>
          <ul className="space-y-2 text-sm">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
            <li><Link href="/contact" className="text-muted hover:text-ink">Contact</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-[13px] text-faint">
          <p>© {new Date().getFullYear()} Amr Moussa. All articles are original work.</p>
          <p>Built with Next.js · Deployed at zero cost</p>
        </div>
      </div>
    </footer>
  );
}
