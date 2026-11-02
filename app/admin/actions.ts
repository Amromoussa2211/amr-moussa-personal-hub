"use server";

import { redirect } from "next/navigation";

import { getSupabaseSession } from "@/lib/supabase/session";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await getSupabaseSession();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await getSupabaseSession();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
