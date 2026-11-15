"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * "Pass or Fail?" — quick-fire API responses. Read the request + response,
 * call it PASS or FAIL within 10 seconds. Timeout counts as a miss.
 * Purely for fun. Best score persists in localStorage.
 */

type Item = { call: string; json: string; pass: boolean; why: string };

const ITEMS: Item[] = [
  {
    call: "POST /api/orders",
    json: `{\n  "status": 201,\n  "id": "ord_782",\n  "total": 250.00\n}`,
    pass: true,
    why: "201 Created with a real resource id and a sensible body — the happy path done right.",
  },
  {
    call: "POST /api/payments",
    json: `{\n  "status": 200,\n  "success": true,\n  "chargeId": null,\n  "amount": 0\n}`,
    pass: false,
    why: "success: true with no chargeId and amount 0 is a lie. Money endpoints must never fake success.",
  },
  {
    call: "POST /api/orders (network glitch)",
    json: `{\n  "status": 500,\n  "error": "timeout",\n  "orderId": "A-991"\n}`,
    pass: false,
    why: "Did the order get created or not? A 500 that may have side effects is dangerous — the client can't retry safely.",
  },
  {
    call: "GET /api/health",
    json: `{\n  "status": 200,\n  "body": { "status": "ok" }\n}`,
    pass: true,
    why: "Health checks should be boring. This one is.",
  },
  {
    call: "DELETE /api/account",
    json: `{\n  "status": 204,\n  "body": (empty)\n}`,
    pass: true,
    why: "204 No Content is the correct way to answer a successful delete.",
  },
  {
    call: "POST /api/signup (typo in the email)",
    json: `{\n  "status": 200,\n  "success": false,\n  "error": "invalid email"\n}`,
    pass: false,
    why: "A rejected request must be 4xx, not a 200 that says no. Status codes are the API's grammar.",
  },
  {
    call: "POST /api/login (correct password)",
    json: `{\n  "status": 401,\n  "error": "invalid credentials"\n}`,
    pass: false,
    why: "Correct credentials rejected — either the test user or the auth flow is broken. Fail loudly.",
  },
  {
    call: "GET /api/search?q=<script>alert(1)</script>",
    json: `{\n  "status": 200,\n  "html": "Results for <script>alert(1)</script>"\n}`,
    pass: false,
    why: "The input is echoed back unescaped — that's reflected XSS, a security defect.",
  },
  {
    call: "GET /api/files/report.pdf",
    json: `{\n  "status": 200,\n  "content-type": "text/html"\n}`,
    pass: false,
    why: "A PDF served as text/html renders as garbage in the browser. Content-Type matters.",
  },
  {
    call: "DELETE /api/orders/123",
    json: `{\n  "status": 200,\n  "deleted": false\n}`,
    pass: false,
    why: "It says 200 but nothing was deleted. If the delete can fail, it should say so with an error status.",
  },
  {
    call: "GET /api/balance",
    json: `{\n  "status": 200,\n  "balance": -500\n}`,
    pass: false,
    why: "A negative balance without any overdraft feature means something upstream went very wrong.",
  },
  {
    call: "GET /api/products?limit=5",
    json: `{\n  "status": 200,\n  "body": [ 5 products ]\n}`,
    pass: true,
    why: "Respects the limit, returns the array the client asked for. Ship it.",
  },
];

const SECONDS_PER_ITEM = 10;

export function PassOrFail() {
  const [step, setStep] = useState<"intro" | "play" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(SECONDS_PER_ITEM);
  const [flash, setFlash] = useState<null | { ok: boolean; why: string; pass: boolean }>(null);

  const [order, setOrder] = useState<number[]>([]);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("passfail-best") ?? 0));
    } catch {
      /* private mode */
    }
  }, []);

  const item = ITEMS[order[idx] ?? 0];

  // countdown tick
  useEffect(() => {
    if (step !== "play" || flash) return;
    const iv = setInterval(() => setLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(iv);
  }, [step, idx, flash]);

  // timeout = an automatic miss
  useEffect(() => {
    if (step !== "play" || flash || left > 0) return;
    setFlash({ ok: false, why: item.why, pass: item.pass });
  }, [left, step, flash, item]);

  function start() {
    setOrder(ITEMS.map((_, i) => i).sort(() => Math.random() - 0.5));
    setScore(0);
    setHits(0);
    setIdx(0);
    setFlash(null);
    setLeft(SECONDS_PER_ITEM);
    setStep("play");
  }

  function judge(guess: boolean) {
    if (flash) return;
    setLeft(0);
    const ok = guess === item.pass;
    if (ok) {
      setScore((s) => s + 10);
      setHits((h) => h + 1);
    }
    setFlash({ ok, why: item.why, pass: item.pass });
  }

  function next() {
    if (idx + 1 >= ITEMS.length) {
      setStep("result");
      try {
        const prev = Number(localStorage.getItem("passfail-best") ?? 0);
        if (score > prev) {
          localStorage.setItem("passfail-best", String(score));
          setBest(score);
        }
      } catch {
        /* private mode */
      }
      return;
    }
    setIdx(idx + 1);
    setFlash(null);
    setLeft(SECONDS_PER_ITEM);
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      {step === "intro" && (
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-ink">⚡ Pass or Fail?</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Twelve API responses, ten seconds each. Call it{" "}
            <strong className="text-ink">PASS</strong> or{" "}
            <strong className="text-ink">FAIL</strong> before the timer dies — a timeout counts as a
            miss. Trust nothing, verify everything.
          </p>
          {best > 0 && <p className="mt-2 text-[12px] text-faint">your best: {best} pts</p>}
          <button
            type="button"
            onClick={start}
            className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Start the review
          </button>
        </div>
      )}

      {step === "play" && (
        <div>
          <div className="mb-4 flex items-center justify-between text-[12px] text-faint">
            <span>
              ⏱ {left}s · response {idx + 1}/{ITEMS.length}
            </span>
            <span>{score} pts</span>
          </div>
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
              style={{ width: `${(left / SECONDS_PER_ITEM) * 100}%` }}
            />
          </div>

          <p className="mt-4 font-mono text-[12px] text-muted">{item.call}</p>
          <pre className="mt-2 overflow-x-auto rounded-xl border border-hairline bg-paper px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink">
            {item.json}
          </pre>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => judge(true)}
              disabled={flash !== null}
              className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 font-display text-sm font-semibold text-accent-ink transition-all hover:opacity-85 disabled:opacity-50"
            >
              ✅ PASS
            </button>
            <button
              type="button"
              onClick={() => judge(false)}
              disabled={flash !== null}
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-display text-sm font-semibold text-rose-700 transition-all hover:opacity-85 disabled:opacity-50 dark:text-rose-300"
            >
              ❌ FAIL
            </button>
          </div>

          {flash && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-[13px] leading-relaxed ${
                flash.ok ? "bg-accent-soft text-accent-ink" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              {flash.ok
                ? "Good call — "
                : flash.pass
                  ? "It should have been PASS — "
                  : "It should have been FAIL — "}
              {flash.why}
            </div>
          )}

          <div className="mt-5 text-right">
            <button
              type="button"
              onClick={next}
              disabled={flash === null}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-30"
            >
              {idx + 1 >= ITEMS.length ? "See my report →" : "Next response →"}
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-ink">📋 Review complete</p>
          <p className="mt-4 text-sm text-muted">
            Score: <strong className="text-ink">{score} pts</strong> · calls made{" "}
            <strong className="text-ink">{hits}/{ITEMS.length}</strong>
            {score >= best && score > 0 && (
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-ink">
                new personal best!
              </span>
            )}
            {score < best && best > 0 && <span className="ml-2 text-[12px] text-faint">best {best}</span>}
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-5 rounded-full border border-hairline px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent-ink"
          >
            Review again
          </button>
        </div>
      )}
    </div>
  );
}
