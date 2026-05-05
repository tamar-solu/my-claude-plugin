---
name: repo-setup
description: Set up a newly cloned repository from scratch. Reads documentation, detects the tech stack, runs install/setup commands, auto-generates secrets, resolves errors, and verifies the project is working. Asks the user only for credentials that cannot be generated. Use when you've just cloned a repo and need to get it running.
---

# Repo Setup

Bootstrap a freshly cloned repository end-to-end: read the docs, detect the stack, install dependencies, configure the environment, auto-generate what can be generated, and fix any errors that arise. The user's only job is to provide credentials that genuinely require a human (API keys, account passwords). Everything else is handled automatically.

## Goal

Get the repository to a working state with minimal manual intervention. This means: dependencies installed, environment configured, dev server or tests running successfully.

---

## SECURITY RULE — Read this before Step 5

**Never ask the user to share secret values in the chat.** API keys, passwords, tokens, and private keys sent in a chat message are a security risk (they appear in logs, history, and context). Instead:

- You classify each variable (auto-generate vs. user-must-fill).
- For user-must-fill variables, you write the `.env` file with a clear `FILL_ME_IN` placeholder and tell the user **exactly which file to open and which lines to edit** — in their editor, not in the chat.
- You never ask "what is your OpenAI API key?" in a message. You never echo or print a secret value the user has provided.

---

## Instructions

### Step 1 — Orient yourself

1. Identify the current working directory (the repo root).
2. List top-level files and directories.
3. Check if there is a `CLAUDE.md` at the repo root — if yes, read it first. It may contain project-specific setup instructions that override everything below.

---

### Step 2 — Read the documentation

Read ALL of the following that exist (in this priority order):

1. `CLAUDE.md` (already done in Step 1 if present)
2. `README.md` / `README.rst` / `README` — read the **entire file**, do not skim.
3. `CONTRIBUTING.md` — setup instructions for contributors.
4. `docs/` folder — look for `setup.md`, `development.md`, `getting-started.md`, or similar.
5. `Makefile` — list all targets with `make help` or `cat Makefile`.
6. `docker-compose.yml` / `docker-compose.yaml` — understand required services.
7. `.env.example` / `.env.sample` — the most important file: read every variable.

Summarize your findings in a brief "Project Overview" before proceeding:
- What does this project do?
- What tech stack does it use?
- What external services does it depend on (DB, Redis, queues, third-party APIs)?
- What are the setup steps described in the docs?

---

### Step 3 — Detect the tech stack

Identify the package manager and runtime based on files present:

| File present | Stack / Package manager |
|---|---|
| `pyproject.toml` with `uv.lock` or `.python-version` | Python + uv |
| `pyproject.toml` + `poetry.lock` | Python + poetry |
| `requirements.txt` / `setup.py` | Python + pip |
| `package.json` + `package-lock.json` | Node.js + npm |
| `package.json` + `yarn.lock` | Node.js + yarn |
| `package.json` + `pnpm-lock.yaml` | Node.js + pnpm |
| `package.json` + `bun.lockb` | Node.js + bun |
| `Cargo.toml` | Rust + cargo |
| `go.mod` | Go + go modules |
| `Gemfile` | Ruby + bundler |
| `build.gradle` / `pom.xml` | Java (Gradle / Maven) |

If multiple stacks exist (e.g. monorepo with Python backend + Node.js frontend), list all and handle each.

---

### Step 4 — Check prerequisites

Before installing, verify the required runtimes are available:

- **Python**: `python --version` or `python3 --version`
- **Node.js**: `node --version` and `npm --version`
- **Docker**: `docker --version` and `docker compose version` (if docker-compose.yml exists)
- **Other tools** mentioned in the README (e.g. `uv`, `poetry`, `cargo`, `go`, `openssl`)

If a required tool is missing:
1. Tell the user exactly what is missing.
2. Provide the install command or link from the official docs.
3. **Stop and ask the user to install the missing tool**, then re-run the skill.

Do NOT attempt to install system-level tools or runtimes silently.

---

### Step 5 — Classify and configure environment variables

This is the most important step. Read the `.env.example` thoroughly and classify **every variable** into one of three buckets before touching the `.env` file.

#### Bucket A — Auto-generate (you do this, silently)

Variables whose value is a random secret used only internally (salts, JWTs, session secrets, internal DB passwords, signing keys). You can identify these by:
- Name contains: `SECRET`, `SALT`, `KEY` (when not an external API key), `TOKEN` (when internal), `HASH`, `PASSWORD` (when for an internal service like a local DB, Grafana, internal admin accounts)
- The README shows a generation command like `openssl rand -base64 32` or `uuidgen`
- The value is not tied to an external account (you don't need to "log in somewhere" to get it)

Generate these automatically:
```bash
openssl rand -base64 32   # for secrets/salts/signing keys
openssl rand -hex 32      # alternative for hex-encoded secrets
uuidgen                   # for UUID-style tokens
```

Write the generated values directly into `.env`. **Do not print them in chat output.**

#### Bucket B — Derive or default (you do this)

Variables that have a sensible default, can be inferred from other config, or are documented with a standard value:
- Ports (`BACKEND_PORT=8000`, `MONGODB_PORT=27017`)
- Hostnames for Docker internal services (`MONGODB_HOST=mongodb`, `REDIS_HOST=redis`)
- Feature flags that can be `false` to start (`SLM_ENABLED=false`, `VISION_ENABLED=false`)
- Log levels (`LOG_LEVEL=INFO`)
- Node env (`NODE_ENV=development`)
- URLs that are localhost + a port you already set

Fill these in automatically using the README defaults or sensible values. Note what you set.

#### Bucket C — User must fill (human-only credentials)

Variables that require the user to have an account, have done an external action, or hold a private credential:
- External API keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SENDGRID_API_KEY`, etc.
- Account credentials: email addresses for external services
- OAuth / SSO credentials: client IDs, client secrets from an OAuth provider
- Cloud credentials: AWS keys, GCP service account JSON, Azure secrets
- Webhook URLs or tokens from third-party platforms
- SSH private keys, TLS certificates

**Before marking a field as Bucket C**, check:
1. Does the repo contain a script that can extract or generate this value automatically? Search: `find . -name "extract_*" -o -name "setup_*" -o -name "get_token*" | grep -v __pycache__ | grep -v node_modules`
2. Is there a corresponding desktop app or CLI already installed that holds this credential? Run the extraction script if so.
3. Is the service known to be **passwordless** (OTP/magic-link/token-only)? If yes, don't list a `*_PASSWORD` field as user-fillable — list the token field instead and explain how to get a token.

For variables that truly require the user, write `FILL_ME_IN` as the placeholder value in `.env`.

---

After classifying, do the following **in this order**:

1. Copy `.env.example` → `.env` (if not already done).
2. Auto-generate all Bucket A values and write them into `.env` silently.
3. Fill all Bucket B values into `.env`.
4. Run any token-extraction scripts found in the repo (see above) and write results to `.env`.
5. Leave remaining Bucket C variables as `FILL_ME_IN` in `.env`.
6. Display the following block to the user — **this is the only time you ask for human input**:

```
⚠️  SECURITY NOTICE
Do NOT paste API keys or passwords into this chat.
Claude cannot and should not receive your credentials.

Open .env in your editor and fill in these values:

  OPENAI_API_KEY        → Your OpenAI API key (platform.openai.com → API Keys)
  ...

Everything else has been configured automatically.
Reply "done" when you've filled them in.
```

Format each Bucket C variable with:
- The variable name
- A plain-English description of what it is
- Where to get it (URL, console, command), if known from the README or docs

Wait for the user to reply before continuing.

---

### Step 6 — Install dependencies

Run the appropriate install command based on the detected stack:

| Stack | Install command |
|---|---|
| Python + uv | `uv sync` |
| Python + poetry | `poetry install` |
| Python + pip | `pip install -r requirements.txt` |
| Node + npm | `npm install` |
| Node + yarn | `yarn install` |
| Node + pnpm | `pnpm install` |
| Node + bun | `bun install` |
| Rust | `cargo build` |
| Go | `go mod download` |
| Ruby | `bundle install` |
| Java/Gradle | `./gradlew dependencies` |
| Java/Maven | `mvn dependency:resolve` |

If a `Makefile` has an `install` or `setup` target, prefer `make install` / `make setup`.

**On install failure:**
1. Read the full error output carefully.
2. Common issues and fixes:
   - **Python version mismatch**: Check `.python-version` or `pyproject.toml`; tell the user what version is needed.
   - **Missing system library** (e.g. `libpq-dev`, `openssl`, `libssl-dev`): Provide the `apt install` / `brew install` command.
   - **Network/registry errors**: Retry; check if a private registry is required.
   - **Lock file conflicts**: Try `uv sync --no-cache`, `npm ci`, or delete `node_modules` and reinstall.
3. Attempt one fix per error. If unresolvable, explain the error clearly and ask the user how to proceed.

---

### Step 7 — Pre-flight checks before starting Docker

**Do these before `docker compose up`**, not after a failed start.

#### Check for port conflicts

1. Parse `docker-compose.yml` for all host port bindings — look for patterns like `"80:80"` or `"${APP_PORT:-80}:80"`.
2. Check which of those ports are already in use: `ss -tlnp | grep ":<port> "`
3. For each conflict, find a free alternative port and set it as an env var override in `.env` before starting services.

#### Check user/group ID mapping

If `docker-compose.yml` uses `USER_ID` / `GROUP_ID` for volume permission mapping, set these to the current user:
```bash
echo "USER_ID=$(id -u)" >> .env
echo "GROUP_ID=$(id -g)" >> .env
```

---

### Step 8 — Database / service setup

1. **Start Docker services**:
   ```bash
   docker compose up -d
   ```
   Wait and verify services are healthy: `docker compose ps`

2. **Fix Docker volume ownership** — Docker often creates bind-mounted directories as root, causing permission errors at runtime. After services start, fix ownership for writable paths:
   ```bash
   # Find the app container name
   APP_CONTAINER=$(docker compose ps --format "{{.Name}}" | grep -v "worker\|db\|redis\|mongo\|postgres" | head -1)
   UID_VAL=$(grep "^USER_ID=" .env | cut -d= -f2)
   GID_VAL=$(grep "^GROUP_ID=" .env | cut -d= -f2)
   # Fix common writable directories
   for dir in output logs data; do
     [ -d "./$dir" ] && docker exec -u root "$APP_CONTAINER" chown -R ${UID_VAL:-1001}:${GID_VAL:-1001} /app/$dir 2>/dev/null || true
   done
   ```

3. **Check startup logs for errors** — don't rely on `docker compose ps` alone, it only shows health check status:
   ```bash
   docker logs <app-container> --tail 30 2>&1 | grep -E "ERROR|FATAL|failed|exception" | head -10
   ```
   Fix any errors before proceeding.

4. **Database migrations**: Look for and run the right command:
   - `make db-migrate` / `make migrate`
   - `alembic upgrade head`
   - `python manage.py migrate`
   - `npx prisma migrate dev`
   - `npm run db:push`

---

### Step 9 — Run a health check

Verify the setup works end-to-end:

1. **Hit the health endpoint** if one exists: `curl -s http://localhost:<port>/health`

2. **Make a real core API call** — don't stop at the health endpoint. Read the README's "API Usage" or "Quick Start" section and make the simplest meaningful request that exercises the main feature. A passing health check doesn't mean the full stack works.

3. **Run unit tests** if they're fast: `pytest tests/unit/`, `npm test`, etc.

If any step fails: read the actual error message (not just the HTTP status), hypothesize the cause, attempt one targeted fix, repeat.

---

### Step 10 — Final report

```
## Setup Report

### Project
<name and one-line description>

### Stack
<languages, frameworks, package managers>

### What was done automatically
- Generated: <list of auto-generated secrets by name only>
- Defaulted: <list of defaulted variables and their values>
- Port overrides: <e.g. APP_PORT=8082 (80 was taken)>
- Installed dependencies via <tool>
- Started Docker services: <list>
- Fixed volume ownership for: <directories>
- Auto-extracted tokens: <variable names, not values>
- Ran migrations: <command>

### What you still need to do
<Only Bucket C items that were left as FILL_ME_IN, with where to get each one>

### How to run
<exact command(s) to start the project in dev mode>

### Useful commands
<key commands from Makefile or package.json scripts>
```

---

## Guidance

- **Always read before running.** Never run install commands without first understanding the stack.
- **Do the maximum, ask for the minimum.** If you can derive, generate, or default a value, do it. Only block on credentials that literally require a human account.
- **Check for port conflicts before starting Docker**, not after a failed start.
- **Fix Docker volume ownership after every `docker compose up`** — mounted directories created by Docker are often owned by root, causing write errors at runtime.
- **Look for token-extraction scripts in the repo** before asking the user to find tokens manually.
- **Read the auth-related source code** when credentials keep failing — don't assume how a service authenticates; check what the code actually calls.
- **Test beyond the health endpoint.** Make a real core API call to verify the full stack works.
- **Never ask for secrets in chat.** Ever. Even if the user offers. Redirect them to edit the file directly.
- **Never print secret values.** Don't echo generated secrets or user-provided values into the conversation. Only confirm variable *names* were set.
- **Fail loudly, not silently.** Include the exact error message in your explanation when blocked.
- **One fix at a time.** When debugging errors, attempt one targeted fix, verify, then proceed.
- **Respect `.env` safety.** Never commit `.env` files. Add it to `.gitignore` if missing.
- **Monorepos**: Handle each sub-package independently, in dependency order (shared libs → backend → frontend).
- **Trust the Makefile.** Prefer `make <target>` over raw commands when available.
- **Feature flags**: Default optional features to `false`/`disabled` if the user hasn't explicitly asked to enable them. Let them work up to it.
