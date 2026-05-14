#!/bin/sh
set -e

pnpm prisma migrate deploy
pnpm db:seed

exec "$@"
