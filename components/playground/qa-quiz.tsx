"use client";

import { useMemo, useState } from "react";

/**
 * QA Certification Quiz — 8 real questions, a playful game title, and a
 * fictional certificate card issued by "Amr's QA Arena". Explicitly labeled
 * as entertainment; not affiliated with any real certification body.
 */

type Q = { q: string; options: string[]; answer: number; why: string };

const QUESTIONS: Q[] = [
  {
    q: "A test fails once in CI, passes on rerun. What's the professional first move?",
    options: [
      "Add it to a measured quarantine with an owner and an expiry",
      "Set retries: 5 and move on",
      "Delete the test — it's clearly unstable",
      "Mark it @skip so the build stays green",
    ],
    answer: 0,
    why: "Reruns hide the signal. Quarantine + triage keeps it visible while you classify the root cause.",
  },
  {
    q: "Requirement: amount must be 100–10,000 EGP in multiples of 50. The strongest boundary set is…",
    options: [
      "500, 5,000 (a couple of realistic values)",
      "99, 100, 101, 9,950, 10,000, 10,001",
      "100, 5,000, 10,000",
      "Random values from 1 to 20,000",
    ],
    answer: 1,
    why: "Boundaries — the edges and their immediate neighbors — are where implementations disagree with requirements.",
  },
  {
    q: "In Playwright, the most resilient locator for a 'Pay now' button is…",
    options: [
      "button.btn-primary >> nth=2",
      "//div[@class='wrapper']//button[3]",
      "getByRole('button', { name: 'Pay now' })",
      "page.locator('#pay-v2-final-FINAL')",
    ],
    answer: 2,
    why: "Role + accessible name survives redesigns, styling changes, and DOM re-nesting. Classes and indices don't.",
  },
  {
    q: "A consumer-driven contract test verifies that the provider…",
    options: [
      "has 100% test coverage",
      "still satisfies the fields and interactions each consumer actually relies on",
      "responds in under 200 ms",
      "never adds new fields",
    ],
    answer: 1,
    why: "Contracts capture exactly what consumers depend on — new provider fields are free, breaking ones are caught in the provider's pipeline.",
  },
  {
    q: "Your p95 API latency is 900 ms and the average is 120 ms. What does the p95 tell you?",
    options: [
      "Most users get 900 ms",
      "95% of requests are faster than 900 ms — the slow tail is real and worth investigating",
      "The average is wrong and should be fixed",
      "Nothing — averages are always enough",
    ],
    answer: 1,
    why: "Percentiles describe the tail where real users suffer; averages hide it.",
  },
  {
    q: "Retrying a failed POST /payments request safely requires…",
    options: [
      "Trying harder",
      "An idempotency key so the server can deduplicate the retry",
      "A longer timeout",
      "Sending the request twice as fast",
    ],
    answer: 1,
    why: "Without idempotency, a retry can double-charge. It's the first thing to test in any payment flow.",
  },
  {
    q: "The fastest way to catch a breaking change between two microservices before staging is…",
    options: [
      "A longer end-to-end regression suite",
      "Consumer-driven contract tests wired into both pipelines",
      "Manual QA every Thursday",
      "More unit tests in each service",
    ],
    answer: 1,
    why: "Unit tests can't see across services; contract tests run in CI, days before staging.",
  },
  {
    q: "A test that occasionally catches a REAL race condition in the payment flow is…",
    options: [
      "Flaky — rerun it until it passes",
      "A defect report doing its job — file the race, then stabilize the test",
      "A reason to disable CI",
      "Impossible — tests don't find production bugs",
    ],
    answer: 1,
    why: "Sometimes the flaky test is the only honest thing in the pipeline. Triage it like the finding it is.",
  },
];

function titleFor(score: number): { title: string; icon: string; line: string } {
  if (score >= 8)
    return {
      title: "Automation Architect",
      icon: "🤖",
      line: "You design the suite everyone else trusts.",
    };
  if (score >= 6)
    return { title: "Boundary Master", icon: "📐", line: "You live at the edges where bugs do." };
  if (score >= 4)
    return { title: "Flake Hunter", icon: "🎯", line: "You can smell a rerun-rescued failure a mile away." };
  return { title: "Bug Hunter", icon: "🐛", line: "Every architect started here. Keep clicking." };
}

const PRAISE = ["Correct — ", "Exactly — ", "That's the one — ", "Yes — "];

export function QaQuiz() {
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [name, setName] = useState("");

  const q = QUESTIONS[idx];
  const result = useMemo(() => titleFor(score), [score]);

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= QUESTIONS.length) {
      setStep("result");
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  }

  function restart() {
    setStep("intro");
    setIdx(0);
    setPicked(null);
    setScore(0);
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      {step === "intro" && (
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-ink">🎯 The QA Arena Quiz</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Eight questions from real testing practice — flaky tests, boundaries, contracts,
            idempotency. Score high and earn your game certificate from{" "}
            <strong className="text-ink">Amr&apos;s QA Arena</strong>.
          </p>
          <button
            type="button"
            onClick={() => setStep("quiz")}
            className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Start the quiz
          </button>
        </div>
      )}

      {step === "quiz" && (
        <div>
          <div className="mb-4 flex items-center justify-between text-[12px] text-faint">
            <span>
              Question {idx + 1}/{QUESTIONS.length}
            </span>
            <span>score {score}</span>
          </div>
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${(idx / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <p className="mt-5 font-display text-lg font-semibold leading-snug text-ink">{q.q}</p>
          <ul className="mt-4 space-y-2">
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answer;
              const isPicked = picked === i;
              const show = picked !== null;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    disabled={picked !== null}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                      show
                        ? isAnswer
                          ? "border-accent bg-accent-soft text-accent-ink"
                          : isPicked
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                            : "border-hairline text-faint"
                        : "border-hairline text-ink-soft hover:border-accent hover:text-ink"
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>

          {picked !== null && (
            <div className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-accent-ink">
              {picked === q.answer ? PRAISE[idx % PRAISE.length] : "Not this time — "}
              {q.why}
            </div>
          )}

          <div className="mt-5 text-right">
            <button
              type="button"
              onClick={next}
              disabled={picked === null}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-30"
            >
              {idx + 1 >= QUESTIONS.length ? "See my certificate →" : "Next question →"}
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div>
          {/* --- the fun certificate --- */}
          <div className="relative mx-auto max-w-lg rounded-2xl border-[3px] border-double border-accent/60 bg-paper p-6 text-center shadow-sm sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-faint">
              Amr&apos;s QA Arena
            </p>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">
              {result.icon} {result.title}
            </p>
            <p className="mt-1 text-[13px] italic text-muted">{result.line}</p>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-hairline" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-faint">
                hereby awarded to
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your name…"
              maxLength={32}
              className="w-full rounded-xl border border-hairline bg-surface px-4 py-3 text-center font-display text-xl font-semibold text-ink focus:border-accent focus:outline-none"
            />

            <p className="mt-3 text-[13px] text-muted">
              Score: <strong className="text-ink">{score}/{QUESTIONS.length}</strong> ·{" "}
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-faint">
              🎮 Entertainment — a game certificate, not a professional credential
            </div>
            <p className="mt-2 text-[11px] text-faint">
              Screenshot it, share it, hang it in your standup. Issued with zero authority and
              maximum affection by amrmoussa-hub.vercel.app.
            </p>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={restart}
              className="rounded-full border border-hairline px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent-ink"
            >
              Take it again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
