#!/bin/bash
# watchdog.sh — local backstop for the Idea Factory, run every ~15 min by launchd
# (ops/com.murmweb.watchdog.plist). Independent of run-factory.sh so it can catch a
# runner that died mid-flight.
#
# Responsibilities:
#   1. Clear a truly-stuck run lock (dead holder OR older than the run budget) — belt &
#      suspenders with run-factory's own lock logic, in case the runner never got to run.
#   2. Probe health via ops/healthcheck.sh; on failure alert Telegram and, if configured,
#      ping a SEPARATE healthchecks.io watchdog check (HC_WATCHDOG_URL) so a dead runner
#      is noticed even when run-factory never executes to send its own dead-man ping.
set -uo pipefail

DIR="$HOME/money-with-claude-factory"
# shellcheck disable=SC1091
source "$DIR/.factory.env" 2>/dev/null || true
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
# shellcheck disable=SC1091
source "$DIR/scripts/telegram.sh" 2>/dev/null || true

LOG="$DIR/cron.log"
LOCK="$DIR/.run.lock"
BUDGET=3000
wlog() { echo "$(date '+%Y-%m-%dT%H:%M:%S') [watchdog] $*" >> "$LOG"; }

# 1) stuck-lock breaker
if [ -d "$LOCK" ]; then
  opid="$(cat "$LOCK/pid" 2>/dev/null || echo '')"
  oepoch="$(cat "$LOCK/epoch" 2>/dev/null || echo 0)"
  now="$(date +%s)"
  case "$oepoch" in ''|*[!0-9]*) oepoch=0 ;; esac
  if { [ -z "$opid" ] || ! kill -0 "$opid" 2>/dev/null; } || [ "$((now - oepoch))" -gt "$BUDGET" ]; then
    rm -rf "$LOCK" 2>/dev/null || true
    wlog "cleared stuck run lock (pid='$opid' age=$((now - oepoch))s)"
    tg_send "watchdog: cleared a stuck factory run lock (pid=${opid:-none})." || true
  fi
fi

# 2) health probe
if out="$("$DIR/ops/healthcheck.sh" 2>/dev/null)"; then
  wlog "health ok"
  [ -n "${HC_WATCHDOG_URL:-}" ] && curl -fsS -m10 "$HC_WATCHDOG_URL" >/dev/null 2>&1 || true
  echo "watchdog ok"
  exit 0
else
  wlog "UNHEALTHY: $out"
  tg_send "watchdog: factory unhealthy — $out" || true
  [ -n "${HC_WATCHDOG_URL:-}" ] && curl -fsS -m10 "$HC_WATCHDOG_URL/fail" >/dev/null 2>&1 || true
  echo "watchdog: unhealthy — $out"
  exit 1
fi
