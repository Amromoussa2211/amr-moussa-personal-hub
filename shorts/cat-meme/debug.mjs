import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.addInitScript(() => {
  window.__logs = [];
  const orig = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
    if (String(text).includes("✦")) {
      const m = this.getTransform();
      window.__logs.push({
        x, y, e: Math.round(m.e), f: Math.round(m.f), a: Math.round(m.a * 100) / 100,
      });
    }
    return orig.call(this, text, x, y);
  };
});
await page.goto("file:///Users/t/Desktop/personalsite/shorts/cat-meme/index.html");
await page.evaluate(() => window.__setFrame(60));
console.log(JSON.stringify(await page.evaluate(() => window.__logs)));
await browser.close();
