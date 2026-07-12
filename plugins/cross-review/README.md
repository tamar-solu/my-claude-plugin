# cross-review

Cross-model code review: runs an independent review with a different model (Opus by default), then independently validates every finding before surfacing it. Findings that don't survive validation are discarded.

## Usage

- `/cross-review` — review the current changes.
- `/cross-review --model <id>` — use a specific reviewer model.
- `/cross-review --base <ref>` — diff against a specific git ref instead of auto-detecting.
- `/cross-review --fix` — after presenting the report, offer to apply confirmed findings.

## What it does

1. Picks a reviewer model that's guaranteed to differ from the model running the review (defaults to Opus, falls back to Sonnet if you're already on Opus).
2. Runs the `cross-model-review` workflow: collects the current diff, has the reviewer model surface findings, then has the session model independently validate each finding against the diff before it's reported.
3. Presents only confirmed findings, sorted by severity, with the validator's reasoning and confidence. Rejected findings are listed separately so nothing is hidden.

Use this when you want a second opinion on generated changes without blindly trusting the reviewer.
