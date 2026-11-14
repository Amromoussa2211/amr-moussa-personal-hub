import type { ProjectMeta } from "@/lib/github";

/**
 * Layered stack diagram for a project, derived strictly from curated repo
 * facts (framework, language, target). No invented architecture.
 */

/** Per-project diagram layers (top = tests, bottom = system under test). */
const DIAGRAMS: Record<string, { layers: string[]; caption: string }> = {
  "MagicStamp-Loyalty": {
    layers: [
      "E2E journey suites — loyalty stamp & reward flows",
      "Screen objects / reusable journey steps",
      "Appium driver — Android & iOS",
      "Mobile app under test",
    ],
    caption: "Journey-level mobile E2E architecture",
  },
  playwriteAdvanced: {
    layers: [
      "Scenario specs — advanced patterns",
      "Locator strategy, fixtures & helpers",
      "Playwright browser engine",
      "Web app under test",
    ],
    caption: "Advanced Playwright pattern layers",
  },
  playwrightPOC: {
    layers: [
      "Evaluation scenarios",
      "Baseline Playwright setup",
      "Target web app under test",
    ],
    caption: "Framework evaluation flow",
  },
  PlaywriteAndAppuimTemplet: {
    layers: [
      "Test specs — web & mobile",
      "Page Object Model layer",
      "Playwright (web) · Appium (mobile)",
      "Application under test",
    ],
    caption: "Combined web + mobile template structure",
  },
  appiumRoboot_python: {
    layers: [
      "Robot Framework suites (Python)",
      "Appium server",
      "Mobile device / emulator",
    ],
    caption: "Robot Framework + Appium mobile stack",
  },
  "docker-robot": {
    layers: [
      "Robot Framework suites",
      "Docker container — reproducible environment",
      "Run artifacts / reports",
    ],
    caption: "Containerized test execution flow",
  },
  "AI-studio-test-generator": {
    layers: [
      "Input specs / prompts",
      "AI Studio LLM — test case drafting",
      "Human review of generated tests",
    ],
    caption: "AI-assisted generation with human review",
  },
};

const GENERIC: { layers: string[]; caption: string } = {
  layers: ["Test suites", "Automation driver", "System under test"],
  caption: "Automation flow",
};

export function getProjectDiagram(p: ProjectMeta) {
  return DIAGRAMS[p.name] ?? GENERIC;
}

export function ProjectDiagram({ p }: { p: ProjectMeta }) {
  const { layers, caption } = getProjectDiagram(p);
  return (
    <figure>
      <div className="mx-auto max-w-md">
        {layers.map((layer, i) => (
          <div key={layer}>
            <div
              className={`rounded-xl border px-4 py-3 text-center text-[13px] font-medium ${
                i === 0
                  ? "border-accent/40 bg-accent-soft text-accent-ink"
                  : i === layers.length - 1
                    ? "border-hairline-strong bg-surface text-ink"
                    : "border-hairline bg-surface text-muted"
              }`}
            >
              {layer}
            </div>
            {i < layers.length - 1 && (
              <div className="flex justify-center py-1" aria-hidden>
                <svg width="14" height="16" viewBox="0 0 14 16" className="text-faint">
                  <path
                    d="M7 1v11m0 0-4-4m4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-4 text-center text-[12px] text-faint">{caption}</figcaption>
    </figure>
  );
}
