export const meta = {
  name: 'cross-model-review',
  description: 'Review code changes with a different model, then independently validate each finding before surfacing it',
  phases: [
    { title: 'Diff', detail: 'Collect current changes from git' },
    { title: 'Review', detail: 'Independent model reviews the diff', model: 'opus' },
    { title: 'Validate', detail: 'Session model independently verifies each finding' },
    { title: 'Report', detail: 'Synthesize confirmed findings only' },
  ],
}

// ---------- Phase 1: get the diff ----------

phase('Diff')

const baseRef = (args && args.base) ? args.base : null

const diffResult = await agent(
  `Collect the git diff to review. Run these commands in order and return the first one that produces meaningful output:
${baseRef
  ? `1. git diff ${baseRef}..HEAD\n2. git diff ${baseRef}`
  : `1. git diff HEAD (unstaged changes against HEAD)
2. git diff --cached (staged changes)
3. git diff HEAD~1 (last commit)
4. git status`
}

Return:
- Which command was used
- The full diff output (do not truncate)
- A brief summary of what files changed`,
  { label: 'get-diff' }
)

if (!diffResult || diffResult.length < 80) {
  log('No diff found — nothing to review.')
  return { confirmed: [], rejected_count: 0, total_reviewed: 0, message: 'No changes found to review. Make sure you have staged, unstaged, or recent commits.' }
}

// ---------- Phase 2: review with a different model ----------

phase('Review')

const reviewerModel = (args && args.reviewModel) ? args.reviewModel : 'opus'

const FINDING_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'suggestion'] },
          category: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          file: { type: 'string' },
          line_hint: { type: 'string' },
          suggestion: { type: 'string' }
        },
        required: ['id', 'severity', 'category', 'title', 'description', 'suggestion']
      }
    },
    summary: { type: 'string' }
  },
  required: ['findings']
}

const review = await agent(
  `You are a senior software engineer performing an independent code review. Your findings will be validated by a second model, so precision matters more than coverage.

Review the diff below and report only findings you are confident about. Do not speculate.

For each finding:
- id: short slug, e.g. "null-deref-1"
- severity: critical (breaks things) | high (likely bug or security issue) | medium (bad practice, potential bug) | low (minor issue) | suggestion (improvement worth considering)
- category: correctness | security | performance | logic | null-safety | error-handling | maintainability | style
- description: explain WHY this is a problem with specific reference to the code. Quote the relevant line if useful.
- file: affected file path if identifiable
- line_hint: line number or range if identifiable
- suggestion: the specific fix or better alternative

Focus on: bugs, logic errors, security vulnerabilities, incorrect null/undefined handling, off-by-one errors, race conditions, misused APIs, type mismatches, and missing error handling. Skip cosmetic nits.

--- DIFF ---
${diffResult}`,
  { label: 'reviewer', model: reviewerModel, schema: FINDING_SCHEMA, effort: 'high' }
)

if (!review || !review.findings || review.findings.length === 0) {
  log('Reviewer found no issues.')
  return {
    confirmed: [],
    rejected_count: 0,
    total_reviewed: 0,
    reviewer_model: reviewerModel,
    message: 'The reviewer found no issues in the current changes.'
  }
}

log(`Reviewer (${reviewerModel}) surfaced ${review.findings.length} finding(s). Validating each independently...`)

// ---------- Phase 3: validate each finding independently ----------

phase('Validate')

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    confirmed: { type: 'boolean' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning: { type: 'string' },
    refined_suggestion: { type: 'string' },
    severity_override: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'suggestion', 'unchanged'] }
  },
  required: ['confirmed', 'confidence', 'reasoning', 'severity_override']
}

const validated = await pipeline(
  review.findings,
  async (finding) => {
    const verdict = await agent(
      `You are independently validating a code review finding. Do NOT treat the finding as authoritative — verify it yourself by carefully reading the diff.

FINDING TO VALIDATE:
- ID: ${finding.id}
- Severity: ${finding.severity}
- Category: ${finding.category}
- Title: ${finding.title}
- Description: ${finding.description}
- File: ${finding.file || 'unspecified'}
- Line hint: ${finding.line_hint || 'unspecified'}
- Suggested fix: ${finding.suggestion}

--- DIFF (same diff the reviewer saw) ---
${diffResult}

Your job:
1. Read the relevant code carefully and independently determine whether the described issue actually exists.
2. Set confirmed=true only if you can see the problem in the diff yourself.
3. Set confidence: high if you are certain, medium if plausible but you have some doubt, low if you cannot verify it.
4. Provide your own reasoning — do not just paraphrase the finding.
5. If confirmed, set severity_override to your assessed severity (or "unchanged" to keep the original).
6. If you have a better or more precise fix than the original suggestion, put it in refined_suggestion.

Reject (confirmed=false) if: the issue does not exist in the diff, the code already handles it correctly, the finding misread the code, or you cannot find evidence for it.`,
      {
        label: `validate:${finding.id}`,
        schema: VERDICT_SCHEMA,
        effort: 'medium'
      }
    )
    return { finding, verdict }
  }
)

// ---------- Phase 4: synthesize ----------

phase('Report')

const confirmedItems = validated
  .filter(Boolean)
  .filter(v => v.verdict && v.verdict.confirmed && v.verdict.confidence !== 'low')

const rejectedItems = validated
  .filter(Boolean)
  .filter(v => !v.verdict || !v.verdict.confirmed || v.verdict.confidence === 'low')

const reportFindings = confirmedItems.map(v => ({
  severity: (v.verdict.severity_override && v.verdict.severity_override !== 'unchanged')
    ? v.verdict.severity_override
    : v.finding.severity,
  category: v.finding.category,
  title: v.finding.title,
  description: v.finding.description,
  file: v.finding.file,
  line_hint: v.finding.line_hint,
  suggestion: v.verdict.refined_suggestion || v.finding.suggestion,
  validator_reasoning: v.verdict.reasoning,
  validator_confidence: v.verdict.confidence
}))

return {
  confirmed: reportFindings,
  rejected_count: rejectedItems.length,
  rejected_titles: rejectedItems.map(v => v.finding.title),
  total_reviewed: review.findings.length,
  reviewer_model: reviewerModel,
  reviewer_summary: review.summary || null
}
