// Mirrors apps/web/lib/slugify.ts exactly (kept in sync by hand — this
// package doesn't depend on the web app). Used to default a post's slug
// from its title when the caller doesn't supply one.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
