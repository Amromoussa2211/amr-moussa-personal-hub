import "server-only";

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export type Destination = "website" | "linkedin" | "x";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  difficulty: string;
  status: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  category_id: string | null;
  current_version_id: string | null;
};

export type ArticleVersionRow = {
  id: string;
  version_no: number;
  body: string;
  created_by: string;
  created_at: string;
  note: string | null;
};

const supabase = () => getSupabaseAdmin();

/* ------------------------------------------------------------------ */
/* Audit                                                              */
/* ------------------------------------------------------------------ */

export async function audit(
  actor: string,
  action: string,
  entity: string,
  entityId?: string,
  before?: unknown,
  after?: unknown
) {
  const { error } = await supabase()
    .from("audit_logs")
    .insert({
      actor,
      action,
      entity,
      entity_id: entityId ?? null,
      before: before ? JSON.parse(JSON.stringify(before)) : null,
      after: after ? JSON.parse(JSON.stringify(after)) : null,
    });
  if (error) console.error("audit insert failed", error.message);
}

/* ------------------------------------------------------------------ */
/* Publishing authorization — THE critical gate                        */
/* ------------------------------------------------------------------ */

/**
 * Publishing is allowed ONLY when an active, non-invalidated approval row
 * exists for (article, current version, destination). The backend enforces
 * this; agents and client code cannot bypass it because they never touch
 * this module's authorization check.
 */
export async function isPublishAuthorized(
  articleId: string,
  versionId: string,
  destination: Destination
): Promise<{ ok: boolean; reason: string }> {
  const { data: approval, error } = await supabase()
    .from("article_approvals")
    .select("id, invalidated_at")
    .eq("article_id", articleId)
    .eq("version_id", versionId)
    .eq("destination", destination)
    .maybeSingle();

  if (error) return { ok: false, reason: `approval lookup failed: ${error.message}` };
  if (!approval) {
    return {
      ok: false,
      reason: `no approval for destination "${destination}" on this version`,
    };
  }
  if (approval.invalidated_at) {
    return {
      ok: false,
      reason: "approval was invalidated (content changed after approval)",
    };
  }
  return { ok: true, reason: "authorized" };
}

export function publishKey(articleId: string, versionId: string, destination: Destination) {
  return createHash("sha256").update(`${articleId}:${versionId}:${destination}`).digest("hex");
}

/* ------------------------------------------------------------------ */
/* Versions                                                           */
/* ------------------------------------------------------------------ */

export async function createArticle(input: {
  slug: string;
  title: string;
  description?: string;
  categorySlug?: string;
  actor: string;
}): Promise<ArticleRow> {
  const supa = supabase();
  let categoryId: string | null = null;
  if (input.categorySlug) {
    const { data: cat } = await supa
      .from("categories")
      .select("id")
      .eq("slug", input.categorySlug)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  const { data: article, error } = await supa
    .from("articles")
    .insert({
      slug: input.slug,
      title: input.title,
      description: input.description ?? "",
      category_id: categoryId,
      status: "IDEA",
    })
    .select()
    .single();
  if (error) throw new Error(`createArticle failed: ${error.message}`);

  await audit(input.actor, "create", "articles", article.id, null, article);
  return article as ArticleRow;
}

export async function saveNewVersion(input: {
  articleId: string;
  body: string;
  actor: string;
  note?: string;
  setStatus?: string;
}): Promise<ArticleVersionRow> {
  const supa = supabase();

  const { data: maxRow } = await supa
    .from("article_versions")
    .select("version_no")
    .eq("article_id", input.articleId)
    .order("version_no", { ascending: false })
    .limit(1);

  const nextNo = (maxRow?.[0]?.version_no ?? 0) + 1;

  const { data: version, error } = await supa
    .from("article_versions")
    .insert({
      article_id: input.articleId,
      version_no: nextNo,
      body: input.body,
      created_by: input.actor,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`saveNewVersion failed: ${error.message}`);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.setStatus) update.status = input.setStatus;
  await supa.from("articles").update(update).eq("id", input.articleId);

  await audit(input.actor, "new_version", "article_versions", version.id, null, {
    article_id: input.articleId,
    version_no: nextNo,
  });

  return version as ArticleVersionRow;
}

/* ------------------------------------------------------------------ */
/* Approvals                                                          */
/* ------------------------------------------------------------------ */

export async function approveDestination(input: {
  articleId: string;
  versionId: string;
  destination: Destination;
  actor: string;
  note?: string;
}) {
  const { error } = await supabase()
    .from("article_approvals")
    .upsert(
      {
        article_id: input.articleId,
        version_id: input.versionId,
        destination: input.destination,
        approved: true,
        invalidated_at: null,
        note: input.note ?? null,
        approved_by: null, // auth user id wired in when session auth lands
      },
      { onConflict: "version_id,destination" }
    );
  if (error) throw new Error(`approve failed: ${error.message}`);

  await audit(input.actor, "approve", "article_approvals", input.articleId, null, {
    destination: input.destination,
    version_id: input.versionId,
  });
}

export async function revokeApproval(input: {
  articleId: string;
  versionId: string;
  destination: Destination;
  actor: string;
}) {
  const supa = supabase();
  const now = new Date().toISOString();
  const { error } = await supa
    .from("article_approvals")
    .update({ invalidated_at: now })
    .eq("article_id", input.articleId)
    .eq("version_id", input.versionId)
    .eq("destination", input.destination)
    .is("invalidated_at", null);
  if (error) throw new Error(`revoke failed: ${error.message}`);

  await audit(input.actor, "revoke_approval", "article_approvals", input.articleId, null, {
    destination: input.destination,
    version_id: input.versionId,
  });
}

export async function getApprovals(articleId: string) {
  const { data, error } = await supabase()
    .from("article_approvals")
    .select("*")
    .eq("article_id", articleId);
  if (error) throw new Error(error.message);
  return data as Array<{
    version_id: string;
    destination: Destination;
    invalidated_at: string | null;
    approved_at: string;
  }>;
}

/* ------------------------------------------------------------------ */
/* Publishing                                                         */
/* ------------------------------------------------------------------ */

/**
 * website destination: writes the approved version into content/articles/
 * (git-committed separately). Social destinations insert a published_posts
 * row; real API callers come in Phase 4.
 */
export async function executePublish(input: {
  articleId: string;
  versionId: string;
  destination: Destination;
  actor: string;
  articleRow: ArticleRow;
  body: string;
}): Promise<{ ok: boolean; reason: string; url?: string }> {
  const authorization = await isPublishAuthorized(
    input.articleId,
    input.versionId,
    input.destination
  );
  if (!authorization.ok) return { ok: false, reason: authorization.reason };

  const key = publishKey(input.articleId, input.versionId, input.destination);

  // Idempotency: if this exact (article, version, destination) already published, stop.
  const { data: existing } = await supabase()
    .from("published_posts")
    .select("id, platform_url")
    .eq("version_id", input.versionId)
    .eq("destination", input.destination)
    .maybeSingle();
  if (existing) {
    return { ok: true, reason: "already published (idempotent)", url: existing.platform_url ?? undefined };
  }

  try {
    if (input.destination === "website") {
      await writePublishedArticle(input.articleRow, input.body);
      const url = `/articles/${input.articleRow.slug}`;
      const { error: insErr } = await supabase()
        .from("published_posts")
        .insert({
          article_id: input.articleId,
          version_id: input.versionId,
          destination: "website",
          platform: "website",
          platform_url: url,
          manual: false,
        });
      if (insErr) throw new Error(insErr.message);

      await supabase()
        .from("articles")
        .update({ status: "PUBLISHED", published_at: new Date().toISOString() })
        .eq("id", input.articleId);

      await audit(input.actor, "publish", "published_posts", input.articleId, null, {
        destination: "website",
        version_id: input.versionId,
      });
      return { ok: true, reason: "published to website content pipeline", url };
    }

    // Social destinations here = manual copy-ready publishing for now (Phase 4 wires real APIs)
    const { error: insErr } = await supabase()
      .from("published_posts")
      .insert({
        article_id: input.articleId,
        version_id: input.versionId,
        destination: input.destination,
        platform: input.destination,
        manual: true,
      });
    if (insErr) throw new Error(insErr.message);

    await audit(input.actor, "publish_manual", "published_posts", input.articleId, null, {
      destination: input.destination,
      version_id: input.versionId,
    });
    return {
      ok: true,
      reason: `recorded as manual publish for ${input.destination} (copy-ready workflow)`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase().from("publishing_logs").insert({
      article_id: input.articleId,
      destination: input.destination,
      level: "error",
      message: `publish failed: ${message}`,
    });
    return { ok: false, reason: message };
  }
}

/** Write an approved article into the site content pipeline as markdown. */
async function writePublishedArticle(article: ArticleRow, body: string) {
  const dir = path.join(process.cwd(), "content", "articles");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${article.slug}.md`);

  const meta = [
    "---",
    `title: ${JSON.stringify(article.title)}`,
    article.subtitle ? `subtitle: ${JSON.stringify(article.subtitle)}` : null,
    `description: ${JSON.stringify(article.description || article.title)}`,
    `date: "${new Date().toISOString().slice(0, 10)}"`,
    "category: qa-fundamentals", // replaced below when known
    "difficulty: Intermediate",
    "draft: false",
    "---",
    "",
    body,
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");

  // Resolve category + difficulty via lookups (no circular supabase import needed here)
  let categoryId: string | null = article.category_id;
  let categorySlug = "qa-fundamentals";
  if (categoryId) {
    const { data: cat } = await supabase()
      .from("categories")
      .select("slug")
      .eq("id", categoryId)
      .maybeSingle();
    if (cat?.slug) categorySlug = cat.slug;
  }
  const final = meta
    .replace('category: qa-fundamentals', `category: ${categorySlug}`)
    .replace("difficulty: Intermediate", `difficulty: ${article.difficulty}`);

  await fs.writeFile(file, final, "utf8");
}
