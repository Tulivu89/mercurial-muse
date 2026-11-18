# Memory in long chats: decision

Nov 18, 2026 · @AmbiProp · Answered by the owner Nov 18; C1 to C4 built Nov 18 (Chat 0.8.0 to 0.8.3)

From the brief and the source of SillyTavern (with three memory add-ons), RisuAI and Talemate (notes beside this page). For the General profile first; Xialong and the adventure follow.

## The plan in a few lines

When old messages leave a chat's window, a short side request writes them up as a **chapter**: a few plain sentences in the past tense, with names, written once from those messages and never rewritten by the model. Chapters sit just above the chat, newest in full; when they outgrow their share, the oldest are folded into one **Earlier** summary, one layer and no deeper. The player sees every chapter in Memory, and can edit, pin, redo or delete it. Nothing is searched by embeddings. The pieces we already have stay: the journal, diary, feelings, plans and moods.

## What the apps agree on (settled)

- **Memory is made on its own, near the edge of the window, by a separate cheap request** at low temperature. RisuAI summarises only when the prompt overflows; qvink and Talemate run after messages, on a threshold.
- **Each piece is written once from its own messages.** A rolling summary rewritten every time "will degrade over time, and one bad generation can completely ruin it" (qvink's README). SillyTavern's built-in Summarize is the one that does it, and the add-ons were written to replace it.
- **The recent chat stays word for word.** qvink keeps 10 messages, RisuAI 3, Talemate at least 5.
- **The prompt says it's writing a document, not the story:** "Do NOT continue the roleplay" (Smart Memory), "YOU MUST NOT QUOTE DIALOGUE" (Talemate).
  - The transcript is fenced.
  - Earlier context is marked as not to be summarised, and given sparingly, because it leaks into the new summary (Talemate).
  - Names, not "someone".
  - Word limits are hints; cap the tokens.
- **Detail falls away with age, in a few layers at most.** Talemate: "diminishing returns at Layer 4 and beyond".
- **The player sees and edits every piece,** can pin the ones that matter (RisuAI's "important", qvink's "remember"), and redo one.
- **A piece goes stale when its messages change.** RisuAI drops it; Talemate offers a redo.
- **Embeddings are optional.** MemoryBooks' FAQ: "Do I need vectors? No."
- **Hold the cut still** so a provider's cache survives (qvink's update triggers). Inkwyrm's window already moves in pieces for this reason.

## Where Inkwyrm starts ahead

- **The window moves in pieces already** (`windowStartFor`), so there is a natural moment to write a chapter. It comes every few dozen messages, not every turn, and the prefix stays stable between cuts.
- **Lore and memories already come in by keys** (Named), which is what MemoryBooks rebuilds on top of SillyTavern.
- **The journal, diary, feelings and plans** are the kind of typed memory Smart Memory adds, already in the record of a chat.

## The calls

| Question | Call | Why |
| --- | --- | --- |
| What leaves the window | **A chapter, written once from exactly the messages that left.** 3 to 6 sentences, past tense, names, what happened and what changed between the two; no quoted dialogue. The previous chapter goes along as context marked "don't summarise this", and only that one | Write-once pieces hold up; one chapter of context avoids the leak Talemate reports |
| When | **When the window moves.** The cut that drops messages queues a chapter for them. A side request after the reply, never in front of it | Cheap: one request per cut. No timer, no guessing scenes |
| Which model | **The chat's own connection for now, then the Side job** when it exists (`docs/model-jobs.md`), at temperature 0.3, with its own small allowance and Gemini's thinking room | As the emotion helper does. A cheaper model is the apps' advice too |
| Where it goes | **A "Story so far" block just above the chat:** an Earlier summary if there is one, then the chapters in order. It changes only at a cut, so the prefix holds | Not one message deep: Smart Memory's lesson is that shallow memory leaks into replies |
| Budget | **15% of the context.** When the chapters outgrow it, the oldest unpinned ones are folded into the Earlier summary (one request). Pinned chapters are never folded | One layer: Talemate's returns fall off after a few, and folding only the oldest keeps the newest exact |
| Retrieval of old chapters | **None beyond the Earlier fold.** Each chapter also gets a few keys, so a later phase can bring a folded chapter back by name, as lore does | Keys are our existing machinery; embeddings would need a model in the browser and buy little |
| The player | **Memory › Chapters:** each chapter with the messages it covers, edit, pin, redo, delete; the Earlier summary editable too; a line saying when the next chapter will be written | Every app found this was needed |
| Stale chapters | **A chapter whose messages were edited or deleted is marked "out of date", with Redo.** Not dropped on its own | Talemate's way: the player decides; dropping silently loses what they may have fixed by hand |
| Failure | **A failed chapter is kept as "not written yet" and tried at the next reply,** at most three times, then shown with Redo. The chat never waits on it | qvink and Smart Memory retry on the next turn |
| Facts | **Later phase:** each chapter may offer one or two journal facts about the player, taken only with a tap, as Errata's Settle does | Smart Memory's typed facts, without facts the model adds by itself |
| Xialong | **Later phase:** chapters as a CharacterRoom brain entry, without touching `aetherroom.ts`'s parity | The byte-for-byte rule holds |
| The adventure | **Out of scope here.** It has its own journal and log; when it reads records (roadmap step 6), the same chapters can serve it | Keep this review to Chat |
| Tracked states, world snapshots, entity graphs | **Skip** | Our rules keep states with numbers the model never moves. Talemate's own docs warn that model-kept state "spirals" |

## Phases

| Phase | What | Size |
| --- | --- | --- |
| **C1, chapters** | Chapters written when the window moves; "Story so far" above the chat; Memory › Chapters to read, edit, pin, redo and delete; stale marks; retries. Core and Chat | One PR |
| **C2, folding** | The Earlier summary within the 15% budget; pins kept out of it; keys on each chapter | One PR |
| **C3, facts and Xialong** | Journal facts offered from chapters; chapters for Xialong as a brain entry | One PR |

## The owner's answers (Nov 18)

1. **On by default,** with a switch.
2. **The transcript stays in the chat as it is;** chapters are managed in a Memory view that is easy to reach. **Memory has to carry between chats** with the same character.
3. **Chapter length** starts at 3 to 6 sentences and is a setting: short, the usual, or full.

So the phases become:

| Phase | What |
| --- | --- |
| **C1, chapters** | As above, with the length setting, and Memory reached from the brain button |
| **C2, memory between chats** | A chat can bring in another chat's memory with the same character: its journal, diary, feelings and chapters, the chapters as one "Before this chat" chapter. A new chat offers it when there is an earlier one |
| **C3, folding** | The Earlier summary within the 15% budget; pins kept out of it; keys on each chapter |
| **C4, facts and Xialong** | Journal facts offered from chapters; chapters for Xialong as a brain entry |
