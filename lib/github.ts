export type Repo = {
  name: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  topics: string[];
  updatedAt: string;
  forks: number;
  stars: number;
  isFork: boolean;
};

/** Curated summaries. Facts only come from GitHub metadata; editorial
 *  descriptions stay strictly within what the repo name/description imply. */
const CURATED: Record<
  string,
  { areaOfFocus: string; blurb: string; features?: string[] }
> = {
  "MagicStamp-Loyalty": {
    areaOfFocus: "Mobile E2E · Appium",
    blurb:
      "End-to-end mobile automation suite that simulates every loyalty stamp pattern and reward flow — built to exercise real business journeys, not individual screens.",
    features: [
      "Journey-driven E2E flows for loyalty stamp patterns and rewards",
      "Mobile automation harness for repeating multi-step user journeys",
    ],
  },
  "playwriteAdvanced": {
    areaOfFocus: "Playwright · Advanced patterns",
    blurb:
      "Advanced Playwright practice ground: locator strategy, fixtures, and patterns explored beyond the happy-path documentation examples.",
    features: ["Playwright advanced scripting exercises", "Locator and fixture experiments"],
  },
  "playwrightPOC": {
    areaOfFocus: "Playwright · Proof of concept",
    blurb:
      "Playwright proof-of-concept used to evaluate the framework against real project constraints before committing to it.",
    features: ["Framework evaluation harness", "Baseline Playwright setup"],
  },
  "PlaywriteAndAppuimTemplet": {
    areaOfFocus: "Playwright · Appium · POM",
    blurb:
      "Template framework combining Playwright and Appium on a Page Object Model foundation — a reusable starting point for web + mobile automation.",
    features: ["Page Object Model structure", "Web (Playwright) + mobile (Appium) foundations", "TypeScript"],
  },
  "appiumRoboot_python": {
    areaOfFocus: "Appium · Robot Framework · Python",
    blurb:
      "Python-based Appium automation built on Robot Framework — mobile testing without hand-rolling a harness from scratch.",
    features: ["Appium mobile automation", "Robot Framework runners in Python"],
  },
  "docker-robot": {
    areaOfFocus: "Robot Framework · Docker",
    blurb:
      "Containerized Robot Framework execution so suites run reproducibly anywhere — no 'works on my machine' drift.",
    features: ["Robot Framework suites", "Dockerized test runs"],
  },
  "AI-studio-test-generator": {
    areaOfFocus: "AI · Test generation",
    blurb:
      "Experiment in AI-assisted test generation with AI Studio — using LLMs to draft test cases and automation scaffolding for human review.",
    features: ["LLM-driven test case drafting", "Python tooling"],
  },
  client: {
    areaOfFocus: "Web test automation",
    blurb: "Client-side test automation project (JavaScript).",
  },
  cypress: {
    areaOfFocus: "Cypress",
    blurb: "Cypress automation work and configuration experiments.",
  },
  "cypressdefultconfig": {
    areaOfFocus: "Cypress",
    blurb: "Cypress baseline configuration reference setup.",
  },
  harness: {
    areaOfFocus: "AI agents · Harnessing",
    blurb: "Python harness work for driving automated agent/tool runs.",
  },
  "willma-trainer": {
    areaOfFocus: "Web automation · JavaScript",
    blurb: "Automation suite for the Willma trainer web application (JavaScript).",
  },
  "WilmaPlaywrite": {
    areaOfFocus: "Playwright",
    blurb: "Playwright project for the Willma trainer application.",
  },
  "-FlairsTechTask": {
    areaOfFocus: "Task · JavaScript",
    blurb: "FlairsTech technical task submission (JavaScript).",
  },
  Task: {
    areaOfFocus: "Task · HTML",
    blurb: "Technical task implementation (HTML).",
  },
};

const GH_USER = "Amromoussa2211";

export async function getRepositories(): Promise<Repo[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "amr-moussa-personal-hub",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<Record<string, unknown>>;
    return data
      .filter((r) => r.fork !== true && r.archived !== true)
      .map((r) => ({
        name: String(r.name),
        htmlUrl: String(r.html_url),
        description: typeof r.description === "string" ? r.description : null,
        language: typeof r.language === "string" ? r.language : null,
        topics: Array.isArray(r.topics) ? (r.topics as string[]) : [],
        updatedAt: String(r.pushed_at ?? r.updated_at ?? ""),
        forks: Number(r.forks_count ?? 0),
        stars: Number(r.stargazers_count ?? 0),
        isFork: r.fork === true,
      }));
  } catch {
    return [];
  }
}

export type ProjectMeta = Repo & {
  blurb: string;
  areaOfFocus: string;
  features: string[];
  curated: boolean;
};

/** Public repos, enriched with curated editorial copy. Falls back to raw
 *  GitHub descriptions if network/API is unavailable. */
export async function getProjects(): Promise<ProjectMeta[]> {
  const repos = await getRepositories();
  if (repos.length === 0) {
    return Object.entries(CURATED).map(([name, c]) => ({
      name,
      htmlUrl: `https://github.com/${GH_USER}/${name}`,
      description: null,
      language: null,
      topics: [],
      updatedAt: "",
      forks: 0,
      stars: 0,
      isFork: false,
      blurb: c.blurb,
      areaOfFocus: c.areaOfFocus,
      features: c.features ?? [],
      curated: true,
    }));
  }
  return repos.map((r) => ({
    ...r,
    blurb: CURATED[r.name]?.blurb ?? r.description ?? "",
    areaOfFocus: CURATED[r.name]?.areaOfFocus ?? (r.language ? `${r.language}` : "Testing"),
    features: CURATED[r.name]?.features ?? [],
    curated: Boolean(CURATED[r.name]),
  }));
}
