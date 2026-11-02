export type Category = {
  slug: string;
  name: string;
  short: string;
  description: string;
  inNav: boolean;
};

export const CATEGORIES: Category[] = [
  {
    slug: "qa-fundamentals",
    name: "QA Fundamentals",
    short: "Fundamentals",
    description:
      "Test design techniques, exploratory and regression testing, test planning, risk-based decisions, and the quality metrics that actually matter.",
    inNav: false,
  },
  {
    slug: "advanced-qa",
    name: "Advanced QA Engineering",
    short: "Advanced QA",
    description:
      "Test architecture, scalable automation strategy, flaky test detection, parallel execution, test observability, and CI/CD quality gates.",
    inNav: true,
  },
  {
    slug: "automation",
    name: "Playwright & Automation",
    short: "Automation",
    description:
      "Playwright deep dives, locator strategy, fixtures, network interception, self-healing approaches, and framework design patterns.",
    inNav: true,
  },
  {
    slug: "mobile",
    name: "Mobile Automation",
    short: "Mobile",
    description:
      "Appium, WebdriverIO, Android and iOS automation, real-device strategy, device farms, and mobile CI/CD.",
    inNav: false,
  },
  {
    slug: "api",
    name: "API & Backend Testing",
    short: "API Testing",
    description:
      "REST and GraphQL testing, contract testing, microservices and Kafka validation, database checks, and API security.",
    inNav: false,
  },
  {
    slug: "performance",
    name: "Performance Engineering",
    short: "Performance",
    description:
      "JMeter load profiles, stress and spike Testing, finding bottlenecks, and interpreting performance data honestly.",
    inNav: false,
  },
  {
    slug: "ai-testing",
    name: "AI & Agentic QA",
    short: "AI & Testing",
    description:
      "LLM testing, AI evaluation, agentic QA workflows, AI-assisted test generation, and where self-healing automation genuinely helps.",
    inNav: true,
  },
  {
    slug: "software-engineering",
    name: "Software Engineering",
    short: "Engineering",
    description:
      "Architecture, Git, CI/CD, debugging, developer productivity, and software design as seen from the quality side.",
    inNav: false,
  },
  {
    slug: "tutorials",
    name: "Tutorials",
    short: "Tutorials",
    description:
      "Step-by-step, hands-on guides: setup to first green run, then beyond it.",
    inNav: true,
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
