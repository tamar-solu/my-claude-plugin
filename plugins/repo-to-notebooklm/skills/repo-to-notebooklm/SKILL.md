---
name: repo-to-notebooklm
description: Converts a code repository into a single readable document and optionally uploads it to a new NotebookLM notebook automatically.
---

# Repo to NotebookLM

Convert this repository into a single, well-structured text document and upload it to NotebookLM.

## Goal

NotebookLM cannot open code files directly. This skill compiles the entire repository — structure, documentation, and source code — into one `.txt` file, then automatically creates a new NotebookLM notebook and uploads it. If the notebooklm CLI is not installed, it falls back to generating the file and prompting manual upload.

## Instructions

### Step 1 — Generate the export file

1. **Determine output path**: Save the output file as `notebooklm_export.txt` in the repository root unless the user specified a different path.

2. **Gather repo metadata**:
   - Project name (from directory name or package.json / pyproject.toml / Cargo.toml etc.)
   - Description (from README or package manifest)
   - Primary language(s) detected from file extensions
   - Git log: last 10 commit messages (`git log --oneline -10`)

3. **Build the directory tree**:
   - Run `git ls-files` to get all tracked files
   - Render a clean indented tree of the structure (omit binary files: images, fonts, lock files, compiled artifacts)

4. **Identify files to include**:
   - Include: README, docs, source code files (.py, .ts, .js, .tsx, .jsx, .go, .rs, .java, .rb, .php, .cs, .cpp, .c, .sh, .sql, .yaml, .yml, .json config files, .toml, .env.example, Dockerfile, Makefile)
   - Skip: binary files, lock files (package-lock.json, yarn.lock, poetry.lock, Cargo.lock), `.git/`, `node_modules/`, `__pycache__/`, `dist/`, `build/`, `.venv/`, any file over 500 lines (summarize those instead)

5. **For files over 500 lines**: Instead of the full content, write a summary section:
   ```
   [LARGE FILE - SUMMARIZED]
   This file contains X lines. Key exports/functions/classes: ...
   ```
   Use your analysis of the file to produce the summary.

6. **Compose the output document** in this exact structure:

```
================================================================
REPOSITORY: <project name>
EXPORTED FOR NOTEBOOKLM ON: <today's date>
================================================================

## PROJECT OVERVIEW
<Description from README intro or package manifest. 2-4 sentences.>

Primary language: <language>
Total files included: <N>

================================================================
## RECENT GIT HISTORY
================================================================
<last 10 git log --oneline entries>

================================================================
## REPOSITORY STRUCTURE
================================================================
<indented file tree>

================================================================
## SOURCE FILES
================================================================

For each file, use this format:

--- FILE: <relative/path/to/file> ---
<full file content>
--- END FILE ---

================================================================
## SUMMARY FOR NOTEBOOKLM
================================================================
<Write a 3-5 paragraph plain-English explanation of what this codebase does, its architecture, main components, and how they fit together. This helps NotebookLM generate better podcast scripts.>
```

7. **Write the file** using the Write tool.

---

### Step 2 — Auto-upload to NotebookLM

After writing the file, run the following check:

```bash
which notebooklm 2>/dev/null
```

**If `notebooklm` is NOT installed:**
- Tell the user the file was generated successfully
- Show install instructions:
  ```
  pip install "notebooklm-py[browser]"
  playwright install chromium
  notebooklm login
  ```
- Tell them to upload manually: go to notebooklm.google.com → Add Source → Upload file
- Stop here.

**If `notebooklm` IS installed**, check login status:

```bash
notebooklm auth check --test 2>&1
```

**If NOT logged in** (non-zero exit or output contains "not authenticated" / "login"):
- Tell the user to run `notebooklm login` first, then re-run this skill
- Stop here.

**If logged in**, proceed with upload:

1. Determine the notebook name: use the project name from Step 1 (e.g. `cv-processing-system`)

2. Create a new notebook:
```bash
notebooklm create "<project-name>"
```

3. Set it as the active notebook using the ID returned from the create command:
```bash
notebooklm use <notebook-id>
```

4. Upload the export file:
```bash
notebooklm source add "./notebooklm_export.txt"
```

5. Report to the user:
   - The notebook name that was created
   - Confirmation that the file was uploaded
   - Tell them to go to notebooklm.google.com to find the notebook and generate a podcast

---

## Guidance
- Keep the document human-readable; NotebookLM works best with flowing text interspersed with code.
- Do not truncate README or documentation files — they are the most valuable for podcast generation.
- If the repo has a `docs/` folder, prioritize those files early in the SOURCE FILES section.
- The final summary section is crucial — write it as if explaining to a smart non-engineer what this project does.
- If any upload step fails, report the error clearly and tell the user they can still upload `notebooklm_export.txt` manually.
