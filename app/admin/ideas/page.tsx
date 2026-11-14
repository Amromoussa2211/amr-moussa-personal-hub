import Link from "next/link";

import { formatDateTime } from "@/lib/format-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

import { createIdeaAction, dismissIdeaAction, promoteIdeaAction } from "./actions";

export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = [
  { slug: "qa-fundamentals", name: "QA Fundamentals" },
  { slug: "advanced-qa", name: "Advanced QA Engineering" },
  { slug: "automation", name: "Playwright & Automation" },
  { slug: "mobile", name: "Mobile Automation" },
  { slug: "api", name: "API & Backend Testing" },
  { slug: "performance", name: "Performance Engineering" },
  { slug: "ai-testing", name: "AI & Agentic QA" },
  { slug: "software-engineering", name: "Software Engineering" },
  { slug: "tutorials", name: "Tutorials" },
];

const STATUS_TONE: Record<string, string> = {
  NEW: "border-hairline text-muted",
  ACCEPTED: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  CONVERTED: "border-accent/30 text-accent-ink",
  DISMISSED: "border-rose-500/30 text-rose-700 dark:text-rose-300",
};

async function getIdeas() {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from("content_ideas")
    .select(
      "id, title, description, status, article_id, created_at, categories:category_id ( slug, name )"
    )
    .neq("status", "DISMISSED")
    .order("created_at", { ascending: false });

  type IdeaRow = {
    id: string;
    title: string;
    description: string;
    status: string;
    article_id: string | null;
    created_at: string;
    categories: { slug: string; name: string } | { slug: string; name: string }[] | null;
  };

  return ((data ?? []) as unknown as IdeaRow[]).map((row) => ({
    ...row,
    category: Array.isArray(row.categories) ? row.categories[0] ?? null : row.categories,
  }));
}

export default async function AdminIdeasPage() {
  const ideas = await getIdeas();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">Content Ideas</h1>
        <p className="mt-1 text-sm text-muted">
          Capture topics worth writing about. When one is ready, start the article from it — it
          enters the normal draft → approval → publish workflow.
        </p>
      </header>

      {/* New idea */}
      <form
        action={createIdeaAction}
        className="space-y-4 rounded-2xl border border-hairline bg-surface p-6"
      >
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          New idea
        </h2>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label htmlFor="title" className="mb-1 block text-[13px] font-medium text-ink">
              Title / working headline
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. Why your Playwright suite flakes in CI but passes locally"
              className="w-full rounded-xl border border-hairline bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="categorySlug" className="mb-1 block text-[13px] font-medium text-ink">
              Category
            </label>
            <select
              id="categorySlug"
              name="categorySlug"
              className="w-full rounded-xl border border-hairline bg-paper px-3 py-2.5 text-sm text-ink"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-[13px] font-medium text-ink">
            Premise / angle
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What problem does it solve? What's the hook?"
            className="w-full rounded-xl border border-hairline bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
        >
          Add idea
        </button>
      </form>

      {/* Idea list */}
      {ideas.length === 0 ? (
        <p className="rounded-2xl border border-hairline bg-surface p-6 text-sm text-muted">
          No open ideas. Add the first one above.
        </p>
      ) : (
        <ul className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {ideas.map((idea) => (
            <li key={idea.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{idea.title}</p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[idea.status] ?? ""}`}
                    >
                      {idea.status}
                    </span>
                    {idea.category && (
                      <span className="text-[11px] text-faint">{idea.category.name}</span>
                    )}
                  </div>
                  {idea.description && (
                    <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
                      {idea.description}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-faint">
                    added {formatDateTime(idea.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {idea.status === "CONVERTED" && idea.article_id ? (
                    <Link
                      href={`/admin/articles/${idea.article_id}`}
                      className="rounded-lg border border-hairline px-3.5 py-2 text-[12px] font-medium text-muted transition-colors hover:border-hairline-strong hover:text-ink"
                    >
                      Open article →
                    </Link>
                  ) : (
                    <>
                      <form action={promoteIdeaAction}>
                        <input type="hidden" name="ideaId" value={idea.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-ink px-3.5 py-2 text-[12px] font-medium text-paper transition-opacity hover:opacity-85"
                        >
                          Start article
                        </button>
                      </form>
                      <form action={dismissIdeaAction}>
                        <input type="hidden" name="ideaId" value={idea.id} />
                        <button
                          type="submit"
                          className="rounded-lg px-2.5 py-2 text-[12px] text-faint transition-colors hover:text-rose-700 dark:hover:text-rose-300"
                        >
                          Dismiss
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
