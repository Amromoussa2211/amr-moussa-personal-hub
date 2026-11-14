---
title: "Quality Gates Developers Keep vs Gates They Disable"
description: "Every team has a graveyard of disabled CI checks. The difference between a gate that survives and one that gets bypassed isn't strictness — it's whether the gate pays rent. A field guide from the quality side of code review."
date: "2026-11-12"
category: "software-engineering"
tags: ["ci-cd", "quality-gates", "developer-experience", "code-review"]
difficulty: "Intermediate"
draft: false
---

Every repository eventually develops a graveyard. A test job that was skipped "temporarily"
nine months ago. A linting rule suppressed in one file, then five, then globally. A coverage
threshold quietly lowered from 80% to 40% by a PR whose description said "chore".

None of this happens because developers don't care about quality. It happens because the gates
were designed as **obstacles** instead of as **instruments** — and any obstacle in a merge path
gets negotiated away the first time a deadline and a flaky check collide. I have spent most of
my career on the quality side of that negotiation. Here is what I've learned separates gates
that teams keep from gates teams route around.

## The rent test

A gate pays rent when the moment it fires, the reaction is *"oh — thanks, that would have been
bad."* A gate costs rent when the moment it fires, the reaction is *"why is this my problem
right now?"* You can predict a gate's lifespan by asking which reaction it produces on its
first ten firings. The rest of this article is just ways to keep your gates in the first
category.

## Gates that survive

### 1. Gates that catch what code review reliably misses

The best gates automate the checks humans are worst at: systematic, boring, and
exhaustive. The boundary values on that new numeric input (see my earlier article on
boundaries — humans miss those even when they care). The missing index on the query added in a
hurry. The `useEffect` dependency that changes on every render. Nobody's code review catches
those consistently — machines do it perfectly, and developers know it, so they don't resent it.

### 2. Gates that fail with the fix attached

Compare two failures:

```
FAIL  Type error: Property 'tier' does not exist on type 'Plan'
```

versus

```
FAIL  Migration 0041 adds a column without a DOWN step.
      Fix: see docs/migrations.md#down — one-line example included.
```

The second one gets fixed in thirty seconds and keeps its good reputation. The first one starts
a fifteen-minute investigation that the developer will remember as "the CI being annoying."
Error message quality is gate design. It's the difference between a linter people praise in
retrospectives and a linter people disable.

### 3. Gates scoped to what actually changed

A gate that runs the full 40-minute suite on a docs change teaches developers to force-merge.
The gates that last use path filters and affected-detection: touched code runs the relevant
tests *fully*, untouched code runs nothing. Strictness where it matters, speed everywhere
else — in that order.

### 4. Gates whose green is meaningful

A flaky gate destroys all other gates, because it trains the whole team that red is negotiable.
Once "just rerun it" is culturally acceptable for one check, it becomes acceptable for all of
them. This is why flaky-test discipline (quarantine with expiry, measured flake rate) is not a
test-suite concern — it is a **governance precondition for every other quality gate you own**.

## Gates that get disabled

- **Coverage percentage as a target.** Coverage gates get gamed the moment the number matters
  more than what the tests assert — assert-free tests, snapshots nobody reads, `expect(true)`.
  If you gate on coverage, gate on *changed-lines* coverage with a floor, and pair it with
  mutation-style spot checks on critical modules.
- **Style-only gates.** If the only output is "put the comma here", let the formatter run
  non-blockingly in pre-commit. Reserving merge authority for formatting spends trust you'll
  want back for the security scan.
- **Security scans with permanent red.** A SAST dashboard with 400 findings, 380 of them
  accepted-forever, teaches everyone to ignore it. Gates on *new* findings; burn down the old
  ones as separate, visible work.
- **Gates with no owner.** The mysterious job nobody can explain, that fails for reasons
  nobody can see, belongs to nobody, and gets deleted by the next cleanup PR. Every gate needs
  a name on it and a documented "why".

## The uncomfortable summary

The strictness of a gate is nearly irrelevant to whether it survives. A gate that catches a
class of defect humans can't reliably catch, fails fast with the fix in hand, runs only when
relevant, and stays green-meaningful will be defended by developers themselves. A strict gate
that fires noise will be disabled by the same people — and they'll be right to.

Build fewer gates. Build ones that pay rent.
