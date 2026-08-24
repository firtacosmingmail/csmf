// Maps common Postgres error codes to HTTP status codes for API responses.
// RLS violations surface as 42501 (insufficient_privilege); CHECK constraint
// violations (e.g. an invalid status) as 23514. Everything else is a 500.
export function statusForPostgresError(code: string | undefined): number {
  if (code === "42501") return 403;
  if (code === "23514") return 400;
  return 500;
}

// Picks only the given fields out of a parsed request body — used to build
// insert/update payloads without letting a caller set arbitrary columns.
export function pickFields<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  fields: readonly (keyof T & string)[],
): Partial<T> {
  return Object.fromEntries(
    fields.filter((key) => key in body).map((key) => [key, body[key]]),
  ) as Partial<T>;
}
