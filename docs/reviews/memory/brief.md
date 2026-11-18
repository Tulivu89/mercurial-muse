# Memory in long chats: brief

Nov 18, 2026 · @AmbiProp

How should a chat with Inkwyrm keep a long conversation coherent once it no longer fits in the model's window? The brand's line is *characters who remember you*. This is the third review (`docs/reviews/README.md`).

## The questions

1. **What leaves the window.** When old messages drop out, what should replace them: a rolling summary, chapter summaries, facts, or nothing?
2. **When memory is made.** By hand, every N messages, or when messages leave the window?
3. **What it costs.** A separate model call (the Side job in `docs/model-jobs.md`), how often, and how long.
4. **Where it goes.** Its place in the prompt, its budget, and how it keeps the stable prefix a provider's cache reuses.
5. **What the player sees and controls.** Reading, editing, pinning, deleting.
6. **Retrieval.** Is similarity search (embeddings) worth it for a browser-only site, or do keys and summaries do?
7. **What goes wrong** in the other apps: summaries that drift, swell, repeat, or get mistaken for the chat.

## What Inkwyrm does now

All of it is in `core/chat/` and the chat's own record (`core/chat/chat.ts`):
- **The journal** (CharacterRoom's Jots): facts about the player, written by the player, sent with every reply.
- **Diary (Reflect) and feelings (Process):** the character writes them from the chat when the player presses the brain button. Each is recalled when one of its keys is said.
- **Plans** that count down by the player's messages.
- **Moods** from the last few emotions or from time away.
- **The window:**
  - **General profile** (`general.ts`, `windowStartFor`): when the chat outgrows its share of the context, whole messages leave from the start a piece at a time, so the prefix stays the same between cuts. **What leaves is gone:** nothing summarises it.
  - **Xialong** (`aetherroom.ts`): CharacterRoom's rollover trims the same way.
- **Nothing happens on its own.** Every memory is made because the player asked.

## Read for this review

- SillyTavern 1.19.0's built-in Summarize and the chat side of its Vectors extension.
- Three SillyTavern add-ons: MemoryBooks, qvink's MessageSummarize, Smart Memory.
- RisuAI's SupaMemory and HypaMemory.
- Talemate's summarisation, long-term memory and world state.
- Agnai's embeddings, already in `docs/reviews/prompt-setup/agnai-risuai.md`.

Ideas only, never code.
