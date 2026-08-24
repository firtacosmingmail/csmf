// Base fetch wrapper for calling the Supabase Edge Functions REST API
// (apps/supabase/functions/) — the only path this app uses to read/write
// the database. Never call Postgres/PostgREST directly from here.
const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

export async function apiFetch(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
) {
  const { accessToken, headers, ...rest } = init;
  return fetch(`${FUNCTIONS_URL}${path}`, {
    ...rest,
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });
}
