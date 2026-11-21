# The next sessions

Nov 18, 2026 · @AmbiProp · What comes after the reviews, in order, each as one dedicated session with a prompt to paste. Writing sessions are in `docs/content/next.md`; this page is the code sessions and how they fit around them.

## Where things stand

The reviews (`docs/reviews/`) compared Inkwyrm with SillyTavern, RisuAI, Agnai, Marinara Engine and Talemate, and most of what they decided is built:
- **Standards (all four phases built):**
  - cards in, cleaned;
  - lorebooks in and out, NovelAI's included;
  - cards out with the record inside, CHARX in;
  - SillyTavern chats in and out.
- **Prompt setup:**
  - length in words, carrying on at the limit, emotions picked after the reply;
  - Gemini through Google's own API with its filters off;
  - the Prompt settings, mature content on, and the 18+ question.
- **Memory:** chapters for what leaves the window, folding, memory carried between chats, facts offered for the journal, and Xialong included.
- **Features (F1):** branches, Write my turn, read aloud with the device's voices, Chat on a phone's home screen.
- **The adventure (A1):** the evaluator. Free text proposes a check from closed lists; the player rolls, changes or sets it aside; Options offers three.

Not yet built: A2 to A4, group chat, first messages and images.

## In order

| # | Session | Kind | Why now |
| --- | --- | --- | --- |
| 1 | **The adventure module:** seed and first slice | Writing | The owner's priority. The adventure's new features need a world to test on. Volungraiv's slice (Qetzal's Lowgate) is filled (Nov 19, `docs/content/volungraiv/slice/5-fill.md`); play is next, and the ceiling gold (`docs/bids/volungraiv-ceiling/`) fills the temple. Prompt: `docs/content/volungraiv/plan.md`, *The next session* |
| 2 | **Adventure A2 and A3:** opponents' moves, progress clocks, story events | Code | Built against the module's first slice, which is written to exercise them |
| 3 | **Group chat G1 to G3** | Code | Designed (`docs/model-jobs.md`) with the review's additions; Home's households are made for it |
| 4 | **First messages (F3), then images (F4)** | Code | Joins Chat, Home and the clock; images are what every other app has |
| — | Later | | A4, other rule systems (after our dice system is tested and fully built); characters talking on their own (after group chat); accounts, then hosted models (`docs/value.md`) |

Sessions 1 and 3 can run side by side: one writes, the other codes, and they touch different folders.

## Prompts

**Session 2, adventure A2 and A3.**
> Read `CLAUDE.md`, `adventure/AGENTS.md`, `docs/praxis/charter.md`, `docs/reviews/adventure/decision.md` and `marinara.md` beside it, then `adventure/src/engine/checks.ts`, `evaluator.ts` and `core/rules/`. Build A2:
> - opponents' moves picked from a list the rules offer (their approaches against a target), with their rank setting the difficulty you face;
> - progress clocks as bounded states shown in segments and ticked only by rules.
>
> Then A3: thread and world-state events with triggers and actions, and events the narrator may trip by name, refused visibly when off the list. The model never moves a number. Use the new module's first slice if it's merged (`content/volungraiv/world.json`, framed in `docs/content/volungraiv/slice/3-frame.md`), else Bogwater's fixture. The slice needs three more things (`docs/content/volungraiv/slice/4-gold.md`, *The plan from here*):
> - milestones that are alternatives, where reaching one closes the rest, and a way for the player to close a whole thread by hand, because there should always be a way to resolve a thread for emergent situations;
> - When sections carried from a Studio world into the adventure, keyed to milestones reached and world states (`core/convert` drops them today);
> - if it fits, Named sections kept on their keys instead of folded into the description sent every turn; otherwise note it for roadmap step 6.
> - from the fill (`5-fill.md`, *For the code session*): a place's starting states (the Lee's Alert) carried to the adventure, and `ownTerms` not taking "The" as a character's first name.
> Stop after a short plan of the data shapes for the owner's review; then build, with tests, `npm test`, `npm run lint` and `npm run build` green, and a pull request with plain steps to merge.

**Session 3, group chat.**
> Read `CLAUDE.md`, `docs/model-jobs.md` (Group chat, with the answers and the review's additions under question 4), `docs/reviews/group-chat/decision.md`, `core/chat/general.ts`, `core/chat/build.ts` and `core/chat/chapters.ts`. Build G1 (the core and the lab), then G2 and G3, one pull request each:
> - one speaker by default;
> - a group button or long press on Send to pick who answers;
> - the agent's pick when nobody is named, behind a setting, else the quietest;
> - clean-up after each reply;
> - the journal and chapters in the shared part.
>
> A one-to-one chat must build byte for byte as before. (AetherRoom parity was retired on Nov 21.) Stop after G1's plan for the owner's review.

**Session 4, first messages and images.**
> Read `CLAUDE.md`, `docs/reviews/features/decision.md` (F3, F4), `core/chat/home.ts`, `core/chat/time.ts` and `core/chat/posts.ts`. First F3:
> - a character whose schedule has them free may write first after time away;
> - at most one message waiting, and off per character.
>
> Then plan F4, images through the player's own provider (NovelAI first), for post photos, portraits by emotion and rooms, and stop for the owner's review before building it.
