/**
 * Phase 2 critical-path E2E — must be executed against `npm run dev` (BASE defaults to :3101).
 * Credentials from /tmp/admin-user.json (never committed). Run: node scripts/admin-e2e.mjs
 */
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.env.BASE ?? "http://localhost:3101";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail: String(detail) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

const creds = JSON.parse(fs.readFileSync("/tmp/admin-user.json", "utf8"));
const envText = fs.readFileSync(".env.local", "utf8");
const envVal = (k) => envText.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const SB = { url: envVal("NEXT_PUBLIC_SUPABASE_URL"), key: envVal("SUPABASE_SECRET_KEY") };
const rest = async (pathQ, method = "GET", body = null) => {
  const res = await fetch(`${SB.url}/rest/v1/${pathQ}`, {
    method,
    headers: {
      apikey: SB.key,
      Authorization: `Bearer ${SB.key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(90000);
page.setDefaultNavigationTimeout(120000);
page.on("dialog", (d) => d.accept()); // explicit publish/approve confirmations

const slug = `critical-path-test-${Date.now().toString(36)}`;
const destForm = (destination, action) =>
  page.locator(
    `form:has(input[name="destination"][value="${destination}"]):has(button:text-matches("${action}"))`
  );

/* 1 — unauthenticated access blocked */
await page.goto(base + "/admin", { waitUntil: "domcontentloaded" });
await sleep(1500);
check("unauthenticated /admin → redirected to login", page.url().includes("/admin/login"), page.url());

/* 2 — login */
await page.goto(base + "/admin/login", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#email", { timeout: 60000 });
await page.fill("#email", creds.email);
await page.fill("#password", creds.password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 90000 }).catch(() => {});
await sleep(2500);
check("login → dashboard", page.url().endsWith("/admin"), page.url());
await page.screenshot({ path: ".screenshots/admin-overview.png", fullPage: true });

/* 3 — create article via the dashboard */
await page.goto(base + "/admin/articles/new", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#title", { timeout: 60000 });
await page.fill("#title", "Critical Path Test: Approvals Before Publishing");
await page.fill("#slug", slug);
await page.fill("#description", "E2E verification of version-bound, destination-specific approvals.");
await page.selectOption("#categorySlug", "automation");
await page.fill("#body", "## The rule\n\nAn article cannot go public without an approval bound to its exact version.\n\n```typescript\nconst authorized = await isPublishAuthorized(articleId, versionId, \"website\");\n```\n");
await page.getByRole("button", { name: "Create article" }).click();
await page.waitForURL(/admin\/articles\/[0-9a-f-]{36}$/, { timeout: 120000 }).catch(() => {});
await page.waitForTimeout(2000);
const detailUrl = page.url();
check("article created → detail page", /admin\/articles\/[0-9a-f-]{36}$/.test(page.url()), page.url());

/* 4 — public article must be absent before approval */
const before = await page.request.get(`${base}/articles/${slug}`);
check("public article 404 before approval", before.status() === 404, `status ${before.status()}`);

/* 5 — approve WEBSITE only */
await destForm("website", "Approve").locator("button[type=submit]").click();
await page.waitForFunction(
  () => /approved for v\d+\s*—\s*valid/.test(document.body.innerText),
  undefined,
  { timeout: 120000 }
);

/* 6 — LinkedIn & X remain unapproved with locked publish */
check("LinkedIn publish locked (not approved)",
  (await page.textContent("body")).includes("not approved") &&
  await destForm("linkedin", "Publish to").locator("button[type=submit]").isDisabled());
check("X publish locked (not approved)",
  await destForm("x", "Publish to").locator("button[type=submit]").isDisabled());
await page.screenshot({ path: ".screenshots/admin-destinations-locked.png", fullPage: true });

/* 7 — publish to website */
await destForm("website", "Publish to").locator("button[type=submit]").click();
await page.waitForFunction(
  () => document.body.innerText.includes("status badge") || /PUBLISHED/.test(document.body.innerText),
  undefined,
  { timeout: 120000 }
).catch(() => {});
const t2 = await page.textContent("body");
check("website publish executed (status PUBLISHED)", t2.includes("PUBLISHED"));

/* 8 — public article live */
const after = await page.request.get(`${base}/articles/${slug}`);
check("public article live on the site", after.status() === 200, `status ${after.status()}`);
await page.goto(`${base}/articles/${slug}`, { waitUntil: "domcontentloaded" }).catch(() => {});
await sleep(1500);
await page.screenshot({ path: ".screenshots/admin-published-public.png", fullPage: true });

/* 9 — idempotency: re-publish website must not duplicate */
await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
await destForm("website", "Publish to").locator("button[type=submit]").click();
await page.waitForTimeout(6000);

/* 10 — exactly ONE publish record for this article (idempotent), audit chain complete */
const { json: art } = await rest(`articles?slug=eq.${slug}&select=id,status`);
const artId = art?.[0]?.id;
const { json: myPosts } = await rest(
  `published_posts?article_id=eq.${artId}&select=id,destination`
);
check(
  "re-publish is idempotent: exactly ONE website publish record",
  (myPosts ?? []).length === 1 && myPosts[0].destination === "website",
  `rows: ${(myPosts ?? []).length}`
);
check("article status PUBLISHED in DB", art?.[0]?.status === "PUBLISHED", art?.[0]?.status);

const { json: audits } = await rest(
  `audit_logs?or=(entity_id.eq.${artId},and(entity.eq.article_versions,after->>article_id.eq.${artId}))&select=action,entity&order=created_at.asc`
);
const actions = (audits ?? []).map((a) => a.action);
const chainOk =
  actions.includes("create") && actions.includes("new_version") &&
  actions.includes("approve") && actions.some((a) => a.startsWith("publish"));
check("audit chain: create → new_version → approve → publish", chainOk, actions.join(" → "));

/* 11 — LinkedIn/X: zero approvals and zero publishes for this article */
const { json: otherApprovals } = await rest(
  `article_approvals?article_id=eq.${artId}&select=destination`
);
check(
  "no LinkedIn/X approvals were ever created",
  (otherApprovals ?? []).every((a) => a.destination === "website"),
  JSON.stringify((otherApprovals ?? []).map((a) => a.destination))
);


fs.writeFileSync(".screenshots/e2e-results.json", JSON.stringify(results, null, 2));
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
