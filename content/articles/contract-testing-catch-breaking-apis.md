---
title: "Contract Testing: Catch Breaking APIs Before Staging Does"
description: "Between your mobile app and your payment service sits an unstated promise. Consumer-driven contract tests turn that promise into an executable artifact — the cheapest way to catch breaking changes while they're still one PR wide."
date: "2026-11-10"
category: "api"
tags: ["api-testing", "contract-testing", "microservices", "integration"]
difficulty: "Intermediate"
draft: false
---

Here is a failure pattern every microservices team knows. Service A (billing) deploys on
Tuesday. Nothing fails. Service B (the web checkout) deploys Thursday — and starts throwing
`TypeError: cannot read property 'tier' of undefined`, because A renamed `plan.tier` to
`plan.level` on Tuesday and every test in A's pipeline was green.

Nothing was wrong with A's tests. They tested A *in isolation*, which is exactly the gap: the
breaking change only exists **in the space between two services**, and no amount of A-side unit
testing can see there.

Contract testing is the cheapest instrument that reaches into that space. And "cheapest" is
meant literally: compared to spinning up full staging with every service deployed together.

## The idea in one exchange

A **contract** is the recorded set of interactions a real consumer makes against a provider:
which endpoints, which request bodies, which response fields the consumer actually reads.

1. Consumer tests run against a **mock** of the provider, generated from real interactions.
2. The test publishes a **pact file** (the contract) to a broker.
3. Provider CI pulls the contract, **replays** those requests against the real service, and
   verifies the responses still satisfy them.

When billing renames `tier` → `level`, the replay fails *in billing's pipeline* — with an error
message saying which consumer, which interaction, which field. The breaking change is caught
while it is one pull request wide, reviewed by the person who made it, instead of discovered by
another team's production incident three days later.

## What a consumer test looks like

Using Pact-style pseudo-code, the web checkout declares what it needs from billing:

```js
// checkout.consumers.test.js
import { PactV3, MatchersV3 } from "@pact-foundation/pact-core";

const { like, integer } = MatchersV3;

const provider = new PactV3({
  consumer: "web-checkout",
  provider: "billing-service",
});

describe("billing plan endpoint", () => {
  it("returns the customer's plan tier and renewal date", async () => {
    await provider
      .given("customer CUST-42 has an active plan")
      .uponReceiving("a plan request for the customer")
      .withRequest({
        method: "GET",
        path: "/plans/CUST-42",
        headers: { Accept: "application/json" },
      })
      .willRespondWith({
        status: 200,
        body: {
          tier: like("pro"),          // consumer READS this field
          renewalDate: like("2026-12-01"),
          seats: integer(5),
        },
      });

    await provider.executeTest(async (ctx) => {
      const client = new BillingClient(ctx.mockServer.baseUrl);
      const plan = await client.getPlan("CUST-42");
      // the assertion that matters: the consumer's actual usage
      expect(plan.tier).toBe("pro");
      expect(plan.renewalDate).toBeTruthy();
    });
  });
});
```

Two things to notice:

- The contract only contains what the **consumer actually uses**. Billing may add ten new fields
  next sprint; nobody's contract breaks. This is the property that makes contract testing scale
  where full integration testing does not.
- The response matching is structural, not exact. Like most real-world verification, it checks
  types and presence — the things that actually break consumers.

## On the provider side

```js
// billing-service pact verification (runs in provider CI)
const verifier = new Verifier({
  provider: "billing-service",
  providerBaseUrl: "http://localhost:8080",
  pactUrls: await broker.resolvePacts(), // contracts from every consumer
  stateHandlers: {
    "customer CUST-42 has an active plan": () => seedCustomer("CUST-42"),
  },
});

await verifier.verify();
```

The `stateHandlers` are the honest work in this setup: each contract precondition must map to
real test data setup in the provider. If you find yourself writing a state handler that fakes
half the system, that is a design signal, not a tooling problem.

## Where contract testing does NOT replace anything

Be precise about what you're buying, or the suite will disappoint you:

1. **It doesn't verify business behavior.** The contract says the response *shape* is intact —
   not that the discount logic is correct. You still need provider-side functional tests.
2. **It doesn't cover asynchronous messaging for free.** Kafka consumers are the classic gap.
   Pact supports message pacts, but more broadly: treat your consumer's *schema expectations*
   for a topic as the contract, and test the producer against them. The rename-`tier` bug
   happens through topics just as easily as through REST.
3. **It doesn't remove the need for one end-to-end smoke.** Keep a thin E2E journey (login →
   checkout → payment) as the belt-and-suspenders check that the *deployment* wiring is intact.
   Contract tests verify interfaces; one E2E verifies that everything is actually pointed at
   everything.

## The rollout that actually works

Teams that try to "pact all the things" in one quarter abandon it. The rollout that sticks:

1. **Pick the pair with the worst history.** The two services with a past cross-team breaking
   incident. The first contract is a firebreak, not an experiment.
2. **Contract-first the next new endpoint** rather than retrofitting old ones.
3. **Wire the broker into both pipelines before writing ten contracts** — a pact file committed
   to a repo that nobody replays is ceremony.
4. Only then expand, consumer by consumer.

One pull request that would have broken a consumer is worth more than a quarter of integration
environment maintenance. That math is why this technique survives in every serious microservices
shop I've worked with — and why "staging found it" should be the last resort, not the plan.
