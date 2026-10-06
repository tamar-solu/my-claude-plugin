#!/usr/bin/env bash
# Reuse the Higgsfield CLI login as the MCP bearer token.
# Prints {} when the CLI is missing or logged out, so Claude Code falls back to OAuth.
token="$(higgsfield auth token 2>/dev/null | tail -n1 | tr -d '[:space:]')"
if [[ "$token" =~ ^[A-Za-z0-9._~+/=-]+$ ]]; then
  printf '{"Authorization": "Bearer %s"}\n' "$token"
else
  echo '{}'
fi
