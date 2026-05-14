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

For a full app + database setup:

```bash
docker compose up --build
```

On startup the app container runs `prisma migrate deploy`, seeds the admin user
and default content, then starts the standalone Next.js server.

Before deploying, change at least:

- `AUTH_SECRET`
- `AUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- database password / connection string

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
