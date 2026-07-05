#!/usr/bin/env bash
#
# One-shot rebuild + run. Pulls the latest code, installs deps only when they
# changed, builds, then brings the app up. In production the app runs under the
# systemd service '$SERVICE' (default: impositionpdf) — if that service exists,
# this restarts it so systemd relaunches with the fresh build. Otherwise it
# frees the port and runs 'next start' directly (dev boxes).
#
# Usage:
#   ./scripts/rebuild.sh              # pull, build, restart the systemd service (or start on :3000)
#   PORT=3001 ./scripts/rebuild.sh    # manual-start mode: use a different port
#   SERVICE=myapp ./scripts/rebuild.sh# restart a differently-named systemd service
#   ./scripts/rebuild.sh --no-service # ignore systemd; free the port and run 'next start' here
#   ./scripts/rebuild.sh --no-pull    # skip git pull (build whatever is checked out)
#   ./scripts/rebuild.sh --bg         # manual-start mode: start detached, logging to .rebuild.log
#   ./scripts/rebuild.sh --build-only # pull + install + build, don't start anything
#
set -euo pipefail

PORT="${PORT:-3000}"
# Name of the systemd service that runs the app in production. When present,
# the script restarts THIS instead of launching its own server (override with
# SERVICE=… , or force a manual start with --no-service).
SERVICE="${SERVICE:-impositionpdf}"
PULL=1
BG=0
START=1
NO_SERVICE=0
for a in "$@"; do
  case "$a" in
    --no-pull)    PULL=0 ;;
    --bg)         BG=1 ;;
    --build-only) START=0 ;;
    --no-service) NO_SERVICE=1 ;;
    -h|--help)    grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown arg: $a (try --help)" >&2; exit 2 ;;
  esac
done

# Run from the repo root regardless of where this is invoked from.
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# Branch to pull. DEFAULT_BRANCH is auto-stamped by the .claude SessionStart
# hook to whatever branch work is happening on; override with BRANCH=… env,
# and it falls back to the currently checked-out branch if unset.
DEFAULT_BRANCH="claude/session-recovery-i9zkfy"
BRANCH="${BRANCH:-${DEFAULT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}}"
say() { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }

if [ "$PULL" -eq 1 ]; then
  say "Pulling latest on '$BRANCH'…"
  for i in 1 2 3 4; do
    if git pull origin "$BRANCH"; then break; fi
    echo "  push/pull failed, retry $i…"; sleep $((2 ** i))
  done
fi

# Install dependencies only when node_modules is missing or the lockfile is newer.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  say "Installing dependencies…"
  npm install
else
  say "Dependencies already up to date — skipping install."
fi

say "Building…"
npm run build

if [ "$START" -eq 0 ]; then
  say "Build complete (--build-only, not starting the server)."
  exit 0
fi

# In production the app runs under systemd. If that service exists, restart IT
# so systemd relaunches with the fresh build — never launch a second server,
# which would just lose the race for the port. (--no-service forces manual.)
if [ "$NO_SERVICE" -eq 0 ] && command -v systemctl >/dev/null 2>&1 && systemctl cat "$SERVICE" >/dev/null 2>&1; then
  SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
  say "Restarting systemd service '$SERVICE'…"
  $SUDO systemctl restart "$SERVICE"
  sleep 1
  if systemctl is-active --quiet "$SERVICE"; then
    say "'$SERVICE' is live — https://impositionpdf.com/app   (logs: journalctl -u $SERVICE -f)"
  else
    echo "  '$SERVICE' did not come up — check: journalctl -u $SERVICE -n 50" >&2
    exit 1
  fi
  exit 0
fi

# No service manager: free the port so 'next start' can bind (kills a stale
# server holding it), then start directly.
say "Freeing port $PORT…"
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -ti "tcp:${PORT}" | xargs -r kill 2>/dev/null || true
fi
sleep 1

if [ "$BG" -eq 1 ]; then
  say "Starting in background on http://localhost:${PORT}  (logs → .rebuild.log)"
  PORT="$PORT" nohup npm start > "$ROOT/.rebuild.log" 2>&1 &
  echo $! > "$ROOT/.rebuild.pid"
  say "Started as PID $(cat "$ROOT/.rebuild.pid"). Tail logs:  tail -f .rebuild.log"
else
  say "Starting on http://localhost:${PORT}/app  (Ctrl+C to stop)"
  PORT="$PORT" npm start
fi
