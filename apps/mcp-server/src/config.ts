// Loaded once at process startup. All four vars are required — there's no
// service-role/API-key fallback by design (see README): this server signs
// in as the same single admin account the /admin UI uses, so RLS applies
// exactly as it would there.
export type Config = {
  supabaseUrl: string;
  anonKey: string;
  adminEmail: string;
  adminPassword: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in (see README.md).`,
    );
  }
  return value;
}

export function loadConfig(): Config {
  return {
    supabaseUrl: requireEnv("SUPABASE_URL").replace(/\/$/, ""),
    anonKey: requireEnv("SUPABASE_ANON_KEY"),
    adminEmail: requireEnv("SUPABASE_ADMIN_EMAIL"),
    adminPassword: requireEnv("SUPABASE_ADMIN_PASSWORD"),
  };
}
