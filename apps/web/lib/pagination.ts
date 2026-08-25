export function totalPages(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}
