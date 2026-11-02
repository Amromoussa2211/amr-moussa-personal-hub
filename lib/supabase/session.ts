import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import "server-only";

/** Session client for admin authentication (publishable key + cookie session). */
export async function getSupabaseSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* server component — middleware refreshes the session */
        }
      },
    },
  });
}
