export const DEFAULT_PER_PAGE = 6;

// Converts 1-indexed page/per_page query params into a zero-indexed
// [from, to] range for PostgREST's .range(). Invalid/missing values fall
// back to page 1 / DEFAULT_PER_PAGE rather than erroring — pagination is a
// display concern, not something worth 400ing a request over.
export function paginationRange(
  page: unknown,
  perPage: unknown,
): { from: number; to: number; page: number; perPage: number } {
  const pageNum = normalizePositiveInt(page, 1);
  const perPageNum = normalizePositiveInt(perPage, DEFAULT_PER_PAGE);
  const from = (pageNum - 1) * perPageNum;
  const to = from + perPageNum - 1;
  return { from, to, page: pageNum, perPage: perPageNum };
}

function normalizePositiveInt(value: unknown, fallback: number): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}
