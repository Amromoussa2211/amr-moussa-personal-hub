"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Staggered scroll-reveal for elements marked [data-reveal].
 * - Content stays visible without JS: the `js` class (added here, on the
 *   client) is what enables the hidden state in CSS.
 * - Re-scans on client-side route changes.
 * - Falls back to always-visible under prefers-reduced-motion (CSS).
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const observeAll = () => {
      document.querySelectorAll("[data-reveal]:not(.revealed)").forEach((el) => {
        observer.observe(el);
      });
    };
    observeAll();

    // Sections that mount late (e.g. below-the-fold content rendered after
    // hydration) are picked up by a short window of mutation watching.
    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [pathname]);

  return null;
}
