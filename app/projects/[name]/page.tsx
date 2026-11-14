import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectDiagram, ProjectDiagram } from "@/components/project-diagram";
import { getProjects } from "@/lib/github";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return getProjects().then((projects) => projects.map((p) => ({ name: p.name })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const projects = await getProjects();
  const project = projects.find((p) => p.name === decoded);
  if (!project) return { title: "Project not found" };
  return {
    title: `Project: ${project.name}`,
    description: project.blurb || project.description || undefined,
    alternates: { canonical: `/projects/${project.name}` },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const projects = await getProjects();
  const project = projects.find((p) => p.name === decoded);
  if (!project) notFound();

  const { layers } = getProjectDiagram(project);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[12px] text-faint">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span className="mx-1.5">/</span>
        <span className="text-muted">{project.name}</span>
      </nav>

      {/* Header */}
      <header className="mt-5 border-b border-hairline pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink">
            {project.areaOfFocus}
          </span>
          {project.language && (
            <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-muted">
              {project.language}
            </span>
          )}
          {project.curated && (
            <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-faint">
              curated write-up
            </span>
          )}
        </div>
        <h1 className="mt-4 font-mono text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {project.name}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          {project.blurb || project.description}
        </p>
      </header>

      {/* Diagram */}
      <section className="pt-10">
        <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          How it&apos;s structured
        </h2>
        <ProjectDiagram p={project} />
        <p className="mt-4 text-center text-[12px] text-muted">
          Derived from the public repository setup — layered top-down from test suites to the
          system under test.
        </p>
      </section>

      {/* Info */}
      {project.features.length > 0 && (
        <section className="pt-12">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            What&apos;s inside
          </h2>
          <ul className="space-y-2.5">
            {project.features.map((f) => (
              <li key={f} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Metadata */}
      <section className="pt-12">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {project.language && (
            <div className="rounded-2xl border border-hairline bg-surface p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Language
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">{project.language}</dd>
            </div>
          )}
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              Last pushed
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-ink">
              {project.updatedAt ? formatDate(project.updatedAt.slice(0, 10)) : "—"}
            </dd>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              Stars
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-ink">{project.stars}</dd>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              Layers shown
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-ink">{layers.length}</dd>
          </div>
        </dl>
      </section>

      {/* Source */}
      <section className="pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-accent-soft px-6 py-5">
          <p className="text-sm text-ink-soft">
            The complete source code lives in the public repository.
          </p>
          <a
            href={project.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-85"
          >
            View source on GitHub
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M7 17 17 7m0 0H8m9 0v9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
