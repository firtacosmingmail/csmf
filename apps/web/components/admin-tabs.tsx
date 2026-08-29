"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";

const TABS = [
  { href: "/admin/posts", label: "Manage posts" },
  { href: "/admin/comments", label: "Manage comments" },
  { href: "/admin/about", label: "About me" },
  { href: "/admin/experience", label: "Work experience" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-paper-raised">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <nav className="flex flex-wrap gap-6 font-sans text-sm">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`-mb-px border-b-2 pb-1 transition-colors ${
                  active ? "border-terracotta text-ink" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-border px-3 py-1.5 font-sans text-sm text-ink transition-colors hover:bg-paper"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
