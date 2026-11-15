"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Bug Squash" — a 30-second time attack: bugs pour in from every edge,
 * click/tap them before they crawl off-screen. Chain squashes quickly for
 * combo multipliers; golden bugs are worth ×5. Purely for fun. Best score
 * persists in localStorage.
 */

type Bug = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  wobble: number;
  golden: boolean;
};

type Splat = { x: number; y: number; life: number; golden: boolean };

const W = 640;
const H = 360;
const GAME_SECONDS = 30;
const COMBO_WINDOW = 1.6; // seconds between squashes to keep the combo

export function BugSquash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [best, setBest] = useState(0);

  const stateRef = useRef({ score: 0, combo: 1, lastSquash: -10, elapsed: 0, mode: "ready" as "ready" | "playing" | "over" });
  const bugsRef = useRef<Bug[]>([]);
  const splatsRef = useRef<Splat[]>([]);
  const spawnRef = useRef(0);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("bugsquash-best") ?? 0));
    } catch {
      /* private mode */
    }
  }, []);

  const sync = useCallback(() => {
    setScore(stateRef.current.score);
    setCombo(stateRef.current.combo);
    setState(stateRef.current.mode);
  }, []);

  const start = useCallback(() => {
    stateRef.current = { score: 0, combo: 1, lastSquash: -10, elapsed: 0, mode: "playing" };
    bugsRef.current = [];
    splatsRef.current = [];
    spawnRef.current = 0;
    setTimeLeft(GAME_SECONDS);
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

    const spawnBug = (elapsed: number): Bug => {
      // spawn just outside a random edge, crawl across the playfield
      const edge = Math.floor(Math.random() * 4);
      const speed = 55 + elapsed * 3.4 + Math.random() * 30;
      const golden = Math.random() < 0.08;
      let x = 0;
      let y = 0;
      let targetX = 0;
      let targetY = 0;
      if (edge === 0) {
        x = -20;
        y = Math.random() * H;
        targetX = W + 20;
        targetY = Math.random() * H;
      } else if (edge === 1) {
        x = W + 20;
        y = Math.random() * H;
        targetX = -20;
        targetY = Math.random() * H;
      } else if (edge === 2) {
        x = Math.random() * W;
        y = -20;
        targetX = Math.random() * W;
        targetY = H + 20;
      } else {
        x = Math.random() * W;
        y = H + 20;
        targetX = Math.random() * W;
        targetY = -20;
      }
      const dx = targetX - x;
      const dy = targetY - y;
      const len = Math.hypot(dx, dy) || 1;
      return {
        x,
        y,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        wobble: Math.random() * Math.PI * 2,
        golden,
      };
    };

    const drawBug = (b: Bug) => {
      const t = b.wobble;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx) + Math.sin(t * 6) * 0.15);
      const r = b.golden ? 11 : 9;
      // body
      ctx.fillStyle = b.golden ? "#c98a12" : "#4a3529";
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();
      // head
      ctx.beginPath();
      ctx.arc(r * 0.9, 0, r * 0.39, 0, Math.PI * 2);
      ctx.fill();
      // legs
      ctx.strokeStyle = b.golden ? "#c98a12" : "#4a3529";
      ctx.lineWidth = 1.4;
      for (const s of [-1, 1]) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 4, s * 4);
          ctx.lineTo(i * 4 + Math.sin(t * 12 + i) * 2.4, s * 9);
          ctx.stroke();
        }
      }
      // antennae
      ctx.beginPath();
      ctx.moveTo(r, -1);
      ctx.lineTo(r + 4, -4);
      ctx.moveTo(r, 1);
      ctx.lineTo(r + 4, 4);
      ctx.stroke();
      if (b.golden) {
        // sparkle marker
        ctx.fillStyle = "#ffd76e";
        ctx.beginPath();
        ctx.arc(-2, -2, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = (ts: number) => {
      const th = theme();
      const s = stateRef.current;
      const dt = Math.min(0.05, (ts - lastRef.current) / 1000 || 0.016);
      lastRef.current = ts;

      // --- backdrop: a plain test grid ---
      ctx.fillStyle = th.paper ?? "#fbfaf7";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = th.surface;
      roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 14);
      ctx.fill();
      ctx.strokeStyle = th.hairline;
      ctx.stroke();

      ctx.strokeStyle = th.hairline;
      ctx.lineWidth = 1;
      for (let gx = 40; gx < W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 40; gy < H; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      // --- game logic ---
      if (s.mode === "playing") {
        s.elapsed += dt;
        spawnRef.current -= dt;
        const interval = Math.max(0.28, 0.95 - s.elapsed * 0.02);
        if (spawnRef.current <= 0) {
          bugsRef.current.push(spawnBug(s.elapsed));
          spawnRef.current = interval;
        }

        for (let i = bugsRef.current.length - 1; i >= 0; i--) {
          const b = bugsRef.current[i];
          b.wobble += dt;
          b.x += b.vx * dt + Math.sin(b.wobble * 7) * 14 * dt;
          b.y += b.vy * dt + Math.cos(b.wobble * 6) * 12 * dt;
          if (b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30) {
            bugsRef.current.splice(i, 1); // escaped, no penalty — it's a score attack
          }
        }

        // combo decay
        if (s.combo > 1 && s.elapsed - s.lastSquash > COMBO_WINDOW) s.combo = 1;
      }

      // splats
      for (let i = splatsRef.current.length - 1; i >= 0; i--) {
        const sp = splatsRef.current[i];
        sp.life -= dt * 1.6;
        if (sp.life <= 0) {
          splatsRef.current.splice(i, 1);
          continue;
        }
        ctx.fillStyle = sp.golden ? "#c98a12" : th.danger;
        ctx.globalAlpha = sp.life * 0.5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 12 * (1.4 - sp.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const b of bugsRef.current) drawBug(b);

      // --- HUD ---
      ctx.textAlign = "left";
      ctx.fillStyle = th.ink;
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(`squashed ${s.score}`, 16, H - 14);
      if (s.combo > 1) {
        ctx.fillStyle = "#c98a12";
        ctx.fillText(`combo ×${s.combo}`, 130, H - 14);
      }
      ctx.fillStyle = s.elapsed > GAME_SECONDS - 6 && s.mode === "playing" ? th.danger : th.muted;
      ctx.textAlign = "right";
      const remain = Math.max(0, Math.ceil(GAME_SECONDS - s.elapsed));
      ctx.fillText(`${remain}s`, W - 20, H - 14);

      // overlays
      if (s.mode !== "playing") {
        ctx.fillStyle = "rgba(14,16,14,0.72)";
        roundRect(ctx, 0, 0, W, H, 14);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "700 22px ui-sans-serif, system-ui, sans-serif";
        if (s.mode === "ready") {
          ctx.fillText("🐛 Bug Squash — 30s", W / 2, H / 2 - 24);
          ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText("Bugs pour in from every edge. Squash as many as you can.", W / 2, H / 2 + 4);
          ctx.fillText("Chain squashes fast for combos. Golden bugs are ×5.", W / 2, H / 2 + 24);
        } else {
          ctx.fillText("Time! ⏱", W / 2, H / 2 - 34);
          ctx.font = "14px ui-monospace, monospace";
          ctx.fillText(`bugs squashed: ${s.score}`, W / 2, H / 2 - 2);
          ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(`personal best: ${Math.max(s.score, best)}`, W / 2, H / 2 + 22);
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
  }, [best]);

  // countdown / game-over watcher
  useEffect(() => {
    if (state !== "playing") return;
    const iv = setInterval(() => {
      const s = stateRef.current;
      const remain = Math.max(0, Math.ceil(GAME_SECONDS - s.elapsed));
      setTimeLeft(remain);
      if (remain <= 0) {
        s.mode = "over";
        setState("over");
        try {
          const prev = Number(localStorage.getItem("bugsquash-best") ?? 0);
          if (s.score > prev) {
            localStorage.setItem("bugsquash-best", String(s.score));
            setBest(s.score);
          }
        } catch {
          /* private mode */
        }
      }
    }, 250);
    return () => clearInterval(iv);
  }, [state]);

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
      if (Math.hypot(b.x - x, b.y - y) < 16) {
        bugsRef.current.splice(i, 1);
        splatsRef.current.push({ x: b.x, y: b.y, life: 1, golden: b.golden });
        // combo: chain squashes within the window, cap at ×5
        if (s.elapsed - s.lastSquash <= COMBO_WINDOW) s.combo = Math.min(5, s.combo + 1);
        s.lastSquash = s.elapsed;
        s.score += b.golden ? 5 * s.combo : 1 * s.combo;
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
        aria-label="Bug Squash mini-game: a 30 second time attack, click the bugs crawling across the screen"
        style={{ width: "100%", height: "auto", display: "block", cursor: state === "playing" ? "crosshair" : "pointer" }}
      />
      <p className="mt-3 text-center text-[12px] text-faint">
        {state === "over"
          ? `Time's up — ${score} squashed. Click to run it back.`
          : state === "playing"
            ? "Chain squashes quickly to build a combo multiplier."
            : "A 30-second score attack. High score saved in your browser."}
      </p>
    </div>
  );
}
