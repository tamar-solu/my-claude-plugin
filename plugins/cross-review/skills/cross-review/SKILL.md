---
name: cross-review
description: >
  Cross-model code review: runs an independent review with a different model (Opus by default),
  then independently validates every finding before surfacing it. Findings that don't survive
  validation are discarded. Use when you want a second opinion on generated changes without
  blindly trusting the reviewer.
---

# Cross-Model Code Review

Invoke this workflow and present the results clearly.

## What to do

1. Parse any arguments the user passed:
   - `--model <id>` — reviewer model override (default: `opus`)
   - `--base <ref>` — git ref to diff against (default: auto-detect)
   - `--fix` — after presenting the report, offer to apply confirmed findings

2. If `--model` was NOT passed, make sure the review is actually cross-model: check your own current model (the model you are running as right now). If it's in the same family as the default reviewer (`opus`), set `reviewModel` to `sonnet` instead — and vice versa if you're currently running as Sonnet, keep the default `opus`. This guarantees the reviewer is never the same model as the one doing this review, even when the user hasn't specified `--model` explicitly. If `--model` WAS passed, always honor it as-is, even if it matches your current model.

3. Invoke the Workflow tool with `{name: "cross-model-review"}` and pass the resolved options as `args`:
   ```
   { reviewModel: "<model>", base: "<ref or null>" }
   ```

4. Present the results using the format below.

## Output format

### Header

```
Cross-model review — <N> confirmed / <M> total findings (<reviewer model> reviewer)
```

### Confirmed findings

For each finding in `result.confirmed`, print a block:

```
[SEVERITY] category — Title
File: <file>:<line_hint> (omit if unknown)

<description>

Fix: <suggestion>

Validator: <validator_reasoning> (confidence: <validator_confidence>)
```

Sort by severity: critical > high > medium > low > suggestion.

Use a severity badge style:
- CRITICAL — prefix with `!!`
- HIGH — prefix with `!`
- MEDIUM — no prefix
- LOW — prefix with `~`
- SUGGESTION — prefix with `?`

### Rejected findings

If any findings were rejected, add a collapsed note at the end:

```
<N> finding(s) from the reviewer did not survive validation and were discarded:
- <title>
- ...
```

### No findings

If `result.confirmed` is empty, say so plainly:

```
No confirmed issues. The reviewer surfaced <N> finding(s) but none survived independent validation.
```

If the reviewer itself found nothing, say:

```
No issues found. The reviewer found nothing to report in the current changes.
```

## Fix mode

If `--fix` was passed and there are confirmed findings, after presenting the report ask:
"Apply fixes for the confirmed findings? I'll handle each one, skipping any that require judgment calls."

Then apply only the high-confidence, mechanically applicable fixes (null checks, type corrections, missing awaits, etc.). Skip findings that require design decisions.

## Important

- Do not editorialize or add your own opinions on top of the validated findings.
- Do not re-review the diff yourself — the workflow already did that with two models.
- Present findings as-is from the validated output. Your job here is formatting, not reviewing.
- If the user asks "why was X rejected?", explain that the validator could not confirm the issue in the diff, so it was filtered out to avoid false positives.
