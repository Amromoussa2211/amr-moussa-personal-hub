import type { Metadata } from "next";

import { AppScene, type SceneId } from "@/components/production/scenes";

export const metadata: Metadata = {
  title: "Production Projects",
  description:
    "Six real-world product domains — trading, blockchain, microservices, dating, lottery & loyalty, fitness — each rendered as a live animation with the QA perspective it demands.",
};

type Project = {
  id: SceneId;
  emoji: string;
  name: string;
  kind: string;
  sceneLabel: string;
  about: string;
  realLife: string[];
  qaTitle: string;
  qa: string;
  chips: string[];
};

const PROJECTS: Project[] = [
  {
    id: "hermes",
    emoji: "💹",
    name: "Hermes",
    kind: "Stock market & trading platform",
    sceneLabel:
      "Live animation of a trading platform: a candlestick chart drawing itself, a flashing price ticker, a buy/sell order panel, and a portfolio P/L bar",
    about:
      "Hermes is a trading product for stock-market users: live price streams, candlestick charts, order placement, and a portfolio view where every tick changes real money.",
    realLife: [
      "Live market data feeds rendered as candlestick charts",
      "Buy / sell orders with market and limit types",
      "Portfolio view with profit-and-loss that updates per tick",
    ],
    qaTitle: "What QA looks like here",
    qa: "Money and milliseconds. Testing a trading app means order idempotency (a retried BUY must never double-execute), price-feed resilience when the socket drops mid-chart, decimal precision on every calculation, and honest p95 latency measurement — because a slow order button is a lost user.",
    chips: ["Playwright", "API testing", "WebSockets", "Performance", "Appium"],
  },
  {
    id: "bitcoin",
    emoji: "₿",
    name: "Bitcoin / Blockchain",
    kind: "Wallet & blockchain product",
    sceneLabel:
      "Live animation of a blockchain: a wallet balance, a block being mined with a flickering hash, and blocks linking into a verified chain",
    about:
      "A blockchain product where wallets send and receive BTC and every transaction becomes a permanently-linked block — there is no 'undo' in this domain, ever.",
    realLife: [
      "Wallet balances with send / receive and transaction history",
      "Blocks mined, hashed, and chained with confirmations",
      "Fee estimation and exchange-rate displays",
    ],
    qaTitle: "What QA looks like here",
    qa: "Irreversibility changes everything. A wrong address or amount cannot be rolled back, so testing focuses on transaction integrity — address validation, amount rounding, confirmation counting, fee display, and what the app does when the network goes dark mid-transfer. Fake-chain test environments let you verify all of it without touching real funds.",
    chips: ["API testing", "Data integrity", "Contract testing", "Security mindset"],
  },
  {
    id: "microservices",
    emoji: "🔗",
    name: "Microservices",
    kind: "Distributed system architecture",
    sceneLabel:
      "Live animation of a microservices map: requests flowing as dots between gateway, auth, orders, payments, and notification services, with a Kafka queue pulsing",
    about:
      "Modern backends are many small services — gateway, auth, orders, payments, notifications — talking over REST and message queues. Each service is simple; the interactions are not.",
    realLife: [
      "Independent services owning one business capability each",
      "Synchronous REST calls and asynchronous Kafka events between them",
      "Health checks, tracing, and observability across the mesh",
    ],
    qaTitle: "What QA looks like here",
    qa: "The bugs live between the services, not inside them. Consumer-driven contract tests catch breaking changes days before staging, Kafka consumers get verified for duplicate and out-of-order messages, and a good suite balances fast contract tests against a thin layer of end-to-end checks — because a giant E2E suite on this architecture is how flakiness is born.",
    chips: ["Contract testing", "Kafka", "REST / GraphQL", "CI/CD", "Docker"],
  },
  {
    id: "arabmatch",
    emoji: "❤️",
    name: "Arab Match",
    kind: "Dating app — Arabic-first, RTL",
    sceneLabel:
      "Live animation of a dating app phone screen: profile cards swiping, a LIKE stamp, rising hearts, and an It's-a-match flash",
    about:
      "A dating app for the Arab market: profile discovery, swiping and matching, real-time chat — built Arabic-first with full RTL support, where design and privacy both carry cultural weight.",
    realLife: [
      "Profile discovery with swipe / like / match flows",
      "Real-time chat between matched users",
      "Arabic-first interface with full RTL layout",
    ],
    qaTitle: "What QA looks like here",
    qa: "A dating app is trust in an app store. Testing covers RTL layout in both directions, photo and location privacy (who can see what, exactly), real-time chat delivery under flaky networks, push notifications, content-reporting flows, and mobile automation across real devices — because the audience will be on everything from a flagship to a 4-year-old mid-ranger.",
    chips: ["Appium", "i18n / RTL", "Playwright", "Real devices", "Privacy testing"],
  },
  {
    id: "lottery",
    emoji: "🎰",
    name: "Lottery & Loyalty",
    kind: "Draws, rewards & points platform",
    sceneLabel:
      "Live animation of a lottery draw: spinning reels landing on a jackpot, confetti, and a loyalty stamp card filling up with a points counter",
    about:
      "A platform where users enter draws, collect loyalty points, and redeem rewards — a domain where every number shown to a user must be provably correct, because someone always checks.",
    realLife: [
      "Draws with entries, results, and verified winners",
      "Loyalty points earned on activity, spent on rewards",
      "Stamp-card style progression and reward tiers",
    ],
    qaTitle: "What QA looks like here",
    qa: "Fairness and ledger integrity. Testing verifies that draws are auditable, points can never be created or lost by a race condition, concurrent redemption claims resolve safely, payouts go through exactly once (idempotency again), and abuse patterns — botting entries, double-claiming — are blocked. In this domain, a rounding bug is a scandal.",
    chips: ["API testing", "Data integrity", "Load testing", "Idempotency", "Fraud scenarios"],
  },
  {
    id: "workout",
    emoji: "💪",
    name: "Workout app",
    kind: "Health & fitness tracking",
    sceneLabel:
      "Live animation of a workout app: an exercise checklist progressing, a rep counter with a progress ring filling, and a rest timer appearing",
    about:
      "A fitness companion that guides workouts set by set — rep counters, rest timers, streaks, and progress stats — and runs on a phone that gets locked, pocketed, and taken off Wi-Fi mid-session.",
    realLife: [
      "Guided workout plans with sets, reps, and rest timers",
      "Progress tracking: streaks, volume, personal records",
      "Session logging that must survive interruptions",
    ],
    qaTitle: "What QA looks like here",
    qa: "Real life is hostile to timers. Testing covers offline sessions and pause/resume, background timers surviving screen lock, streak logic across timezones and midnight boundaries, health-data sync, and notifications that arrive on time without nagging — verified across the Android/iOS device matrix, because 'it worked on my phone' is not a strategy.",
    chips: ["Appium", "Mobile CI", "Offline scenarios", "Health data", "Device matrix"],
  },
];

export default function ProductionPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <header className="border-b border-hairline pb-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          From real industry experience
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          Production Projects
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Six product domains from real production life — each rendered here as a{" "}
          <strong className="text-ink">live animation</strong> (no GIFs — drawn in your browser,
          theme-aware), with what the app actually does and the QA discipline it demands. The
          animations are illustrations of the products; the testing perspective is the work.
        </p>
      </header>

      <div className="space-y-10 pt-12">
        {PROJECTS.map((p, i) => (
          <section
            key={p.id}
            className="overflow-hidden rounded-3xl border border-hairline bg-surface"
          >
            <div className="grid lg:grid-cols-2">
              {/* scene */}
              <div
                className={`flex items-center bg-paper ${
                  i % 2 === 1 ? "lg:order-2" : ""
                }`}
              >
                <AppScene id={p.id} label={p.sceneLabel} />
              </div>

              {/* copy */}
              <div className="p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
                  {p.kind}
                </p>
                <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink">
                  {p.emoji} {p.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.about}</p>

                <ul className="mt-4 space-y-1.5">
                  {p.realLife.map((line) => (
                    <li key={line} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-xl border border-hairline bg-accent-soft/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
                    {p.qaTitle}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{p.qa}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-hairline px-2.5 py-0.5 text-[11px] text-faint"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="pb-6 pt-12 text-center text-[12px] text-faint">
        Every animation is rendered live on canvas — no video files, adapts to dark mode, and
        pauses for visitors who prefer reduced motion.
      </p>
    </div>
  );
}
