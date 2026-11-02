"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/admin/actions";

const initial: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <h1 className="font-display text-2xl font-semibold text-ink">Editorial access</h1>
      <p className="mt-2 text-sm text-muted">
        Private admin area — only the editor-in-chief.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-[13px] font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-[13px] font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-700 dark:text-rose-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
