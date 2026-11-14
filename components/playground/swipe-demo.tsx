"use client";

import { useRef, useState } from "react";

/**
 * "TestMatch" — a dating-app-style swipe demo where the profiles are
 * fictional test-suite personas. Clearly labeled as a UI demo. Swipe right
 * to keep, left to refactor. Hearts + match overlay included.
 */

type Persona = {
  name: string;
  emoji: string;
  bio: string;
  traits: string[];
  verdict: "keeper" | "refactor";
  match: string;
};

const PERSONAS: Persona[] = [
  {
    name: "getByRole('button', { name: 'Pay now' })",
    emoji: "🛡️",
    bio: "Accessible. Resilient. Survives every redesign you throw at it. Looking for a long-term suite.",
    traits: ["stable", "semantic", "redesign-proof"],
    verdict: "keeper",
    match: "You and getByRole both refuse to break on a Friday deploy. It's forever.",
  },
  {
    name: "sleep(5000)",
    emoji: "😴",
    bio: "I always pass eventually. Trust me. Sometimes I even test something, if the network is fast.",
    traits: ["slow", "mysterious", "always green"],
    verdict: "refactor",
    match: "",
  },
  {
    name: "expect(page).toHaveScreenshot()",
    emoji: "📸",
    bio: "I judge everything by appearance. Two pixels off and I'm calling it a bug. Rerun me twice.",
    traits: ["visual", "opinionated", "needs a baseline"],
    verdict: "keeper",
    match: "A high-maintenance relationship — but the best visual-regression catch you'll ever have.",
  },
  {
    name: "//div[@class='wrapper']//button[3]",
    emoji: "🧟",
    bio: "I knew the DOM when it was young. Now every redesign leaves me looking for meaning.",
    traits: ["brittle", "legacy", "positional"],
    verdict: "refactor",
    match: "",
  },
  {
    name: "contract: billing → plan.tier",
    emoji: "🤝",
    bio: "I catch breaking changes in the provider's own pipeline, days before staging does. Communication is my love language.",
    traits: ["proactive", "honest", "CI-native"],
    verdict: "keeper",
    match: "Breaking changes fear you two as a couple. The broker approves.",
  },
];

const SWIPE_THRESHOLD = 90;

export function SwipeDemo() {
  const [idx, setIdx] = useState(0);
  const [gone, setGone] = useState<number[]>([]);
  const [matched, setMatched] = useState<Persona | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const startX = useRef(0);
  const startY = useRef(0);

  const card = PERSONAS[idx];

  function decide(direction: "right" | "left") {
    if (direction === "right" && card.verdict === "keeper") {
      setMatched(card);
    }
    setGone((g) => [...g, idx]);
    setTimeout(() => {
      setIdx((i) => (i + 1) % PERSONAS.length);
      setGone((g) => g.filter((n) => n !== idx));
      setDrag({ x: 0, y: 0, active: false });
    }, 260);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (matched) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setDrag({ x: 0, y: 0, active: true });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.active || matched) return;
    setDrag({ x: e.clientX - startX.current, y: e.clientY - startY.current, active: true });
  }

  function onPointerUp() {
    if (!drag.active || matched) return;
    if (drag.x > SWIPE_THRESHOLD) decide("right");
    else if (drag.x < -SWIPE_THRESHOLD) decide("left");
    else setDrag({ x: 0, y: 0, active: false });
  }

  const rotation = drag.x / 22;
  const opacity = 1 - Math.min(0.6, Math.abs(drag.x) / 260);

  return (
    <div className="relative mx-auto max-w-sm">
      {/* match overlay */}
      {matched && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border-2 border-accent bg-surface/95 p-6 text-center backdrop-blur-sm">
          <p className="font-display text-3xl font-semibold text-accent-ink">It's a match! 🎉</p>
          <p className="mt-4 text-5xl">{matched.emoji}</p>
          <p className="mt-2 break-all font-mono text-[13px] font-semibold text-ink">{matched.name}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{matched.match}</p>
          <div className="mt-3 text-2xl" aria-hidden>
            <span className="inline-block animate-bounce">❤️</span>
            <span className="ml-2 inline-block">💕</span>
            <span className="ml-2 inline-block animate-bounce" style={{ animationDelay: "150ms" }}>
              ❤️
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMatched(null)}
            className="mt-5 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Keep testing →
          </button>
        </div>
      )}

      {/* card stack */}
      <div className="relative h-[380px] select-none">
        {/* ghost cards behind */}
        {[1, 2].map((n) => (
          <div
            key={n}
            aria-hidden
            className="absolute inset-x-6 rounded-2xl border border-hairline bg-surface"
            style={{ top: n * 10, bottom: -n * 10, opacity: 0.55 }}
          />
        ))}

        {/* active card */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 flex cursor-grab touch-none flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-md active:cursor-grabbing"
          style={{
            transform: `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${rotation}deg)`,
            opacity,
            transition: drag.active ? "none" : "transform 260ms ease, opacity 260ms ease",
          }}
        >
          <div
            className={`flex h-44 items-center justify-center text-6xl ${
              card.verdict === "keeper" ? "bg-accent-soft" : "bg-rose-500/10"
            }`}
          >
            {card.emoji}
          </div>

          {/* swipe stamps */}
          <span
            className="absolute left-5 top-5 rounded-lg border-4 border-rose-500 px-2 py-0.5 text-sm font-bold uppercase tracking-widest text-rose-500"
            style={{ opacity: Math.min(1, Math.max(0, -drag.x / 90)), transform: "rotate(-14deg)" }}
          >
            Refactor
          </span>
          <span
            className="absolute right-5 top-5 rounded-lg border-4 border-emerald-500 px-2 py-0.5 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400"
            style={{ opacity: Math.min(1, Math.max(0, drag.x / 90)), transform: "rotate(14deg)" }}
          >
            Keep
          </span>

          <div className="flex flex-1 flex-col p-5">
            <p className="break-all font-mono text-[14px] font-semibold text-ink">{card.name}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{card.bio}</p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {card.traits.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-hairline px-2.5 py-0.5 text-[11px] text-faint"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-5 flex justify-center gap-6">
        <button
          type="button"
          aria-label="Swipe left — refactor"
          onClick={() => decide("left")}
          disabled={Boolean(matched)}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-500/60 text-xl text-rose-500 transition-all hover:scale-105 hover:bg-rose-500/10 disabled:opacity-30"
        >
          ✗
        </button>
        <button
          type="button"
          aria-label="Swipe right — keep"
          onClick={() => decide("right")}
          disabled={Boolean(matched)}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500/60 text-xl text-emerald-600 transition-all hover:scale-105 hover:bg-emerald-500/10 disabled:opacity-30"
        >
          ❤️
        </button>
      </div>

      <p className="mt-4 text-center text-[12px] text-faint">
        TestMatch™ — a swipe-UI demo, not a real app. The profiles are fictional test-suite
        personas: drag the card, or use the buttons. Swipe the flaky ones left.
      </p>
    </div>
  );
}
