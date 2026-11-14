---
title: "Stop Rerunning Flaky Tests — Triage Them Like Defects"
description: "The rerun button is where flaky test discipline goes to die. A quarantine-and-triage system: classify the failure mode, measure the flake rate, and set a quality gate that makes flakiness visible instead of habitual."
date: "2026-11-07"
category: "advanced-qa"
tags: ["flaky-tests", "ci-cd", "test-strategy", "observability"]
difficulty: "Advanced"
draft: false
---

Every team I have led had the same moment: a pipeline goes red, the on-call person stares at it,
and someone — always reasonably — says "just rerun it." The rerun goes green. Everyone moves on.

Six months later the suite needs three reruns to pass, the retry configuration in CI has grown to
`retries: 3`, and nobody can name a single test that was actually fixed. The suite didn't get
less flaky. The team got more used to it.

Rerunning a flaky test is not triage. It is an anesthetic. Here is the system I use instead —
it fits in a spreadsheet and one CI flag, and it has survived contact with suites of thousands
of tests.

## Step 1: Make flakiness a number

You cannot triage what you don't measure. The minimum viable metric is **flake rate per test**:

```
flake rate = rerun-rescued failures / total runs   (per test, per week)
```

Most CI systems expose this in their API (GitHub Actions, Buildkite, CircleCI all have run
history endpoints). If you have a dashboard for pass/fail, add one for "passed on retry N". A
test that passed 95% of the time *looks* healthy. A test rescued by a rerun 30 times last month
is a defect generator that has been quietly wasting your team's most expensive resource: trust
in CI.

The number changes the conversation. "This suite is flaky" is unactionable. "Twelve tests exceed
a 2% flake rate" is a work queue.

## Step 2: Classify the failure mode — once, not per incident

Flaky failures repeat a small number of root causes. When a test trips the flake threshold,
someone spends thirty minutes labeling it, and the label dictates the fix:

| Mode | Signature | Actual fix |
|---|---|---|
| **Timing** | Passes locally, fails on loaded CI; timeout-related | Fix waits (Playwright auto-waiting, no hard sleeps); usually a test-authoring bug |
| **Shared data** | Fails more under parallelism; worker-dependent | Isolate data per worker; tests must not share mutable records |
| **Order dependence** | Fails only in full suite, passes alone | Hidden coupling — often a static/seeded state; run-shuffling exposes it |
| **Environment** | Network, container OOM, DNS blips | Infrastructure work — not the test's fault, but still must be visible |
| **Genuinely racy app** | Test correctly detected a real race | Celebrate briefly, then file the product defect — this is the flaky test doing its job |

The fifth row matters most and gets ignored most: **sometimes the flaky test is the only thing
in your pipeline that is honest.** A test that occasionally catches a real race condition in a
payment flow is not noise — rerunning it until it passes is suppressing a production defect
report.

## Step 3: Quarantine with an expiry, not a shrug

A test that trips the threshold moves to quarantine: it still runs, but on a separate lane whose
result does not block the build. The rule that keeps quarantine from becoming a graveyard:

> **Every quarantined test has a named owner and a two-week expiry. At expiry: fix it, keep it
> quarantined with a written justification, or delete it.**

Deleting is an acceptable outcome. A deleted flaky test that covered nothing critical is a net
gain in signal. A quarantined test with no owner is a lie you tell the dashboard.

## Step 4: Gate the trend, not the incident

The final piece is the quality gate that makes the whole thing self-sustaining:

- Flake rate above threshold → new quarantines get created (already handled by step 3)
- **Quarantine count above a budget → the merge lane slows down.** Pick a number the team can
  live with (for most teams: 2% of suite size). Above it, someone must clear backlog before
  landing new flaky-capable features.
- Reruns are allowed, but **every rerun-rescue is logged and visible.** A pipeline that silently
  retries five times produces green reports that mean nothing.

The point is not to punish anyone for a flaky test — flakiness is normal entropy. The point is
to make its cost visible *before* the suite needs four retries and everyone has stopped reading
the failures.

## What this buys you

Teams that run this loop report the same shift: within a quarter or two, "is it flaky?" stops
being the first question after a red build, because the answer is known, bounded, and owned.
Red builds mean something again. That — not the rerun button — is what a test suite is for.
