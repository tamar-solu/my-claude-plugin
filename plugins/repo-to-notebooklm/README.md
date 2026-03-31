# repo-to-notebooklm

A Claude Code plugin that converts any Git repository into a single structured `.txt` file ready to upload to [NotebookLM](https://notebooklm.google.com).

## Why

NotebookLM can't open code files directly, but it can generate excellent AI podcasts and answer questions about your codebase — if you give it the right input. This plugin does that automatically.

## What it does

- Scans all tracked files via `git ls-files`
- Filters out lock files, binaries, and build artifacts
- Summarizes files over 500 lines instead of dumping them raw
- Writes a structured `notebooklm_export.txt` with project overview, git history, directory tree, all source files, and a plain-English architecture summary

## Usage

In any Git repo, run:

```
/repo-to-notebooklm
```

Then upload the generated `notebooklm_export.txt` to NotebookLM → Add Source → Upload file.
