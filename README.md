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

After a successful health check, the VM deploy script automatically removes
stopped containers, unused networks and images, and Docker build cache. Named
volumes are never pruned, so PostgreSQL data and uploaded media are preserved.
Set `PRUNE_DOCKER=false` when running `scripts/deploy.sh` manually to skip this
cleanup for a diagnostic deployment.

## Deployment

`.github/workflows/deploy.yml` deploys every push to `main` to all servers at
once. The server list is the `TARGETS` JSON in its `targets` job — one entry
per deployment:

```json
{ "name": "best",
  "runner": "best",
  "deploy_dir": "/home/bm/werkgroepen-template",
  "health_url": "http://localhost:3000/" }
```

That list becomes the matrix of the `deploy` job, which runs once per server.
The servers have no public IP, so there is no SSH from GitHub: each VM runs its
own self-hosted runner that polls GitHub outbound, and the job is routed to it
by the label in `runner`. Servers are independent — `fail-fast` is off so one
broken VM still lets the others get the release, and each has its own
`concurrency` group so their deploys never queue behind each other.

`scripts/deploy.sh` contains no server-specific values; everything that differs
comes from the matrix. Everything that must *not* be shared (database password,
`AUTH_URL`, admin credentials, uploads, Postgres data) lives in the untracked
`.env` and the Docker volumes on each VM, so the same commit produces a
different site per subdivision.

To deploy to one server only, run the workflow manually from the Actions tab
and pick it from the **target** dropdown.

### Adding a deployment target

1. **Prepare the VM.** Install Docker and Compose, then create the deployment
   checkout and its environment file:

   ```bash
   git clone https://github.com/VTKLeuven/werkgroepen-template.git ~/werkgroepen-template
   cd ~/werkgroepen-template
   cp .env.example .env   # then fill in real values for this subdivision
   ```

   The deploy script refuses to run if that directory is not a git checkout.
   Make sure the account that will run the runner is in the `docker` group
   (`sudo usermod -aG docker $USER`, then log out and back in).

2. **Register a self-hosted runner** on that VM. In the repository, go to
   Settings → Actions → Runners → New self-hosted runner, pick Linux, and run
   the commands it shows. When `config.sh` asks for additional labels, give the
   server's short name (for example `chemix`); the workflow matches on
   `[self-hosted, <label>]`. Then install it as a service so it survives a
   reboot:

   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

   The runner polls GitHub over outbound HTTPS, which is why this works without
   a public IP or an inbound firewall rule.

3. **Add the server to the workflow**: one entry in `TARGETS`, plus its name in
   the `workflow_dispatch` `options` list so it can be deployed on its own.
   `deploy_dir` must be the absolute path from step 1
   (`/home/<user>/werkgroepen-template`). Do this only once the runner is
   online: until then its job sits queued on every push to `main`.

4. **Point the proxy at it** and deploy: push to `main`, or run the workflow
   manually with the new target selected.

If a deploy fails, the script rolls the checkout back to the previous commit
and rebuilds it, so the site stays up. Run it by hand on the VM to see why:

```bash
cd ~/werkgroepen-template && bash scripts/deploy.sh
```

## Environment files

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

### Changing POSTGRES_PASSWORD on an existing deployment

Postgres only applies `POSTGRES_PASSWORD` when it initializes an *empty* data
directory. On a deployment whose `postgres-data` volume already exists, editing
`POSTGRES_PASSWORD` in `.env` changes what the app sends but not what the
database expects, and the app crash-loops on:

```
Error: P1000: Authentication failed against database server
```

Update the stored password to match `.env`. Local socket connections inside the
db container use `trust` auth, so the old password is not needed:

```bash
docker compose exec -T db sh -c \
  'echo "ALTER USER werkgroep WITH PASSWORD :'\''pw'\'';" | psql -U werkgroep -d werkgroep -v pw="$POSTGRES_PASSWORD"'
```

The app recovers on its next restart attempt. Alternatively `docker compose
down -v` starts clean, but that also deletes the uploads volume and all
content.

Uploaded logos and photos are stored in the `uploads` Docker volume mounted at
`/app/uploads`. Individual image uploads are limited to 10 MB.

## Admin content

The admin panel manages:

- A single-language or bilingual (English/Dutch) public website
- Site identity, an icon-with-text or full-width header logo, and the browser icon
- Hero photo, copy, CTA, nine-position text placement, and a live
  desktop/mobile preview
- Theme colors and adjustable body, heading, and hero font sizes
- Homepage section visibility and one global header order shared with custom pages
- Standalone pages with localized titles, optional intro copy, cover photos,
  live preview, full/flexible/fit/fill/manual-crop image layouts, configurable
  borders and shadows, above/left/right content placement, explicit save
  confirmation, draft/published state, and header placement
- Markdown editing and preview for page content, About, contact text, and event
  descriptions, including inline image uploads
- Optional hero eyebrow and supporting copy (empty translations stay empty)
- About and contact text, plus an optional right-hand About image with the same
  sizing, crop, border, radius, and shadow controls as custom-page covers
- Email, Facebook, Instagram, and LinkedIn links
- Team members with portrait, function, visual ordering, and profile URL
- Academic years for team archives, with one current year shown publicly
- Events with image, time, location, summary, detail page, and published state
- Partners with logo, website URL, visual ordering, and visibility

Settings and all content forms automatically adapt to the configured language
mode. Existing translations are kept when a site temporarily switches to a
single language.

Markdown is rendered without raw HTML. The editor supports headings, bold,
italics, code blocks, links, uploaded images, lists, quotes, and horizontal
rules; uploaded images use the same persistent uploads volume as other media.
