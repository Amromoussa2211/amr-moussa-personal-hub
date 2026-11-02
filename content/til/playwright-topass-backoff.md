---
title: "Playwright's expect.poll with growing intervals beats fixed waits everywhere"
date: "2026-11-01"
tags: ["playwright", "waits"]
draft: false
---

`expect(...).toPass({ intervals: [500, 1000, 2000, 5000] })` polls your condition with
back-off until timeout. It works on any condition — not just locators — including raw
functions. It has quietly replaced every `waitForTimeout` in the suites I maintain, and it
reads better in reports because the *condition* is the failure message.
