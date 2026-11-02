import type { Metadata } from "next";

import { SocialButtons } from "@/components/footer";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Amr Moussa — QA engineering, test automation strategy, and AI-powered testing.",
};

const CHANNELS = [
  {
    label: "Email",
    href: "mailto:amro_kaza@hotmail.com",
    detail: "For consulting, test strategy reviews, or speaking.",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/amr-moussa-88a9676b/",
    detail: "Professional conversations and QA community.",
  },
  {
    label: "X / Twitter",
    href: "https://x.com/amro_kaza",
    detail: "Short-form technical takes and article announcements.",
  },
  {
    label: "GitHub",
    href: "https://github.com/Amromoussa2211",
    detail: "Code, automation frameworks, and open-source work.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Contact</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        The fastest way to reach me is any of the channels below. I read everything and reply to
        serious messages — particularly around test automation strategy, framework design, and
        AI-in-QA work.
      </p>

      <div className="mt-10 divide-y divide-hairline border-y border-hairline">
        {CHANNELS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-baseline justify-between gap-4 py-5"
          >
            <div>
              <p className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-accent-ink">
                {c.label}
              </p>
              <p className="mt-0.5 text-sm text-muted">{c.detail}</p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent"
            >
              <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ))}
      </div>

      <div className="mt-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          Or find me here
        </p>
        <SocialButtons size="lg" />
      </div>
    </div>
  );
}
