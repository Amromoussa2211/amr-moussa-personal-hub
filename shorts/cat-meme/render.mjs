/*
 * Renders the cat-meme short frame-by-frame with headless Chrome.
 *
 *   node shorts/cat-meme/render.mjs preview   -> ~6 stills into preview/
 *   node shorts/cat-meme/render.mjs full      -> all 900 frames into frames/
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] ?? "preview";
const FPS = 30, TOTAL = 900;
const PREVIEW_FRAMES = [60, 200, 340, 420, 620, 700, 790, 860];

mkdirSync(path.join(here, mode === "full" ? "frames" : "preview"), { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});
await page.goto("file://" + path.join(here, "index.html"));
await page.waitForFunction("window.__ready === true");

const frames = mode === "full"
  ? Array.from({ length: TOTAL }, (_, i) => i)
  : PREVIEW_FRAMES;

const dir = path.join(here, mode === "full" ? "frames" : "preview");
const t0 = Date.now();
for (const f of frames) {
  await page.evaluate((n) => window.__setFrame(n), f);
  const buf = await page.screenshot({ type: "png" });
  writeFileSync(path.join(dir, `f${String(f).padStart(4, "0")}.png`), buf);
  if (f % 60 === 0) {
    const done = frames.indexOf(f) + 1;
    console.log(`frame ${f} (${done}/${frames.length})`);
  }
}
console.log(`done: ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await browser.close();
