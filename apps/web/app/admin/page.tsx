import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";
import { listPosts } from "@/lib/api/posts";
import { listComments } from "@/lib/api/comments";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const accessToken = session?.access_token;
  const [published, draft, pending] = accessToken
    ? await Promise.all([
        listPosts({ status: "published", accessToken }),
        listPosts({ status: "draft", accessToken }),
        listComments({ status: "pending", accessToken }),
      ])
    : [[], [], []];

  const stats = [
    { label: "Published posts", value: published.length },
    { label: "Draft posts", value: draft.length },
    { label: "Pending comments", value: pending.length },
  ];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-ink">Admin dashboard</h1>
        <p className="font-sans text-ink-muted">Signed in as {user?.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 rounded border border-border bg-paper-raised p-4">
            <span className="font-serif text-3xl text-ink">{stat.value}</span>
            <span className="font-sans text-sm text-ink-muted">{stat.label}</span>
          </div>
        ))}
      </div>

      <nav className="flex gap-6 font-sans">
        <Link href="/admin/posts" className="text-terracotta hover:underline">
          Manage posts
        </Link>
        <Link href="/admin/comments" className="text-terracotta hover:underline">
          Manage comments
        </Link>
        <Link href="/admin/about" className="text-terracotta hover:underline">
          About me
        </Link>
        <Link href="/admin/experience" className="text-terracotta hover:underline">
          Work experience
        </Link>
      </nav>

      <form action={logout}>
        <button
          type="submit"
          className="self-start rounded border border-border px-4 py-2 font-sans text-ink transition-colors hover:bg-paper"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
