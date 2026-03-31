---
name: repo-to-notebooklm
description: Converts a code repository into a single readable document that can be uploaded to NotebookLM for AI-powered podcast generation and Q&A.
---

# Repo to NotebookLM

Convert this repository into a single, well-structured text document suitable for uploading to NotebookLM.

## Goal

NotebookLM cannot open code files directly. This skill compiles the entire repository — structure, documentation, and source code — into one `.txt` file that NotebookLM can ingest, understand, and use to generate podcasts or answer questions.

## Instructions

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

8. **Report to the user**:
   - The output file path
   - How many files were included vs skipped
   - Total character count (rough size)
   - Remind them: "Upload `notebooklm_export.txt` to NotebookLM at notebooklm.google.com — click Add Source → Upload file."

## Guidance
- Keep the document human-readable; NotebookLM works best with flowing text interspersed with code.
- Do not truncate README or documentation files — they are the most valuable for podcast generation.
- If the repo has a `docs/` folder, prioritize those files early in the SOURCE FILES section.
- The final summary section is crucial — write it as if explaining to a smart non-engineer what this project does.
