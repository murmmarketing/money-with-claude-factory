#!/bin/bash
# Idea Factory local runner — invoked hourly by cron.
# Runs Claude Code headless to build + deliver the next batch of kits to Telegram.
set -uo pipefail
DIR="$HOME/money-with-claude-factory"
cd "$DIR" || exit 1

# Load Telegram creds into the environment (claude's Bash tool inherits these).
# shellcheck disable=SC1091
source "$DIR/.factory.env"

# Make sure `claude` and common tools are on PATH under cron's minimal env.
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

echo "===== $(date) run start =====" >> "$DIR/cron.log"

# Refresh state/instructions from the repo (best-effort).
git pull -q 2>>"$DIR/cron.log"

PROMPT='Execute exactly ONE Idea Factory run. Read AGENTS.md at the repo root and follow ALL steps precisely, INCLUDING Step 0 (read & obey the owner Telegram commands via getUpdates).

Telegram credentials are already exported as shell env vars: $TG_TOKEN and $TG_CHAT. In every curl, use BASE=https://api.telegram.org/bot$TG_TOKEN. Do not print the token.

Steps: (1) getChat -> read pinned config (DONE/BATCH/PAUSED/SKIP/NEXT/LASTUPD; defaults if absent, pinned message id noted). (2) getUpdates -> obey any command messages with update_id>LASTUPD (status/pause/resume/batch N/skip/unskip/do/next; cadence commands -> just explain you cannot change cron), acknowledge each, update LASTUPD, rewrite pinned config via editMessageText. (3) If PAUSED=yes, send the paused note and STOP. (4) Otherwise pick the next BATCH ids (NEXT first, then data/run-order.json, excluding DONE and SKIP). (5) Build a REAL launchable kit per id in kits/<id>/ per AGENTS.md (real artifacts, not descriptions). (6) Deliver each: sendMessage summary + zip the folder and sendDocument the zip. (7) Add delivered ids to DONE, rewrite pinned config, send the final tally. (8) git add/commit/push best-effort. Only mark an id DONE after its delivery succeeds.'

claude -p "$PROMPT" --dangerously-skip-permissions --output-format text >> "$DIR/cron.log" 2>&1

echo "===== $(date) run end =====" >> "$DIR/cron.log"
