"use client";

export function TocList({
  items,
  variant = "aside",
}: {
  items: { id: string; text: string; depth: 2 | 3 }[];
  variant?: "aside" | "inline";
}) {
  return (
    <nav
      aria-label="Table of contents"
      className={variant === "aside" ? "text-sm" : "text-[13px]"}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
        On this page
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={`${item.id}-${i}`} className={item.depth === 3 ? "ps-4" : ""}>
            <a
              href={`#${item.id}`}
              className="block text-muted leading-snug transition-colors hover:text-accent-ink"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
