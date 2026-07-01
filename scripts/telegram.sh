# shellcheck shell=bash
# Telegram helper functions for the Idea Factory ops layer.
# Source this AFTER loading TG_TOKEN / TG_CHAT (e.g. from .factory.env).
# Design rules:
#   - Never print the bot token.
#   - Every function is a safe no-op (returns 0) when creds are absent, so ops
#     scripts degrade gracefully on a box without Telegram configured.
#   - Uses only curl (no jq required) so it works under launchd's minimal env.

_tg_base() { printf 'https://api.telegram.org/bot%s' "${TG_TOKEN:-}"; }

tg_ok() { [ -n "${TG_TOKEN:-}" ] && [ -n "${TG_CHAT:-}" ]; }

# tg_send "text"
tg_send() {
  tg_ok || return 0
  curl -fsS -m20 -X POST "$(_tg_base)/sendMessage" \
    --data-urlencode "chat_id=${TG_CHAT}" \
    --data-urlencode "text=$1" \
    -d "disable_web_page_preview=true" >/dev/null 2>&1 || return 1
}

# tg_send_doc /path/to/file [caption]
tg_send_doc() {
  tg_ok || return 0
  local f="$1" cap="${2:-}"
  [ -f "$f" ] || return 1
  curl -fsS -m180 -X POST "$(_tg_base)/sendDocument" \
    -F "chat_id=${TG_CHAT}" \
    -F "document=@${f}" \
    -F "caption=${cap}" >/dev/null 2>&1 || return 1
}

# tg_edit message_id "text"
tg_edit() {
  tg_ok || return 0
  curl -fsS -m20 -X POST "$(_tg_base)/editMessageText" \
    --data-urlencode "chat_id=${TG_CHAT}" \
    --data-urlencode "message_id=$1" \
    --data-urlencode "text=$2" >/dev/null 2>&1 || return 1
}

# tg_pin message_id
tg_pin() {
  tg_ok || return 0
  curl -fsS -m20 -X POST "$(_tg_base)/pinChatMessage" \
    --data-urlencode "chat_id=${TG_CHAT}" \
    --data-urlencode "message_id=$1" >/dev/null 2>&1 || return 1
}

# tg_get_chat  -> prints raw getChat JSON on stdout
tg_get_chat() {
  tg_ok || return 0
  curl -fsS -m20 "$(_tg_base)/getChat?chat_id=${TG_CHAT}" 2>/dev/null
}

# tg_get_updates [offset]  -> prints raw getUpdates JSON on stdout
tg_get_updates() {
  tg_ok || return 0
  local off="${1:-}"
  if [ -n "$off" ]; then
    curl -fsS -m20 "$(_tg_base)/getUpdates?offset=${off}" 2>/dev/null
  else
    curl -fsS -m20 "$(_tg_base)/getUpdates" 2>/dev/null
  fi
}
