"use client";

// Catches errors thrown by admin pages and by <form action={...}>-bound
// server actions (PostForm, DeleteButton) — those propagate to the
// nearest error boundary automatically. Imperative onClick/onBlur calls
// to server actions (BlockEditor, AboutForm, ExperienceEditor) don't, so
// those handle their own errors locally instead.
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-serif text-2xl text-ink">Something went wrong</h1>
      <p className="font-sans text-ink-muted">{error.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-terracotta px-4 py-2 font-sans text-paper-raised transition-colors hover:bg-terracotta-hover"
      >
        Try again
      </button>
    </main>
  );
}
