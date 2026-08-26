import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

// Plain <Link>-based pager (not client-side/infinite scroll) — each page
// is its own crawlable, cacheable URL, per FLE-40.
export function PaginationNav({
  page,
  totalPages,
  lang,
  dict,
}: {
  page: number;
  totalPages: number;
  lang: Locale;
  dict: Dictionary;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-4 pt-4 font-sans text-sm text-ink-muted"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={page - 1 === 1 ? `/${lang}` : `/${lang}?page=${page - 1}`}
          className="hover:text-ink hover:underline"
        >
          {dict.pagination.newer}
        </Link>
      ) : (
        <span aria-hidden className="opacity-40">
          {dict.pagination.newer}
        </span>
      )}
      <span>{dict.pagination.pageOf(page, totalPages)}</span>
      {page < totalPages ? (
        <Link href={`/${lang}?page=${page + 1}`} className="hover:text-ink hover:underline">
          {dict.pagination.older}
        </Link>
      ) : (
        <span aria-hidden className="opacity-40">
          {dict.pagination.older}
        </span>
      )}
    </nav>
  );
}
