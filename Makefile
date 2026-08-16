# Operational commands for a deployed site. The real work lives in scripts/, so
# every target is also runnable by hand when a deploy needs debugging.
#
# Moving a site to another server:
#
#   old server:  make backup
#   your laptop: scp old:~/werkgroepen-template/backups/<file>.tar .
#                scp <file>.tar new:~/werkgroepen-template/
#   new server:  make restore FILE=<file>.tar CONFIRM=yes
#
# The archive holds the database, the uploads volume and .env. The code is not
# in it: the new server gets that from git.

COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help backup restore verify logs ps up down

help:
	@echo "Data:"
	@echo "  make backup                      Archive database + uploads + .env into backups/"
	@echo "  make backup BACKUP_DIR=/mnt/usb  Write the archive to another disk"
	@echo "  make verify FILE=<archive>       Show what an archive holds, change nothing"
	@echo "  make restore FILE=<archive> CONFIRM=yes"
	@echo "                                   Replace this server's data with the archive"
	@echo ""
	@echo "Containers:"
	@echo "  make up / down / ps / logs"
	@echo ""
	@echo "Restoring is destructive: it drops the database, empties the uploads"
	@echo "volume and overwrites .env. It refuses to run without CONFIRM=yes."
	@echo ""
	@echo "If the archive will not fit on this disk, send it over without"
	@echo "landing it here first:"
	@echo "  bash scripts/backup.sh --stdout | ssh new 'cat > ~/werkgroepen-template/site.tar'"

backup:
	@bash scripts/backup.sh

# Reads the manifest without touching the server, so an archive can be checked
# before it is trusted -- and before the old server is switched off.
verify:
	@test -n "$(FILE)" || { echo "usage: make verify FILE=backups/<file>.tar" >&2; exit 1; }
	@test -f "$(FILE)" || { echo "error: $(FILE) does not exist" >&2; exit 1; }
	@tar -xOf "$(FILE)" werkgroepen-backup/manifest.txt
	@echo ""
	@echo "contains $$(tar -tf '$(FILE)' | wc -l | tr -d ' ') entries, $$(du -h '$(FILE)' | cut -f1) on disk"
	@tar -tf "$(FILE)" | grep -v '^werkgroepen-backup/uploads/.' | sed 's/^/  /'

restore:
	@FILE="$(FILE)" CONFIRM="$(CONFIRM)" bash scripts/restore.sh

up:
	@$(COMPOSE) up -d --build

down:
	@$(COMPOSE) down

ps:
	@$(COMPOSE) ps

logs:
	@$(COMPOSE) logs -f --tail 100
