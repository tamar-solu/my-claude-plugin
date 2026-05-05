# repo-setup

A Claude Code plugin that bootstraps a freshly cloned repository end-to-end.

## Why

Getting a new repo to a working state usually means hunting through a README, guessing at the right install commands, copying `.env.example`, and chasing errors one by one. This plugin automates that loop and only stops to ask you for things a human genuinely must provide (real API keys, account passwords).

## What it does

- Reads the docs in priority order: `CLAUDE.md`, `README`, `CONTRIBUTING.md`, `docs/`, `Makefile`, `docker-compose.yml`, `.env.example`
- Detects the tech stack and picks the right install/build/run commands
- Installs dependencies and configures the environment
- Auto-generates values that can be generated (random secrets, local URLs, ports)
- Writes `.env` with clear `FILL_ME_IN` placeholders for true secrets and tells you exactly which lines to edit in your editor (never asks for secrets in chat)
- Resolves errors as they come up and verifies the project runs (dev server, tests, or equivalent)

## Usage

In a freshly cloned repo, run:

```
/repo-setup
```

The plugin will orient itself, summarize the project, and walk through setup. You'll only be prompted for credentials that genuinely require a human.
