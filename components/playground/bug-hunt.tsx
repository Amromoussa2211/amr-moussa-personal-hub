"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Find the Bug" — a small canvas arcade: bugs crawl across a mock app
 * screen toward the PROD corner; click them before they escape.
 * Purely for fun. High score persists in localStorage.
 */

type Bug = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  wobble: number;
  speed: number;
};

type Splat = { x: number; y: number; life: number };

const W = 640;
const H = 360;
const PROD = { x: W - 70, y: H - 46, w: 120, h: 36 }; // production zone
const MAX_LIVES = 3;

export function BugHunt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const [state, setState] = useState<"ready" | "playing" | "over">("ready");
  const [high, setHigh] = useState(0);

  const stateRef = useRef({ score: 0, lives: MAX_LIVES, level: 1, mode: "ready" as "ready" | "playing" | "over" });
  const bugsRef = useRef<Bug[]>([]);
  const splatsRef = useRef<Splat[]>([]);
  const spawnRef = useRef(0);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    try {
      setHigh(Number(localStorage.getItem("bughunt-high") ?? 0));
    } catch {
      /* private mode */
    }
  }, []);

  const sync = useCallback(() => {
    setScore(stateRef.current.score);
    setLives(stateRef.current.lives);
    setLevel(stateRef.current.level);
    setState(stateRef.current.mode);
  }, []);

  const start = useCallback(() => {
    stateRef.current = { score: 0, lives: MAX_LIVES, level: 1, mode: "playing" };
    bugsRef.current = [];
    splatsRef.current = [];
    spawnRef.current = 0;
    sync();
  }, [sync]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const theme = () => {
      const s = getComputedStyle(document.documentElement);
      const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
      return {
        paper: v("--paper", "#fbfaf7"),
        surface: v("--surface", "#fff"),
        hairline: v("--hairline", "#e6e4db"),
        ink: v("--ink", "#181c19"),
        muted: v("--muted", "#6b726c"),
        faint: v("--faint", "#9aa29a"),
        accent: v("--accent", "#2e7d47"),
        accentSoft: v("--accent-soft", "#e8f3ea"),
        danger: "#e05252",
      };
    };

    const spawnBug = (level: number): Bug => {
      // spawn from the left/top edges, crawl generally toward PROD
      const fromTop = Math.random() < 0.5;
      const speed = 22 + level * 9 + Math.random() * 14;
      const x = fromTop ? Math.random() * (W - 80) : -20;
      const y = fromTop ? -20 : Math.random() * (H - 90);
      const dx = PROD.x - x;
      const dy = PROD.y - y;
      const len = Math.hypot(dx, dy) || 1;
      const jitter = 0.5;
      return {
        x,
        y,
        vx: (dx / len) * speed * (1 - jitter / 2 + Math.random() * jitter),
        vy: (dy / len) * speed * (1 - jitter / 2 + Math.random() * jitter),
        wobble: Math.random() * Math.PI * 2,
        speed,
      };
    };

    const drawBug = (b: Bug) => {
      const t = b.wobble;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx) + Math.sin(t * 6) * 0.15);
      // body
      ctx.fillStyle = "#4a3529";
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // head
      ctx.beginPath();
      ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // legs
      ctx.strokeStyle = "#4a3529";
      ctx.lineWidth = 1.4;
      for (const s of [-1, 1]) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 4, s * 4);
          ctx.lineTo(i * 4 + Math.sin(t * 10 + i) * 2, s * 9);
          ctx.stroke();
        }
      }
      // antennae
      ctx.beginPath();
      ctx.moveTo(10, -1);
      ctx.lineTo(14, -4);
      ctx.moveTo(10, 1);
      ctx.lineTo(14, 4);
      ctx.stroke();
      ctx.restore();
    };

    const draw = (ts: number) => {
      const th = theme();
      const s = stateRef.current;
      const dt = Math.min(0.05, (ts - lastRef.current) / 1000 || 0.016);
      lastRef.current = ts;

      // --- mock app screen backdrop ---
      ctx.fillStyle = th.paper ?? "#fbfaf7";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = th.surface;
      roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 14);
      ctx.fill();
      ctx.strokeStyle = th.hairline;
      ctx.stroke();

      // app header bar
      ctx.fillStyle = th.accentSoft;
      roundRect(ctx, 12, 12, W - 24, 30, 8);
      ctx.fill();
      ctx.fillStyle = th.muted ?? th.faint;
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("payments-app — staging", 24, 31);

      // content cards (mock UI)
      ctx.strokeStyle = th.hairline;
      ctx.fillStyle = th.surface;
      for (const [cx, cy, cw, ch] of [
        [24, 60, 180, 90],
        [220, 60, 180, 90],
        [24, 166, 376, 60],
      ] as const) {
        roundRect(ctx, cx, cy, cw, ch, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = th.faint;
        for (let i = 0; i < 3; i++) {
          roundRect(ctx, cx + 12, cy + 12 + i * 16, cw - 24 - i * 30, 7, 3.5);
          ctx.fill();
          ctx.fillStyle = th.faint;
        }
      }

      // PROD zone
      ctx.fillStyle = s.mode === "playing" ? "rgba(224,82,82,0.12)" : "rgba(224,82,82,0.06)";
      roundRect(ctx, PROD.x, PROD.y, PROD.w, PROD.h, 8);
      ctx.fill();
      ctx.strokeStyle = th.danger;
      ctx.stroke();
      ctx.fillStyle = th.danger;
      ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("PRODUCTION", PROD.x + PROD.w / 2, PROD.y + 15);
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText("do not let them in", PROD.x + PROD.w / 2, PROD.y + 28);

      // --- game logic ---
      if (s.mode === "playing") {
        spawnRef.current -= dt;
        const interval = Math.max(0.55, 1.7 - s.level * 0.18);
        if (spawnRef.current <= 0) {
          bugsRef.current.push(spawnBug(s.level));
          spawnRef.current = interval;
        }

        for (let i = bugsRef.current.length - 1; i >= 0; i--) {
          const b = bugsRef.current[i];
          b.wobble += dt;
          b.x += b.vx * dt + Math.sin(b.wobble * 6) * 8 * dt;
          b.y += b.vy * dt + Math.cos(b.wobble * 5) * 6 * dt;
          if (b.x > PROD.x + 6 && b.y > PROD.y + 6) {
            bugsRef.current.splice(i, 1);
            s.lives -= 1;
            splatsRef.current.push({ x: b.x, y: b.y, life: 1 });
            if (s.lives <= 0) {
              s.mode = "over";
              try {
                const prev = Number(localStorage.getItem("bughunt-high") ?? 0);
                if (s.score > prev) {
                  localStorage.setItem("bughunt-high", String(s.score));
                  setHigh(s.score);
                }
              } catch {
                /* private mode */
              }
            }
          }
        }

        if (s.score > 0 && s.score % 10 === 0 && s.level < 1 + s.score / 10) {
          s.level = 1 + s.score / 10;
        }
      }

      // splats
      for (let i = splatsRef.current.length - 1; i >= 0; i--) {
        const sp = splatsRef.current[i];
        sp.life -= dt * 1.4;
        if (sp.life <= 0) {
          splatsRef.current.splice(i, 1);
          continue;
        }
        ctx.fillStyle = th.danger;
        ctx.globalAlpha = sp.life * 0.5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 12 * (1.4 - sp.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = "12px ui-monospace, monospace";
        ctx.fillText("✓", sp.x, sp.y + 4);
      }

      for (const b of bugsRef.current) drawBug(b);

      // --- HUD ---
      ctx.textAlign = "left";
      ctx.fillStyle = th.ink;
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(`caught ${s.score}`, 16, H - 14);
      ctx.fillStyle = th.muted ?? th.faint;
      ctx.fillText(`level ${s.level}`, 110, H - 14);
      ctx.fillStyle = th.danger;
      ctx.textAlign = "right";
      ctx.fillText("♥".repeat(Math.max(0, s.lives)), W - 20, H - 13);

      // overlays
      if (s.mode !== "playing") {
        ctx.fillStyle = "rgba(14,16,14,0.72)";
        roundRect(ctx, 0, 0, W, H, 14);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "700 22px ui-sans-serif, system-ui, sans-serif";
        if (s.mode === "ready") {
          ctx.fillText("🐛 Find the Bug", W / 2, H / 2 - 24);
          ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText("Click the bugs before they reach production.", W / 2, H / 2 + 6);
          ctx.fillText("3 escapes and the build breaks. Good luck.", W / 2, H / 2 + 26);
        } else {
          ctx.fillText("Build failed 💥", W / 2, H / 2 - 34);
          ctx.font = "14px ui-monospace, monospace";
          ctx.fillText(`bugs caught: ${s.score} · level reached: ${s.level}`, W / 2, H / 2 - 2);
          ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(`personal best: ${Math.max(s.score, high)}`, W / 2, H / 2 + 22);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    function roundRect(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [high]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.mode !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;

    for (let i = bugsRef.current.length - 1; i >= 0; i--) {
      const b = bugsRef.current[i];
      if (Math.hypot(b.x - x, b.y - y) < 15) {
        bugsRef.current.splice(i, 1);
        splatsRef.current.push({ x: b.x, y: b.y, life: 1 });
        s.score += 1;
        sync();
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointer}
        onClick={state === "ready" || state === "over" ? start : undefined}
        role="img"
        aria-label="Find the Bug mini-game: click the bugs before they reach the production corner"
        style={{ width: "100%", height: "auto", display: "block", cursor: state === "playing" ? "crosshair" : "pointer" }}
      />
      <p className="mt-3 text-center text-[12px] text-faint">
        {state === "over"
          ? "Reload the suite and try again — click to restart."
          : "A tiny game about the job: catch defects before they ship. High score saved in your browser."}
      </p>
    </div>
  );
}
