"use client";

import { useEffect, useRef } from "react";

/**
 * Animated test-run panel — the site's signature scene, QA-branded.
 * A small browser-chrome panel where spec names tick from pending →
 * running → passed, a counter climbs, and the run restarts. Theme-aware
 * (reads the site's CSS variables), static under reduced motion.
 */

const SPECS = [
  "login.spec › valid credentials",
  "transfer.spec › boundary amounts",
  "checkout.spec › apply discount",
  "contract.spec › billing: plan",
  "reports.spec › csv export",
];

const ROW_MS = 1150; // time between tests starting
const RUN_MS = 750; // spinner duration per test
const HOLD_MS = 1700; // pause on the summary before restarting

type Theme = {
  surface: string;
  hairline: string;
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  paper: string;
};

function readTheme(): Theme {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
  return {
    surface: v("--surface", "#ffffff"),
    hairline: v("--hairline", "#e6e4db"),
    ink: v("--ink", "#181c19"),
    muted: v("--muted", "#6b726c"),
    faint: v("--faint", "#9aa29a"),
    accent: v("--accent", "#2e7d47"),
    accentSoft: v("--accent-soft", "#e8f3ea"),
    paper: v("--paper", "#fbfaf7"),
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function HeroTestRun() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 340;
    const H = 190;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const drawFrame = (theme: Theme, elapsed: number, finalOnly: boolean) => {
      const cycle = SPECS.length * ROW_MS + RUN_MS + HOLD_MS;
      const t = finalOnly ? Number.MAX_SAFE_INTEGER : elapsed % cycle;

      // status per test: 0 pending, 1 running, 2 passed
      const states = SPECS.map((_, i) => {
        const start = i * ROW_MS;
        if (t >= start + RUN_MS) return 2;
        if (t >= start) return 1;
        return 0;
      });
      const passed = states.filter((s) => s === 2).length;
      const showSummary = passed === SPECS.length;

      // panel
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = theme.surface;
      roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 14);
      ctx.fill();
      ctx.strokeStyle = theme.hairline;
      ctx.lineWidth = 1;
      ctx.stroke();

      // title bar
      ctx.fillStyle = theme.faint;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(16 + i * 12, 15, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = theme.muted;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("qa-suite · run #1437", W / 2 + 10, 18);

      // rows
      ctx.textAlign = "left";
      SPECS.forEach((name, i) => {
        const y = 44 + i * 26;
        const state = states[i];

        ctx.fillStyle = theme.hairline;
        ctx.beginPath();
        ctx.arc(20, y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = state === 0 ? theme.faint : theme.ink;
        ctx.font = "10.5px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(name, 32, y + 3.5);

        // status icon
        const ix = W - 24;
        if (state === 2) {
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ix - 4, y);
          ctx.lineTo(ix - 1, y + 4);
          ctx.lineTo(ix + 5, y - 4);
          ctx.stroke();
        } else if (state === 1) {
          const a = (elapsed / 220) % (Math.PI * 2);
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ix, y, 5, a, a + Math.PI * 1.3);
          ctx.stroke();
        } else {
          ctx.strokeStyle = theme.hairline;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ix, y, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // footer counter / summary
      const fy = H - 18;
      if (showSummary) {
        ctx.fillStyle = theme.accentSoft;
        roundRect(ctx, 12, fy - 10, W - 24, 20, 8);
        ctx.fill();
        ctx.fillStyle = theme.accent;
        ctx.font = "bold 10.5px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("✓ 42 passed · 0 failed · 3.8s", W / 2, fy + 3.5);
      } else {
        ctx.fillStyle = theme.muted;
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.fillText(`running ${Math.min(passed + 1, SPECS.length)}/${SPECS.length}…`, 14, fy + 3);
        // progress bar
        const progress = t / (SPECS.length * ROW_MS + RUN_MS);
        ctx.fillStyle = theme.hairline;
        roundRect(ctx, W - 110, fy - 2, 96, 5, 2.5);
        ctx.fill();
        ctx.fillStyle = theme.accent;
        roundRect(ctx, W - 110, fy - 2, Math.max(4, 96 * Math.min(1, progress)), 5, 2.5);
        ctx.fill();
      }
    };

    if (reduced) {
      drawFrame(readTheme(), 0, true);
      return;
    }

    let raf = 0;
    let frame = 0;
    let theme = readTheme();

    const loop = (ts: number) => {
      // refresh theme colors a few times per second (theme toggle support)
      if (frame % 20 === 0) theme = readTheme();
      drawFrame(theme, ts, false);
      frame++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Animated illustration of an automated test run: five specs tick from pending to passed, ending with 42 passed, 0 failed"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}
