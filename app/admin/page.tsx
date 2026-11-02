import Link from "next/link";

import { formatDateTime } from "@/lib/format-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

async function getCounts() {
  const supabase = getSupabaseAdmin();
  try {
    const [{ count: total }, { count: drafts }, { count: pending }, { count: published }, { count: failed }, { data: recent }] =
      await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).in("status", ["IDEA", "RESEARCHING", "DRAFTING", "TECHNICAL_REVIEW", "NEEDS_REVISION"]),
        supabase.from("articles").select("id", { count: "exact", head: true }).in("status", ["READY_FOR_REVIEW", "APPROVED"]),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("publishing_jobs").select("id", { count: "exact", head: true }).eq("status", "FAILED"),
        supabase.from("articles").select("id, slug, title, status, updated_at").order("updated_at", { ascending: false }).limit(5),
      ]);
    return { total: total ?? 0, drafts: drafts ?? 0, pending: pending ?? 0, published: published ?? 0, failed: failed ?? 0, recent: recent ?? [] };
  } catch {
    return null;
  }
}

function StatCard({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${tone || "text-ink"}`}>{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const counts = await getCounts();

  if (counts === null) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h1 className="font-display text-xl font-semibold text-ink">Database not initialized</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          The schema (<code className="font-mono text-[12px]">supabase/migrations/0001_init_schema.sql</code>)
          hasn&apos;t been applied to this Supabase project yet. Apply it via the SQL Editor or the
          database connection string, then reload this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">Content pipeline at a glance.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total articles" value={counts.total} />
        <StatCard label="In production" value={counts.drafts} />
        <StatCard label="Awaiting approval" value={counts.pending} />
        <StatCard label="Published" value={counts.published} tone="text-accent-ink" />
      </div>

      {counts.failed > 0 && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-700 dark:text-rose-300">
          {counts.failed} failed publishing operation{counts.failed > 1 ? "s" : ""} — check Publishing History.
        </p>
      )}

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Recently touched articles
        </h2>
        {counts.recent.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-surface p-6 text-sm text-muted">
            No articles yet. Create your first idea from Articles &amp; Workflow.
          </p>
        ) : (
          <ul className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
            {counts.recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <Link href={`/admin/articles/${a.id}`} className="min-w-0 group">
                  <p className="truncate font-medium text-ink transition-colors group-hover:text-accent-ink">
                    {a.title}
                  </p>
                  <p className="text-[12px] text-faint">/{a.slug} · updated {formatDateTime(a.updated_at)}</p>
                </Link>
                <span className="shrink-0 rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-muted">
                  {a.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
