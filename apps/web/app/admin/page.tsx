import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
      <h1 className="font-serif text-3xl text-ink">Admin dashboard</h1>
      <p className="font-sans text-ink-muted">Signed in as {user?.email}</p>
      <Link href="/admin/posts" className="font-sans text-terracotta hover:underline">
        Manage posts
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="rounded border border-border px-4 py-2 font-sans text-ink transition-colors hover:bg-paper"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
