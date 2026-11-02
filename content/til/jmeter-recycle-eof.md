---
title: "JMeter: 'Recycle on EOF' silently halves your dataset"
date: "2026-10-15"
tags: ["jmeter", "performance"]
draft: false
---

If your CSV Data Set Config has `Recycle on EOF = True`, the moment your thread count exceeds
your CSV rows, JMeter serves the same rows twice — and your "unique users" test silently
becomes a hot-cache test. Uncheck it, or make rows ≥ max threads. The symptom that gives it
away: latency collapsing on *later* iterations that should have been the harshest.
