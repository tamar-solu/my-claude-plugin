# seedance-higgsfield

Write Seedance 2.5 video prompts and generate them on Higgsfield, from inside Claude Code.

## What's included

- **`seedance-prompt` skill**: turns a rough video idea (Hebrew or English) into one production-ready Seedance 2.5 prompt with labeled sections (global style, scene, characters, location, blocking, shot-by-shot, camera, physics, lighting, audio).
- **Higgsfield MCP server** (`https://mcp.higgsfield.ai/mcp`): image and video generation tools, authenticated with your Higgsfield account via OAuth.

## Setup

1. Install the [Higgsfield CLI](https://higgsfield.ai) and log in: `higgsfield auth login`
2. Install the plugin: `/plugin install seedance-higgsfield@tamar-solu-plugins`
3. Restart Claude Code (or `/reload-plugins`) and check `/mcp` shows `higgsfield` as connected.

The MCP server authenticates with your CLI token via `scripts/higgsfield-headers.sh`. Higgsfield's own OAuth flow in `/mcp` currently fails with a `code_challenge` error, so the CLI login is the supported path. If the CLI is logged out, the helper sends no token and Claude Code falls back to OAuth.

### Troubleshooting

- **`needs-auth` after a failed OAuth attempt:** Claude Code caches that state and skips connecting. Remove the `plugin:seedance-higgsfield:higgsfield` entry from `~/.claude/mcp-needs-auth-cache.json`, then reconnect from `/mcp`.
- **Token expired:** run `higgsfield auth login` again, then reconnect from `/mcp`.

## Usage

- `/seedance-higgsfield:seedance-prompt <your idea>`, or just describe a video idea and ask for a Seedance prompt.
- Then ask Claude to generate it with Higgsfield.

## Notes

- Generations spend Higgsfield credits. Ask Claude to check the cost before generating.
- Seedance 2.x models require a Pro or Ultimate Higgsfield plan.
