import Link from "next/link";
import { notFound } from "next/navigation";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getApprovals, isPublishAuthorized } from "@/lib/workflow";
import { formatDateTime } from "@/lib/format-admin";

import {
  approveAction,
  publishAction,
  revokeAction,
  saveVersionAction,
} from "../actions";
import { ConfirmSubmit, VersionTabs } from "./ui";

export const dynamic = "force-dynamic";

const DESTINATIONS = [
  { key: "website", label: "Website" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X (Twitter)" },
] as const;

const EDITABLE_STATUSES = [
  "IDEA",
  "RESEARCHING",
  "DRAFTING",
  "TECHNICAL_REVIEW",
  "NEEDS_REVISION",
  "READY_FOR_REVIEW",
] as const;

export default async function AdminArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: article } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!article) notFound();

  const { data: versions } = await supabase
    .from("article_versions")
    .select("*")
    .eq("article_id", id)
    .order("version_no", { ascending: false });

  const approvals = await getApprovals(id);
  const latest = versions?.[0] ?? null; // highest version_no (MostRecent), editor edits this
  const oldest = versions?.at(-1) ?? null; // original body shown pre-filled in the editor

  const isApproved = (destination: string) =>
    Boolean(
      latest &&
        approvals.some(
          (a) => a.version_id === latest.id && a.destination === destination && !a.invalidated_at
        )
    );
  const isInvalidated = (destination: string) =>
    Boolean(
      latest &&
        approvals.some(
          (a) => a.version_id === latest.id && a.destination === destination && a.invalidated_at
        )
    );

  const [authWebsite, authLinkedIn, authX] = latest
    ? await Promise.all([
        isPublishAuthorized(id, latest.id, "website"),
        isPublishAuthorized(id, latest.id, "linkedin"),
        isPublishAuthorized(id, latest.id, "x"),
      ])
    : [
        { ok: false, reason: "no version yet" },
        { ok: false, reason: "no version yet" },
        { ok: false, reason: "no version yet" },
      ];
  const auth = { website: authWebsite, linkedin: authLinkedIn, x: authX };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <nav className="text-[12px] text-faint">
          <Link href="/admin/articles" className="hover:text-ink">Articles</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted">/{article.slug}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">{article.title}</h1>
          <span className="rounded-full border border-hairline px-3 py-1 text-[12px] font-medium text-muted">
            {article.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="font-mono text-[12px] text-faint">
          /{article.slug} · updated {formatDateTime(article.updated_at)}
        </p>
      </header>

      {/* Editor */}
      <section className="rounded-2xl border border-hairline bg-surface p-6">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Edit → new version
        </h2>
        <form action={saveVersionAction} className="space-y-3">
          <input type="hidden" name="articleId" value={id} />
          <textarea
            name="body"
            defaultValue={latest?.body ?? ""}
            rows={16}
            className="w-full rounded-xl border border-hairline bg-paper px-4 py-3 font-mono text-[13px] leading-relaxed text-ink focus:border-accent focus:outline-none"
            placeholder="Markdown body…"
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              name="note"
              placeholder="Version note (optional)"
              className="min-w-64 flex-1 rounded-xl border border-hairline bg-paper px-3.5 py-2 text-[13px] text-ink focus:border-accent focus:outline-none"
            />
            <select
              name="nextStatus"
              defaultValue={article.status}
              className="rounded-xl border border-hairline bg-paper px-3 py-2 text-[13px] text-ink"
            >
              {EDITABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-ink px-5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85"
            >
              Save as v{(latest?.version_no ?? 0) + 1}
            </button>
          </div>
          <p className="text-[12px] text-faint">
            Saving creates an immutable new version — which is exactly what invalidates any active
            approvals for this article (content changed after approval).
          </p>
        </form>
      </section>

      {/* Destination approvals + publishing */}
      <section className="rounded-2xl border border-hairline bg-surface p-6">
        <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Approvals &amp; publishing — per destination
        </h2>
        <p className="mb-5 text-[12px] text-muted">
          Approving one destination does NOT authorize another. Approvals bind to
          <span className="font-mono"> v{latest?.version_no ?? "-"}</span> exactly.
        </p>

        {latest ? (
          <div className="space-y-3">
            {DESTINATIONS.map((d) => {
              const active = isApproved(d.key);
              const invalidated = isInvalidated(d.key);
              const authorized = auth[d.key].ok;

              return (
                <div
                  key={d.key}
                  className="rounded-xl border border-hairline px-4 py-3.5"
                >
                  {/* approval row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{d.label}</p>
                      <p className="text-[12px] text-faint">
                        {active
                          ? `approved for v${latest.version_no} — valid`
                          : invalidated
                            ? "approval invalidated (content changed after approval)"
                            : "not approved"}
                      </p>
                    </div>

                    {active ? (
                      <form action={revokeAction}>
                        <input type="hidden" name="articleId" value={id} />
                        <input type="hidden" name="versionId" value={latest.id} />
                        <input type="hidden" name="destination" value={d.key} />
                        <ConfirmSubmit
                          message={`Revoke the ${d.label} approval on v${latest.version_no}?`}
                        >
                          Revoke
                        </ConfirmSubmit>
                      </form>
                    ) : (
                      <form action={approveAction}>
                        <input type="hidden" name="articleId" value={id} />
                        <input type="hidden" name="versionId" value={latest.id} />
                        <input type="hidden" name="destination" value={d.key} />
                        <ConfirmSubmit
                          message={`Approve ${d.label} publishing for version v${latest.version_no}? This authorizes ONLY ${d.label}.`}
                        >
                          Approve
                        </ConfirmSubmit>
                      </form>
                    )}
                  </div>

                  {/* publish row */}
                  <form action={publishAction} className="mt-2.5">
                    <input type="hidden" name="articleId" value={id} />
                    <input type="hidden" name="versionId" value={latest.id} />
                    <input type="hidden" name="destination" value={d.key} />
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2.5">
                      <p className="text-[12px] text-muted">
                        {authorized
                          ? d.key === "website"
                            ? "Ready: writes the approved version into the site content pipeline."
                            : "Ready: records approved manual publishing — official APIs wire in at Phase 4."
                          : "Locked: publishing requires an active approval for this destination."}
                      </p>
                      <button
                        type="submit"
                        disabled={!authorized}
                        className="rounded-lg bg-ink px-4 py-2 text-[12px] font-medium text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Publish to {d.label}…
                      </button>
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">Create a first version to unlock approvals.</p>
        )}
      </section>

      <VersionTabs
        versions={(versions ?? []).slice().reverse()} // oldest first for display
        currentId={latest?.id ?? null}
        slug={article.slug}
      />
    </div>
  );
}
