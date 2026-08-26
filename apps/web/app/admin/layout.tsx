import type { Metadata } from "next";
import type { ReactNode } from "react";

// FLE-57: admin is kept out of the sitemap by construction and disallowed
// in robots.ts, but neither of those prevents a URL from being indexed if
// it's discovered some other way (e.g. a stray inbound link) — only a
// noindex directive does. Defense in depth, even though these routes sit
// behind auth.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Not typed via the generated `LayoutProps<"/admin">` helper (unlike the
// other layouts in this app) because that type only exists for routes that
// already had a layout.tsx when Next last generated its route types —
// this file is what adds "/admin" to that set.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
