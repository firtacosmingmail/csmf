"use client";

export function DeleteButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this post? This can't be undone.")) e.preventDefault();
      }}
    >
      <button type="submit" className="text-terracotta hover:underline">
        Delete
      </button>
    </form>
  );
}
