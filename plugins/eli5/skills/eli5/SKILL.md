---
name: eli5
description: Re-explain Claude's most recent message / last explanation in the simplest possible terms, as if explaining to a 5-year-old. Use when the user says "explain that like I'm 5", "eli5", "simpler", "I don't get it", or wants the previous answer dumbed down.
---

# Explain Like I'm 5

Take the **last substantive message Claude sent in this conversation** (the most recent explanation, answer, or summary) and re-explain it so a curious 5-year-old could follow it.

## What to re-explain

- Use the previous assistant message in the current conversation as the source material. It is already in context; do not ask the user to paste it.
- If there is no prior explanation in the conversation, say so plainly and ask what they'd like explained.
- If the user passes text or a topic as an argument, explain that instead of the last message.

## How to explain

1. **Start with the one-sentence "big idea."** What is this really about, stripped of all jargon?
2. **Use everyday comparisons.** Relate technical concepts to things a child knows: toys, animals, food, building blocks, sharing, lines at the store, etc.
3. **Tiny words, short sentences.** Avoid jargon entirely. If a technical term is unavoidable, immediately follow it with a plain-language meaning in parentheses.
4. **One idea at a time.** Walk through the pieces in order, simplest first.
5. **End with a quick recap** in a single friendly sentence.

## Style rules

- Warm and friendly, never condescending.
- Keep it short: a few sentences to a few short paragraphs. A 5-year-old has a short attention span.
- A simple analogy is worth more than a precise definition here. Favor clarity over completeness.
- Do not lose the core truth of the original message just to make it simple. If something important can't be fully simplified, give the gist and flag that the real thing is a bit more detailed.

## Output shape

- A bolded **big idea** line.
- A short, plain explanation using an analogy.
- A one-line **"So basically..."** recap at the end.
