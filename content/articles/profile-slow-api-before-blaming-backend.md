---
title: "How I Profile a Slow API Before Blaming the Backend"
description: "A endpoint takes 4 seconds. The backend team says it's fine on their machines. Before opening a ticket, walk this five-layer checklist — each step either finds the culprit or proves your case."
date: "2026-10-12"
category: "performance"
tags: ["jmeter", "performance", "api", "latency"]
difficulty: "Intermediate"
draft: false
---

"Login takes four seconds" is not a bug report. It's a séance. The backend team profiles their
service locally, sees 80 ms, and closes your ticket. The truth is usually that the four seconds
live somewhere nobody profiled: TLS, DNS, an asset the page never asked to be lazy, a cold
cache, or a connection pool that only starves under concurrency.

Here's the separation I run — five layers, from cheapest to most expensive to reproduce —
before I even open a conversation with the backend team.

## Layer 1 — Where does the 4 s actually go?

Open the browser's network tab (or Playwright's trace viewer), request the endpoint, and read
the waterfall honestly:

```text
Stalled        1.8 s   ← sanity check this first
TTFB           0.9 s   ← server time (the backend's claim)
Download       1.3 s   ← payload / network problem
```

Each number incriminates a different layer:

| Dominant phase | Usual suspect |
|---|---|
| Stalled / DNS | Queueing, proxy, keep-alive missing, HTTP/1.1 limit of 6 connections |
| TTFB | Genuine server processing — now the backend team cares |
| Download | Payload size, ungzipped responses, mobile-network simulation |

A 4-second *download* of a 2 MB JSON nobody asked for is a different ticket than a 4-second
TTFB. Ten minutes here reclassifies half of all "slow API" complaints.

## Layer 2 — Cold or warm?

Cache-aware backends complicate symptom reports. Send the first request, then send it three
more times and record TTFB for each:

```typescript
const ttfb = [];
for (let i = 0; i < 4; i++) {
  const res = await page.waitForResponse("**/api/reports/summary");
  ttfb.push(res.headers()["timing"] ?? Date.now() - sent);
}
```

If request #1 is 4 s and requests #2–4 are 120 ms, the problem is cache warming — a real issue,
but a completely different one (long TTL, scheduled warmups, and sometimes: nobody noticed
because individual users hit cold caches rarely).

## Layer 3 — Concurrency: the individual lie

The user-facing killer is rarely a single slow request. It's twenty requests where the client
or server pool collapses. A JMeter test plan answers it in minutes:

- Thread group: 10 → 20 → 50 threads, ramp 30 s
- The endpoint under test, looped twice per thread
- Listeners: Summary Report + Response Times Over Time (aggregates only — the GUI listeners
  lie and, under real load, the GUI *itself* distorts results)

Then read two numbers — and only two:

- **90th percentile response time.** Averages constantly hide the tail. If avg = 300 ms but
  p90 = 6 s, your users experience 6 s, and that is the number in your report.
- **Error rate as concurrency rises.** Timeouts, resets, or 500s appearing at 20 threads but
  not 10 point at a pool limit (DB connections, HTTP client pool, thread starvation), not at
  "code slowness."

```jmx / pseudo
Thread Group (50 threads, ramp 30s)
  └─ HTTP Request: GET /api/reports/summary
  └─ Response Assertion: status 200
```

If latency degrades *linearly* with threads, that's capacity. If it degrades
*non-linearly* — 20 threads fine, 25 threads melting — that is a specific, reportable bug:
a saturated pool or lock contention.

## Layer 4 — Payload and N+1

For API endpoints fanning out across microservices, the response time is the sum of the
slowest dependency chain. Ask for (or infer) the call graph:

```text
/api/reports/summary
  ├─ auth check          20 ms
  ├─ entitlements        900 ms   ← N+1: one call per permission per report
  ├─ aggregation query  400 ms
  └─ render              15 ms
```

You can confirm N+1 from the outside if you count the requests the response *triggers* in the
UI or the database logs: a screen issuing 1 + N requests where N is row count is the single
most repeated root cause of "reports are slow" across every ERP I've tested.

## Layer 5 — What the numbers let you say in the ticket

This is what separates a defensible report from noise. Each layer produces a claim with the
data attached:

- "The 4.0 s latency for this endpoint is 2.1 s DNS/proxy stall in the test environment, not
  server time" (Layer 1).
- "TTFB is 4 s on cache miss and 110 ms warm — the endpoint depends on a warm cache whose
  expiry is 10 min" (Layer 2).
- "p90 latency exceeds 6 s at 20 concurrent users; error rate climbs from 0% to 9% at 25
  threads — consistent with a connection-pool limit of X, see config threadpool.max=25"
  (Layer 3).
- "The endpoint triggers 1 + N downstream requests; latency scales with row count" (Layer 4).

Backend teams don't argue with phase breakdowns and concurrency curves. They argue with
"timeouts in Postman". Do the layering, attach the waterfall, and the ticket either becomes
someone else's clear defect or your own reproducible spec — either way, the four seconds
stays dead.
