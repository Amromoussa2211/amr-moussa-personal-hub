import type { Metadata } from "next";

import { ProjectCard } from "@/components/cards";
import { getProjects } from "@/lib/github";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Real public repositories — automation frameworks, mobile E2E harnesses, and AI-assisted testing experiments, with verified GitHub metadata only.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  const grouped = new Map<string, typeof projects>();
  for (const p of projects) {
    const key = p.areaOfFocus.split("·")[0].trim();
    const list = grouped.get(key) ?? [];
    list.push(p);
    grouped.set(key, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-14">
      <header className="mb-12 max-w-2xl border-b border-hairline pb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Projects</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Public repositories and technical experiments — automation frameworks, mobile E2E
          harnesses, and AI-assisted testing tools. Descriptions reflect only public repository
          metadata; no invented statistics or capabilities.
        </p>
      </header>

      <div className="space-y-14">
        {[...grouped.entries()].map(([area, list]) => (
          <section key={area}>
            <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
              {area}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <ProjectCard key={p.name} p={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
