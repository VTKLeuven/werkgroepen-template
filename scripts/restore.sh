#!/usr/bin/env bash
#
# Load an archive made by scripts/backup.sh into this server.
#
#   make restore FILE=backups/best-20260816-140000.tar CONFIRM=yes
#
# THIS REPLACES EVERYTHING. The database schema is dropped and rebuilt from the
# dump, the uploads volume is emptied and refilled, and .env is overwritten. The
# previous .env is kept as .env.before-restore-<stamp> so a mistake there is
# recoverable; the database and the uploads are not.
#
# Moving a site to another server:
#
#   old:  make backup
#   scp:  scp best-*.tar newserver:~/werkgroepen-template/
#   new:  make restore FILE=best-*.tar CONFIRM=yes
#
# Like the backup, the uploads are streamed straight from the archive into the
# volume and never unpacked to a second copy on disk first.

set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE="${COMPOSE:-docker compose}"
DB_USER="${DB_USER:-werkgroep}"
DB_NAME="${DB_NAME:-werkgroep}"
FILE="${FILE:-}"
CONFIRM="${CONFIRM:-}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/}"

log() { printf '\n=== %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

[ -n "$FILE" ] ||
    die "no archive given. Use: make restore FILE=backups/<file>.tar CONFIRM=yes"
[ -f "$FILE" ] || die "$FILE does not exist"

$COMPOSE version >/dev/null 2>&1 ||
    die "'docker compose' is unavailable. Is $(id -un) in the docker group?"

staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

log "reading $FILE"
# Only the small files come out onto this disk. The uploads stay in the archive
# until they are streamed into the volume further down.
tar -xf "$FILE" -C "$staging" \
    werkgroepen-backup/manifest.txt \
    werkgroepen-backup/.env \
    werkgroepen-backup/database.sql.gz 2>/dev/null ||
    die "$FILE does not look like an archive made by 'make backup'."

payload="$staging/werkgroepen-backup"
for required in manifest.txt .env database.sql.gz; do
    [ -f "$payload/$required" ] || die "$FILE is missing $required."
done
cat "$payload/manifest.txt"

if [ "$CONFIRM" != yes ]; then
    cat >&2 <<EOF

Refusing to continue without confirmation.

This would DROP the current database, EMPTY the uploads volume and overwrite
.env on this server with the contents above. Nothing has been changed yet.

Re-run with:  make restore FILE=$FILE CONFIRM=yes
EOF
    exit 1
fi

stamp="$(date +%Y%m%d-%H%M%S)"
if [ -f .env ]; then
    log "keeping the current .env as .env.before-restore-$stamp"
    cp .env ".env.before-restore-$stamp"
fi

log "installing .env from the archive"
cp "$payload/.env" .env

log "starting the database"
# Only the database. The app must not boot against a schema that is about to be
# dropped, and its entrypoint would seed a half-restored database.
$COMPOSE up -d --build db

for _ in $(seq 1 60); do
    $COMPOSE exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 && break
    sleep 1
done
$COMPOSE exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 ||
    die "the database did not come up. Check '$COMPOSE logs db'."

log "replacing the database contents"
# The dump carries its own CREATE TABLE statements, so the schema is cleared
# first. That also drops _prisma_migrations, which the dump then restores, so
# the app's migrate step on the next start sees the correct history.
if ! $COMPOSE exec -T db psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" \
    -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;' >/dev/null; then
    die "could not talk to the database.

If this server already ran the site before, its postgres-data volume was
initialised with the OLD POSTGRES_PASSWORD, while .env now holds the one from
the archive, and the two no longer match. Postgres only reads that password
when it creates an empty data directory.

For a server that is being migrated onto, the clean fix is to start from an
empty database and restore again:

  $COMPOSE down -v      # deletes this server's database AND uploads
  make restore FILE=$FILE CONFIRM=yes

Your previous .env is at .env.before-restore-$stamp."
fi

gunzip -c "$payload/database.sql.gz" |
    $COMPOSE exec -T db psql -v ON_ERROR_STOP=1 -q -U "$DB_USER" -d "$DB_NAME" >/dev/null

log "restoring the uploads volume"
# A throwaway container that mounts the same volume, so this works before the
# app has ever started. Emptied first so the result is exactly the archive and
# not a merge with whatever was here; -mindepth 1 also catches dotfiles.
$COMPOSE run --rm --no-deps -T --entrypoint sh app -c '
    set -e
    find /app/uploads -mindepth 1 -delete
    tar -xf - -C /app/uploads --strip-components=2 werkgroepen-backup/uploads
' <"$FILE"

log "starting the application"
# Its entrypoint runs prisma migrate deploy (a no-op when the dump is current)
# and the seed, which only upserts and never overwrites restored content.
$COMPOSE up -d --build

log "waiting for $HEALTH_URL"
healthy=false
for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL" 2>/dev/null; then
        healthy=true
        break
    fi
    sleep 2
done

if [ "$healthy" != true ]; then
    $COMPOSE ps
    $COMPOSE logs --tail 50 app
    die "restored, but the site is not answering on $HEALTH_URL. See the logs above."
fi

log "restored"
cat <<EOF

The database, uploads and .env are in place and the site is answering.

Before pointing DNS at this server, check .env:

  AUTH_URL   must be the public address this site is served on. If the domain
             changed, edit it and run '$COMPOSE up -d --force-recreate app',
             otherwise logging in to /admin will fail.

The previous .env, if there was one, is saved as .env.before-restore-$stamp.
EOF
