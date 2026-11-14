import Image from "next/image";
import Link from "next/link";

import { ArticleCard, ProjectCard, TiltItem } from "@/components/cards";
import { SocialButtons } from "@/components/footer";
import { HeroTestRun } from "@/components/hero-test-run";
import { getArticleMetas, getTiltMetas } from "@/lib/content";
import { getProjects } from "@/lib/github";

const EXPERTISE = [
  {
    title: "Quality Engineering",
    body: "Test strategy that scales with the product — risk-based planning, healthy metrics, and quality gates that developers trust.",
  },
  {
    title: "Automation Architecture",
    body: "Frameworks designed for longevity: layered POM, fixtures, parallel execution, and pipelines that keep signal above noise.",
  },
  {
    title: "Playwright",
    body: "Web automation with modern observability — tracing, network interception, and stable locators.",
  },
  {
    title: "Mobile Automation",
    body: "Appium and WebdriverIO across Android and iOS, real-device strategy, and mobile CI that doesn't crawl.",
  },
  {
    title: "API Testing",
    body: "REST and GraphQL validation, contract tests, Kafka and microservices checks — where most bugs actually live.",
  },
  {
    title: "Performance Testing",
    body: "JMeter load profiles, bottleneck hunting, and honest interpretation of tail-latency data.",
  },
  {
    title: "AI in Testing",
    body: "LLM-assisted test generation, agentic QA workflows, and where self-healing automation genuinely earns its keep.",
  },
];

export default async function HomePage() {
  const [articles, til, projects] = await Promise.all([
    Promise.resolve(getArticleMetas()),
    Promise.resolve(getTiltMetas()),
    getProjects(),
  ]);

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const featuredSlug = featured?.slug;
  const latest = articles.filter((a) => a.slug !== featuredSlug).slice(0, 4);
  const featuredProjects = projects.slice(0, 4);

  return (
    <div>
      {/* ---- Hero ---- */}
      <section className="mx-auto max-w-6xl px-5 pt-14 sm:pt-20">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_auto]">
          <div data-reveal>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Senior QA Engineer · Test Automation Lead
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl sm:leading-[1.08]">
              Engineering Quality.
              <br />
              Automating Confidence.
              <br />
              <span className="text-accent-ink italic">Exploring AI.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              I&apos;m Amr — a test automation architect with 13+ years in QA across FinTech, ERP,
              retail, entertainment, and health & fitness. I write original, deeply practical
              articles about Playwright, Python, performance testing, and AI-powered QA — from real
              projects, not textbook versions.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/articles"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
              >
                Read the articles
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-hairline-strong px-5 py-2.5 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                About me
              </Link>
            </div>
            <div className="mt-8">
              <SocialButtons size="lg" />
            </div>
          </div>

          {/* Profile photo */}
          <div className="mx-auto w-80 shrink-0 lg:mt-1">
            <div className="relative h-[232px] overflow-hidden rounded-[2rem] border border-hairline bg-surface shadow-sm">
              <Image
                src="/images/amr-portrait.jpg"
                alt="Amr Moussa"
                width={640}
                height={462}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <div
              data-reveal
              className="mt-4 overflow-hidden rounded-[2rem] border border-hairline bg-surface shadow-sm"
            >
              <HeroTestRun />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Featured article ---- */}
      {featured && (
        <section data-reveal className="mx-auto max-w-6xl px-5 pt-16">
          <div className="rounded-3xl border border-hairline bg-surface p-7 sm:p-10">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Featured article
            </p>
            <ArticleCard a={featured} big />
          </div>
        </section>
      )}

      {/* ---- Expertise ---- */}
      <section data-reveal className="mx-auto max-w-6xl px-5 pt-20">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          What I work with
        </h2>
        <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERTISE.map((e) => (
            <div key={e.title} className="flex gap-3.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <div>
                <h3 className="font-display text-[17px] font-semibold text-ink">{e.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{e.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Latest articles ---- */}
      <section data-reveal className="mx-auto max-w-6xl px-5 pt-20">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            Latest writing
          </h2>
          <Link href="/articles" className="text-sm text-accent-ink hover:underline">
            All articles →
          </Link>
        </div>
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {latest.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      </section>

      {/* ---- Projects ---- */}
      <section data-reveal className="mx-auto max-w-6xl px-5 pt-20">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            Projects
          </h2>
          <Link href="/projects" className="text-sm text-accent-ink hover:underline">
            All projects →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProjects.map((p) => (
            <ProjectCard key={p.name} p={p} />
          ))}
        </div>
      </section>

      {/* ---- TIL ---- */}
      <section data-reveal className="mx-auto max-w-6xl px-5 pt-20">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            Today I Learned
          </h2>
          <Link href="/til" className="text-sm text-accent-ink hover:underline">
            All TILs →
          </Link>
        </div>
        <div>
          {til.slice(0, 5).map((t) => (
            <TiltItem key={t.slug} t={t} />
          ))}
        </div>
      </section>

      {/* ---- Experience ---- */}
      <section data-reveal className="mx-auto max-w-6xl px-5 pt-20">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Professional experience
        </h2>
        <div className="mt-6 rounded-2xl border border-hairline bg-surface p-6 sm:p-8">
          <p className="font-display text-lg font-semibold text-ink">13+ years in Quality Engineering</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Senior QA Engineer and Test Automation Lead. Industry experience spanning FinTech, ERP,
            retail, entertainment, and health &amp; fitness — across web, mobile, API, and
            microservices testing. Individual roles and dates are managed through the editorial
            dashboard and published only after verification.
          </p>
        </div>
      </section>

      {/* ---- Newsletter ---- */}
      <section data-reveal className="mx-auto max-w-6xl px-5 pt-20">
        <div className="rounded-3xl border border-hairline bg-accent-soft p-7 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Follow the work</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                One email when something new earns your time — original engineering articles,
                automation tips, and honest QA thinking. Consent-based, unsubscribe anytime.
              </p>
            </div>
            <Link
              href="/contact"
              className="justify-self-start rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85 sm:justify-self-end"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
