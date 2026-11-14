"use client";

import { useEffect, useRef } from "react";

/**
 * Global click feedback: a soft ripple ring plus a small burst of rising
 * checkmark particles at the click point. Purely cosmetic — overlay canvas,
 * pointer-events: none. Disabled for prefers-reduced-motion.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1 remaining
  size: number;
};

type Ripple = { x: number; y: number; life: number };

export function ClickEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const particles: Particle[] = [];
    const ripples: Ripple[] = [];

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr();
      canvas.height = window.innerHeight * dpr();
    };

    const cssVar = (name: string, fallback: string): string => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    };

    const accentColor = (): string => cssVar("--accent", "#62d487");

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const d = dpr();
      const accent = accentColor();

      // ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.life -= 0.045;
        if (r.life <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        const radius = (1 - r.life) * 46;
        ctx.beginPath();
        ctx.arc(r.x * d, r.y * d, radius * d, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = r.life * 0.35;
        ctx.lineWidth = 1.6 * d;
        ctx.stroke();
      }

      // particles: small ✓ glyphs rising and fading
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.025;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.045; // gentle upward float
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.min(1, p.life * 1.4);
        ctx.fillStyle = accent;
        ctx.font = `${p.size * d}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillText("✓", p.x * d, p.y * d);
      }

      ctx.globalAlpha = 1;

      if (ripples.length > 0 || particles.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
      clearTimeout(idleTimer);
      // safety: hard-stop the loop if stragglers remain
      idleTimer = setTimeout(() => {
        if (!running) return;
        particles.length = 0;
        ripples.length = 0;
      }, 4000);
    };

    const onClick = (e: MouseEvent) => {
      // Skip clicks on form inputs — typing focus shouldn't sparkle.
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;

      resize(); // cheap; handles rotation/resize between clicks
      const x = e.clientX;
      const y = e.clientY;
      ripples.push({ x, y, life: 1 });
      const count = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * (0.5 + Math.random() * 0.8),
          vy: Math.sin(angle) * 0.4 - 0.6,
          life: 1,
          size: 9 + Math.random() * 5,
        });
      }
      ensureLoop();
    };

    window.addEventListener("resize", resize);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
