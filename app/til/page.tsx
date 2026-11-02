import type { Metadata } from "next";

import { TiltItem } from "@/components/cards";
import { getTiltMetas } from "@/lib/content";

export const metadata: Metadata = {
  title: "Today I Learned",
  description:
    "Short, honest technical discoveries from real work — small gotchas, quick wins, and things worth remembering.",
};

export default function TiltIndexPage() {
  const tils = getTiltMetas();

  return (
    <div className="mx-auto max-w-3xl px-5 pt-14">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          Today I Learned
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Small discoveries from real work. No articles dressed up as tips — just the thing I
          searched for, learned, and didn&apos;t want to lose.
        </p>
      </header>
      {tils.length === 0 ? (
        <p className="py-16 text-center text-sm text-faint">Nothing logged yet.</p>
      ) : (
        <div>
          {tils.map((t) => (
            <TiltItem key={t.slug} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
