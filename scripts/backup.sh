#!/usr/bin/env bash
#
# Pack everything that is NOT in git into one archive: the database, the uploads
# volume and .env.
#
#   make backup
#   bash scripts/backup.sh                  # same thing
#   BACKUP_DIR=/mnt/usb make backup         # write somewhere else
#
# The code itself is deliberately left out. The new server clones that from git;
# what cannot be recovered that way is exactly these three things.
#
# Why a .tar and not a .zip: zip cannot take its entries from a pipe, so the
# uploads would have to be staged as a second full copy before being zipped.
# With the photo quota at 10 GB on an 18 GB disk there is no room for that, so
# the archive is streamed straight out of the container in a single pass and
# never exists twice. It is also not gzipped: the photos inside are already
# compressed JPEG and WebP, so it would cost minutes of VM CPU for nothing. The
# database dump, where compression does pay off, is gzipped on its own inside.

set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE="${COMPOSE:-docker compose}"
DB_USER="${DB_USER:-werkgroep}"
DB_NAME="${DB_NAME:-werkgroep}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
SITE_NAME="${SITE_NAME:-$(hostname -s 2>/dev/null || echo site)}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="${ARCHIVE:-${BACKUP_DIR}/${SITE_NAME}-${STAMP}.tar}"

# --stdout writes the archive to the pipe instead of to a file, so a site whose
# uploads no longer fit on its own disk can still be moved:
#
#   bash scripts/backup.sh --stdout | ssh new 'cat > werkgroepen-backup.tar'
STREAM=false
[ "${1:-}" = "--stdout" ] && STREAM=true

# Progress goes to stderr, always: on stdout it would corrupt the archive.
log() { printf '\n=== %s\n' "$*" >&2; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# Runs a throwaway container that shares the app's volumes. Used instead of
# 'exec' so a backup also works while the app is stopped, which is how you take
# one that is guaranteed consistent.
in_app() {
    $COMPOSE run --rm --no-deps -T --entrypoint sh app -c "$1"
}

$COMPOSE version >/dev/null 2>&1 ||
    die "'docker compose' is unavailable. Is $(id -un) in the docker group?"
[ -f .env ] ||
    die ".env is missing, so there is nothing worth backing up here. Are you in the deploy directory?"

db_id="$($COMPOSE ps -q db 2>/dev/null || true)"
[ -n "$db_id" ] && [ "$(docker inspect -f '{{.State.Running}}' "$db_id" 2>/dev/null)" = true ] ||
    die "the 'db' container is not running, so there is nothing to dump. Start it with '$COMPOSE up -d db'."

uploads_kb="$(in_app 'du -sk /app/uploads 2>/dev/null | cut -f1' | tr -dc '0-9')"

if [ "$STREAM" != true ]; then
    mkdir -p "$(dirname "$ARCHIVE")"

    # The archive is roughly the size of the uploads volume. Check there is room
    # for it before spending minutes writing a file that gets truncated.
    free_kb="$(df -Pk "$(dirname "$ARCHIVE")" | awk 'NR==2 {print $4}')"
    if [ -n "$uploads_kb" ] && [ -n "$free_kb" ] &&
        [ "$free_kb" -lt "$((uploads_kb + uploads_kb / 10 + 51200))" ]; then
        die "not enough free disk for the archive: uploads are $((uploads_kb / 1024)) MB but only $((free_kb / 1024)) MB is free at $(dirname "$ARCHIVE").
Write it to another disk with 'make backup BACKUP_DIR=/some/other/disk', or send it straight to the new server without landing here at all:
  bash scripts/backup.sh --stdout | ssh newserver 'cat > ~/werkgroepen-template/werkgroepen-backup.tar'"
    fi
fi

staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

log "dumping the database"
# pg_dump runs inside the db container, so its version always matches the
# server. --no-owner keeps the dump loadable under a different role.
$COMPOSE exec -T db pg_dump --no-owner --no-acl -U "$DB_USER" -d "$DB_NAME" |
    gzip -9 >"$staging/database.sql.gz"
[ -s "$staging/database.sql.gz" ] || die "the database dump came out empty"

cp .env "$staging/.env"

# Deliberately not packed: an override file is about how this particular server
# runs the site, and blindly reinstalling one that maps a fixed host port would
# collide with the other sites on a shared machine. Say so rather than let it
# vanish silently.
if [ -f docker-compose.override.yml ]; then
    printf '\nnote: docker-compose.override.yml exists here and is NOT in the archive.\n' >&2
    printf 'Review it by hand; on a shared server, a fixed port mapping in it will\n' >&2
    printf 'clash with the other sites. Use APP_PORT in .env instead.\n' >&2
fi

count() {
    $COMPOSE exec -T db psql -tAq -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>/dev/null |
        tr -dc '0-9' || true
}

cat >"$staging/manifest.txt" <<EOF
site           ${SITE_NAME}
created        $(date -u +"%Y-%m-%dT%H:%M:%SZ")
host           $(hostname 2>/dev/null || echo unknown)
commit         $(git rev-parse HEAD 2>/dev/null || echo unknown)
branch         $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
database       $(du -h "$staging/database.sql.gz" | cut -f1) compressed
uploads        $((uploads_kb / 1024)) MB
albums         $(count 'select count(*) from "PhotoAlbum";')
photos         $(count 'select count(*) from "Photo";')
restore with   make restore FILE=<this file> CONFIRM=yes
EOF

if [ "$STREAM" = true ]; then
    log "streaming the archive to stdout"
else
    log "writing $ARCHIVE"
fi

# One pass: the small files go in over stdin, the uploads directory is symlinked
# and followed with -h, and the whole thing comes back out over stdout. The
# uploads are never copied to a second place on disk.
build() {
    # COPYFILE_DISABLE stops BSD tar from adding ._ resource-fork files when the
    # backup is taken from a Mac. No effect on the servers, which use GNU tar.
    COPYFILE_DISABLE=1 tar -cf - -C "$staging" . | in_app '
        set -e
        rm -rf /tmp/wgb
        mkdir -p /tmp/wgb/werkgroepen-backup
        tar -xf - -C /tmp/wgb/werkgroepen-backup
        ln -sfn /app/uploads /tmp/wgb/werkgroepen-backup/uploads
        tar -chf - -C /tmp/wgb werkgroepen-backup
        rm -rf /tmp/wgb
    '
}

if [ "$STREAM" = true ]; then
    build
    log "streamed"
    cat "$staging/manifest.txt" >&2
    exit 0
fi

build >"$ARCHIVE"

tar -tf "$ARCHIVE" >/dev/null 2>&1 ||
    die "the archive did not come out readable. Check '$COMPOSE logs app'."

log "done"
cat "$staging/manifest.txt"
printf '\narchive  %s  (%s)\n' "$ARCHIVE" "$(du -h "$ARCHIVE" | cut -f1)"
printf '\nThis file contains .env, so it holds the database password, the auth\n'
printf 'secret and the admin password. Move it over scp and delete it afterwards.\n'
