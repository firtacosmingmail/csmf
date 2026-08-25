// Reverse-chronological (most recent start_date first) — the public /about
// page always shows this order regardless of the admin's display_order
// (which drives drag-to-reorder in the editor, not necessarily by date).
// Entries with no start_date sort last.
export function sortByStartDateDesc<T extends { start_date: string | null }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.start_date && !b.start_date) return 0;
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    return b.start_date.localeCompare(a.start_date);
  });
}
