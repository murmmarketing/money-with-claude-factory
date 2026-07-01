#!/bin/bash
# install.sh — (un)install the Idea Factory launchd agents.
# Usage:
#   ops/install.sh install     copy plists to ~/Library/LaunchAgents and bootstrap them
#   ops/install.sh uninstall   bootout + remove the installed plists
#   ops/install.sh status      show launchctl state for both agents
#
# Uses the modern `launchctl bootstrap`/`bootout gui/<uid>` API with a legacy
# load/unload fallback for older macOS.
set -uo pipefail

DIR="$HOME/money-with-claude-factory"
LA="$HOME/Library/LaunchAgents"
UID_N="$(id -u)"
AGENTS="com.murmweb.factory com.murmweb.watchdog"

ensure_exec() {
  chmod +x "$DIR/run-factory.sh" "$DIR/ops/watchdog.sh" "$DIR/ops/healthcheck.sh" 2>/dev/null || true
}

do_install() {
  ensure_exec
  mkdir -p "$LA"
  for a in $AGENTS; do
    cp -f "$DIR/ops/$a.plist" "$LA/$a.plist"
    launchctl bootout "gui/$UID_N/$a" 2>/dev/null || true
    if ! launchctl bootstrap "gui/$UID_N" "$LA/$a.plist" 2>/dev/null; then
      launchctl unload "$LA/$a.plist" 2>/dev/null || true
      launchctl load "$LA/$a.plist" 2>/dev/null || true
    fi
    launchctl enable "gui/$UID_N/$a" 2>/dev/null || true
    echo "installed $a"
  done
}

do_uninstall() {
  for a in $AGENTS; do
    launchctl bootout "gui/$UID_N/$a" 2>/dev/null || launchctl unload "$LA/$a.plist" 2>/dev/null || true
    rm -f "$LA/$a.plist"
    echo "removed $a"
  done
}

do_status() {
  for a in $AGENTS; do
    echo "== $a =="
    launchctl print "gui/$UID_N/$a" 2>/dev/null | grep -E 'state|last exit|program' || echo "  not loaded"
  done
}

case "${1:-}" in
  install)   do_install ;;
  uninstall) do_uninstall ;;
  status)    do_status ;;
  *) echo "usage: $0 {install|uninstall|status}"; exit 2 ;;
esac
