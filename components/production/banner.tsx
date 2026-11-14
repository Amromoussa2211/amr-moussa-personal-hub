"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AppScene, type SceneId } from "@/components/production/scenes";

const SLIDES: { id: SceneId; emoji: string; name: string; kind: string }[] = [
  { id: "hermes", emoji: "💹", name: "Hermes", kind: "Stock market & trading" },
  { id: "bitcoin", emoji: "₿", name: "Bitcoin / Blockchain", kind: "Wallet & chain product" },
  { id: "microservices", emoji: "🔗", name: "Microservices", kind: "Distributed systems" },
  { id: "arabmatch", emoji: "❤️", name: "Arab Match", kind: "Dating app — Arabic-first" },
  { id: "lottery", emoji: "🎰", name: "Lottery & Loyalty", kind: "Draws & rewards" },
  { id: "workout", emoji: "💪", name: "Workout app", kind: "Health & fitness" },
];

/**
 * Auto-rotating banner of the six production-project scenes.
 * Swipes automatically every 5s (pauses on hover/focus and under
 * reduced motion); clicking the scene opens /production, while the
 * arrows and dots let the visitor drive it manually.
 */
export function ProductionBanner() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const go = (d: number) => setIdx((i) => (i + d + SLIDES.length) % SLIDES.length);
  const s = SLIDES[idx];

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-hairline bg-surface shadow-sm"
      style={{ aspectRatio: "480 / 280" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* click-through layer over the scene */}
      <Link
        href="/production"
        aria-label={`Open production projects — currently showing: ${s.name}`}
        className="absolute inset-0 z-0 block"
      />

      {/* the live scene */}
      <div key={s.id} className="banner-fade pointer-events-none absolute inset-0">
        <AppScene id={s.id} label={`Auto-rotating banner: ${s.name} — ${s.kind}`} />
      </div>

      {/* caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/70 via-black/35 to-transparent px-5 pb-5 pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
          {s.kind}
        </p>
        <p className="font-display text-lg font-semibold text-white">
          {s.emoji} {s.name}
        </p>
      </div>
      <p className="pointer-events-none absolute right-4 top-3 z-[1] rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/85">
        Live render · click to explore
      </p>

      {/* manual controls */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous project"
        className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-lg text-white backdrop-blur-sm transition-colors hover:bg-black/55"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next project"
        className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-lg text-white backdrop-blur-sm transition-colors hover:bg-black/55"
      >
        ›
      </button>

      {/* dots */}
      <div className="absolute bottom-2 right-4 z-10 flex gap-1.5">
        {SLIDES.map((sl, i) => (
          <button
            key={sl.id}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Show ${sl.name}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-4 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
