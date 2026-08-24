"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(login, undefined);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-32">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-paper-raised p-8"
      >
        <h1 className="font-serif text-2xl text-ink">Admin login</h1>

        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            className="rounded border border-border bg-paper px-3 py-2 text-ink"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded border border-border bg-paper px-3 py-2 text-ink"
          />
        </label>

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-terracotta px-4 py-2 font-sans text-paper-raised transition-colors hover:bg-terracotta-hover disabled:opacity-50"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
