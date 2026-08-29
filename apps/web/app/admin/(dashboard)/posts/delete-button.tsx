"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/spinner";

// useFormStatus only sees the nearest enclosing <form>, so this has to be
// a child of it rather than inlined in DeleteButton itself.
function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 text-terracotta hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export function DeleteButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this post? This can't be undone.")) e.preventDefault();
      }}
    >
      <DeleteSubmitButton />
    </form>
  );
}
