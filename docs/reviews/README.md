# Reviews

Nov 17, 2026 · @AmbiProp

What other roleplay apps already know. A review reads open-source apps and the formats they share, and asks three things: what lessons they learned that we can skip learning, what features they have that we don't, and what standards players already carry between apps. It works like a bid (`docs/bids/README.md`), except the bidders are apps that already shipped.

## The folders

One folder per topic:

| File | What it is |
| --- | --- |
| `brief.md` | The questions, what Inkwyrm already does, and which apps and specs are read. |
| `<source>.md` | Notes on one app or spec: what it does, with file and line where the source was read. |
| `decision.md` | What to adopt, what to learn from, what to skip, each with the reason and the cost. The owner approves or vetoes. |

A short topic can keep its notes inside `decision.md`.

## The rules

- **Ideas and formats, never code.** Most of these apps are GPL or AGPL. We read them to learn; we write our own. A published spec (Character Card V3 is MIT) can be followed exactly.
- **Read the source, not the pitch.** A README says what an app wants to be; its code says what it does. Where a page couldn't be reached, the notes say so instead of filling in from memory.
- **Measured against ours.** Every finding names what Inkwyrm already does, so the decision is a gap, not a wish list.
- **Our rules still hold.** The model never moves a number; records keep their reaches; flagship content isn't written by the site's model. A feature that breaks one of these is a skip, however popular.
- An approved decision becomes a phase in the brief it belongs to (Studio, Chat or the adventure), the same as a bid.

## The topics

| Topic | Brief | Decision | Status |
| --- | --- | --- | --- |
| Standards: cards, lorebooks, chat files, macros | `standards/brief.md`, Nov 17 (notes: `card-specs.md`, `sillytavern.md`, `agnai-risuai.md`) | `standards/decision.md`, Nov 17 | X1 to X4 built Nov 18 |
| Prompt setup: system prompts per model, reply length, mature content, refusals, emotions | `prompt-setup/brief.md`, Nov 17 (notes: `sillytavern.md`, `agnai-risuai.md`) | `prompt-setup/decision.md`, Nov 17 | P1 to P3 built Nov 18 (Chat 0.6.0 to 0.7.0) |
| Memory in long chats | `memory/brief.md`, Nov 18 (notes: `sillytavern.md`, `risuai-talemate.md`) | `memory/decision.md`, Nov 18 | C1 to C4 built Nov 18 (Chat 0.8.0 to 0.9.1) |
| Feature sweep | `features/brief.md`, Nov 18 (notes: `apps.md`) | `features/decision.md`, Nov 18 | Answered Nov 18; F1 built (Chat 0.9.0) |
| The adventure: Marinara's game mode, our dice, other rule systems | — | `adventure/decision.md`, Nov 18 (notes: `marinara.md`) | A1 built Nov 18 (adventure 0.28.0) |
| Group chat: four apps against our plan | — | `group-chat/decision.md`, Nov 18 | Answered Nov 18; folded into `docs/model-jobs.md` |

## Sources

Checked to exist on Nov 17: SillyTavern, RisuAI, Agnai, Talemate, Marinara Engine, kokoro-chat, the Character Card V2 and V3 specs, and the SillyTavern memory add-ons (MemoryBooks, qvink's MessageSummarize, Smart Memory). Sukino's Findings (rentry.org/Sukino-Findings) indexes the rest of the scene. Four names from an outside list (ORC, Chronicler, GensokyoAI, Ägir) could not be found and are not used.
