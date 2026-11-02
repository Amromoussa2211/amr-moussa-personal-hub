---
title: "Why Your Playwright Tests Are Flaky — and the Four Wait Patterns That Fix Them"
description: "Flakiness is rarely about the framework. It's about what your test does while the app is busy. Four wait patterns from real suites, and when each one earns its place."
date: "2026-10-26"
updated: "2026-11-01"
category: "automation"
tags: ["playwright", "flaky-tests", "waits", "typescript"]
difficulty: "Intermediate"
featured: true
draft: false
---

If you shred a hundred failing CI runs from a mature Playwright suite, most of them are not
framework bugs. They are the test doing something while the app is still busy — and being told
to wait anyway.

The good news: almost every flake traces back to one of four situations, and each has a correct
wait pattern. The bad news: the default fix most people reach for — `waitForTimeout` — hides all
four instead of fixing them.
## The rule

**Playwright's auto-waiting waits for elements to appear. It cannot wait for your application's
state to settle.** If your test depends on data arriving, a cache warming up, or a websocket
pushing an event, no locator strategy will save you. You need to wait on the *event*, not the
time.

## Pattern 1 — the network response you actually depend on

When a click triggers a background request and the UI renders from its result, wait for that
request — race-free:

```typescript
test("order history reflects the refund", async ({ page }) => {
  const refundResponse = page.waitForResponse(
    (r) => r.url().includes("/api/refunds") && r.status() === 201
  );

  await page.getByRole("button", { name: "Refund order" }).click();
  const response = await refundResponse;
  expect(await response.json()).toMatchObject({ status: "issued" });

  // Now the assertion is checking a settled world, not a migrating one.
  await expect(page.getByTestId("order-status")).toContainText("Refunded");
});
```

Why this beats a timeout: if the app serves the response in 80 ms, you continue in 80 ms. If a
cold cache makes it 4 seconds in CI, the test still holds — and when the endpoint stops
returning 201, you get a *failing, named, debuggable* promise rejection instead of a random
assertion error somewhere downstream.

## Pattern 2 — the locator that represents state

Stop asserting on DOM soup. `getByTestId("skeleton")` disappearing is not a signal that data
loaded; it is a signal that a component gave up animating. Prefer locators that mean something:

```typescript
// Fragile: depends on animation teardown, not data
await expect(page.locator(".spinner")).toBeHidden();

// Strong: exists only when the data exists
await expect(page.getByRole("cell", { name: /total: \d/ })).toBeVisible();
```

Playwright retries the second assertion on its own clock until the assertion timeout. You get
polled waiting for free, and the *reason* for waiting is encoded in the assertion itself. When
this timeouts, the failure message tells you what never appeared — that is a diagnostic, not a
flake.

## Pattern 3 — polling your own condition

Sometimes you have no DOM signal and no single request — think Kafka consumers catching up or a
report building asynchronously. Poll with `expect.poll`:

```typescript
await expect(async () => {
  const rows = await getAuditRows(paymentId); // your API/db check
  expect(rows).toContainEqual(
    expect.objectContaining({ event: "PAYMENT_REFUNDED" })
  );
}).toPass({
  timeout: 15_000,
  intervals: [500, 1_000, 2_000],
});
```

`toPass` retries with growing intervals until the timeout — the cleanest
eventual-consistency wait in the arsenal. One warning: keep the timeout honest. If the
downstream pipeline genuinely needs 30 seconds, configure 30 seconds *with a comment saying
why*; if it usually takes 2 seconds and suddenly needs 15, that flake is a product bug dying to
be reported.

## Pattern 4 — navigation that React swallows

SPA routers make "page loaded" ambiguous. `waitForURL` handles client-side navigation that
changes history without a document event:

```typescript
await page.getByRole("menuitem", { name: "Webhooks" }).click();
await page.waitForURL("**/settings/webhooks**");
```

But if the route itself renders from an API call, combine it with Pattern 1. URL is a waypoint,
not an arrival signal.

## The pattern that is never correct

```typescript
await page.waitForTimeout(3000); // hope
```

It is slow, it lies in both directions (too short on CI, too long locally), and worst of all it
*trains your team to ignore failures* — because when it does fail, the flake will come back
next week. I remove these from every suite I inherit, and the pass rate goes up even though the
tests do strictly less waiting.

## What changes in practice

- Clicks that trigger data-dependent UI: `waitForResponse` (Pattern 1).
- Assertions on anything that "becomes there eventually": state-based locators (Pattern 2) or
  `expect.poll` / `toPass` (Pattern 3).
- SPA routing: `waitForURL` (Pattern 4).
- Fixed waits: never. If a fixed wait appears to fix a flake, the flake has been moved, not
  fixed.

Flaky tests are cheap to fix once you know which pattern applies — and worth the discipline.
A suite your team stops re-running on failure is worse than no suite at all.
