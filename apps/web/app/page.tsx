import { createClient } from "@/lib/supabase/server";

async function checkSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return { ok: false, message: "Supabase env vars are not set." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.getSession();
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: `Connected to ${url}` };
}

export default async function Home() {
  const supabaseStatus = await checkSupabaseConnection();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
      <h1 className="font-serif text-4xl text-ink">csmf.ro</h1>
      <p className="font-sans text-ink-muted">Personal blog — under construction.</p>
      <p className="font-mono text-sm text-terracotta">
        {supabaseStatus.ok ? "✓" : "✗"} {supabaseStatus.message}
      </p>
    </main>
  );
}
