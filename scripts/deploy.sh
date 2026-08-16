#!/usr/bin/env bash
#
# Deploy werkgroepen-template on the server this runs on.
#
# The script is server agnostic: every deployment (best, chemix, ...) runs this same
# file, and .github/workflows/deploy.yml passes the per server values (TARGET_NAME,
# DEPLOY_DIR, HEALTH_URL) as environment variables from its matrix. Nothing here may
# hardcode a single server.
#
# Driven by that workflow on the self hosted runner, but it is a plain script: run it
# by hand on the server to debug a failed deploy.
#
#   cd ~/werkgroepen-template && bash scripts/deploy.sh
#
# It deploys into DEPLOY_DIR rather than into the runner workspace, so .env and any
# bind mounted data stay where they are. Untracked files are never removed, which is
# what keeps each server's own .env (database password, AUTH_URL, admin credentials)
# in place across deploys.
#
# Note on ports: docker-compose.yml publishes the app on 3000, while Caddy on
# proxy-vm reverse proxies to port 80 of the VM. If you need 80, put the mapping in
# an untracked docker-compose.override.yml on the server and set HEALTH_URL to match.
# Do not edit docker-compose.yml in place on the server: it is tracked, so the
# git reset below reverts it on the next deploy and the site goes dark.

set -Eeuo pipefail

TARGET_NAME="${TARGET_NAME:-$(hostname -s 2>/dev/null || echo this server)}"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/werkgroepen-template}"
BRANCH="${BRANCH:-main}"
TARGET_SHA="${TARGET_SHA:-}"
REPO_URL="${REPO_URL:-}"
GIT_TOKEN="${GIT_TOKEN:-}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_DELAY="${HEALTH_DELAY:-2}"
PRUNE_DOCKER="${PRUNE_DOCKER:-true}"

log() { printf '\n=== %s\n' "$*"; }

if [ ! -d "$DEPLOY_DIR/.git" ]; then
    echo "error: $DEPLOY_DIR is not a git checkout, cannot deploy into it" >&2
    exit 1
fi
cd "$DEPLOY_DIR"

if ! docker compose version >/dev/null 2>&1; then
    echo "error: 'docker compose' is unavailable. Is $(id -un) in the docker group?" >&2
    exit 1
fi

previous_sha="$(git rev-parse HEAD)"
log "deploying to $TARGET_NAME in $DEPLOY_DIR, currently at $previous_sha"

rollback() {
    log "DEPLOY FAILED on $TARGET_NAME, rolling back to $previous_sha"
    git reset --hard "$previous_sha" || true
    docker compose up -d --build --remove-orphans || true
    echo "rolled back. Check 'docker compose logs' on $TARGET_NAME for the cause." >&2
}
trap rollback ERR

# 1. Move the checkout to the commit that triggered this run.
log "updating source"
if [ -n "$TARGET_SHA" ] && [ -n "$REPO_URL" ]; then
    fetch_url="$REPO_URL"
    if [ -n "$GIT_TOKEN" ]; then
        # Token stays in this process only, it is never written to .git/config.
        fetch_url="https://x-access-token:${GIT_TOKEN}@${REPO_URL#https://}"
    fi
    git fetch "$fetch_url" "+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}"
    git reset --hard "$TARGET_SHA"
else
    git fetch origin "$BRANCH"
    git reset --hard "origin/${BRANCH}"
fi
git submodule update --init --recursive 2>/dev/null || true
log "now at $(git rev-parse HEAD)"

# 2. Rebuild. --pull refreshes the base images, so security updates land too.
log "building images"
docker compose build --pull

# 3. Restart. --remove-orphans cleans up services deleted from the compose file.
log "starting containers"
docker compose up -d --remove-orphans

# 4. Prisma migrations and the seed already run in docker-entrypoint.sh, so nothing
#    is needed here. Anything else the app wants after the containers are up goes in
#    scripts/post-deploy.sh. Optional, skipped if absent.
if [ -x scripts/post-deploy.sh ]; then
    log "running post-deploy hook"
    ./scripts/post-deploy.sh
fi

# 5. The site has to answer on the VM port Caddy on proxy-vm reverse proxies to.
#    If it does not come back, the deploy is a failure.
log "waiting for $HEALTH_URL"
healthy=false
for _ in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL"; then
        healthy=true
        break
    fi
    sleep "$HEALTH_DELAY"
done

if [ "$healthy" != true ]; then
    log "no healthy response after $((HEALTH_RETRIES * HEALTH_DELAY))s"
    docker compose ps
    docker compose logs --tail 50
    exit 1
fi

trap - ERR
log "healthy"

# 6. Builds pile up fast on a 64 GB disk. Only clean up after the new release is
#    healthy so the rollback path can still use the previous image. This removes
#    stopped containers, unused networks, all images unused by a container, and
#    BuildKit cache. It deliberately does NOT pass --volumes: postgres-data and
#    uploads must survive every deploy.
if [ "$PRUNE_DOCKER" = true ]; then
    log "pruning unused Docker data (persistent volumes are kept)"
    docker system df || true
    if ! docker system prune -af; then
        echo "warning: Docker system cleanup failed; deployment is still healthy" >&2
    fi
    if ! docker builder prune -af; then
        echo "warning: Docker build-cache cleanup failed; deployment is still healthy" >&2
    fi
    docker system df || true
else
    log "skipping Docker cleanup because PRUNE_DOCKER=$PRUNE_DOCKER"
fi

log "deployed $(git rev-parse --short HEAD) to $TARGET_NAME"
