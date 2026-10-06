---
name: "seedance-prompt"
description: "Turn a rough video idea (Hebrew or English) into a structured Seedance 2.5 prompt, and generate videos on Higgsfield with an approval gate. MUST be used for ANY request to make, create or generate a video with Higgsfield or Seedance (MCP generate_video or the higgsfield CLI), even a one-line request like 'make me a video of X', before calling any Higgsfield generation tool or command."
---

# Seedance 2.5 Prompt Builder

Take the user's video idea, however rough, and return ONE production-ready Seedance 2.5 prompt, written in English, in a single copyable code block.

## Step 1: Extract or default the essentials

Pull these from the idea. Ask only if something critical is missing AND there is no sensible default (max 2 short questions, in one message). Otherwise use the defaults and list them under "Assumptions".

| Field | Default |
|---|---|
| Duration | 5s for tests, 10-15s for real content (max 30s) |
| Aspect ratio | 9:16 (TikTok / Reels) |
| Number of shots | 1 shot per ~3-5 seconds |
| Style | Clean, modern, natural color, soft film grain |
| Audio | Ambience + foley, no music, no dialogue |
| References | None, unless the user mentions uploading images/video/audio |

If the idea is in Hebrew, understand it in Hebrew but write the prompt in English (the model follows English best).

## Step 2: Write the prompt in this exact section order

One continuous block, each section labeled in caps. Never skip a section; skipped sections produce predictable failures (e.g. no CAMERA = random movement).

1. **GLOBAL STYLE**: genre, look, color grade, film stock/grain, aspect ratio, shutter feel. End with global exclusions (e.g. "No text overlays. No slow motion.").
2. **SCENE**: one-line logline: who does what, where, with what mood.
3. **CHARACTERS**: each character named (e.g. "Maya") with age range, build, hair, wardrobe. Reuse the exact same name everywhere after.
4. **LOCATION**: space, props, time of day. Kept separate from characters.
5. **FIRST FRAME AND BLOCKING**: exact starting positions (e.g. "Maya at x 40%, y 60%, facing camera-left").
6. **SHOT-BY-SHOT**: `SHOT 1 (0-4s): shot type, action, one primary change, end state.` Separate shots with `HARD CUT.` Time ranges consecutive, non-overlapping, covering the full duration.
7. **CAMERA**: per shot: framing, lens/focal length, height, movement (dolly push-in, locked tripod, slow orbit, handheld).
8. **PHYSICS**: only what moves: hair, fabric, liquid, smoke, particles.
9. **LIGHTING**: motivated source, direction, quality, color temperature.
10. **AUDIO**: use brackets: `(music)`, `<sound effects>`, `{dialogue}`. End with exclusions ("No music." / "No dialogue.").

## Rules that prevent common failures

- **One action per time range.** Never pack several actions into a second. Timestamps are a pacing budget, not frame-accurate.
- **Show, don't imply speech.** Never put quoted thoughts in action text ("a look that says 'really?'"); the model will voice it. Describe visible behavior ("eyebrows lift, she holds the stare").
- **Exclusions as separate sentences.** Write "Do not show a logo." not "a shirt without a logo." The model is bad at subtraction.
- **On-screen text is unreliable.** Avoid readable signs, UI text or subtitles in the prompt; add them in editing. Mention this in Notes if the idea depends on text.
- **Keep it concrete.** No vague words like "epic", "beautiful", "cinematic" without saying what makes it so (lens, light, movement).

## References (only if the user uploads material)

One role sentence per material, each with its own exclusion:

- `@Image 1 defines Maya's face, hair and build. Do not use the background or clothing from the image.`
- `@Video 1 defines the camera movement and pacing only. Do not use the people or location in the video.`
- `@Audio 1 defines Maya's voice tone. Do not use the words spoken in the audio.`

If several images show one subject, say so: "@Images 1-3 all define one character, Maya." Never map several images to several characters in one sentence. Stay within ~1-8 image subjects for stability.

## Dialogue

Default to no dialogue. If the user wants speech:

- Declare the language before the line: `Dialogue language: natural Israeli Hebrew. Maya says: {...}`
- Keep lines short (one sentence per ~3s).
- For Hebrew, add a Note: Hebrew lip-sync and pronunciation may be unreliable; test with a 5s clip first, or plan a voiceover in editing instead.

## Output format

Return exactly this, nothing more:

**Settings:** duration, aspect ratio, mode (text-to-video / image-to-video / references)

```
[the full prompt]
```

**Assumptions:** bullet list of defaults you chose (only if any).

**Notes:** 1-3 bullets max: the riskiest part of this prompt and what to tweak first if the result is off.

Do not offer multiple prompt variants unless asked. If the user asks for iteration after a generation, ask what went wrong (or read their description) and change only the section responsible.

## Generating on Higgsfield (only when the user asks)

This plugin bundles the Higgsfield MCP server (`plugin:seedance-higgsfield:higgsfield`). Credits are real money, so the user must approve the exact prompt and settings before anything is generated.

### Approval gate (never skip)

- **Never write and generate in the same turn.** Even if the user asked for a video in one message ("make me a video of X"), first return the prompt in the normal output format and stop. Generation starts only in a later turn, after the user has seen the final prompt.
- **One confirmation message, then wait.** Before any non-`get_cost` `generate_video` call, send a single message containing all of the following, and wait for an explicit yes to it:
  - the exact final prompt, in full, in a code block (the text that will be sent, not a summary);
  - model, duration, aspect ratio, count, and any reference media with their roles;
  - the cost from the `get_cost` preflight, and the current balance.
- **What counts as approval:** a clear yes in reply to that confirmation message ("yes", "go", "generate it", "כן"). A request to generate made before the confirmation was shown, or approval of an earlier version, does not count.
- **Any change resets approval.** If the prompt text, model, duration, aspect ratio, count or references change after the confirmation (an edit, an iteration after a test, a plan-block fallback, a parameter adjusted by the server), show a new confirmation with the new values and cost, and wait again. Never silently fix or rewrite the prompt between approval and submission.
- **Same gate for the CLI.** These rules apply equally to `higgsfield generate create` (price it with `higgsfield generate cost` first). Prefer the MCP tools when they are connected.
- **No conditional approval.** Never ask for or act on approval of a branch ("switch to Kling if Seedance is blocked", "retry if it fails"). Each alternative gets its own confirmation when it actually happens.
- **One approval, one submission.** Approval covers exactly one `generate_video` call. A second clip, a retry or the full-length version after a test each need their own confirmation.

### Steps

1. **Check the connection.** If the Higgsfield tools are missing or the server shows `needs-auth`, do not try the OAuth flow in `/mcp`: it currently fails with a `code_challenge` error. Tell the user to run `higgsfield auth login` in the CLI and reconnect from `/mcp`. If it still shows `needs-auth`, remove the `plugin:seedance-higgsfield:higgsfield` entry from `~/.claude/mcp-needs-auth-cache.json`, then reconnect.
2. **Default to a 5s test** for a new prompt, even if the final clip is longer. Price the full length separately once the test looks right.
3. **Preflight the cost.** Call `balance`, then `generate_video` with `get_cost: true`, using `model: "seedance_2_5"`, the full prompt from the code block, and the `duration` and `aspect_ratio` from Settings. `get_cost` submits nothing and is allowed before approval.
4. **Confirm** using the approval gate above, and stop until the user answers.
5. **Generate** with exactly the approved params minus `get_cost`. Leave `use_unlim` unset; if the response returns `unlim_choice`, ask the user which balance to use and call again with their answer. If the response reports `adjustments` that changed a setting, tell the user what changed.
6. **Plan blocks.** Seedance may be gated by plan. A block is reported before any charge. If blocked, say so and offer `kling3_0_turbo` as a cheaper fallback, noting that the prompt was written for Seedance and may be followed more loosely. Switching model is a change: price it and confirm again.
7. **Never resubmit on a timeout.** The job may already be running. Use the returned job ID with `jobs_wait` or `show_generation_by_ids`.
8. **References.** If the prompt uses `@Image`/`@Video`/`@Audio`, upload the media first (`media_upload`, or `media_import_url` for web links) and pass the returned IDs in `medias` with the roles the model declares (check with `models_explore` `action: "get"`). Never pass raw URLs in `medias`. Uploading is not generating, but list the uploaded media in the confirmation.
