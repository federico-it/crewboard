#!/bin/sh
# Runner entrypoint: apply database migrations, then start the web server.
#
# Drizzle records applied migrations, so re-running on every container start is
# idempotent. This assumes a single migrating instance at a time; for multi-replica
# rollouts gate migrations to one job instead (see docs/DEPLOY.md). A migration
# failure aborts startup on purpose so a broken schema never serves traffic.
set -e

echo "[entrypoint] Applying database migrations..."
node /app/migrate.cjs

echo "[entrypoint] Starting server..."
exec "$@"
