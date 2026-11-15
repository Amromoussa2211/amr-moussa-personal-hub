"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Triage Rush" — 60 seconds, incoming bug reports, assign the right
 * severity P0–P3 before the clock runs out. Streaks pay a bonus.
 * Purely for fun (the severities are debatable in every real standup).
 * Best score persists in localStorage.
 */

type Report = { text: string; p: 0 | 1 | 2 | 3; why: string };

const REPORTS: Report[] = [
  { text: "Checkout button crashes for 100% of iOS users", p: 0, why: "Everyone on one platform is blocked from paying. Textbook P0." },
  { text: "Admin panel opens without any login", p: 0, why: "Unauthenticated access to admin = security incident. P0, page the on-call." },
  { text: "Saved cards show another customer's last 4 digits", p: 0, why: "Cross-user data exposure. Privacy/security, fix and disclose. P0." },
  { text: "Two-factor codes can be reused within 10 minutes", p: 0, why: "A used code still working defeats the second factor. Security → P0." },
  { text: "Logo is 2px off-center on the pricing page", p: 3, why: "Cosmetic, no user blocked, no money lost. Low priority." },
  { text: "Typo: 'Paymant' in the invoice title", p: 3, why: "Embarrassing but harmless — bundle it with the next copy sweep." },
  { text: "Button hover animation is janky on old laptops", p: 3, why: "Polish. Nobody's workflow stops because an animation dropped frames." },
  { text: "Search returns results in a random order", p: 1, why: "A core feature gives wrong results for everyone — broken behavior, but workarounds exist. P1." },
  { text: "Password reset links stay valid after being used", p: 1, why: "Security hardening, not an open door — an attacker needs the link first. P1, fix this sprint." },
  { text: "Currency shows $ instead of EGP for Egyptian accounts", p: 1, why: "Wrong money-related data erodes trust fast. P1." },
  { text: "Deleting an account keeps sending weekly digest emails", p: 1, why: "Respects neither the user nor the law (GDPR-ish). Functional + compliance. P1." },
  { text: "App crashes when the profile photo is exactly 10MB", p: 2, why: "Nasty but narrow edge case with a workaround (smaller photo). P2." },
  { text: "Payment succeeded but the confirmation email never arrives", p: 2, why: "The money moved; the receipt didn't. Annoying, not blocking — P2." },
  { text: "Site takes 9 seconds to load on 4G", p: 2, why: "Serious, measurable, but the site still works. Profile it and fix. P2." },
  { text: "PDF export cuts off the last page of long reports", p: 2, why: "Partial data loss in a secondary feature. P2 until someone important hits it." },
  { text: "Dark mode makes some labels unreadable", p: 2, why: "Real usability damage for a subset of users — but light mode works. P2." },
  { text: "Empty state missing for brand-new users' dashboard", p: 2, why: "Confusing first run, nothing is broken. P2." },
  { text: "API /orders returns 500 for orders older than a year", p: 1, why: "Server errors on valid, real data. Affects a meaningful slice. P1." },
];

const LABELS = ["P0 — critical", "P1 — major", "P2 — minor", "P3 — trivial"];
const GAME_SECONDS = 60;

export function TriageRush() {
  const [step, setStep] = useState<"intro" | "play" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [left, setLeft] = useState(GAME_SECONDS);
  const [flash, setFlash] = useState<null | { ok: boolean; why: string; p: 0 | 1 | 2 | 3 }>(null);
  const [best, setBest] = useState(0);

  const orderRef = useRef<number[]>([]);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("triage-best") ?? 0));
    } catch {
      /* private mode */
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  function start() {
    // shuffle a fresh order of reports
    orderRef.current = REPORTS.map((_, i) => i).sort(() => Math.random() - 0.5);
    setIdx(0);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setHits(0);
    setMisses(0);
    setLeft(GAME_SECONDS);
    setFlash(null);
    setStep("play");
    stopTimer();
    timerRef.current = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          stopTimer();
          setStep("result");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function finish() {
    stopTimer();
    setStep("result");
    try {
      const prev = Number(localStorage.getItem("triage-best") ?? 0);
      if (scoreRef.current > prev) {
        localStorage.setItem("triage-best", String(scoreRef.current));
        setBest(scoreRef.current);
      }
    } catch {
      /* private mode */
    }
  }

  function assign(p: number) {
    if (flash) return;
    const i = idx % orderRef.current.length;
    const rep = REPORTS[orderRef.current[i]];
    const ok = p === rep.p;
    if (ok) {
      const bonus = Math.min(streak, 5) * 2;
      scoreRef.current += 10 + bonus;
      setScore(scoreRef.current);
      setStreak((s) => s + 1);
      setHits((h) => h + 1);
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 4);
      setScore(scoreRef.current);
      setStreak(0);
      setMisses((m) => m + 1);
    }
    setFlash({ ok, why: rep.why, p: rep.p });

    setTimeout(() => {
      setFlash(null);
      setIdx((cur) => {
        const next = cur + 1;
        if (next >= orderRef.current.length) finish();
        return next;
      });
    }, ok ? 900 : 1900);
  }

  function backToIntro() {
    setStep("intro");
    setIdx(0);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setHits(0);
    setMisses(0);
    setFlash(null);
    stopTimer();
  }

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      {step === "intro" && (
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-ink">🚨 Triage Rush</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            60 seconds. Bug reports keep arriving. Slap the right severity on each —{" "}
            <strong className="text-ink">P0 to P3</strong>. Correct streaks pay a bonus, wrong calls
            cost points. This is the job, gamified.
          </p>
          {best > 0 && <p className="mt-2 text-[12px] text-faint">your best: {best} pts</p>}
          <button
            type="button"
            onClick={start}
            className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Start the shift
          </button>
        </div>
      )}

      {step === "play" && (
        <div>
          <div className="mb-4 flex items-center justify-between text-[12px] text-faint">
            <span>
              ⏱ {left}s · 🔥 streak {streak}
            </span>
            <span>{score} pts</span>
          </div>
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
              style={{ width: `${(left / GAME_SECONDS) * 100}%` }}
            />
          </div>

          <div className="mt-5 rounded-xl border border-hairline bg-paper px-4 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
              incoming bug report #{idx + 1}
            </p>
            <p className="mt-2 font-display text-lg font-semibold leading-snug text-ink">
              “{REPORTS[orderRef.current[idx % orderRef.current.length]]?.text ?? ""}”
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LABELS.map((label, p) => (
              <button
                key={label}
                type="button"
                onClick={() => assign(p)}
                disabled={flash !== null}
                aria-label={`Triage as ${label}`}
                className={`rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all ${
                  p === 0
                    ? "border-rose-500/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                    : "border-hairline text-ink-soft hover:border-accent hover:text-ink"
                } ${flash ? "opacity-60" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {flash && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-[13px] leading-relaxed ${
                flash.ok ? "bg-accent-soft text-accent-ink" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              {flash.ok ? "Correct triage — " : `It was ${LABELS[flash.p]} — `}
              {flash.why}
            </div>
          )}
        </div>
      )}

      {step === "result" && (
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-ink">🔔 Shift over</p>
          <p className="mt-4 text-sm text-muted">
            Score: <strong className="text-ink">{score} pts</strong> · triage accuracy{" "}
            <strong className="text-ink">{accuracy}%</strong> ({hits}/{hits + misses})
            {score >= best && score > 0 && (
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-ink">
                new personal best!
              </span>
            )}
            {score < best && best > 0 && <span className="ml-2 text-[12px] text-faint">best {best}</span>}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85"
            >
              Another shift
            </button>
            <button
              type="button"
              onClick={backToIntro}
              className="rounded-full border border-hairline px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent-ink"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
