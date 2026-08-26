import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, isLocale, type Locale } from "@/i18n/locales";

// Public routes are locale-prefixed (/en/..., /ro/...); /admin isn't (it's
// a single-admin tool, not translated). This proxy does two unrelated
// jobs gated on that split: redirect a locale-less public URL to one, and
// refresh the admin session — kept in one file because Next.js only
// allows a single proxy/middleware entry point per app.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return updateSession(request);
  }

  // Leave static assets (favicon.ico, /file.svg, etc.) alone.
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  const [, firstSegment] = pathname.split("/");
  if (isLocale(firstSegment)) {
    // Forward the resolved locale as a request header so the (unlocalized)
    // root layout can set <html lang> without needing root params, which
    // only work for routes actually nested under app/[lang].
    const headers = new Headers(request.headers);
    headers.set("x-locale", firstSegment);
    return NextResponse.next({ request: { headers } });
  }

  const locale = preferredLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

function preferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  for (const part of acceptLanguage.split(",")) {
    const base = part.split(";")[0].trim().split("-")[0].toLowerCase();
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
