#!/usr/bin/env node
/**
 * One-time provisioning: creates the editor-in-chief admin account and seeds
 * the first content ideas. Idempotent — skips whatever already exists.
 *
 * Usage: node scripts/provision.mjs <admin-email> <admin-password>
 * Credentials are NOT stored anywhere; they go straight to Supabase Auth.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

/* --- load .env.local (no dotenv dependency) --- */
const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/provision.mjs <admin-email> <admin-password>");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* --- 1. admin user --- */
const { data: listData } = await supabase.auth.admin.listUsers();
let user = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (user) {
  console.log(`Admin user already exists: ${email}`);
} else {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Amr Moussa" },
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  user = created.user;
  console.log(`Created admin user: ${email}`);
}

if (user) {
  const { data: existing } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) {
    const { error } = await supabase
      .from("admin_users")
      .insert({ user_id: user.id, role: "admin" });
    if (error) console.error("admin_users insert failed:", error.message);
    else console.log("Added admin_users row (role: admin).");
  } else {
    console.log("admin_users row already present.");
  }
}

/* --- 2. seed content ideas --- */
const IDEAS = [
  {
    title: "Why your Playwright suite flakes in CI but passes locally",
    description:
      "Timers, animations, shared state and parallel workers behave differently under CI load. Walk through the real causes and the isolation patterns that make CI runs boring again.",
    category: "automation",
    score: 90,
  },
  {
    title: "The locator strategy that survives a UI redesign",
    description:
      "CSS and XPath selectors break the moment design tweaks a page. How to build a locator hierarchy — test ids, roles, contracts — that lets redesigns happen without rewriting the suite.",
    category: "automation",
    score: 85,
  },
  {
    title: "Contract testing a microservices API without a dedicated team",
    description:
      "Consumer-driven contracts sound heavy, but a small pact setup catches breaking changes before staging. A minimal, realistic rollout for a small QA team.",
    category: "api",
    score: 80,
  },
  {
    title: "What AI test generators get right — and where they quietly fail",
    description:
      "Hands-on review of LLM-generated Playwright tests: great scaffolding, subtle assertion gaps, and the review checklist that keeps AI-assisted suites trustworthy.",
    category: "ai-testing",
    score: 88,
  },
  {
    title: "Reading a JMeter report like an engineer, not a dashboard",
    description:
      "Percentiles lie less than averages, throughput hides saturation, and error rate needs context. How to move from pretty graphs to an actual bottleneck diagnosis.",
    category: "performance",
    score: 75,
  },
  {
    title: "Test data management for fintech flows without production copies",
    description:
      "Payments, KYC and ledger data can't be copied out of production. Deterministic factories, seeded fixtures and synthetic data that still exercises real business rules.",
    category: "advanced-qa",
    score: 70,
  },
];

const { data: cats } = await supabase.from("categories").select("id, slug");
const catMap = new Map((cats ?? []).map((c) => [c.slug, c.id]));

const { data: existingIdeas } = await supabase
  .from("content_ideas")
  .select("title");
const known = new Set((existingIdeas ?? []).map((i) => i.title));

let seeded = 0;
for (const idea of IDEAS) {
  if (known.has(idea.title)) continue;
  const { error } = await supabase.from("content_ideas").insert({
    title: idea.title,
    description: idea.description,
    category_id: catMap.get(idea.category) ?? null,
    source: "manual",
    score: idea.score,
  });
  if (error) console.error(`seed failed for "${idea.title}":`, error.message);
  else seeded++;
}
console.log(`Seeded ${seeded} content idea(s).`);
console.log("Done.");
