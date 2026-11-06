#!/usr/bin/env bash
# Deploys Praxis from the newest main to a server set up by setup-server.sh: fetch, pull, install if the
# lockfile changed, test, type-check, build, restart, verify.
#
# Run it on the server as root, from anywhere:
#   bash /srv/muse/deploy/deploy.sh          (or with --force to rebuild anyway)
#
# The work runs as the praxis account, which owns the app, so no file ever ends up owned by
# someone who can't change it later. It stops at the first failure, before the running service
# is touched, so a broken build never replaces a working one. Everything runs inside main() so
# that the pull, which may update this file, cannot change the script while bash reads it.

set -euo pipefail

APP_USER=${APP_USER:-praxis}
REPO_DIR=${REPO_DIR:-/srv/muse}
APP_DIR=${APP_DIR:-$REPO_DIR/praxis}
SERVICE=${SERVICE:-praxis}
PORT=${PORT:-8791}

say() { printf '\n== %s\n' "$*"; }
as_app() { sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && $*"; }

main() {
  if [ "$(id -u)" -ne 0 ]; then echo "Run this as root (or with sudo)."; exit 1; fi

  say "Fetching from GitHub"
  as_app "git fetch -q origin"
  local running newest
  running=$(as_app "git rev-parse --short HEAD")
  newest=$(as_app "git rev-parse --short origin/main")
  echo "Running now:    $(as_app "git log --oneline -1 HEAD")"
  echo "Newest on main: $(as_app "git log --oneline -1 origin/main")"
  if [ "$running" = "$newest" ] && [ "${1:-}" != "--force" ]; then
    echo "Already up to date. Run with --force to rebuild and restart anyway."
    exit 0
  fi

  say "Pulling"
  local lock_before lock_after
  lock_before=$(as_app "git rev-parse HEAD:praxis/package-lock.json")
  as_app "git pull -q --ff-only origin main"
  lock_after=$(as_app "git rev-parse HEAD:praxis/package-lock.json")

  if [ "$lock_before" != "$lock_after" ] || [ ! -d "$APP_DIR/node_modules" ]; then
    say "Installing dependencies"
    as_app "npm ci"
  fi

  say "Testing"
  as_app "npm test"
  say "Type checks"
  as_app "npm run lint"
  say "Building"
  as_app "npm run build"

  say "Restarting $SERVICE"
  systemctl restart "$SERVICE"

  say "Checking it is live"
  sleep 2
  systemctl status "$SERVICE" --no-pager --lines=3 || true
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    echo
    echo "Praxis is live at $(as_app "git log --oneline -1 HEAD"), version $(as_app "node -p \"require('./package.json').version\"")."
  else
    echo "The service restarted but did not answer. Check: journalctl -u $SERVICE -n 50"
    exit 1
  fi
}

main "$@"
