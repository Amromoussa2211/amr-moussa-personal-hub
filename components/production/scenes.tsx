"use client";

import { useEffect, useRef } from "react";

/**
 * Production-project scenes: each project renders as a live looping canvas
 * animation that looks like the app running. Theme-aware (reads CSS vars),
 * static frame under prefers-reduced-motion. No GIFs — pure rendering.
 */

export type SceneId =
  | "hermes"
  | "bitcoin"
  | "microservices"
  | "arabmatch"
  | "lottery"
  | "workout";

const W = 480;
const H = 280;

type T = {
  paper: string;
  surface: string;
  ink: string;
  muted: string;
  faint: string;
  hairline: string;
  accent: string;
  accentSoft: string;
  danger: string;
};

function readTheme(): T {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
  return {
    paper: v("--paper", "#fbfaf7"),
    surface: v("--surface", "#fff"),
    ink: v("--ink", "#181c19"),
    muted: v("--muted", "#6b726c"),
    faint: v("--faint", "#9aa29a"),
    hairline: v("--hairline", "#e6e4db"),
    accent: v("--accent", "#2e7d47"),
    accentSoft: v("--accent-soft", "#e8f3ea"),
    danger: "#e05252",
  };
}

function rr(
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

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "ui-sans-serif, system-ui, sans-serif";

/* deterministic pseudo-random for stable chart shapes */
function noise(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ---------------- HERMES — trading ---------------- */
function hermes(ctx: CanvasRenderingContext2D, T: T, ts: number) {
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, W, H);

  // ticker header
  const cycle = Math.floor(ts / 2600) % 9;
  const price = 12847 + (noise(cycle) - 0.45) * 90 + Math.sin(ts / 900) * 12;
  const up = noise(cycle + 3) > 0.45;
  ctx.fillStyle = T.surface;
  rr(ctx, 12, 12, W - 24, 34, 8);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.fillStyle = T.ink;
  ctx.font = `bold 13px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("HERMES", 26, 34);
  ctx.fillStyle = up ? T.accent : T.danger;
  ctx.font = `bold 13px ${MONO}`;
  ctx.fillText(`${up ? "▲" : "▼"} ${price.toFixed(2)}`, 100, 34);
  ctx.fillStyle = T.muted;
  ctx.font = `10px ${MONO}`;
  ctx.fillText(`${up ? "+" : "-"}${(0.2 + noise(cycle + 7) * 1.4).toFixed(2)}% today`, 190, 34);
  ctx.fillStyle = T.faint;
  ctx.fillText("LIVE", W - 46, 34);
  ctx.fillStyle = up ? T.accent : T.danger;
  ctx.beginPath();
  ctx.arc(W - 60, 30, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // candlestick chart
  const chart = { x: 14, y: 58, w: 300, h: 180 };
  ctx.fillStyle = T.surface;
  rr(ctx, chart.x, chart.y, chart.w, chart.h, 8);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.save();
  rr(ctx, chart.x, chart.y, chart.w, chart.h, 8);
  ctx.clip();

  const cw = 14;
  const n = Math.floor(chart.w / cw) + 1;
  const shift = ((ts / 420) % cw) * -1;
  for (let i = 0; i < n; i++) {
    const seed = Math.floor(ts / 420) + i;
    const base = 60 + noise(seed) * 120;
    const o = base;
    const c = base + (noise(seed + 0.5) - 0.48) * 46;
    const hi = Math.max(o, c) + noise(seed + 0.9) * 18;
    const lo = Math.min(o, c) - noise(seed + 1.3) * 18;
    const x = chart.x + chart.w - cw * (n - i) + shift;
    const green = c >= o;
    const y = (v: number) => chart.y + chart.h - 14 - (v / 200) * (chart.h - 30);
    ctx.strokeStyle = green ? T.accent : T.danger;
    ctx.fillStyle = green ? T.accent : T.danger;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + cw / 2, y(hi));
    ctx.lineTo(x + cw / 2, y(lo));
    ctx.stroke();
    const top = y(Math.max(o, c));
    const bot = y(Math.min(o, c));
    ctx.fillRect(x + 2, top, cw - 4, Math.max(2.5, bot - top));
  }
  ctx.restore();

  // order panel
  const p = { x: 326, y: 58, w: 140, h: 180 };
  ctx.fillStyle = T.surface;
  rr(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.fillStyle = T.ink;
  ctx.font = `10.5px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("Order · HERMES", p.x + 12, p.y + 20);
  ctx.fillStyle = T.faint;
  ctx.fillText("Qty", p.x + 12, p.y + 44);
  ctx.fillText("Limit", p.x + 12, p.y + 68);
  ctx.strokeStyle = T.hairline;
  for (const [ly] of [[p.y + 50], [p.y + 74]] as const) {
    rr(ctx, p.x + 44, ly - 10, p.w - 58, 15, 4);
    ctx.stroke();
  }
  const buyPulse = 0.75 + Math.sin(ts / 500) * 0.25;
  ctx.globalAlpha = buyPulse;
  ctx.fillStyle = T.accent;
  rr(ctx, p.x + 12, p.y + 96, p.w - 24, 26, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = T.paper;
  ctx.font = `bold 11px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("BUY", p.x + p.w / 2, p.y + 113);
  ctx.fillStyle = T.danger;
  rr(ctx, p.x + 12, p.y + 130, p.w - 24, 26, 6);
  ctx.fill();
  ctx.fillStyle = T.paper;
  ctx.fillText("SELL", p.x + p.w / 2, p.y + 147);

  // portfolio bar
  ctx.fillStyle = T.accentSoft;
  rr(ctx, 14, 246, W - 28, 22, 6);
  ctx.fill();
  ctx.fillStyle = T.accent;
  ctx.font = `bold 10.5px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("Portfolio", 26, 261);
  ctx.textAlign = "right";
  ctx.fillText(`P/L  +$1,248.${Math.floor((ts / 300) % 100)}`.slice(0, 22), W - 26, 261);
}

/* ---------------- BITCOIN — blockchain ---------------- */
function bitcoin(ctx: CanvasRenderingContext2D, T: T, ts: number) {
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, W, H);

  // wallet card
  ctx.fillStyle = T.surface;
  rr(ctx, 12, 12, 220, 74, 8);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.fillStyle = T.muted;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("WALLET · bc1q…x7f", 26, 32);
  ctx.fillStyle = T.ink;
  ctx.font = `bold 20px ${MONO}`;
  ctx.fillText("₿ 0.084213", 26, 58);
  ctx.fillStyle = T.accent;
  ctx.font = `10px ${MONO}`;
  ctx.fillText(`+0.0012 BTC received`, 26, 74);

  // mempool / mining status
  const mining = ts % 3600;
  const blockNo = 873412 + Math.floor(ts / 3600);
  ctx.fillStyle = T.surface;
  rr(ctx, 244, 12, W - 256, 74, 8);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.fillStyle = T.muted;
  ctx.font = `10px ${MONO}`;
  ctx.fillText(`BLOCK #${blockNo.toLocaleString("en-US")}`, 258, 32);
  ctx.fillStyle = mining < 2900 ? T.faint : T.accent;
  ctx.font = `bold 11px ${MONO}`;
  ctx.fillText(mining < 2900 ? "mining…" : "mined ✓", 258, 50);
  // flickering hash
  let hash = "";
  const chars = "0123456789abcdef";
  const seedTick = Math.floor(ts / 90);
  for (let i = 0; i < 14; i++) {
    hash += chars[Math.floor(noise(seedTick + i * 3) * 16)];
  }
  ctx.fillStyle = T.faint;
  ctx.font = `10px ${MONO}`;
  ctx.fillText(`00000000${hash}…`, 258, 68);
  const prog = Math.min(1, mining / 2900);
  ctx.fillStyle = T.hairline;
  rr(ctx, 258, 74, 180, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = T.accent;
  rr(ctx, 258, 74, Math.max(4, 180 * prog), 5, 2.5);
  ctx.fill();

  // the chain
  const chainY = 150;
  const labels = ["#…410", "#…411", "#…412"];
  labels.forEach((lb, i) => {
    const bx = 40 + i * 150;
    const solid = i < 2 || mining >= 2900;
    ctx.fillStyle = solid ? T.accentSoft : T.surface;
    rr(ctx, bx, chainY, 108, 62, 8);
    ctx.fill();
    ctx.strokeStyle = solid ? T.accent : T.hairline;
    ctx.stroke();
    ctx.fillStyle = solid ? T.accent : T.faint;
    ctx.font = `bold 10px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(lb, bx + 54, chainY + 22);
    ctx.fillStyle = T.muted;
    ctx.font = `9px ${MONO}`;
    ctx.fillText(solid ? "✓ verified" : mining < 2900 ? "mining…" : "✓ verified", bx + 54, chainY + 40);
    if (i < 2) {
      ctx.strokeStyle = T.faint;
      ctx.beginPath();
      ctx.moveTo(bx + 112, chainY + 31);
      ctx.lineTo(bx + 146, chainY + 31);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + 146, chainY + 31);
      ctx.lineTo(bx + 140, chainY + 27);
      ctx.moveTo(bx + 146, chainY + 31);
      ctx.lineTo(bx + 140, chainY + 35);
      ctx.stroke();
    }
  });

  // flowing tx dots from wallet to latest block
  const dotT = (ts / 1300) % 1;
  for (let k = 0; k < 3; k++) {
    const d = (dotT + k / 3) % 1;
    ctx.fillStyle = T.accent;
    ctx.globalAlpha = 0.9 - d * 0.6;
    ctx.beginPath();
    ctx.arc(130 + d * (40 + 300 - 130 - 40), 118 + Math.sin(d * 6) * 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = T.faint;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("tx pool → block → chain · proof of work in progress", W / 2, 258);
}

/* ---------------- MICROSERVICES ---------------- */
function microservices(ctx: CanvasRenderingContext2D, T: T, ts: number) {
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, W, H);

  type Node = { x: number; y: number; w: number; h: number; name: string; hl?: boolean };
  const nodes: Node[] = [
    { x: 190, y: 26, w: 100, h: 34, name: "gateway" },
    { x: 30, y: 110, w: 92, h: 34, name: "auth" },
    { x: 150, y: 110, w: 92, h: 34, name: "orders" },
    { x: 270, y: 110, w: 100, h: 34, name: "payments" },
    { x: 382, y: 110, w: 68, h: 34, name: "notify" },
    { x: 96, y: 206, w: 92, h: 34, name: "kafka" },
    { x: 262, y: 206, w: 92, h: 34, name: "postgres" },
  ];

  // edges
  const edges: [Node, Node][] = [
    [nodes[0], nodes[1]],
    [nodes[0], nodes[2]],
    [nodes[0], nodes[3]],
    [nodes[3], nodes[5]],
    [nodes[3], nodes[6]],
    [nodes[2], nodes[5]],
    [nodes[4], nodes[6]],
  ];
  ctx.strokeStyle = T.hairline;
  ctx.lineWidth = 1.4;
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(a.x + a.w / 2, a.y + a.h / 2);
    ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
    ctx.stroke();
  }

  // flowing packets
  edges.forEach(([a, b], i) => {
    for (let k = 0; k < 2; k++) {
      const d = ((ts / 900 + i * 0.37 + k * 0.5) % 1);
      const x = a.x + a.w / 2 + (b.x + b.w / 2 - (a.x + a.w / 2)) * d;
      const y = a.y + a.h / 2 + (b.y + b.h / 2 - (a.y + a.h / 2)) * d;
      ctx.fillStyle = T.accent;
      ctx.globalAlpha = 0.85 * (1 - Math.abs(d - 0.5) * 0.7);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  // nodes
  nodes.forEach((n, i) => {
    const amberFlash = i === 3 && Math.floor(ts / 2400) % 4 === 3; // payments occasionally slow
    ctx.fillStyle = amberFlash ? "rgba(240,180,60,0.18)" : T.surface;
    rr(ctx, n.x, n.y, n.w, n.h, 8);
    ctx.fill();
    ctx.strokeStyle = amberFlash ? "#d9a52e" : T.hairline;
    ctx.stroke();
    ctx.fillStyle = T.ink;
    ctx.font = `10.5px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(n.name, n.x + n.w / 2, n.y + n.h / 2 + 4);
    // health dot
    ctx.beginPath();
    ctx.arc(n.x + n.w - 9, n.y + 9, 3, 0, Math.PI * 2);
    ctx.fillStyle = amberFlash ? "#d9a52e" : T.accent;
    ctx.fill();
  });

  // kafka pulses
  const kp = (ts / 1100) % 1;
  ctx.strokeStyle = T.accent;
  ctx.globalAlpha = 0.5 * (1 - kp);
  ctx.lineWidth = 2;
  rr(ctx, nodes[5].x - kp * 8, nodes[5].y - kp * 6, nodes[5].w + kp * 16, nodes[5].h + kp * 12, 8);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = T.faint;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("requests flowing · queue buffering · all health checks green", W / 2, 262);
}

/* ---------------- ARAB MATCH — dating ---------------- */
function arabmatch(ctx: CanvasRenderingContext2D, T: T, ts: number) {
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, W, H);

  // phone frame
  const px = W / 2 - 74;
  ctx.fillStyle = T.surface;
  rr(ctx, px, 14, 148, 252, 22);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  rr(ctx, px + 4, 20, 140, 240, 18);
  ctx.clip();

  const CYCLE = 3000;
  const t = ts % CYCLE;
  const swipe = Math.max(0, t - CYCLE * 0.62) / (CYCLE * 0.38); // 0..1 during swipe-out
  const dx = swipe * 240;
  const rot = swipe * 0.35;
  const cardIdx = Math.floor(ts / CYCLE) % 3;

  const profiles = [
    { name: "سارة · Cairo, 27", emoji: "🦋", bio: "Backend dev · loves Espresso ☕" },
    { name: "Omar · Dubai, 31", emoji: "🐪", bio: "iOS engineer · padel & oud" },
    { name: "Lina · Amman, 25", emoji: "🎨", bio: "UX designer · sunrise runner" },
  ];
  const p = profiles[cardIdx];

  // backdrop inside phone
  ctx.fillStyle = T.accentSoft;
  ctx.fillRect(px + 4, 20, 140, 240);

  // the profile card (swiping)
  ctx.save();
  ctx.translate(px + 74 + dx, 105);
  ctx.rotate(rot);
  ctx.fillStyle = T.surface;
  rr(ctx, -58, -76, 116, 152, 14);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.font = "34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(p.emoji, 0, -28);
  ctx.fillStyle = T.ink;
  ctx.font = `bold 9.5px ${SANS}`;
  ctx.fillText(p.name, 0, -2);
  ctx.fillStyle = T.muted;
  ctx.font = `8.5px ${SANS}`;
  ctx.fillText(p.bio, 0, 16);
  // like stamp appearing mid-swipe
  if (swipe > 0.25) {
    ctx.globalAlpha = Math.min(1, (swipe - 0.25) * 3);
    ctx.strokeStyle = T.accent;
    ctx.lineWidth = 3;
    ctx.font = `bold 16px ${SANS}`;
    ctx.fillText("LIKE ❤", 0, 58);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // rising hearts during swipe
  if (swipe > 0.15) {
    for (let i = 0; i < 4; i++) {
      const hd = ((ts / 700 + i * 0.25) % 1);
      ctx.globalAlpha = 1 - hd;
      ctx.fillStyle = T.danger;
      ctx.font = `${10 + i * 2}px sans-serif`;
      ctx.fillText("♥", px + 30 + i * 26, 210 - hd * 60);
    }
    ctx.globalAlpha = 1;
  }

  // match flash at cycle end
  if (t > CYCLE * 0.86) {
    ctx.fillStyle = "rgba(14,16,14,0.78)";
    ctx.fillRect(px + 4, 20, 140, 240);
    ctx.fillStyle = T.accent;
    ctx.font = `bold 15px ${SANS}`;
    ctx.textAlign = "center";
    ctx.fillText("It's a match! 💕", px + 74, 120);
    ctx.fillStyle = "#fff";
    ctx.font = `10px ${MONO}`;
    ctx.fillText("chat opened →", px + 74, 142);
  }

  // side annotations
  ctx.fillStyle = T.ink;
  ctx.font = `bold 12px ${SANS}`;
  ctx.textAlign = "left";
  ctx.fillText("Arab Match", 26, 60);
  ctx.fillStyle = T.muted;
  ctx.font = `10.5px ${SANS}`;
  const lines = [
    "Profile discovery",
    "Match & chat flows",
    "Arabic-first, RTL ready",
    "Privacy-critical by design",
  ];
  lines.forEach((l, i) => {
    ctx.fillStyle = T.accent;
    ctx.fillText("✓", 26, 88 + i * 24);
    ctx.fillStyle = T.muted;
    ctx.fillText(l, 40, 88 + i * 24);
  });
}

/* ---------------- LOTTERY & LOYALTY ---------------- */
function lottery(ctx: CanvasRenderingContext2D, T: T, ts: number) {
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, W, H);

  const CYCLE = 4200;
  const t = ts % CYCLE;
  const spin = t < 2600;
  const symbols = ["🍒", "⭐", "💎", "7️⃣"];
  const winning = Math.floor(ts / CYCLE) % 3 === 2; // jackpot every 3rd cycle

  // slot reels
  ctx.fillStyle = T.surface;
  rr(ctx, 14, 14, 226, 130, 10);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.fillStyle = T.muted;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("TONIGHT'S DRAW", 127, 34);
  for (let r = 0; r < 3; r++) {
    const rx = 40 + r * 62;
    rr(ctx, rx, 46, 50, 62, 8);
    ctx.save();
    rr(ctx, rx, 46, 50, 62, 8);
    ctx.clip();
    if (spin) {
      const off = (ts / 60 + r * 130) % 62;
      for (let s = -1; s < 2; s++) {
        ctx.font = "22px sans-serif";
        ctx.fillText(
          symbols[(Math.floor(ts / 60 + r * 130) + s + 8) % 4],
          rx + 25,
          77 + s * 30 + off * 0.4
        );
      }
    } else {
      const final = winning ? 3 : Math.floor(noise(Math.floor(ts / CYCLE) + r) * 3);
      const settle = Math.min(1, (t - 2600) / 300);
      ctx.font = "22px sans-serif";
      ctx.globalAlpha = 1;
      ctx.fillText(symbols[final], rx + 25, 77 + (1 - settle) * 8);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.strokeStyle = T.hairline;
    rr(ctx, rx, 46, 50, 62, 8);
    ctx.stroke();
  }

  if (!spin && winning) {
    ctx.fillStyle = T.accent;
    ctx.font = `bold 14px ${MONO}`;
    ctx.fillText("★ JACKPOT ★", 127, 132);
  }

  // loyalty card
  ctx.fillStyle = T.surface;
  rr(ctx, 252, 14, 214, 130, 10);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  ctx.fillStyle = T.muted;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("LOYALTY · stamp card", 266, 34);
  const filled = Math.min(8, Math.floor(t / (CYCLE / 9)));
  for (let i = 0; i < 8; i++) {
    const sx = 268 + (i % 4) * 48;
    const sy = 50 + Math.floor(i / 4) * 44;
    ctx.strokeStyle = T.hairline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sx + 14, sy + 14, 13, 0, Math.PI * 2);
    ctx.stroke();
    if (i < filled) {
      ctx.fillStyle = T.accent;
      ctx.beginPath();
      ctx.arc(sx + 14, sy + 14, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = T.paper;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", sx + 14, sy + 19);
    }
  }
  ctx.fillStyle = T.accent;
  ctx.font = `bold 10.5px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(`${filled * 25} pts`, 266, 136);

  // win banner
  if (!spin && winning) {
    const pulse = 0.7 + Math.sin(ts / 180) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = T.accentSoft;
    rr(ctx, 14, 158, W - 28, 40, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = T.accent;
    ctx.font = `bold 13px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("🎉 Winner verified — payout queued to ledger", W / 2, 183);
  } else {
    ctx.fillStyle = T.surface;
    rr(ctx, 14, 158, W - 28, 40, 8);
    ctx.fill();
    ctx.strokeStyle = T.hairline;
    ctx.stroke();
    ctx.fillStyle = T.muted;
    ctx.font = `10.5px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(spin ? "draw in progress — every entry logged…" : "next draw starting…", W / 2, 183);
  }

  ctx.fillStyle = T.faint;
  ctx.font = `10px ${MONO}`;
  ctx.fillText("draws are audited · points are ledger-bound · no silent rewrites", W / 2, 228);

  // confetti on jackpot
  if (!spin && winning) {
    for (let i = 0; i < 12; i++) {
      const d = ((ts / 900 + i * 0.11) % 1);
      ctx.fillStyle = i % 2 ? T.accent : T.danger;
      ctx.globalAlpha = 1 - d;
      ctx.fillRect(40 + noise(i) * (W - 90), 200 + d * 60, 4, 7);
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------------- WORKOUT ---------------- */
function workout(ctx: CanvasRenderingContext2D, T: T, ts: number) {
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, W, H);

  // phone
  const px = W / 2 - 74;
  ctx.fillStyle = T.surface;
  rr(ctx, px, 14, 148, 252, 22);
  ctx.fill();
  ctx.strokeStyle = T.hairline;
  ctx.stroke();
  rr(ctx, px + 4, 20, 140, 240, 18);
  ctx.clip();

  // today's plan header
  ctx.fillStyle = T.ink;
  ctx.font = `bold 11px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("Today · Push day 💪", px + 74, 42);

  const EXS = ["Squats", "Push-ups", "Plank", "Pull-ups"];
  const done = Math.floor((ts / 5000) % 4);

  // exercise list
  EXS.forEach((ex, i) => {
    const y = 62 + i * 30;
    const isCurrent = i === done;
    if (isCurrent) {
      ctx.fillStyle = T.accentSoft;
      rr(ctx, px + 10, y - 15, 128, 26, 7);
      ctx.fill();
    }
    ctx.fillStyle = i < done ? T.accent : T.hairline;
    ctx.beginPath();
    ctx.arc(px + 22, y - 2, 6, 0, Math.PI * 2);
    if (i < done) {
      ctx.fill();
      ctx.fillStyle = T.paper;
      ctx.font = "7px sans-serif";
      ctx.fillText("✓", px + 22, y);
    } else {
      ctx.strokeStyle = T.hairline;
      ctx.stroke();
    }
    ctx.fillStyle = isCurrent ? T.ink : T.muted;
    ctx.font = `${isCurrent ? "bold " : ""}10px ${SANS}`;
    ctx.textAlign = "left";
    ctx.fillText(ex, px + 36, y + 2);
  });

  // rep counter + ring
  const reps = Math.floor((ts % 5000) / (5000 / 4));
  const repInSet = (ts % 1250) / 1250;
  const count = 1 + Math.floor(repInSet * 15);
  const cx = px + 74;
  const cy = 232;
  ctx.strokeStyle = T.hairline;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = T.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * repInSet);
  ctx.stroke();
  ctx.fillStyle = T.ink;
  ctx.font = `bold 13px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText(`${count}/15`, cx, cy + 5);

  // side panel: stats
  ctx.textAlign = "left";
  ctx.fillStyle = T.ink;
  ctx.font = `bold 12px ${SANS}`;
  ctx.fillText("Workout app", 26, 60);
  const stats: [string, string][] = [
    ["Reps this set", `${Math.floor((ts / 800) % 15) + 1} / 15`],
    ["Session", "34 min"],
    ["Calories", "412 kcal"],
    ["Streak", "12 days 🔥"],
  ];
  stats.forEach(([k, v], i) => {
    const y = 92 + i * 34;
    ctx.fillStyle = T.muted;
    ctx.font = `10.5px ${SANS}`;
    ctx.fillText(k, 26, y);
    ctx.fillStyle = T.ink;
    ctx.font = `bold 12px ${MONO}`;
    ctx.fillText(v, 26, y + 16);
  });

  // rest timer bar under stats
  const restT = (ts % 5000) / 5000;
  const resting = repInSet > 0.85;
  if (resting) {
    ctx.fillStyle = T.accentSoft;
    rr(ctx, 26, 226, 120, 30, 7);
    ctx.fill();
    ctx.fillStyle = T.accent;
    ctx.font = `bold 10px ${MONO}`;
    ctx.fillText(`REST ${String(Math.floor((1 - repInSet) * 45)).padStart(2, "0")}s`, 36, 245);
  }
}

/* ---------------- shared component ---------------- */
const SCENES: Record<SceneId, (ctx: CanvasRenderingContext2D, T: T, ts: number) => void> = {
  hermes,
  bitcoin,
  microservices,
  arabmatch,
  lottery,
  workout,
};

export function AppScene({ id, label }: { id: SceneId; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const draw = SCENES[id];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      draw(ctx, readTheme(), 2000); // a representative static frame
      return;
    }

    let raf = 0;
    let frame = 0;
    let theme = readTheme();
    const loop = (ts: number) => {
      if (frame % 20 === 0) theme = readTheme();
      draw(ctx, theme, ts);
      frame++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [id]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}
