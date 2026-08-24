#!/usr/bin/env bash
# Installs the database to a fresh, functional state on any Postgres/Supabase
# instance by running every setup file in order (numeric prefix = run order),
# followed by storage/ bucket files. Idempotent only insofar as the SQL
# itself is (plain `create table`/`create policy` will fail on a non-empty
# database — this is for bootstrapping a fresh environment, not migrating one).
#
# Usage: ./install.sh "$DATABASE_URL"
set -euo pipefail

DATABASE_URL="${1:?Usage: install.sh <database-url>}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for f in "$DIR"/*.sql; do
  echo "Applying $(basename "$f")..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

for f in "$DIR"/storage/*.sql; do
  [ -e "$f" ] || continue
  echo "Applying storage/$(basename "$f")..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "Done."
