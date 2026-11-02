import Link from "next/link";

import { formatDateTime } from "@/lib/format-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const supabase = getSupabaseAdmin();
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, slug, title, subtitle, description, status, difficulty, featured, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h1 className="font-display text-xl font-semibold text-ink">Database not initialized</h1>
        <p className="mt-2 text-sm text-ink-soft">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Articles &amp; Workflow</h1>
          <p className="mt-1 text-sm text-muted">
            The pipeline: IDEA → RESEARCHING → DRAFTING → TECHNICAL_REVIEW → READY_FOR_REVIEW →
            APPROVED → PUBLISHED. Per-destination approvals are bound to exact versions.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-85"
        >
          New article
        </Link>
      </header>

      {/* New article form is one level deep; keep this list focused */}
      {articles.length === 0 ? (
        <p className="rounded-2xl border border-hairline bg-surface p-6 text-sm text-muted">
          No articles in the pipeline yet.
        </p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
          {articles.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/articles/${a.id}`} className="group flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink transition-colors group-hover:text-accent-ink">
                    {a.title}
                  </p>
                  <p className="truncate text-[12px] text-faint">
                    /{a.slug} · {a.description || "no description"} · updated{" "}
                    {formatDateTime(a.updated_at)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-muted">
                  {a.status.replaceAll("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
