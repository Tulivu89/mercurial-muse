#!/usr/bin/env bash
# Deploys Inkwyrm from the newest main to a server set up by setup-server.sh: fetch, pull, install if
# the lockfile changed, test, type-check, build, install the service file, restart, verify.
#
# Run it on the server as root, from anywhere:
#   bash /srv/muse/deploy/deploy.sh          (or with --force to rebuild anyway)
#
# The work runs as the praxis account, which owns the app, so no file ever ends up owned by
# someone who can't change it later. It stops at the first failure, before the running service
# is touched, so a broken build never replaces a working one. Everything runs inside main() so
# that the pull, which may update this file, cannot change the script while bash reads it.
#
# It also moves a server from before 0.22.0 (the app in praxis/, the `praxis` service) onto the
# current layout (adventure/ and core/ under one install, the `inkwyrm` service), once.

set -euo pipefail

APP_USER=${APP_USER:-praxis}
REPO_DIR=${REPO_DIR:-/srv/muse}
SERVICE=${SERVICE:-inkwyrm}
OLD_SERVICE=praxis
PORT=${PORT:-8791}
UNIT=/etc/systemd/system/$SERVICE.service

say() { printf '\n== %s\n' "$*"; }
as_app() { sudo -u "$APP_USER" bash -c "cd '$REPO_DIR' && $*"; }
lock_hash() { as_app "git rev-parse HEAD:package-lock.json 2>/dev/null || echo none"; }

main() {
  if [ "$(id -u)" -ne 0 ]; then echo "Run this as root (or with sudo)."; exit 1; fi

  say "Fetching from GitHub"
  as_app "git fetch -q origin"
  local running newest force=${1:-}
  running=$(as_app "git rev-parse --short HEAD")
  newest=$(as_app "git rev-parse --short origin/main")
  echo "Running now:    $(as_app "git log --oneline -1 HEAD")"
  echo "Newest on main: $(as_app "git log --oneline -1 origin/main")"
  if [ ! -f "$UNIT" ]; then
    echo "This server still has the layout from before 0.22.0; moving it over."
    force=--force
  fi
  if [ "$running" = "$newest" ] && [ "$force" != "--force" ]; then
    echo "Already up to date. Run with --force to rebuild and restart anyway."
    exit 0
  fi

  say "Pulling"
  local lock_before lock_after
  lock_before=$(lock_hash)
  as_app "git pull -q --ff-only origin main"
  lock_after=$(lock_hash)

  if [ "$lock_before" != "$lock_after" ] || [ ! -d "$REPO_DIR/node_modules" ]; then
    say "Installing dependencies"
    as_app "npm ci"
  fi

  say "Testing"
  as_app "npm test"
  say "Type checks"
  as_app "npm run lint"
  say "Building"
  as_app "npm run build"

  if ! cmp -s "$REPO_DIR/deploy/$SERVICE.service" "$UNIT"; then
    say "Installing the $SERVICE service"
    install -m 644 "$REPO_DIR/deploy/$SERVICE.service" "$UNIT"
    systemctl daemon-reload
    systemctl enable "$SERVICE" >/dev/null 2>&1
  fi

  if [ -f "/etc/systemd/system/$OLD_SERVICE.service" ]; then
    say "Retiring the old $OLD_SERVICE service"
    systemctl disable --now "$OLD_SERVICE" >/dev/null 2>&1 || true
    rm -f "/etc/systemd/system/$OLD_SERVICE.service"
    systemctl daemon-reload
  fi
  if [ -d "$REPO_DIR/praxis" ] && [ -z "$(as_app "git ls-files praxis")" ]; then
    rm -rf "$REPO_DIR/praxis"
  fi

  say "Restarting $SERVICE"
  systemctl restart "$SERVICE"

  say "Checking it is live"
  sleep 2
  systemctl status "$SERVICE" --no-pager --lines=3 || true
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    echo
    echo "Inkwyrm is live at $(as_app "git log --oneline -1 HEAD"), adventure $(as_app "node -p \"require('./adventure/package.json').version\"")."
  else
    echo "The service restarted but did not answer. Check: journalctl -u $SERVICE -n 50"
    exit 1
  fi
}

main "$@"
