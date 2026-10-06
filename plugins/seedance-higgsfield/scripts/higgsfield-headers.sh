#!/usr/bin/env bash
# Reuse the Higgsfield CLI login as the MCP bearer token.
# Higgsfield's OAuth flow in /mcp rejects Claude Code's PKCE code_challenge,
# so the CLI token is the working auth path.
# Prints {} when no token is found, so Claude Code falls back to OAuth.

find_cli() {
  command -v higgsfield 2>/dev/null && return
  # Claude Code launched from an IDE or desktop app may not have nvm/npm bins on PATH.
  local c
  for c in "$HOME"/.nvm/versions/node/*/bin/higgsfield "$HOME"/.npm-global/bin/higgsfield \
           /usr/local/bin/higgsfield /opt/homebrew/bin/higgsfield; do
    [[ -x "$c" ]] && { echo "$c"; return; }
  done
}

token=""
cli="$(find_cli | tail -n1)"
if [[ -n "$cli" ]]; then
  # `auth token` refreshes an expired access token when possible.
  token="$(PATH="$(dirname "$cli"):$PATH" "$cli" auth token 2>/dev/null | tail -n1 | tr -d '[:space:]')"
fi

if [[ -z "$token" ]]; then
  # Last resort: read the CLI's credentials file directly, only if not expired.
  creds="${XDG_CONFIG_HOME:-$HOME/.config}/higgsfield/credentials.json"
  if [[ -r "$creds" ]] && command -v python3 >/dev/null; then
    token="$(python3 -c '
import json, sys, time
d = json.load(open(sys.argv[1]))
exp = d.get("expires_at") or 0
if exp > 1e12: exp /= 1000
if not exp or exp > time.time() + 60:
    print(d.get("access_token", ""))
' "$creds" 2>/dev/null)"
  fi
fi

if [[ "$token" =~ ^[A-Za-z0-9._~+/=-]+$ ]]; then
  printf '{"Authorization": "Bearer %s"}\n' "$token"
else
  echo '{}'
fi
