---
title: "Boundary Values Find More Bugs Than Any Tool You'll Buy"
description: "Most test suites check that the happy path works. The bugs live at the edges: one below the limit, one above, zero, empty, duplicated. A practical guide to equivalence partitioning and boundary analysis that actually finds defects."
date: "2026-11-05"
category: "qa-fundamentals"
tags: ["test-design", "boundaries", "equivalence-partitioning", "fundamentals"]
difficulty: "Beginner"
draft: false
---

Give a junior tester a transfer form with a minimum of 100 EGP and a maximum of 10,000 EGP, and
they will test: enter 500, press submit, it works. Done.

Give the same form to someone who has spent years reading bug reports, and they will test:
99, 100, 101, 9,999, 10,000, 10,001, 0, -1, 1e10, "100 ", "100٫٥" (Arabic-Indic digits), and an
empty field. Done — and the odds are high that at least two of those inputs behave wrong, because
input handling at edges is where implementations quietly disagree with requirements.

This is not a seniority flex. It is a technique — equivalence partitioning and boundary value
analysis — and it is still the highest defect-yield per minute of any testing I have done in 13+
years, including every automation framework I've built.

## The technique in one paragraph

Every input field defines **partitions**: ranges of values the system should treat identically.
For the transfer amount: below minimum (invalid), within range (valid), above maximum (invalid),
plus the non-numeric garbage partition. The rule that earns its keep: **test one value from each
partition, plus both boundaries of every valid partition, plus the values immediately outside
them.** Boundaries are where developers write `<` instead of `<=`, where `parseInt` meets
floating point, and where localization meets validation. That concentration is not a coincidence —
requirements say "at least 100", and every `>=` vs `>` decision in the code sits exactly there.

## A worked example

Requirement: *"Amount must be between 100 and 10,000 EGP, in multiples of 50."*

| Partition | Values to test | What it can reveal |
|---|---|---|
| Below minimum | 99, 50, 0, -50 | Off-by-one on `<` vs `<=`, unvalidated negatives |
| Boundary low | 100, 101, 150 | Minimum enforcement, multiple-of-50 logic |
| Valid interior | 2,500, 7,500 | Rounding, storage precision (float vs decimal) |
| Boundary high | 9,950, 10,000, 10,001 | Maximum enforcement, UI truncation |
| Above maximum | 10,050, 1e10 | Overflow handling, API error shape |
| Non-numeric | "abc", "100 ", "١٠٠", "" | Validation, localization, trimming |
| Duplicated submits | double-click submit | Idempotency — a favorite production bug |

Notice what this is *not*: it is not 7 test cases for a form. It is **one well-designed test
session** that produces maybe 10 assertions — and historically catches the bugs that scripted
happy-path suites miss, the ones that reach production and cost real money.

## Where teams lose the value

### They automate the happy path instead of the edges

A Playwright script that fills 500 EGP and asserts success proves one thing. The same script
parameterized over the boundary table proves the *rule*. Automation multiplies whatever design
you fed it — if the design is weak, you get fast, confident coverage of nothing important.

### They test UI boundaries but not API boundaries

The form clamps at 10,000 — but does the endpoint? The web UI is one consumer; mobile apps,
integrations, and curl-wielding users hit the API directly. Boundary tests belong at **every
layer that accepts the input**, and the API layer is where the missing validation actually
causes damage.

### They skip the boundaries of *state*, not just inputs

The same technique applies to data and timing: an account with exactly 100 EGP balance (can it
transfer 100?), a session token at 59 minutes of a 60-minute expiry, a list with 0 items, 1 item,
and the pagination limit. Limits in state machines break the same way limits in forms do.

## Making it stick

1. **Put the partition table in the test case.** A test named `boundary_low_min_transfer`
   documents its own design. Six months later, when someone asks "why do we test 101?", the
   answer is in the repo, not in someone's head.
2. **Generate the edges, author the assertions.** It's fine to generate boundary values
   programmatically (Playwright fixtures, pytest `@pytest.mark.parametrize`) — but the *expected
   result* for each edge is a human decision. Auto-generating both is how suites get green while
   asserting nothing.
3. **Review boundary coverage in pull requests, not bug counts.** When a feature PR adds a new
   input, the review question is: "where are the partition boundaries, and which tests sit on
   them?"

## Why this matters more, not less, in 2026

AI-assisted test generation is genuinely useful at scaffolding — it will happily write you fifty
happy-path scripts in a minute. What it reliably under-produces is the disciplined edge analysis
above, because it requires reading the requirement the way a defect would. The testers who
thrive aren't the ones who type faster than the model; they're the ones who look at a spec and
see the seven partitions before the first test is written.

Tools change. Boundaries don't.
