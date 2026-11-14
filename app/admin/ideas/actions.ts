"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createArticle, saveNewVersion } from "@/lib/workflow";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ACTOR = "amr"; // replaced by real auth.uid() once admin accounts are provisioned

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "idea";
}

async function uniqueSlug(base: string): Promise<string> {
  const supa = getSupabaseAdmin();
  let candidate = base;
  for (let n = 2; ; n++) {
    const { data } = await supa
      .from("articles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n}`;
  }
}

export async function createIdeaAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categorySlug = String(formData.get("categorySlug") ?? "");
  if (!title) return;

  const supa = getSupabaseAdmin();
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supa
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  await supa.from("content_ideas").insert({
    title,
    description,
    category_id: categoryId,
    source: "manual",
  });
  revalidatePath("/admin/ideas");
}

export async function promoteIdeaAction(formData: FormData) {
  const ideaId = String(formData.get("ideaId") ?? "");
  if (!ideaId) return;

  const supa = getSupabaseAdmin();
  const { data: idea } = await supa
    .from("content_ideas")
    .select("id, title, description, status, article_id")
    .eq("id", ideaId)
    .maybeSingle();
  if (!idea) return;

  // Already converted — just go to the article.
  if (idea.article_id) redirect(`/admin/articles/${idea.article_id}`);

  const slug = await uniqueSlug(slugify(idea.title));
  const article = await createArticle({
    slug,
    title: idea.title,
    description: idea.description || "",
    actor: ACTOR,
  });

  // Link category from the idea onto the article.
  const { data: full } = await supa
    .from("content_ideas")
    .select("category_id")
    .eq("id", ideaId)
    .maybeSingle();
  if (full?.category_id) {
    await supa.from("articles").update({ category_id: full.category_id }).eq("id", article.id);
  }

  // Give the editor a starting v1 with the premise, so approvals unlock immediately.
  const premise = idea.description
    ? `${idea.description}\n\n<!-- Draft premise. Replace with the full article body. -->`
    : "<!-- Draft stub. Replace with the full article body. -->";
  await saveNewVersion({
    articleId: article.id,
    body: premise,
    actor: ACTOR,
    note: "initial draft from idea",
    setStatus: "DRAFTING",
  });

  await supa
    .from("content_ideas")
    .update({ status: "CONVERTED", article_id: article.id })
    .eq("id", ideaId);

  revalidatePath("/admin/ideas");
  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${article.id}`);
}

export async function dismissIdeaAction(formData: FormData) {
  const ideaId = String(formData.get("ideaId") ?? "");
  if (!ideaId) return;

  const supa = getSupabaseAdmin();
  await supa.from("content_ideas").update({ status: "DISMISSED" }).eq("id", ideaId);
  revalidatePath("/admin/ideas");
}
