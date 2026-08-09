#!/usr/bin/env bash
#
# Deploy werkgroepen-template on the best VM (10.10.10.12).
#
# Driven by .github/workflows/deploy.yml on the self hosted runner, but it is a plain
# script: run it by hand on the server to debug a failed deploy.
#
#   cd ~/werkgroepen-template && bash scripts/deploy.sh
#
# It deploys into DEPLOY_DIR rather than into the runner workspace, so .env and any
# bind mounted data stay where they are. Untracked files are never removed.
#
# Note on ports: docker-compose.yml publishes the app on 3000, while Caddy on
# proxy-vm reverse proxies to port 80 of this VM. If you need 80, put the mapping in
# an untracked docker-compose.override.yml on the server and set HEALTH_URL to match.
# Do not edit docker-compose.yml in place on the server: it is tracked, so the
# git reset below reverts it on the next deploy and the site goes dark.

set -Eeuo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-$HOME/werkgroepen-template}"
BRANCH="${BRANCH:-main}"
TARGET_SHA="${TARGET_SHA:-}"
REPO_URL="${REPO_URL:-}"
GIT_TOKEN="${GIT_TOKEN:-}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_DELAY="${HEALTH_DELAY:-2}"

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
log "deploy dir $DEPLOY_DIR, currently at $previous_sha"

rollback() {
    log "DEPLOY FAILED, rolling back to $previous_sha"
    git reset --hard "$previous_sha" || true
    docker compose up -d --build --remove-orphans || true
    echo "rolled back. Check 'docker compose logs' on best for the cause." >&2
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

# 5. The site has to answer on port 80 of this VM, that is what Caddy on proxy-vm
#    reverse proxies to. If it does not come back, the deploy is a failure.
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

# 6. Builds pile up fast on a 64 GB disk. Drop the layers nothing references.
docker image prune -f >/dev/null 2>&1 || true

log "deployed $(git rev-parse --short HEAD) to best"
