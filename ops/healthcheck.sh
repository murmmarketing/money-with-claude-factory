#!/bin/bash
# healthcheck.sh — read-only health probe for the Idea Factory.
# Checks (a) the launchpad app's /api/health if LAUNCHPAD_HEALTH_URL is set, and
# (b) run freshness from ops/state.json. Prints a one-line status and exits 0 (ok)
# or 1 (unhealthy). Does NOT ping healthchecks.io — that dead-man ping is owned by
# run-factory.sh so the two can't fight over the schedule signal. The watchdog
# consumes this exit code.
set -uo pipefail

DIR="$HOME/money-with-claude-factory"
# shellcheck disable=SC1091
source "$DIR/.factory.env" 2>/dev/null || true
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

STATE="$DIR/ops/state.json"
STATUS="ok"
MSG=""

# (a) app health
if [ -n "${LAUNCHPAD_HEALTH_URL:-}" ]; then
  code="$(curl -fsS -m10 -o /dev/null -w '%{http_code}' "$LAUNCHPAD_HEALTH_URL" 2>/dev/null || echo 000)"
  if [ "$code" != "200" ]; then
    STATUS="degraded"; MSG="${MSG}launchpad health=$code; "
  fi
fi

# (b) run freshness (default staleness threshold 2h; override via STALE_SECONDS)
if [ -f "$STATE" ]; then
  last="$(node "$DIR/scripts/ops/state.mjs" get "$STATE" last_run_epoch 2>/dev/null || echo 0)"
  case "$last" in ''|*[!0-9]*) last=0 ;; esac
  now="$(date +%s)"
  age=$((now - last))
  thr="${STALE_SECONDS:-7200}"
  if [ "$last" -gt 0 ] && [ "$age" -gt "$thr" ]; then
    STATUS="stale"; MSG="${MSG}last run ${age}s ago (> ${thr}s); "
  fi
fi

if [ "$STATUS" = "ok" ]; then
  echo "ok"
  exit 0
fi
echo "$STATUS: ${MSG%% }"
exit 1
