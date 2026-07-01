#!/bin/bash
# Dogfood scheduler entry — invoked hourly by launchd (com.murmweb.factory.plist).
# Lean + fail-safe: atomic lock, PAUSED/KILL check from the pinned Telegram config,
# whole-run timeout (this Mac has no `timeout`/`flock`), healthchecks.io ping.
# The actual work is ops/dogfood.mjs (deterministic; LLM only for content generation).
set -uo pipefail

DIR="$HOME/money-with-claude-factory"
cd "$DIR" || exit 1
# shellcheck disable=SC1091
source "$DIR/.factory.env" 2>/dev/null || true
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export TG_TOKEN TG_CHAT FACTORY_SUPABASE_URL FACTORY_SERVICE_ROLE_KEY HC_URL 2>/dev/null || true

LOG="$DIR/cron.log"; LOCK="$DIR/.run.lock"; BUDGET=900
log(){ echo "$(date '+%Y-%m-%dT%H:%M:%S') dogfood: $*" >> "$LOG"; }

# log rotation (keep < 5MB)
if [ -f "$LOG" ] && [ "$(stat -f%z "$LOG" 2>/dev/null || echo 0)" -gt 5242880 ]; then mv -f "$LOG" "$LOG.1"; fi

# atomic lock; break only if holder is dead or older than BUDGET
if ! mkdir "$LOCK" 2>/dev/null; then
  opid="$(cat "$LOCK/pid" 2>/dev/null || echo '')"; oep="$(cat "$LOCK/epoch" 2>/dev/null || echo 0)"; now="$(date +%s)"
  if { [ -z "$opid" ] || ! kill -0 "$opid" 2>/dev/null; } || [ "$((now - ${oep:-0}))" -gt "$BUDGET" ]; then
    rm -rf "$LOCK"; mkdir "$LOCK" 2>/dev/null || { log "lock race — exit"; exit 0; }
  else log "busy (pid=$opid) — exit"; exit 0; fi
fi
echo "$$" > "$LOCK/pid"; date +%s > "$LOCK/epoch"
RC=0
trap 'rm -rf "$LOCK" 2>/dev/null || true; [ -n "${HC_URL:-}" ] && curl -fsS -m10 "$HC_URL/${RC}" >/dev/null 2>&1 || true' EXIT
[ -n "${HC_URL:-}" ] && curl -fsS -m10 "$HC_URL/start" >/dev/null 2>&1 || true

git pull -q 2>>"$LOG" || log "git pull failed (continuing)"

# dogfood.mjs processes Telegram commands (pause/resume/batch) and honors the paused
# gate itself — always invoke it so `resume` can never deadlock behind a pre-gate.
log "run start"
node "$DIR/ops/dogfood.mjs" >> "$LOG" 2>&1 &
NPID=$!
( sleep "$BUDGET"; kill -TERM "$NPID" 2>/dev/null; sleep 5; kill -KILL "$NPID" 2>/dev/null ) & KP=$!
wait "$NPID"; RC=$?
kill "$KP" 2>/dev/null || true
log "run end rc=$RC"
