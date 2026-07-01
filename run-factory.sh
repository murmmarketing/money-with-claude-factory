#!/bin/bash
# Idea Factory local runner — invoked hourly by launchd (see ops/com.murmweb.factory.plist).
#
# Self-healing / fail-closed by design (this Mac has NO `timeout`, `gtimeout`, or `flock`):
#   O1  atomic mkdir lock + whole-run wall-clock timeout via a killer subshell + healthchecks.io
#       dead-man ping (start + exit-code) + cron.log rotation.
#   O2  cost/kill circuit-breaker: parse KILL/CAP_USD from the pinned Telegram config, meter real
#       spend from claude's JSON output into a gitignored ledger, enforce a per-day cap, fail-closed.
#   O3  gated pipeline: export DataForSEO/Meta/Reddit/Supabase creds so claude's Bash inherits them,
#       and instruct the run (via PROMPT) to run Step 1.5 validation BEFORE any build and the
#       post-launch compute_scores/portfolio-stop gate.
set -uo pipefail

DIR="$HOME/money-with-claude-factory"
cd "$DIR" || exit 1

# --- Load creds/config; everything we export here is inherited by claude's Bash tool. ---
# shellcheck disable=SC1091
source "$DIR/.factory.env" 2>/dev/null || true
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Make Telegram + factory + validation-pipeline creds visible to claude's Bash (O3).
# These are marked for export even if unset (empty) so nothing hard-fails before .factory.env
# is fully populated — validate.mjs / score.mjs degrade gracefully on missing tokens.
export TG_TOKEN TG_CHAT \
  FACTORY_SUPABASE_URL FACTORY_SUPABASE_ANON_KEY FACTORY_SERVICE_ROLE_KEY \
  DATAFORSEO_LOGIN DATAFORSEO_PASSWORD META_AD_LIBRARY_TOKEN REDDIT_UA \
  HC_URL 2>/dev/null || true

LOG="$DIR/cron.log"
STATE="$DIR/ops/state.json"
LEDGER="$DIR/ledger.jsonl"
BUDGET=3000   # whole-run wall-clock budget (~50 min); also the lock-staleness TTL.

log() { echo "$(date '+%Y-%m-%dT%H:%M:%S') $*" >> "$LOG"; }

# --- O1: log rotation — keep cron.log under ~5MB. ---
if [ -f "$LOG" ] && [ "$(stat -f%z "$LOG" 2>/dev/null || echo 0)" -gt 5242880 ]; then
  mv -f "$LOG" "$LOG.1" 2>/dev/null || true
fi

# --- O1: atomic lock. mkdir is atomic on POSIX; break a held lock ONLY if the holder is dead
#         (kill -0 fails) OR it has exceeded BUDGET (crashed without cleaning up). ---
LOCK="$DIR/.run.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  opid="$(cat "$LOCK/pid" 2>/dev/null || echo '')"
  oepoch="$(cat "$LOCK/epoch" 2>/dev/null || echo 0)"
  now="$(date +%s)"
  stale=0
  if [ -z "$opid" ] || ! kill -0 "$opid" 2>/dev/null; then stale=1; fi
  if [ "$((now - ${oepoch:-0}))" -gt "$BUDGET" ]; then stale=1; fi
  if [ "$stale" = "1" ]; then
    log "breaking stale lock (pid='$opid' age=$((now - ${oepoch:-0}))s)"
    rm -rf "$LOCK"
    mkdir "$LOCK" 2>/dev/null || { log "lock race lost — exiting"; exit 0; }
  else
    log "run already in progress (pid=$opid) — exiting"
    exit 0
  fi
fi
echo "$$" > "$LOCK/pid"
date +%s > "$LOCK/epoch"

# RC + OUT are shared across O1/O2. RC is what we report to healthchecks.io on exit.
RC=0
OUT=""
# EXIT trap: release the lock, clean the temp file, and fire the dead-man ping with the outcome.
# (RC="fail" for a tripped breaker -> pings HC_URL/fail; a number -> HC treats 0 as up, nonzero down.)
trap '
  rm -rf "$LOCK" 2>/dev/null || true
  [ -n "${OUT:-}" ] && rm -f "$OUT" 2>/dev/null || true
  [ -n "${HC_URL:-}" ] && curl -fsS -m10 "$HC_URL/${RC:-0}" >/dev/null 2>&1 || true
' EXIT

log "===== run start (pid=$$) ====="
[ -n "${HC_URL:-}" ] && curl -fsS -m10 "$HC_URL/start" >/dev/null 2>&1 || true

# Telegram helpers (used for the circuit-breaker heartbeat).
# shellcheck disable=SC1091
source "$DIR/scripts/telegram.sh" 2>/dev/null || true

# --- Refresh state/instructions from the repo (best-effort). ---
git pull -q 2>>"$LOG" || log "git pull failed (continuing)"

# --- O2: cost/kill circuit-breaker (fail-closed). Parse pinned config (non-LLM node), then
#         sum today's real spend from the ledger. Defaults: KILL=no, CAP_USD=5. ---
KILL="no"; CAP_USD="5"; PORTFOLIO_STOP="no"; PAUSED_CFG="no"
CHAT_JSON="$(tg_get_chat 2>/dev/null || echo '')"
if [ -n "$CHAT_JSON" ]; then
  CFG_EVAL="$(printf '%s' "$CHAT_JSON" | node "$DIR/scripts/ops/parse-config.mjs" 2>/dev/null || echo '')"
  [ -n "$CFG_EVAL" ] && eval "$CFG_EVAL"
fi
# Harden CAP_USD to a plain number (default 5).
case "$CAP_USD" in ''|*[!0-9.]*) CAP_USD="5" ;; esac

TODAY="$(date +%Y-%m-%d)"
TODAY_TOTAL="$(node "$DIR/scripts/ops/ledger.mjs" today "$LEDGER" "$TODAY" 2>/dev/null || echo 0)"

TRIP=""
if [ "$KILL" = "yes" ]; then
  TRIP="KILL switch is on"
elif [ "$PORTFOLIO_STOP" = "yes" ]; then
  TRIP="portfolio-stop is set (a winner is promoting — intake frozen)"
else
  OVER="$(node -e 'const t=Number(process.argv[1])||0,c=Number(process.argv[2])||0;process.stdout.write(c>0&&t>=c?"1":"0")' "$TODAY_TOTAL" "$CAP_USD" 2>/dev/null || echo 0)"
  [ "$OVER" = "1" ] && TRIP="daily cap reached (\$$TODAY_TOTAL >= \$$CAP_USD)"
fi

if [ -n "$TRIP" ]; then
  RC="fail"   # EXIT trap will ping HC_URL/fail
  log "circuit-breaker tripped: $TRIP — NOT invoking claude"
  tg_send "Factory circuit-breaker tripped: $TRIP. Skipping this run (no build)." || true
  node "$DIR/scripts/ops/state.mjs" set "$STATE" \
    last_run_epoch "$(date +%s)" last_run_ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    last_rc "breaker" last_cost 0 today_total "$TODAY_TOTAL" cap_usd "$CAP_USD" \
    kill "$KILL" portfolio_stop "$PORTFOLIO_STOP" >/dev/null 2>&1 || true
  exit 0
fi

# --- O3: the gated run prompt. Step 1.5 validation is a HARD gate before any build. ---
PROMPT='Execute exactly ONE Idea Factory run. Read AGENTS.md at the repo root and follow ALL steps precisely, INCLUDING Step 0 (read & obey owner Telegram commands via getUpdates) and the GATED validation flow below.

Telegram credentials are exported as env vars: $TG_TOKEN and $TG_CHAT. In every curl use BASE=https://api.telegram.org/bot$TG_TOKEN. Never print the token. Validation creds are also exported (DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD, META_AD_LIBRARY_TOKEN, REDDIT_UA) and Supabase service access (FACTORY_SUPABASE_URL, FACTORY_SERVICE_ROLE_KEY).

Flow:
(1) getChat -> read the pinned config (DONE/BATCH/PAUSED/SKIP/NEXT/LASTUPD, plus KILL/CAP_USD/PORTFOLIO_STOP; defaults if absent). (2) getUpdates -> obey commands with update_id>LASTUPD (status/pause/resume/batch N/skip/unskip/do/next; cadence commands -> explain you cannot change the schedule), acknowledge each, update LASTUPD, rewrite the pinned config via editMessageText. (3) If PAUSED=yes OR PORTFOLIO_STOP=yes, send the note and STOP (no build). (4) Otherwise pick the next BATCH candidate ids (NEXT first, then data/run-order.json, excluding DONE and SKIP).

(1.5) VALIDATION GATE — for EACH candidate id, run `node docs/pipeline/validate.mjs <id>` then `node scripts/verify/score.mjs kits/<id>/evidence/validation.json`, and branch on the scorer exit code:
  - 20 / KILL   -> add the id to a DEAD list; DO NOT build it.
  - 10 / LANDING -> landing-only path: build the kit + a DB-driven landing page, NO full tool.
  - 0  / FULL   -> full build (kit + tool/digital deliverable + landing page).
  - exit 2 / FLAG (or any error) -> SKIP this id this run, log the error class, DO NOT mark it DONE and DO NOT build.
HARD RULE: never build an id without a passing kits/<id>/evidence/validation.json. Only tool (programmatic-SEO/calculator) and digital (download) idea types are eligible for a full build. Everything stays noindex.

(2-3) Build the real, launchable deliverable per the scorer verdict, then run STEP 2.5 verify, then deliver over Telegram (summary + zip via sendDocument). (4) Add only successfully-delivered ids to DONE and rewrite the pinned config.

POST-LAUNCH GATE (after delivery): call the Supabase RPC compute_scores with the service-role key, then read scores WHERE state='PROMOTE'. If that result is non-empty, set PORTFOLIO_STOP=yes in the pinned config to freeze intake (a winner is being promoted) and notify the owner. (5) git add/commit/push best-effort. Only mark an id DONE after its delivery succeeds.'

# --- O1+O2: launch claude in its OWN process group so a killer subshell can enforce the
#            whole-run timeout (no `timeout` binary here), and capture JSON to meter spend. ---
set -m
OUT="$(mktemp -t factory_out)"
claude -p "$PROMPT" --dangerously-skip-permissions --output-format json >"$OUT" 2>>"$LOG" &
CLAUDE_PID=$!
# Under `set -m`, the async job is its own process-group leader (pgid == CLAUDE_PID),
# so kill -TERM -$CLAUDE_PID signals claude AND every child it spawned.
( sleep "$BUDGET"; kill -TERM -"$CLAUDE_PID" 2>/dev/null; sleep 10; kill -KILL -"$CLAUDE_PID" 2>/dev/null ) &
KILLER=$!
wait "$CLAUDE_PID"; RC=$?
kill -TERM -"$KILLER" 2>/dev/null || true   # cancel the pending timeout kill + its sleep group
kill "$KILLER" 2>/dev/null || true
set +m

if [ "${RC:-0}" -ge 124 ] 2>/dev/null; then
  log "claude run terminated by whole-run timeout (rc=$RC)"
fi

# --- O2: meter real spend from claude's JSON result and append to the gitignored ledger. ---
COST="$(node "$DIR/scripts/ops/ledger.mjs" append "$LEDGER" "$OUT" "$RC" 2>/dev/null || echo 0)"
TODAY_TOTAL="$(node "$DIR/scripts/ops/ledger.mjs" today "$LEDGER" "$TODAY" 2>/dev/null || echo "$TODAY_TOTAL")"
log "run cost \$$COST · today \$$TODAY_TOTAL / cap \$$CAP_USD · rc=$RC"

# --- Persist ops state for the watchdog / healthcheck. ---
node "$DIR/scripts/ops/state.mjs" set "$STATE" \
  last_run_epoch "$(date +%s)" last_run_ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  last_rc "$RC" last_cost "$COST" today_total "$TODAY_TOTAL" cap_usd "$CAP_USD" \
  kill "$KILL" portfolio_stop "$PORTFOLIO_STOP" >/dev/null 2>&1 || true

log "===== run end (rc=$RC) ====="
# The EXIT trap pings healthchecks.io with $RC (the real claude outcome), then releases the lock.
exit 0
