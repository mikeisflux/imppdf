#!/usr/bin/env bash
#
# One-shot rebuild + run. Pulls the latest code, installs deps only when they
# changed, builds, frees the port, and starts the server.
#
# Usage:
#   ./scripts/rebuild.sh              # pull current branch, build, start on :3000 (foreground)
#   PORT=3001 ./scripts/rebuild.sh    # start on a different port
#   ./scripts/rebuild.sh --no-pull    # skip git pull (build whatever is checked out)
#   ./scripts/rebuild.sh --bg         # start detached, logging to .rebuild.log
#   ./scripts/rebuild.sh --build-only # pull + install + build, don't start the server
#
set -euo pipefail

PORT="${PORT:-3000}"
PULL=1
BG=0
START=1
for a in "$@"; do
  case "$a" in
    --no-pull)    PULL=0 ;;
    --bg)         BG=1 ;;
    --build-only) START=0 ;;
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

# Free the port so 'next start' can bind (kills a stale server holding it).
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
