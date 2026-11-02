"use client";

import { useState } from "react";

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? new URL(path, window.location.origin).href : path;

  const enc = encodeURIComponent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Share</span>
      <a
        href={`https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
        </svg>
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45Z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-hairline px-3 text-[12px] text-muted transition-colors hover:border-accent hover:text-accent"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
