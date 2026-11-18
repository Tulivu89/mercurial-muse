# Notes: Marinara Engine's game mode and our adventure

Nov 18, 2026 · @AmbiProp

Marinara Engine 2.5.2 (AGPL-3.0), read from a clone: `docs/game/`, `docs/extending/` and `packages/server/src/services/game/`. Its 5e SRD package lives in another repository (`Pasta-Devs/Marinara-Agents`); only a draft of it was read. Four long reference docs were skimmed by heading. Ours: `adventure/src/engine/`, `core/rules/`, `docs/praxis/charter.md`.

## One turn in Marinara

- **The player types an action,** may queue a roll, and may pick a map destination.
- **The game master model gets:**
  - a system prompt: role, genre, tone, the world kit, the story script, the ruleset's GM reference, party cards;
  - the scene state the server worked out: weather, morale, encounters, combat results;
  - a closing reminder of a **bracket-tag language** it may write: `[skill_check:]`, `[inventory: add|remove|…]`, `[reputation: npc= action=]`, `[state: combat]`, `[story: event=]` and about twenty more.
- **Dice are rolled in code, never by the model.** The model decides *whether* there's a check, which skill, and the difficulty. Numbers it writes are replaced.
  - By default the model writes **before** the roll, as a success half and a failure half, and the engine keeps the half the roll picks.
- **The engine applies or refuses every tag,** and rewrites it in place as a receipt (`result="ok" now="4/6"`, or refused with a reason).
- **But the model picks many magnitudes:**
  - damage outside fights;
  - whole enemy stat blocks in classic fights;
  - item effects.
  - Reputation and morale are the exceptions: a label the model picks from a list, with a table supplying the number.
- **State:** sheets, HP, inventory with markets, a party, quests (an AI agent, or flags in story scripts), time from a fixed table, weather from biome-and-season tables, maps, morale, progress clocks, a journal, sessions with summaries, checkpoints.

## Installable rulesets

- **One JSON file of data, never code,** checked against a published schema.
- **The heart is a `resolution.kind`,** one of five built into the engine:

  | Kind | What it does | Covers |
  | --- | --- | --- |
  | `dice-sum` | dice plus sheet numbers against a difficulty | d20, PbtA 2d6, Fate |
  | `dice-pool` | count successes | World of Darkness |
  | `dice-highest` | keep the highest die | Blades, Trophy |
  | `roll-against` | roll under a percentage | Call of Cthulhu, GURPS |
  | `symbol-pool` | narrative symbol dice | Genesys |

  **Its symbol-pool faces match ours exactly.** A new mechanic is "a new resolution kind inside the Engine, which is a code contribution with tests."
- **Every kind shares the same parts:**
  - ability modifiers, proficiency tiers, a difficulty ladder;
  - **outcome bands** (Critical, Full, Partial…), each with a line of text for the game master.
- **Blocks for the rest:** the sheet, rests, catalogs, items and markets, combat (its own initiative, actions and bestiary).
- **Layers** are named options fixed when a game starts. They can only take things away or add guidance, never add mechanics.
- **Only guidance text reaches the prompt;** every number stays in code.
- **A game is pinned to the ruleset version it began on.**

**Story scripts** are data too:
- flags shown as quests or clocks;
- standing directions while conditions hold;
- events on triggers (arrive, meet, day, deed, fight, rest, idle…) with actions (set a flag, tell the GM, a cutscene, give, fight, move, ending);
- knowledge a person may share, behind conditions.

**The model's share is closed:** it may only trip events marked for it, by id.

## Ours, the same way

- **The player picks a check from the menu:** target, approach, charge, push, and what they want from it. Free speech never starts a check.
- **The rules settle it first:**
  - a Genesys pool, with exact odds computed;
  - difficulty from the record, its tier or the default;
  - setbacks from states, boosts from leverage.
- **The reading moves state** by authored cost tables:
  - successes wear the target's state down;
  - failure and threat cost what the approach says;
  - advantage gives Edge, a triumph or despair moves a bond.
- **The outcome becomes plain sentences** ("It works: …", "It gains ground, but…") put into the reply's prefill. The narrator writes from them.
- **The model decides only prose.** The evaluator, which would turn free text into a proposed check chosen from closed lists, is planned but not built.
- **One rule system:** `extends` accepts only `four-approaches/1`. World rules are sparse overrides of it, and much of it is data (states, approaches, costs, deeds, goods, levels). The dice and the reading are fixed in code. Blades and Year Zero presets are mentioned in docs, never built.

## Side by side

| Decision | Marinara | Ours |
| --- | --- | --- |
| Dice and their maths | Code | Code |
| Whether a check happens | The model | The player, by menu |
| Difficulty | The model | The rules |
| What an outcome does to state | The model writes amounts; code checks they're legal | Authored tables; the rules apply them |
| Enemy numbers | The model, in classic fights | Authored records |
| Write first or roll first | Write both halves, keep one | Roll first; the outcome is fixed before writing |
| Reputation | A label the model picks → a table | Bonds move by triumph or despair |
| Quests | An AI agent, or script flags | Threads with milestones, by state tests |

**Marinara is broader:**
- a combat screen and tactical grid, a party, inventory and markets, weather;
- installable rulesets, story scripts, receipts on every tag.

**Ours is stricter:**
- no number moves without a rule or the player, and the ledger records it;
- the four approaches work on any person, place or thing without authoring;
- exact odds before the roll;
- states reach the model only as band sentences.

**Our gaps:**
- no evaluator;
- opponents never act with their own dice;
- no turn order in a fight;
- one ruleset only;
- no weather or encounters.
