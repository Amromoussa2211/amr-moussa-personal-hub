"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * "Spot the Bug in Code" — read a short snippet, click the line that has
 * the bug. One guess per snippet, then the explanation is revealed.
 * Purely for fun. Best score persists in localStorage.
 */

type Snippet = {
  lang: string;
  title: string;
  lines: string[];
  answer: number;
  why: string;
};

const SNIPPETS: Snippet[] = [
  {
    lang: "python",
    title: "average() crashes on the last item",
    lines: [
      "def average(nums):",
      "    total = 0",
      "    for i in range(len(nums)):",
      "        total += nums[i + 1]",
      "    return total / len(nums)",
    ],
    answer: 3,
    why: "Off-by-one: nums[i + 1] skips the first item and crashes with IndexError on the last index. It should be nums[i].",
  },
  {
    lang: "javascript",
    title: "every user passes the age gate",
    lines: [
      "function canEnter(user) {",
      "  if ((user.age = 18)) {",
      "    return true;",
      "  }",
      "  return false;",
      "}",
    ],
    answer: 1,
    why: "Assignment, not comparison: user.age = 18 overwrites the age and the condition is always truthy. Should be === 18.",
  },
  {
    lang: "javascript",
    title: "profile renders [object Promise]",
    lines: [
      "async function loadProfile(id) {",
      "  const user = fetchUser(id);",
      "  const orders = fetchOrders(id);",
      "  render(user.name);",
      "  render(orders.total);",
      "}",
    ],
    answer: 1,
    why: "fetchUser is async — without await, user is a Promise, so user.name is undefined. Both calls need await.",
  },
  {
    lang: "python",
    title: "tags leak between calls",
    lines: [
      "def add_tag(tag, tags=[]):",
      "    tags.append(tag)",
      "    return tags",
    ],
    answer: 0,
    why: "Mutable default argument: the same list object is shared across every call, so tags accumulate forever. Use tags=None.",
  },
  {
    lang: "javascript",
    title: "pro users get the free quota",
    lines: [
      "switch (plan) {",
      "  case \"pro\":",
      "    quota = 9999;",
      "  case \"free\":",
      "    quota = 10;",
      "    break;",
      "}",
    ],
    answer: 2,
    why: "Missing break after the \"pro\" case — execution falls through and pro users end up with quota = 10.",
  },
  {
    lang: "javascript",
    title: "an 18-year-old is rejected",
    lines: [
      "function isAdult(age) {",
      "  return age > 18;",
      "}",
    ],
    answer: 1,
    why: "Boundary bug: the requirement says \"18 or older\", so an 18-year-old must pass. Should be age >= 18.",
  },
  {
    lang: "python",
    title: "the 30% discount never triggers",
    lines: [
      "total = 0.1 + 0.2",
      "if total == 0.3:",
      "    apply_discount()",
    ],
    answer: 1,
    why: "Floating point: 0.1 + 0.2 == 0.30000000000000004, so the equality fails. Compare with a tolerance or use decimal.",
  },
  {
    lang: "javascript",
    title: "guest accounts crash the header",
    lines: [
      "function firstName(user) {",
      "  return user.name.split(\" \")[0];",
      "}",
    ],
    answer: 1,
    why: "user.name is null for guest accounts, so .split throws. Guard the null before touching it.",
  },
];

function verdict(score: number): { title: string; icon: string; line: string } {
  if (score >= 8)
    return { title: "Static Analysis Engine", icon: "🤖", line: "You read code like a compiler with opinions." };
  if (score >= 6)
    return { title: "Code Reviewer", icon: "🔍", line: "Nothing sneaks past you in a pull request." };
  if (score >= 4)
    return { title: "Stack TraceEnjoyer", icon: "🧵", line: "You find the crash line… half the time." };
  return { title: "Console.log Detective", icon: "🕵️", line: "Everyone starts by printing things. Keep going." };
}

export function SpotBug() {
  const [step, setStep] = useState<"intro" | "play" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const snip = SNIPPETS[idx];
  const result = useMemo(() => verdict(score), [score]);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("spotbug-best") ?? 0));
    } catch {
      /* private mode */
    }
  }, []);

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === snip.answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= SNIPPETS.length) {
      setStep("result");
      try {
        const prev = Number(localStorage.getItem("spotbug-best") ?? 0);
        if (score > prev) {
          localStorage.setItem("spotbug-best", String(score));
          setBest(score);
        }
      } catch {
        /* private mode */
      }
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
          <p className="font-display text-xl font-semibold text-ink">🎯 Spot the Bug in Code</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Eight short snippets, eight real bugs: an off-by-one, a boundary violation, a
            floating-point trap… Click the <strong className="text-ink">line</strong> that has the bug.
            One guess each.
          </p>
          {best > 0 && (
            <p className="mt-2 text-[12px] text-faint">your best: {best}/{SNIPPETS.length}</p>
          )}
          <button
            type="button"
            onClick={() => setStep("play")}
            className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Start reading code
          </button>
        </div>
      )}

      {step === "play" && (
        <div>
          <div className="mb-4 flex items-center justify-between text-[12px] text-faint">
            <span>
              Snippet {idx + 1}/{SNIPPETS.length} · <span className="font-mono">{snip.lang}</span>
            </span>
            <span>score {score}</span>
          </div>
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${(idx / SNIPPETS.length) * 100}%` }}
            />
          </div>

          <p className="mt-4 font-display text-lg font-semibold leading-snug text-ink">{snip.title}</p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-hairline bg-paper">
            {snip.lines.map((line, i) => {
              const isAnswer = i === snip.answer;
              const isPicked = picked === i;
              const show = picked !== null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={show}
                  aria-label={`Line ${i + 1}${show && isAnswer ? " — this was the buggy line" : ""}`}
                  className={`flex w-full items-start gap-3 border-l-2 px-3 py-1.5 text-left transition-colors ${
                    show
                      ? isAnswer
                        ? "border-accent bg-accent-soft"
                        : isPicked
                          ? "border-rose-500/50 bg-rose-500/10"
                          : "border-transparent opacity-60"
                      : "border-transparent hover:bg-accent-soft/60"
                  }`}
                >
                  <span className="mt-0.5 w-5 shrink-0 select-none text-right font-mono text-[11px] text-faint">
                    {i + 1}
                  </span>
                  <code className="whitespace-pre font-mono text-[12.5px] leading-relaxed text-ink sm:text-[13px]">
                    {line || " "}
                  </code>
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-accent-ink">
              {picked === snip.answer ? "Bug caught — " : "It escaped this time — "}
              {snip.why}
            </div>
          )}

          <div className="mt-5 text-right">
            <button
              type="button"
              onClick={next}
              disabled={picked === null}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-30"
            >
              {idx + 1 >= SNIPPETS.length ? "See my verdict →" : "Next snippet →"}
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            {result.icon} {result.title}
          </p>
          <p className="mt-1 text-[13px] italic text-muted">{result.line}</p>
          <p className="mt-4 text-sm text-muted">
            Bugs spotted: <strong className="text-ink">{score}/{SNIPPETS.length}</strong>
            {score > best && score > 0 && (
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-ink">
                new personal best!
              </span>
            )}
            {score <= best && best > 0 && <span className="ml-2 text-[12px] text-faint">best {best}</span>}
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-5 rounded-full border border-hairline px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent-ink"
          >
            Read them again
          </button>
        </div>
      )}
    </div>
  );
}
