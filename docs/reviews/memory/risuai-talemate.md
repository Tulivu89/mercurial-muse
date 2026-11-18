# Notes: RisuAI and Talemate

Nov 18, 2026 · @AmbiProp

RisuAI (GPL-3.0) from `kwaroran/Risuai` on `main`: `src/ts/process/memory/`. Talemate (AGPL-3.0) from `vegu-ai/talemate` on `main`: the summarizer, memory and world state agents, and the docs folder. Talemate's docs site and RisuAI's wiki pages were blocked; their raw files were read instead.

## RisuAI

**All its memory runs on the auxiliary model,** at request time, **only when the prompt overflows.**

**SupaMemory, the oldest system:**
- The oldest messages are cut in chunks of up to 1,200 tokens and summarised.
- Each summary is appended as a paragraph. At four paragraphs, the whole summary is summarised again.
- Summarised messages leave the prompt.
- **Its prompt is one bracketed line:** "Summarize the ongoing role story, It must also remove redundancy…"

**HypaMemory V3, the current system:**
- **20% of the context is kept for memory.**
- When the prompt is still over, messages are summarised **six at a time**, oldest first, never the last three. **Each summary is written once,** never rolled into a bigger one on its own.
- **The 20% is filled in this order:**
  1. the summaries the player **pinned as important**;
  2. the **newest** summaries (40%);
  3. summaries **similar** to the last three messages, by embeddings (40%);
  4. **random** ones for the rest.
- The picks are put back in story order and sent as `<Past Events Summary>…</Past Events Summary>` before the chat.
- **A summary whose messages were deleted is dropped** every turn.
- **The player can edit, pin, reroll, delete or merge summaries,** see the messages behind each, and see when the next summary will be made.

The code admits its token maths is a "temporary fix", and older modes still call OpenAI models that were retired in 2024.

## Talemate

A set of agents, each of which can run on its own model, so summarising can be cheaper than narrating.

**Archived history:**
- After every message, **the unarchived chat is cut into a chapter** when it passes about 1,500 tokens, when time jumps, or when the people present change. Failing those, the model picks the line that ends a scene.
- The newest message is never archived: the player may still regenerate it.
- **Each chapter is summarised once,** with the last few chapters given as context: "YOU MUST ONLY SUMMARIZE THE CONTENT EXPLICITLY STATED WITHIN CHAPTER N. YOU MUST NOT INCLUDE OR REPEAT THE PREVIOUS CONTEXT… YOU MUST NOT QUOTE DIALOGUE."
- Lengths run from 2–3 sentences to a numbered list of facts.
- Each chapter records who was present, so a character can remember only what they saw.

**Layered history** (experimental):
- Chapters are summarised into outlines, and outlines into shorter outlines.
- **"Useful compression typically tops out around Layer 3… diminishing returns at Layer 4 and beyond."**
- A summary longer than its source is rejected.

**Filling the history budget:**
- Everything starts at its shortest layer. **The newest stretches are then opened up to finer layers,** down to the messages themselves, until the budget (8,192 tokens) is full. So detail falls away with age.
- At least the last five messages always stay word for word.
- A context preview shows each section's tokens.

**Long-term memory:**
- Chapters and world entries are searched by similarity with the last three messages, re-ranked a little towards recent ones, near-duplicates skipped, cut to about 1,000 tokens.
- They are sent under "POTENTIALLY RELEVANT INFORMATION… may or may not be relevant".
- **Whatever is still in the chat word for word is left out.**

**World state and tracked states:**
- A snapshot of characters, items and places, rebuilt every 10 turns.
- Questions per character ("What is Kaira's mental state?") are re-asked on a timer, one sentence each.

**Lessons in its own docs:**
- Previous chapters given as context **leak into the new summary** ("if you find yourself with a bunch of similar history entries, try setting this to 0").
- A tracked state built on its last value "only takes one bad generation… to start spiraling out of control".
- Asking the model to judge relevance is "hit and miss" and can "make the generated content worse".
- It wants 16k context at least, and models good enough to follow its steps: "the failures look like Talemate bugs".

## What they agree on

- **Memory is made when the chat outgrows the window, or near it, in pieces, by a cheaper model.**
- **Each piece is summarised once, from its own messages.** Merging is by hand (RisuAI) or into a few layers at most (Talemate).
- **Newer history keeps more detail.** The last few messages stay word for word.
- **The player can see, edit, pin and redo every piece,** and see what it costs.
- **A summary goes stale when its messages change:** RisuAI drops it, Talemate offers a redo.
- **Embeddings are an extra,** not the base.
