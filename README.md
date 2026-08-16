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

`.github/workflows/deploy.yml` deploys every push to `main` to all sites at
once. The site list is the `TARGETS` JSON in its `targets` job — one entry per
deployment:

```json
{ "name": "best",
  "runner": "vtk",
  "project": "best",
  "deploy_dir": "/home/it/best/werkgroepen_template",
  "health_url": "http://localhost:3000/" }
```

That list becomes the matrix of the `deploy` job, which runs once per site. The
VM has no public IP, so there is no SSH from GitHub: it runs a self-hosted
runner that polls GitHub outbound, and the job is routed to it by the label in
`runner`. `fail-fast` is off so one broken site still lets the others get the
release, and each has its own `concurrency` group.

### Several sites on one server

The subdivisions share a host, one directory each:

```
/home/it/best/werkgroepen_template
/home/it/chemix/werkgroepen_template
```

Two settings in each site's `.env` keep them apart, and **both must be unique
per site on the machine**:

- `COMPOSE_PROJECT_NAME` namespaces containers *and volumes*. Compose otherwise
  derives it from the directory name — and every site's directory is called
  `werkgroepen_template`, so leaving it unset points two sites at one database
  and one uploads volume. The workflow also passes it explicitly, so a deploy is
  correct even if that line is edited out of `.env`.
- `APP_PORT` is the host port the site is published on. Caddy on proxy-vm routes
  each hostname to the matching port.

Both sites also share one disk, so `PHOTO_STORAGE_LIMIT_BYTES` is a per-site
budget that has to be divided rather than set to 10 GB each. Check the room with
`df -h /`.

One runner serves every site on the host, so their deploys queue behind each
other. That is fine for a handful of sites; if the wait becomes annoying,
register a second runner service on the same machine with the same label and two
deploys can run at once.

`scripts/deploy.sh` contains no server-specific values; everything that differs
comes from the matrix. Everything that must *not* be shared (database password,
`AUTH_URL`, admin credentials, uploads, Postgres data) lives in the untracked
`.env` and the Docker volumes on each VM, so the same commit produces a
different site per subdivision.

To deploy to one server only, run the workflow manually from the Actions tab
and pick it from the **target** dropdown.

### Moving a site to another server

`make backup` packs the three things that are not in git — the database, the
uploads volume and `.env` — into one archive. `make restore` loads it on the
other side. The code is not in the archive: the new server clones that from git.

```bash
# on the old server
make backup                       # -> backups/<site>-<timestamp>.tar

# from your laptop
scp old:~/werkgroepen-template/backups/best-*.tar .
scp best-*.tar new:~/werkgroepen-template/

# on the new server, after cloning the repo there
make verify  FILE=best-*.tar                  # look before you leap
make restore FILE=best-*.tar CONFIRM=yes
```

`make restore` **replaces everything**: it drops the database, empties the
uploads volume and overwrites `.env`. It refuses to run without `CONFIRM=yes`,
and prints the archive's manifest first so you can check you are restoring what
you think. The `.env` it replaces is kept as `.env.before-restore-<timestamp>`;
the database and uploads it replaces are gone.

Afterwards, check `AUTH_URL` in `.env` before pointing DNS at the new machine.
It comes from the archive, so it still names the old host; logging in to
`/admin` fails while it is wrong.

For a snapshot with no chance of a photo being uploaded halfway through it,
stop the app first — the backup reads the volume through its own throwaway
container, so it works fine while the site is down:

```bash
docker compose stop app && make backup && docker compose start app
```

The archive is a plain `.tar`, not a `.zip`, and is not gzipped. `zip` cannot
take its entries from a pipe, so the uploads would have to be written out a
second time in full before being zipped, and with the photo quota at 10 GB on
an 18 GB disk there is no room for that. Instead the archive is streamed
straight out of the container in one pass. Gzipping it would spend minutes of
VM CPU on photos that are already compressed; the database dump, which does
compress well, is gzipped on its own inside the archive.

If the archive will not fit on the old server's disk at all, skip the disk:

```bash
bash scripts/backup.sh --stdout | ssh new 'cat > ~/werkgroepen-template/site.tar'
```

`make backup` checks for free space first and points you here if it is short.

### Adding a deployment target

1. **Prepare the directory.** On the shared host, give the site its own folder
   and check the repo out inside it:

   ```bash
   mkdir -p ~/<site>
   git clone https://github.com/VTKLeuven/werkgroepen-template.git ~/<site>/werkgroepen_template
   cd ~/<site>/werkgroepen_template
   cp .env.example .env   # then fill in real values for this subdivision
   ```

   Set `COMPOSE_PROJECT_NAME` to the site name and `APP_PORT` to a port no other
   site on the machine uses. The deploy script refuses to run if the directory is
   not a git checkout. On a brand new host, also make sure the account running
   the runner is in the `docker` group (`sudo usermod -aG docker $USER`, then log
   out and back in).

2. **Make sure the host has a runner.** One runner serves every site, so this is
   only needed on a new machine. In the repository, go to Settings → Actions →
   Runners → New self-hosted runner, pick Linux, and run the commands it shows.
   When `config.sh` asks for additional labels, give the host's label (`vtk`);
   the workflow matches on `[self-hosted, vtk]`. Then install it as a service so
   it survives a reboot:

   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

   The runner polls GitHub over outbound HTTPS, which is why this works without
   a public IP or an inbound firewall rule.

3. **Add the site to the workflow**: one entry in `TARGETS`, plus its name in
   the `workflow_dispatch` `options` list so it can be deployed on its own.
   `deploy_dir` is the absolute path from step 1, `project` matches
   `COMPOSE_PROJECT_NAME`, and `health_url` matches `APP_PORT`. Do this only
   once the runner is online: until then its job sits queued on every push to
   `main`.

4. **Point the proxy at its port** and deploy: push to `main`, or run the
   workflow manually with the new target selected.

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
- Photo albums with bulk upload, automatic compression, a cover photo, a
  draft/published state, whole-album download, and a shared storage allowance
- Partners with logo, website URL, visual ordering, and visibility

Settings and all content forms automatically adapt to the configured language
mode. Existing translations are kept when a site temporarily switches to a
single language.

## Photo albums

Albums live at `/photos`, with one page per album. In the admin, **Photos**
creates albums, uploads into them, and downloads or deletes them. Photos is a
normal entry in the header order, so it can be reordered or hidden from the
navigation like any other section — it just links to its own page instead of
scrolling to a block on the homepage. An album stays invisible to visitors until
it is published, and its photos 404 for anyone who is not signed in.

### What happens to an uploaded photo

Every upload is re-encoded on arrival; the original file is never stored.

- Scaled to fit **2560×2560**, never upscaled, EXIF rotation applied first
- Saved as progressive **mozjpeg at quality 82**
- A **640px WebP thumbnail** is saved alongside it for the grids
- All metadata is dropped, which also strips **GPS coordinates** from photos
  before they are published
- Transparency is flattened onto white instead of turning black

Measured on real 6000×6000 camera photos, a 12 MB upload is stored as roughly
200 KB, and a noisy high-ISO photo around 400 KB. The 10 GB allowance therefore
holds on the order of 25,000–50,000 photos. Uploads go a few at a time rather
than in one request, so a dropped connection costs a handful of photos instead of
the whole evening's upload.

HEIC files straight from an iPhone are rejected with a message saying so: the
prebuilt `sharp` binaries cannot decode them. Export as JPEG first.

### The storage allowance

All albums share one ceiling, `PHOTO_STORAGE_LIMIT_BYTES`, defaulting to 10 GB.
The admin shows a meter, turns it amber past 75%, red past 90%, and refuses
uploads once it is full — there is no automatic deletion, so the werkgroep
chooses what to keep. The check runs against the *compressed* size, so a photo
that fits after compression is accepted even when the original would not have
been.

Only album photos count toward it. Logos, hero images and event pictures are
`MediaAsset` rows and are small enough not to matter.

The allowance exists because the VM has 18 GB of disk in total, shared with
Postgres, the Docker images and the OS. Raising it past roughly 12 GB risks
filling the disk, which takes the whole site down rather than just refusing an
upload.

### Downloading an album

**Download album** streams a ZIP built on the fly, holding one photo in memory at
a time — a 5 GB album is never staged on disk, which would not fit anyway. The
photos are stored uncompressed inside the archive because JPEGs do not deflate,
and files keep the names they were uploaded with. Downloads require a signed-in
admin.

## Markdown

Markdown is rendered without raw HTML. The editor supports headings, bold,
italics, code blocks, links, uploaded images, lists, quotes, and horizontal
rules; uploaded images use the same persistent uploads volume as other media.
