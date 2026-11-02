"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  approveDestination,
  createArticle,
  executePublish,
  revokeApproval,
  saveNewVersion,
} from "@/lib/workflow";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ACTOR = "amr"; // replaced by real auth.uid() once admin accounts are provisioned

export async function saveVersionAction(formData: FormData) {
  const articleId = String(formData.get("articleId") ?? "");
  const body = String(formData.get("body") ?? "");
  const note = String(formData.get("note") ?? "") || undefined;
  const setStatus = String(formData.get("nextStatus") ?? "") || undefined;
  if (!articleId || !body.trim()) return;

  await saveNewVersion({ articleId, body, actor: ACTOR, note, setStatus });
  revalidatePath(`/admin/articles/${articleId}`);
  revalidatePath("/admin/articles");
}

export async function createArticleAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const categorySlug = String(formData.get("categorySlug") ?? "") || undefined;
  if (!title || !slug) return;

  const article = await createArticle({ slug, title, description, categorySlug, actor: ACTOR });
  await saveNewVersion({
    articleId: article.id,
    body: String(formData.get("body") ?? ""),
    actor: ACTOR,
    note: "initial draft",
    setStatus: "DRAFTING",
  });
  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${article.id}`);
}

export async function approveAction(formData: FormData) {
  const articleId = String(formData.get("articleId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const destination = String(formData.get("destination") ?? "") as "website" | "linkedin" | "x";
  if (!articleId || !versionId || !destination) return;

  await approveDestination({ articleId, versionId, destination, actor: ACTOR });
  revalidatePath(`/admin/articles/${articleId}`);
  revalidatePath("/admin");
}

export async function revokeAction(formData: FormData) {
  const articleId = String(formData.get("articleId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const destination = String(formData.get("destination") ?? "") as "website" | "linkedin" | "x";
  if (!articleId || !versionId || !destination) return;

  await revokeApproval({ articleId, versionId, destination, actor: ACTOR });
  revalidatePath(`/admin/articles/${articleId}`);
}

export async function publishAction(formData: FormData) {
  const articleId = String(formData.get("articleId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const destination = String(formData.get("destination") ?? "") as "website" | "linkedin" | "x";
  if (!articleId || !versionId || !destination) return;

  const supabase = getSupabaseAdmin();
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .maybeSingle();
  const { data: version } = await supabase
    .from("article_versions")
    .select("body")
    .eq("id", versionId)
    .maybeSingle();
  if (!article || !version) return;

  await executePublish({
    articleId,
    versionId,
    destination,
    actor: ACTOR,
    articleRow: article,
    body: version.body,
  });

  revalidatePath(`/admin/articles/${articleId}`);
  revalidatePath("/admin");
  revalidatePath("/articles");
}
