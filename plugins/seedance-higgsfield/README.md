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
- Then ask Claude to generate it. It checks your balance and the cost first, and waits for your OK.

## Notes

- Generations spend Higgsfield credits. The skill always checks the cost and asks before generating, and starts with a 5s test.
- Seedance may be gated by plan. Higgsfield reports a block before charging, and the skill offers `kling3_0_turbo` as a cheaper fallback.
- The headers helper finds the CLI even when it is not on Claude Code's PATH (nvm, npm-global, Homebrew), and falls back to reading `~/.config/higgsfield/credentials.json` if the token has not expired.

## Maintaining

Bump `version` in both `.claude-plugin/plugin.json` and the marketplace entry on every change. `claude plugin update` skips a plugin whose version is unchanged, so installs keep the old files.
