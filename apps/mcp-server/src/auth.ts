import type { Config } from "./config.js";

// Signs in as the single admin account via Supabase Auth's GoTrue REST API
// directly (no @supabase/supabase-js dependency — this is the only auth
// call this package makes) and caches the resulting session in memory for
// the life of the process, refreshing it a minute before it expires. The
// access token is then attached as the Authorization header on every
// Edge Functions call (see api-client.ts), so RLS treats this process
// exactly like an authenticated admin browser session — same as
// apps/web's own auth flow, just without cookies.
type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
};

type GoTrueTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
  msg?: string;
};

const REFRESH_SKEW_MS = 60_000;

export class AdminAuth {
  private session: Session | null = null;
  private inFlight: Promise<Session> | null = null;

  constructor(private readonly config: Config) {}

  async getAccessToken(): Promise<string> {
    if (this.session && Date.now() < this.session.expiresAtMs - REFRESH_SKEW_MS) {
      return this.session.accessToken;
    }
    if (!this.inFlight) {
      this.inFlight = this.refreshOrSignIn().finally(() => {
        this.inFlight = null;
      });
    }
    this.session = await this.inFlight;
    return this.session.accessToken;
  }

  private async refreshOrSignIn(): Promise<Session> {
    if (this.session) {
      try {
        return await this.tokenRequest("refresh_token", { refresh_token: this.session.refreshToken });
      } catch {
        // Refresh token may itself have expired (GoTrue default is long,
        // but not infinite) — fall through to a fresh password sign-in.
      }
    }
    return this.tokenRequest("password", {
      email: this.config.adminEmail,
      password: this.config.adminPassword,
    });
  }

  private async tokenRequest(grantType: "password" | "refresh_token", body: Record<string, string>): Promise<Session> {
    const res = await fetch(`${this.config.supabaseUrl}/auth/v1/token?grant_type=${grantType}`, {
      method: "POST",
      headers: {
        apikey: this.config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as GoTrueTokenResponse;
    if (!res.ok || !data.access_token) {
      const message = data.error_description ?? data.msg ?? data.error ?? `HTTP ${res.status}`;
      throw new Error(
        grantType === "password"
          ? `Admin sign-in failed: ${message}. Check SUPABASE_ADMIN_EMAIL / SUPABASE_ADMIN_PASSWORD in .env.`
          : `Session refresh failed: ${message}`,
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAtMs: Date.now() + data.expires_in * 1000,
    };
  }
}
