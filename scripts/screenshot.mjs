import { chromium } from "playwright";

const base = process.env.BASE ?? "http://localhost:3100";
const outDir = ".screenshots";

const shots = [
  { name: "home-light", path: "/", viewport: [1440, 900], full: false, theme: "light" },
  { name: "home-light-full", path: "/", viewport: [1440, 900], full: true, theme: "light" },
  { name: "home-dark", path: "/", viewport: [1440, 900], full: true, theme: "dark" },
  { name: "article", path: "/articles/why-your-playwright-tests-are-flaky", viewport: [1440, 900], full: false, theme: "light" },
  { name: "article-full", path: "/articles/why-your-playwright-tests-are-flaky", viewport: [1440, 900], full: true, theme: "light" },
  { name: "articles-index", path: "/articles", viewport: [1440, 900], full: true, theme: "light" },
  { name: "projects", path: "/projects", viewport: [1440, 900], full: true, theme: "light" },
  { name: "til", path: "/til", viewport: [1440, 900], full: false, theme: "light" },
  { name: "category-automation", path: "/categories/automation", viewport: [1440, 900], full: false, theme: "light" },
  { name: "about", path: "/about", viewport: [1440, 900], full: true, theme: "light" },
  { name: "contact", path: "/contact", viewport: [1440, 900], full: false, theme: "dark" },
  { name: "mobile-home", path: "/", viewport: [390, 844], full: false, theme: "light" },
  { name: "mobile-article", path: "/articles/pytest-xdist-playwright-parallel-python", viewport: [390, 844], full: false, theme: "light" },
];

import fs from "node:fs";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.viewport[0], height: s.viewport[1] },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(
    `try { localStorage.setItem('theme', '${s.theme}'); var d=document.documentElement; if('${s.theme}'==='dark') document.documentElement.classList.add('dark'); } catch(e) {}`
  );
  const page = await ctx.newPage();
  const res = await page.goto(base + s.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${outDir}/${s.name}.png`,
    fullPage: s.full,
  });
  console.log(`${s.name}: ${res?.status()}`);
  await ctx.close();
}
await browser.close();
console.log("DONE");
