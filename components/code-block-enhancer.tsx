"use client";

import { useEffect } from "react";

/** Adds a copy button to every code block rendered by the markdown pipeline. */
export function CodeBlockEnhancer() {
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>(".editorial pre");
    const attached = new Map<HTMLElement, boolean>();

    blocks.forEach((pre) => {
      if (attached.get(pre)) return;
      attached.set(pre, true);
      pre.classList.add("code-copyable");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Copy";
      btn.className =
        "absolute top-2.5 right-2.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white opacity-0 focus:opacity-100 [pre:hover>&]:opacity-100 [&:focus-visible]:opacity-100 pointer-events-auto";
      btn.setAttribute("aria-label", "Copy code to clipboard");

      const code = pre.querySelector("code");
      let timer: ReturnType<typeof setTimeout> | undefined;

      btn.addEventListener("click", async () => {
        const text = code?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "Copied!";
        } catch {
          const range = document.createRange();
          if (code) range.selectNodeContents(code);
          btn.textContent = "…";
        }
        clearTimeout(timer);
        timer = setTimeout(() => (btn.textContent = "Copy"), 1600);
      });

      pre.appendChild(btn);
    });

    return () => {
      document.querySelectorAll<HTMLElement>(".editorial pre").forEach((pre) => {
        pre.querySelector("button")?.remove();
      });
    };
  }, []);

  return null;
}
