#!/usr/bin/env node
// Reuse the Higgsfield CLI login as the MCP bearer token.
// Higgsfield's OAuth flow in /mcp rejects Claude Code's PKCE code_challenge,
// so the CLI token is the working auth path.
// Prints {} when no token is found, so Claude Code falls back to OAuth.
//
// Written in Node rather than bash so it runs headless on every platform:
// on Windows a .sh helper is opened through the file association
// (usually a Git Bash window) instead of being executed.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";

const isWin = process.platform === "win32";
const home = homedir();

function findCli() {
  const names = isWin ? ["higgsfield.cmd", "higgsfield.exe", "higgsfield"] : ["higgsfield"];
  const dirs = (process.env.PATH || "").split(delimiter).filter(Boolean);
  // Claude Code launched from an IDE or desktop app may not have nvm/npm bins on PATH.
  if (isWin) {
    if (process.env.APPDATA) dirs.push(join(process.env.APPDATA, "npm"));
  } else {
    const nvm = join(home, ".nvm", "versions", "node");
    try {
      for (const v of readdirSync(nvm)) dirs.push(join(nvm, v, "bin"));
    } catch {}
    dirs.push(join(home, ".npm-global", "bin"), "/usr/local/bin", "/opt/homebrew/bin");
  }
  for (const d of dirs) {
    for (const n of names) {
      const p = join(d, n);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

function tokenFromCli(cli) {
  try {
    const env = { ...process.env, PATH: dirname(cli) + delimiter + (process.env.PATH || "") };
    // npm installs a .cmd shim on Windows, which can only be run through a shell.
    const out = isWin
      ? execFileSync(`"${cli}" auth token`, { env, shell: true, windowsHide: true, timeout: 15000, stdio: ["ignore", "pipe", "ignore"] })
      : execFileSync(cli, ["auth", "token"], { env, timeout: 15000, stdio: ["ignore", "pipe", "ignore"] });
    // `auth token` refreshes an expired access token when possible.
    const lines = out.toString().trim().split(/\r?\n/);
    return lines[lines.length - 1].replace(/\s/g, "");
  } catch {
    return "";
  }
}

function tokenFromCredentials() {
  // Last resort: read the CLI's credentials file directly, only if not expired.
  const dirs = [process.env.XDG_CONFIG_HOME || join(home, ".config")];
  if (isWin && process.env.APPDATA) dirs.push(process.env.APPDATA);
  for (const d of dirs) {
    try {
      const c = JSON.parse(readFileSync(join(d, "higgsfield", "credentials.json"), "utf8"));
      let exp = Number(c.expires_at) || 0;
      if (exp > 1e12) exp /= 1000;
      if (!exp || exp > Date.now() / 1000 + 60) return c.access_token || "";
    } catch {}
  }
  return "";
}

const cli = findCli();
let token = cli ? tokenFromCli(cli) : "";
if (!token) token = tokenFromCredentials();

console.log(/^[A-Za-z0-9._~+/=-]+$/.test(token) ? JSON.stringify({ Authorization: `Bearer ${token}` }) : "{}");
