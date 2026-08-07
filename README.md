# VTK subdivision website template

A Docker-ready Next.js + Prisma template for VTK subdivisions such as
`chemix.vtk.be`, `mechanix.vtk.be`, and `statix.vtk.be`. Each subdivision is
intended to deploy its own copy with its own database, uploads volume, admin
credentials, colors, text, people, events, and partners.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma 7 with PostgreSQL
- Auth.js credentials login for one admin user
- Docker Compose with persistent Postgres and upload volumes

## Local development

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Start a local PostgreSQL database or use Docker Compose.

3. Install and prepare the app:

```bash
pnpm install
pnpm prisma migrate deploy
pnpm db:seed
pnpm dev
```

The public site is available at `http://localhost:3000`. The admin panel is at
`http://localhost:3000/admin` and uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Docker

Create the environment file first — Compose reads `.env` from this directory
and the app container will not start without it:

```bash
cp .env.example .env
```

Fill in `POSTGRES_PASSWORD`, `AUTH_SECRET`, `AUTH_URL`, `ADMIN_EMAIL`, and
`ADMIN_PASSWORD`, then:

```bash
docker compose up --build
```

On startup the app container runs `prisma migrate deploy`, seeds the admin user
and default content, then starts the standalone Next.js server.

**Write `.env` values unquoted.** Compose loads the file with `format: raw` so
that a `$` in a password survives; the tradeoff is that quotes are not
stripped, and `ADMIN_PASSWORD="hunter2"` would make the quote characters part
of the password. The seed refuses to run on a quoted or placeholder
`ADMIN_PASSWORD` rather than creating an admin you cannot log in as.

`POSTGRES_PASSWORD` is the exception: it is interpolated into `DATABASE_URL`,
so keep it to letters and digits. `$` is dropped during interpolation and
`@ : /` break the connection URL.

To confirm the container actually received your values:

```bash
docker compose exec app env | grep -E 'ADMIN|AUTH'
```

### Changing the admin credentials later

`ADMIN_PASSWORD` is re-seeded on every container start, so changing it in
`.env` and running `docker compose up -d --force-recreate` resets the password.

Changing `ADMIN_EMAIL` instead creates a *second* admin and leaves the previous
one active. Remove the old account by hand:

```bash
docker compose exec db psql -U werkgroep -d werkgroep \
  -c "delete from \"AdminUser\" where email='old@example.org';"
```

Uploaded logos and photos are stored in the `uploads` Docker volume mounted at
`/app/uploads`.

## Admin content

The admin panel manages:

- Site identity, header logo, hero photo, slogan, and CTA
- English and Dutch public copy, plus the default public language
- Theme colors
- About and contact text
- Email, Facebook, Instagram, and LinkedIn links
- Team members with portrait, function, sort order, and profile URL
- Academic years for team archives, with one current year shown publicly
- Events with image, time, location, summary, detail page, and published state
- Partners with logo, website URL, sort order, and visibility
