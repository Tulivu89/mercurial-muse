# Notes: SillyTavern and its memory add-ons

Nov 18, 2026 · @AmbiProp

SillyTavern 1.19.0's built-in Summarize and Vectors (from its npm package), and three add-ons read from GitHub: qvink's MessageSummarize 1.3.29, MemoryBooks 9.4.0, Smart Memory 1.8.3. All four are AGPL-3.0.

## SillyTavern's Summarize: one rolling summary

- **Every 10 messages** (by default) the model rewrites one summary of the whole story, about 200 words: "Summarize the most important facts and events in the story so far. If a summary already exists… use that as a base and expand with new facts."
- **Sent as `[Summary: …]`** after the main prompt. It has no token budget, only the word target.
- **Messages aren't dropped,** so the summary repeats what is still in the window.
- The player can **edit** the summary, **pause** it, or **restore the previous one**. Older versions are kept on earlier messages.
- **Its default source is a retired service,** so most players must switch it to the main model before it does anything.

## SillyTavern's Vectors (chat memory, off by default)

- **Every message is embedded** in 400-character chunks, in the browser by default.
- **Each turn,** the last two messages are the query. The top three matches are lifted out of their place and put back together as a `Past events:` block, never from the last five messages.
- **A matched message moves even while it is still in the window,** so the chat can read out of order.

## qvink's MessageSummarize: a short line per message

- **A one-line, past-tense summary of each of the character's messages,** made after it arrives: "Summarize the given fictional narrative in a single, very short and concise statement of fact… Include names… past tense."
- **The last 10 messages stay word for word.** Older messages are **taken out of the prompt** and their summaries go in instead, as a bulleted list: "recent events", then "events that occurred in the past".
- **Each tier is capped at 10% of the context.**
- **The player marks a message "remember"** to keep its summary in the long-term tier; unmarked old summaries fall off.
- Optional **update triggers** hold the cut still for N messages, so the provider's cache isn't broken every turn.
- **Each summary shows under its message,** coloured by tier, and can be edited or redone.

**Why it was built, in its README:**
- summarising the whole chat at once loses detail;
- "Letting an LLM determine how to update the chat summary means that it will degrade over time, and one bad generation can completely ruin it";
- edits to the chat don't reach a rolling summary.

**Its tips:**
- keep the summary prompt short;
- use temperature 0;
- treat word limits as hints and cap tokens;
- reasoning models "blab";
- when summaries "continue the conversation" instead, end with "Summarize the above message" or prefill "The summary is as follows:".

**Its flaw:** old player messages vanish, because only the character's are summarised by default.

## MemoryBooks: scenes as lorebook entries

- **The player marks a scene** (two messages) and makes a memory. An automatic mode, off by default, makes one every 50 messages, leaving the newest two alone.
- **The model returns JSON:** a 1–3 word title, a beat-by-beat summary that keeps dates and times and drops out-of-character talk, and **15–30 concrete keywords**: places, objects, proper nouns, unusual actions, "not abstract themes".
- **The entry becomes ordinary lore,** brought back by its keywords. The processed messages are hidden but not deleted.
- **Consolidation** folds scenes into arcs, chapters and books.
- **Side prompts** keep trackers up to date: plot threads, relationships, inventory.

**Lessons from its manual:**
- "Creating an entry does not guarantee that SillyTavern later activates it." Retrieval is the weak point.
- 20 to 60 messages make a good scene. Very large ranges merge unrelated events.
- Weak keywords ("secret") are too broad.
- A tracker's previous entry is "existing state to revise, not proof that every old statement should remain".
- "Cut-off JSON is a common reason for failed generation."

## Smart Memory: typed facts, many tiers

- **Facts are pulled out every three of the character's messages,** each typed (fact, relationship, preference, event), with an importance and a scope (scene, session, permanent). Long-term facts follow a character from chat to chat.
- **Changes replace old facts:** wording like "no longer" or "became" retires the old one.
- **A nine-part summary** (scene, who's present, events, relationships, revelations, threads, where the player is steering, the current moment, the next beat) is made when the part not yet summarised reaches 80% of the context. It is updated part by part: some parts rewritten, events appended, threads updated.
- **Each tier has its own budget,** about 3,750 tokens in all, and its own place in the prompt.

**Lessons from its README:**
- Memory inserted one message deep **leaks into replies verbatim**; move it up to the prompt.
- Every memory prompt starts "CRITICAL: Respond with plain TEXT ONLY. Do NOT continue the roleplay… You are writing a document, not a story", because local models ignore system prompts.
- Weak models pad empty fields with placeholders.
- Reasoning models spend their budget and return garbled structure.
- Edited messages don't update the memories made from them.

## What they agree on

- **Make memory on its own, with a cheap, separate request, at low temperature, with a short prompt that says "don't continue the story".**
- **Keep the recent chat word for word.** Older chat becomes summaries.
- **A single rolling summary rewritten every time degrades.** Pieces that are each written once (a line per message, a scene, a fact) hold up better.
- **Hold the cut still** across turns, so the provider's cache survives.
- **Let the player see, edit and pin every memory.**
- **Retrieval by keywords works.** Embeddings are optional, even to their own authors.
