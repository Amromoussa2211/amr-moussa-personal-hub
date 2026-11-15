import type { Metadata } from "next";

import { BugHunt } from "@/components/playground/bug-hunt";
import { BugSquash } from "@/components/playground/bug-squash";
import { PassOrFail } from "@/components/playground/pass-or-fail";
import { QaQuiz } from "@/components/playground/qa-quiz";
import { SpotBug } from "@/components/playground/spot-bug";
import { SwipeDemo } from "@/components/playground/swipe-demo";
import { TriageRush } from "@/components/playground/triage-rush";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Entertainment corner: seven games and demos — bug hunting, code reading, severity triage, API judgment calls, a QA quiz with a game certificate, and a swipe-UI demo. All fun, nothing real is claimed.",
};

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-14">
      <header className="border-b border-hairline pb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Playground</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          The entertainment corner of the site. Everything here is a{" "}
          <strong className="text-ink">game or a demo</strong> — scores, certificates, and matches
          are for fun and carry no professional claim of any kind. The serious writing lives in{" "}
          <a href="/articles" className="text-accent-ink underline decoration-accent/40 underline-offset-2">
            Articles
          </a>
          .
        </p>
      </header>

      {/* --- Bug Hunt --- */}
      <section className="pt-12">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            🐛 Find the Bug — mini-game
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-hairline">
          <BugHunt />
        </div>
      </section>

      {/* --- Quiz + certificate --- */}
      <section className="pt-14">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          🎯 QA quiz — earn your game certificate
        </h2>
        <QaQuiz />
      </section>

      {/* --- Spot the Bug in Code --- */}
      <section className="pt-14">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          🎯 Spot the Bug in Code
        </h2>
        <SpotBug />
      </section>

      {/* --- Triage Rush --- */}
      <section className="pt-14">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          🚨 Triage Rush — severity in 60 seconds
        </h2>
        <TriageRush />
      </section>

      {/* --- Pass or Fail --- */}
      <section className="pt-14">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          ⚡ Pass or Fail? — API quick-fire
        </h2>
        <PassOrFail />
      </section>

      {/* --- Bug Squash --- */}
      <section className="pt-14">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            🐛 Bug Squash — 30s time attack
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-hairline">
          <BugSquash />
        </div>
      </section>

      {/* --- Swipe demo --- */}
      <section className="pt-14">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          💘 TestMatch — swipe-UI demo
        </h2>
        <div className="rounded-2xl border border-hairline bg-surface p-6">
          <SwipeDemo />
        </div>
      </section>

      <p className="pb-4 pt-12 text-center text-[12px] text-faint">
        Built for fun by a test automation lead — even the games here are about catching bugs
        before production does.
      </p>
    </div>
  );
}
