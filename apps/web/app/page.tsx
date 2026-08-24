import { createSupabaseClient } from "@csmf/supabase";

async function checkSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, message: "Supabase env vars are not set." };
  }
  const supabase = createSupabaseClient(url, anonKey);
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
