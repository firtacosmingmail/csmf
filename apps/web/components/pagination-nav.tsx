import Link from "next/link";

// Plain <Link>-based pager (not client-side/infinite scroll) — each page
// is its own crawlable, cacheable URL, per FLE-40.
export function PaginationNav({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-4 pt-4 font-sans text-sm text-ink-muted"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={page - 1 === 1 ? "/" : `/?page=${page - 1}`} className="hover:text-ink hover:underline">
          ← Newer
        </Link>
      ) : (
        <span aria-hidden className="opacity-40">
          ← Newer
        </span>
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/?page=${page + 1}`} className="hover:text-ink hover:underline">
          Older →
        </Link>
      ) : (
        <span aria-hidden className="opacity-40">
          Older →
        </span>
      )}
    </nav>
  );
}
