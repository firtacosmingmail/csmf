import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";

/**
 * Builds a Supabase client scoped to the caller's own Authorization header
 * (or none, for anonymous requests), so RLS policies apply exactly as they
 * would for that caller — not as the function's own service role.
 */
export function createScopedClient(authHeader: string | null) {
  return createClient<Database>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
      },
    },
  );
}
