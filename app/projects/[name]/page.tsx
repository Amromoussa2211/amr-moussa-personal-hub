import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LanguageChart } from "@/components/language-chart";
import { ProjectDiagram } from "@/components/project-diagram";
import { getProjects, getRepoDetail } from "@/lib/github";
import { formatDate } from "@/lib/format";

export const revalidate = 86400; // detail stats cached per page for a day

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

function kb(sizeKb: number): string {
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</dt>
      <dd className="mt-1.5 font-display text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
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

  const detail = await getRepoDetail(project.name);
  const languageCount = detail.languages ? Object.keys(detail.languages).length : null;

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
        {detail.githubDescription && detail.githubDescription !== project.blurb && (
          <blockquote className="mt-4 max-w-2xl rounded-xl border-l-2 border-accent bg-surface px-4 py-3 text-[13px] leading-relaxed text-muted">
            {detail.githubDescription}
            <span className="mt-1 block text-[11px] text-faint">— repository description, GitHub</span>
          </blockquote>
        )}
      </header>

      {/* By the numbers — live GitHub statistics */}
      <section className="pt-10">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          By the numbers
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Commits"
            value={detail.commits !== null ? detail.commits.toLocaleString("en-US") : "—"}
          />
          <StatCard
            label="Repo size"
            value={detail.sizeKb !== null ? kb(detail.sizeKb) : "—"}
          />
          <StatCard
            label="Stars"
            value={String(project.stars)}
          />
          <StatCard
            label="Forks"
            value={String(project.forks)}
          />
          <StatCard
            label="Created"
            value={detail.createdAt ? formatDate(detail.createdAt.slice(0, 10)) : "—"}
          />
          <StatCard
            label="Open issues"
            value={detail.openIssues !== null ? String(detail.openIssues) : "—"}
          />
          <StatCard
            label="Languages"
            value={languageCount !== null ? String(languageCount) : "—"}
          />
          <StatCard label="License" value={detail.license || "None declared"} />
        </dl>
        <p className="mt-3 text-[12px] text-faint">
          All figures are live GitHub repository metadata, cached daily — nothing estimated.
        </p>
      </section>

      {/* Language breakdown chart */}
      {detail.languages && (
        <section className="pt-12">
          <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            Language breakdown
          </h2>
          <LanguageChart languages={detail.languages} />
        </section>
      )}

      {/* Diagram */}
      <section className="pt-12">
        <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          How it&apos;s structured
        </h2>
        <ProjectDiagram p={project} />
        <p className="mt-4 text-center text-[12px] text-muted">
          Derived from the public repository setup — layered top-down from test suites to the
          system under test.
        </p>
      </section>

      {/* Features */}
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

      {/* Source */}
      <section className="pb-4 pt-12">
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
