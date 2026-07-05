#!/bin/bash
# ============================================================================
# botblock-watcher.sh
#
# Host-side firewall watcher for ImpositionPDF's bot blocker. Watches the
# pending file that the app appends blocked IPs to and adds iptables DROP
# rules within seconds, and on startup restores all currently-blocked IPs
# from the SQLite database.
#
# Adapted from the printingcomics watcher (which read PostgreSQL) to this
# app's better-sqlite3 store.
#
# Install as a systemd service (recommended):
#   sudo cp scripts/botblock-watcher.service /etc/systemd/system/
#   sudo systemctl enable --now botblock-watcher
#
# Config via /etc/default/botblock-watcher (EnvironmentFile), e.g.:
#   BOTBLOCK_DB=/opt/pdfpress/app/data/impositionpdf.db
#   BOTBLOCK_PENDING_FILE=/tmp/botblock-pending
# ============================================================================
set -uo pipefail

CHAIN="BOTBLOCK"
PENDING_FILE="${BOTBLOCK_PENDING_FILE:-/tmp/botblock-pending}"
DB="${BOTBLOCK_DB:-/opt/pdfpress/app/data/impositionpdf.db}"
INTERVAL="${BOTBLOCK_INTERVAL:-5}"          # seconds between checks
LOG_PREFIX="[BotBlock-Watcher]"

log() { echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') $LOG_PREFIX $*"; }

[ "$(id -u)" -eq 0 ] || { echo "$LOG_PREFIX must run as root" >&2; exit 1; }
command -v iptables >/dev/null || { echo "$LOG_PREFIX iptables not found" >&2; exit 1; }
command -v sqlite3  >/dev/null || log "sqlite3 CLI not found — startup DB restore disabled"

valid_ip() { [[ "$1" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; }

drop_ip() {
  local ip="$1"
  valid_ip "$ip" || { log "SKIP invalid IP: $ip"; return; }
  iptables -C "$CHAIN" -s "$ip/32" -j DROP 2>/dev/null && return
  iptables -A "$CHAIN" -s "$ip/32" -j DROP && log "BLOCKED $ip"
}

# Ensure our chain exists and INPUT jumps to it.
iptables -n -L "$CHAIN" >/dev/null 2>&1 || { log "Creating chain $CHAIN"; iptables -N "$CHAIN"; }
iptables -C INPUT -j "$CHAIN" 2>/dev/null || { log "Linking INPUT -> $CHAIN"; iptables -I INPUT -j "$CHAIN"; }

# Startup: restore still-active blocked IPs from the SQLite DB (expires_at in ms).
if command -v sqlite3 >/dev/null && [ -f "$DB" ]; then
  now_ms=$(( $(date +%s) * 1000 ))
  restored=0
  while IFS= read -r ip; do
    [ -z "$ip" ] && continue
    drop_ip "$ip" && ((restored++)) || true
  done < <(sqlite3 "$DB" "SELECT ip_address FROM blocked_ips WHERE expires_at > $now_ms;" 2>/dev/null)
  log "Startup restore complete (${restored} new rules)"
else
  log "No SQLite DB at $DB — skipping startup restore"
fi

log "Watching $PENDING_FILE every ${INTERVAL}s"
while true; do
  if [ -s "$PENDING_FILE" ]; then
    WORK="/tmp/botblock-processing.$$"
    if mv "$PENDING_FILE" "$WORK" 2>/dev/null; then
      sort -u "$WORK" | while IFS= read -r ip; do [ -n "$ip" ] && drop_ip "$ip"; done
      rm -f "$WORK"
    fi
  fi
  systemd-notify WATCHDOG=1 2>/dev/null || true
  sleep "$INTERVAL"
done
