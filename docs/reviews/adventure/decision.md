# The adventure: decision

Nov 18, 2026 · @AmbiProp · Answered by the owner Nov 18; A1 built Nov 18 (adventure 0.28.0); A2 next

From Marinara Engine's game mode (`marinara.md`) and the owner's priority (Nov 18): **our AI-friendly dice system first**, because it bridges the model's creative side and the rules' deterministic side. Other rule systems should be addable, though they won't slot in the way ours does.

## The plan in a few lines

Make the dice system usable from free text. The **evaluator** reads what the player writes and proposes a check from closed lists: approach, target in the scene, what they want. The rules settle it as now, and the narrator writes from the outcome sentences. That is the bridge: the model chooses words from lists, the dice and tables decide. Then the same idea for **opposition** (an opponent's move picked from a list), **story events** a model may trip by name, and **progress clocks**. Then open the resolution to **other systems as data**, Marinara's way: a few resolution kinds in code, each reading a roll into named outcome bands, and a ruleset file that sets the numbers and maps bands to our costs.

## What to take, and how it fits our rule

The rule: the model picks a label from a closed list, and the rules move numbers.

| From Marinara | Call | How it fits |
| --- | --- | --- |
| Tags the engine answers with a receipt | **Adopt, as the evaluator's shape.** The narrator (or a Side call) may propose `[check: approach= target= want=]` with values only from lists the engine gave it. The engine settles it or refuses visibly, and the player sees the proposal and can change it before it rolls | The model picks labels; the engine rolls. Marinara's `[reputation: action=]` with a table is exactly our pattern. Unlike its silent zero, a label we don't know is refused out loud |
| The model deciding difficulty and magnitudes | **Skip** | It crosses our line |
| Writing before the roll (two halves) | **Skip** | We roll first and narrate once, which is simpler and can't be steered |
| Opponents choosing moves | **Adopt, as a list:** an opponent's turn is one of the moves the rules offer it (its approaches against a target), picked by the narrator or by the rules' own choice. Its rank sets the difficulty you face | Closes our gap of opponents never acting |
| Story scripts: events on triggers, actions, events the model may trip by id | **Adopt, on threads and world states:** triggers (arrive, meet, day, rest, idle, fight over) and actions (set or move a state, tell the narrator once, a written cutscene, give, move, an ending); an author can mark an event as the narrator's to trip by name | The author's table says what an event does; the model only names it |
| Progress clocks | **Adopt:** a bounded state shown as segments. Rules tick it (threat, time, crossings), never a free number | Already our state primitive |
| Weather | **Later:** a world state moved by a seeded table when the day turns; the narrator reads its band | Pure, seeded, like the engine |
| Installable rulesets | **Adopt, in steps (below)** | Data for numbers, code for resolution |
| Layers | **Later:** named options that narrow a ruleset and add narrator lines, fixed when play starts | Our world rules are already sparse overrides |
| Combat screen, grid, markets, party, sessions | **Later, after the above** | Breadth, once the core loop is AI-friendly |

## Other rule systems as add-ons

As Marinara proves, data sets the numbers, and resolution is a short list of kinds in code:
1. **Resolution kinds in `core/rules/`,** pure, each with exact odds and worked rolls as tests:
   - `symbol-pool`: ours, moved out of the adventure's `dice.ts`;
   - then `dice-highest` (Blades: 6 full, 4–5 partial, 1–3 bad, two 6s critical);
   - `success-pool` (Year Zero);
   - `dice-sum` (PbtA 2d6: 10+, 7–9, 6−).
2. **Outcome bands are the closed list.** Each kind reads its roll into a band id. A ruleset's table maps each band to our costs and an outcome sentence. Today's lines become the `four-approaches/1` table.
3. **"Approach" generalised** to whatever a check is made with (Blades actions, Year Zero skills, PbtA stats). Situational choices become more closed lists, such as Blades' position and effect.
4. **A ruleset file:**
   - an id, version and licence, its kind and parameters, its sheet words mapped onto states, its bands;
   - checked on import line by line;
   - a world names it by id and version, and a save is pinned to it.
5. **Kept as they are:**
   - the `core/convert` round trip and the second test run;
   - no rules text in the prompt (the model never rolls), only band sentences.

They won't slot in like ours: our four approaches work on anything without authoring, and theirs need sheets and catalogs. A world on another system gets the same evaluator, events and clocks, with its own bands.

## Phases

| Phase | What |
| --- | --- |
| **A1, the evaluator** | Free text → a proposed check from closed lists, shown to the player, settled by the rules (charter *Next* 4). The narrator may propose one; a Side call checks it |
| **A2, opposition and clocks** | Opponents' moves from a list; progress clocks shown and ticked by rules |
| **A3, events** | Thread and world-state events with triggers and actions; events the narrator may trip by name |
| **A4, resolution kinds** | `symbol-pool` moved to the core; band tables; the ruleset file; then Blades, Year Zero and PbtA kinds |

These run alongside roadmap step 6 (the adventure on the new records) and the search for a game to replace Bogwater.

## The owner's answers (Nov 18)

1. **A proposed check waits for the player:** tap to approve, edit or dismiss. Ignoring it dismisses it after the player's next message. Another way in is a cheap **choices card**: a short Side call that offers a few options, each a check from the closed lists, for the player to pick.
2. **Other rule systems are not a focus** until our own dice system is tested and fully built. A4 waits.
3. **The world that replaces Bogwater is the test bed,** written after HOG Wild.

## Questions for the owner

1. **The evaluator:** should a proposed check wait for the player's tap (proposed), or roll at once with an undo?
2. **Which other system first:** Blades, Year Zero, PbtA, or CharacterRoom's dice presets?
3. **A game to replace Bogwater:** should the first world written for these phases be its test bed?
