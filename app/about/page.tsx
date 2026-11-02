import type { Metadata } from "next";

import { SocialButtons } from "@/components/footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Amr Moussa — Senior QA Engineer and Test Automation Lead with 13+ years across FinTech, ERP, retail, entertainment, and health & fitness.",
};

const STACK = [
  { group: "Web & E2E automation", items: ["Playwright", "Selenium", "Cypress", "WebdriverIO"] },
  { group: "Mobile automation", items: ["Appium", "WebdriverIO", "Robot Framework", "Real-device farms"] },
  { group: "API & backend testing", items: ["REST APIs", "GraphQL", "Kafka & microservices", "SQL & database validation"] },
  { group: "Performance", items: ["JMeter", "Load & stress testing", "Bottleneck analysis"] },
  { group: "Platform & CI/CD", items: ["GitHub", "GitLab", "Docker", "CI/CD quality gates"] },
  { group: "AI in QA", items: ["AI-assisted test generation", "Agentic QA workflows", "Self-healing strategies"] },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        About
      </h1>

      <div className="mt-8 space-y-5 border-b border-hairline pb-10 text-[15px] leading-relaxed text-ink-soft">
        <p>
          I&apos;m Amr Moussa — Senior QA Engineer and Test Automation Lead with{" "}
          <strong className="text-ink">13+ years of QA experience</strong> across FinTech, ERP,
          retail, entertainment, and health &amp; fitness products.
        </p>
        <p>
          I&apos;ve spent most of that career where automated testing meets architecture: designing
          frameworks that stay maintainable through product changes, building test strategies that
          survive scale, and pushing quality leftward without making developers hate the process.
          Web, mobile, API, and microservices testing — the full stack, from the locators to the
          load profiles.
        </p>
        <p>
          Lately my main interest is the intersection of QA and AI: LLM-assisted test generation,
          agentic QA workflows, and — more importantly — where that story is oversold. I write the
          kind of articles I wanted to read when facing those decisions: honest about limits,
          specific about technique, and grounded in projects that shipped.
        </p>
        <p className="font-display text-lg text-ink">
          Engineering Quality. Automating Confidence. Exploring AI.
        </p>
        <SocialButtons size="lg" />
      </div>

      <h2 className="mb-6 pt-10 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
        Toolbox
      </h2>
      <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {STACK.map((s) => (
          <div key={s.group} className="flex gap-3.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <div>
              <h3 className="text-sm font-semibold text-ink">{s.group}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {s.items.join(" · ")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-hairline bg-surface p-6">
        <p className="text-sm leading-relaxed text-muted">
          <strong className="text-ink">A note on sourcing:</strong> everything published here is
          written from direct engineering practice. Employment roles, publications, and
          certifications are only those I can verify — this profile is managed centrally, so it
          stays accurate as my work evolves.
        </p>
      </div>
    </div>
  );
}
