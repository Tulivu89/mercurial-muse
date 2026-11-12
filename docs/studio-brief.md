# Studio and the rules: brief

Nov 10, 2026 · @AmbiProp · Hand-off for the session that makes the Studio Inkwyrm's worldbuilding tool and launchpad

The Studio makes worlds; the adventure plays them. The aim of this work is that **everything made in the Studio can be played by the rules the moment it exists**:
- a character can be persuaded, fought, robbed or bargained with;
- a place can be searched, slipped through or held;
- an item can be bought, carried or used.

All of this happens with no rules authoring, and an author can change any of it. Then the owner builds their own setting in the Studio, and the adventure is rebuilt to play Studio worlds directly (roadmap step 6).

Read this whole page before writing code. Where it decides something, build that. Where it leaves a question open, ask the owner.

## Where it stands (Nov 10, 2026): start here

All three phases are built, and threads with milestones after them: Studio 0.6.0, adventure 0.25.0. `studio/README.md` lists what the Studio does and what it doesn't yet. The owner's answers to the early questions: group defaults in S1, the Rules panel folded with a summary, the order as written. The owner does not test each phase, so several can go in one turn.

**What a new session should know**
- `core/rules/` holds the rules. Read a record's rules through `rulesFor(world, record)`, never from its `rules` block. A world's `rules` block and a record's hold only what was changed.
- `core/convert/` holds the converters, the schedule model (`schedule.ts`), the checks (`checks.ts`) and the launch hand-off. The adventure's tests run twice, the second time on modules that went through the Studio and back. Keep that green: it is the proof that nothing is lost.
- A record's `carried` block still holds, in the module's names: where someone lives and works, where an item lies, the scenario's start, and anything the model has no field for. A world's holds relationships and the module's own id, version and notes. The Studio edits home, item place and scenario start in place there.
- The adventure still loads modules. Play in the adventure converts the world first.

**Left from this brief**
1. ~~Threads with milestones in the adventure.~~ Built Nov 11: `core/rules/threads.ts`, the module's `threads`, the engine's `threads.ts`, the Journal, and the thread page's **In the adventure**.
2. Relationships, narrowed by the owner on Nov 11: only the player's relationship with a character needs depth (a "with the player" panel: the starting bond and its kind, for the adventure and Chat's Home). Ties between two characters stay in their sections. A module's relationships come through unchanged.
3. Chat reading a schedule event's `when`, and the address `/chat/#/with/<world id>/<record id>` for Chat with. Both are for the Chat session.
4. On World › Rules: the fight and follow rules, craft's steps, what a hop into a room costs, and taking an approach away.
5. Where a place or a group starts its states reaching the adventure.

**Asked for, on the plan**
- **Maps.** Approved Nov 12 (`docs/bids/maps/decision.md`, prototype beside it). **M1 built the same day, Studio 0.9.0:** `core/map/`, the map in `kit/`, the read-only Map page and Travel by level on World › Rules. **M2 built the same day, Studio 0.10.0 and adventure 0.27.0:** the adventure travels by levels and the map, places carry crossing rules, routes retired. **M3 built the same day, Studio 0.11.0:** refining the ground (move, size, paint, roads, what a cell is worth, keep, reroll, reset, add a place). **M4 built the same day, Studio 0.12.0:** icons by genre and choice, colour paint, wrapped names. Next: M5, a picture under a sheet.
- **The helper,** for writing fields. Below, under *The helper*; out for bid as the worldbuilding tools (`docs/bids/worldbuilding/`), with the owner's Nov 11 answers in its brief.
- **The Studio's look and layout** for big worlds: decided from three bids and built in Studio 0.8.0 (`docs/bids/ui/decision.md`). The list goes one level at a time, a record's page is the writing with doors to its other jobs, and every page has an address. Studio 0.7.0 had done the plain fixes first: one searchable picker, Find and order in the list, and a jump bar that the doors replaced.

**Then, as the brief already says:** the owner's own setting built in the Studio; the adventure rebuilt to read records directly (roadmap step 6), when `core/convert/` and `carried` retire; generate buttons and guided builders.

## The helper

Asked for on Nov 11. A record in the Studio has many fields and few of them are obvious: a section's reach, a set's entries, a schedule, a scene action. A blank field asks the author to do all the thinking at once. The helper is a chat beside the record that does that thinking with them, then writes into a field.

**How it goes**
1. The author opens the helper on a record, or on one field of it.
2. They talk it through: who she is, what the place is for, what the thread's pressure is. The helper asks questions and suggests.
3. The author picks a field (or the helper names one) and taps **Write it**. The helper writes that field from the conversation, in the field's own shape: a section's text, a line, a list of keys, a set's entries, a schedule's events.
4. The result lands as a **draft** beside the field, never over it. The author keeps it, edits it, asks again, or throws it away.

**Decided by what came before**
- **The model never writes a record.** It proposes; the author applies. This is Orbis's Coda rule (write access was a flag only the user could set) and the records' own rule.
- **One conversation per record,** kept with the world, editable on both sides, because the conversation is the prompt and a bad reply left in it steers every later call (Character Engine's Build).
- **Each field is its own call,** reading the conversation, the record as it stands, the world's premise, genre and tone, and the record's neighbours by their lines. The field's call says the field's shape and length. Names get a call of their own, with the world's existing names listed so they don't repeat (Character Engine's name call).
- **The world's voice.** Every call carries the writing rules: pulp-voice, plain names, no glossary words, a species in one or two traits. Records in the world are its examples.
- **The player's own model and key,** through the relay, in the model's own prompt format, like Chat's side generations. Budgeted, started by the author, and showing what it will send.
- **Generate buttons are the helper with no conversation:** one tap on a field writes a draft from the record and the world alone.

**The owner's answers (Nov 11)**
1. The helper's voice is Errata, toned down: her name and a light touch, never her full persona, so it doesn't cost the helper's quality.
2. Yes to new records: a workshop chat at the world's level talks through the bigger setting and proposes records, limited by what the player's model can hold.
3. Questions are offered, and every author can change them: everyone has their own template.

**Decided Nov 12** (`docs/bids/worldbuilding/decision.md`, approved by the owner). Its phases:

| Phase | What |
| --- | --- |
| W1 | Generate buttons: **Draft** on the line and every section, names first, the draft card (Keep, Edit, Again, Drop, Undo), the stale check, one resend with the fix, `NEEDS:`, Never sections as Kept back, What this sends, and the live prompt test kit. |
| W2 | The Errata door: rounds of answers to pick, the talk, Settled, the default questions, Write all empty, Plain voice, the helper model, and Export talks. |
| W3 | Try a scene. |
| W4 | The author's library of questions and templates, a world's pick, the form, the kit file. |
| W5 | The workshop, on the world and on a place, with proposals and Check. |
| W6 | More fields: keys, set entries, greetings, example messages, an event's words. |

## A second session is working beside you

Chat is being built at the same time, by another session on another account (`docs/chat-brief.md`, `chat/README.md`). You share files with it, so these rules hold:

- **What each session owns.** Chat owns `chat/`, `core/chat/`, `kit/`, the schedule fields in `core/records`, and the schedule editor in the Studio. You own the rest of `studio/`, the new `core/rules/`, the rules fields in `core/records`, the converters between Studio worlds and adventure modules, and the adventure engine's switch to `core/rules`.
- **Schema changes are additive.** In `core/records/schema.ts`, add optional fields with defaults; never rename, remove or retype a field. A world file saved yesterday must open tomorrow.
- **Keep pull requests small and merge them quickly.** Fetch `main` and rebase before every push. When a pull request touches a shared file (`core/records/*`, `kit/*`, `studio/src/RecordEditor.tsx`, the root `package.json`, the CI workflow, `CLAUDE.md`, `docs/roadmap.md`), say so in its description.
- **Don't reformat or tidy files you don't own.**
- **Chat's dice and sheets (its Phase C) should run on your `core/rules`,** not a second rules engine. The owner will pass that on; see the note at the end.

## Read first

1. `CLAUDE.md`, `README.md`, `docs/roadmap.md`. The owner doesn't use git: you handle branches and pull requests and give them plain merge steps. Never use the owner's real name; sign docs `@AmbiProp`.
2. `docs/records.md`: the record model and its Settled list.
3. **The rules as they stand:**
   - `docs/praxis/charter.md`: the rows on Mechanics, Four Approaches everywhere, Growth, People in the scene and Optional mechanics, and the Architecture section;
   - `docs/praxis/four-approaches-on-genesys-dice.md`;
   - `docs/praxis/growth-challenge-and-economy.md`;
   - `docs/praxis/records-and-context-map.md`.
4. **The engine:**
   - `adventure/src/engine/standard.ts` is the standard ruleset, `four-approaches/1`;
   - `adventure/src/engine/module.ts` has the module schema: tiers, difficulty by approach, states, charges, goods, trade, craft, routes, scene actions, schedules, follow rules;
   - `adventure/AGENTS.md` has the engine's rules: it is pure, and the model never moves a number.
5. **The Studio and the record model:** `studio/`, `core/records/`, `kit/`.
6. **The test modules:**
   - `adventure/modules/abernys-bogwater.json` and its design in `docs/praxis/bogwater-module.md` and `docs/praxis/bogwater-plan.md`;
   - `adventure/tests/engine-bogwater.test.ts`, including the census test: forty days of schedules, no stop outside a real place, never more than four people in one place.

## The idea, and why it works

The adventure already plays any person, thing or place with the Four Approaches without authoring (charter, *Four Approaches everywhere*):
- difficulty comes from the target, its tier, or a roll fixed per save;
- standard deeds cover hurting, persuading, stealing and building leverage;
- states reach the narrator only as sentences from their bands.

So the rules don't need authoring to exist. What's missing is the Studio showing them, and letting an author change them. Four principles carry it:

1. **The world has a ruleset,** `four-approaches/1` by default. A world can change any part of it: states, approaches, deeds, tiers, dice, growth, trade, craft, calendar. Whatever it leaves alone comes from the standard.
2. **Every record's rules are worked out, not stored.** The rules for a record come from its kind, its tier, its groups (a species or faction can carry defaults for its members) and the world's ruleset. **Only what the author changes is stored on the record.** Change the ruleset and every record that wasn't changed follows.
3. **Every rule shows where it came from:** the standard, the world, a tier, a group, or "set here". It is one tap to change and one tap to put back.
4. **Mechanics stay Never text.** Numbers reach the model only as the sentences their bands write (records.md: Never), and the Studio's In context now shows those sentences, so the author sees what the narrator will see.

## Decisions already made

1. **`core/rules/`.** The ruleset schemas and the standard ruleset move from `adventure/src/engine/` into `core/rules/`, because the Studio is now their second user. The adventure imports them from there, with no change in behaviour, and all 208 of its tests stay green.
2. **A `rules` block on records,** optional and additive, holding only overrides:
   - **character:** tier, approach ratings, charges, rank, gang, state values and maxima, difficulty by approach, purse, price, what they sell and carry;
   - **place:** its kind, difficulty by approach, its own states (such as Alert), and routes;
   - **item:** its kind of good (help, weapon, armour, use, goods), worth, harm or armour, what it helps, what it restores, and difficulty to take or break;
   - **group:** a standing ladder and resources for factions; defaults for members, such as a species' maxima.
3. **One function, `rulesFor(world, record)`, in `core/rules/`,** gives a record's effective rules, each part tagged with where it came from. The Studio's Rules panel, the In context now panel, the converter and later the rebuilt adventure all read rules through it.
4. **Studio worlds and adventure modules convert both ways in `core/`,** until the adventure reads records directly (step 6):
   - Bogwater and Port Covenant import into the Studio;
   - a Studio world exports as a module the current adventure plays.
5. **Launch.** A world's page gets **Play in the adventure**. It hands the converted module to the adventure in the browser (a module is about 120 KB; `localStorage` under an `inkwyrm.launch` key is enough) and opens `/` to start it. A character's page gets **Chat with**, which opens Chat on that character; ask the Chat session for its link format.
6. **One schedule model.** Chat put CharacterRoom's schedule on records: days, events in minutes, required intimacy, and which outfit and scenario room go with an event. The adventure's schedules are day plans of rows (from an hour, at a place, doing something) with rules that pick a plan by state. Unify them, additively and agreed with the Chat session:
   - add a place to schedule events;
   - add a condition, so an event holds only while it does (this is how the adventure's plan rules come across);
   - convert both ways.

   Authored worlds use times of day (CLAUDE.md); the minutes are the storage.

## Phases

One pull request per phase at most; smaller is better given the second session. Stop after S1 and show the owner.

### S1: rules on every record

- `core/rules/`: schemas, the standard ruleset, `rulesFor`, and band sentences, moved out of the adventure engine with its tests green.
- A **World › Rules** page in the Studio. It shows the ruleset in plain words (the four approaches, the states and their bands, the tiers, the dice), lets the author change any part, and shows what came from the standard.
- A **Rules** panel on every character, place, item and group:
  - what a player can do here, as a list of deeds by approach with their difficulty;
  - the record's states and how each reads to the narrator right now;
  - where every value came from, with Change and Put back.

  Plain words first, numbers second. A writer who never touches the panel still has a playable record.
- **In context now** gains the state sentences that are off their resting band, under the record they belong to.
- Tests: `rulesFor` on defaults, a tier, a group and an override; the ruleset round-trips; a world saved before S1 still opens.

### S2: Bogwater both ways

- **The converters.** Adventure module to Studio world, and back.
- **The proof.** Import `abernys-bogwater.json` into a world, export it back to a module, and run the adventure's whole test suite against the round-tripped module, census included. It should pass unchanged. Same for Port Covenant.
- **Play in the adventure** from a world's page, and **Chat with** from a character's.
- The adventure's start screen lists modules launched from the Studio.

### S3: authoring what the adventure needs

- **Routes and travel:** distances, terrain, what a route needs to be open.
- **Scene actions:** who must be present, what must hold, what changes.
- **The calendar and world states, threads with milestones,** and the goods a world sells (prices on the ten-step coin scale).
- **The schedule unification** from decision 6, with the Chat session.
- **A Checks panel** for authors:
  - every schedule stop is a real place;
  - never more than four named people in a place at once, over a span of days (Bogwater's census, made a tool);
  - every When has its condition;
  - every route connects;
  - nothing a rule points at is missing.

### After you

These are the owner's next steps, not yours unless asked:
1. The owner's own setting, built in the Studio from the start.
2. The adventure rebuilt to play Studio worlds directly (roadmap step 6), at which point the converter retires.
3. Generate buttons and guided builders in the Studio, with Character Engine's Wizard as the model.

## Gotchas

- `adventure/AGENTS.md` says to keep Orbis field names in modules. That predates the record model. Keep the module format as it is while the converter lives; the rule retires with step 6. Say so in the docs, but don't rename module fields now.
- The engine is pure: no DOM, no network, no storage, time and randomness passed in. `core/rules/` keeps that.
- **Genre:** the four approaches suit any genre, but the coin bands and goods read as fantasy. Make their labels part of the world's ruleset, with the standard's as defaults, so a modern world can say *could buy a car*.
- Save files and modules in players' browsers must keep opening. Version the rules block and keep the old readings, as 0.22.0 did for formats.

## Checks before each pull request

- From the root: `npm test`, `npm run lint`, `npm run build`. CI (the Site workflow) runs them.
- Drive the built Studio in a headless browser at 390 and 1280 px:
  - make a character and see its deeds and state sentences;
  - change one value and put it back;
  - in S2, launch a world into the adventure and take a turn with a stubbed narrator.

  No console errors, no sideways scroll.
- Versions:
  - the Studio's in `studio/README.md`;
  - the adventure's in `adventure/CHANGELOG.md`, bumped only when its code changes (the S1 move to `core/rules/` counts).
- Update `docs/roadmap.md` step 4, the charter's progress table and `CLAUDE.md`'s layout list.

## Ask the owner early

1. Should groups carry defaults for members in S1 (a species' maxima, a faction's standing), or wait until the owner's own setting needs them?
2. Should the Rules panel be open by default, or folded until opened, for writers who don't care about rules?
3. Is the order right: rules first, then Bogwater both ways, then authoring tools?

## A note for the owner to pass to the Chat session

> The Studio session is building `core/rules/`: the world's ruleset, the standard Four Approaches, and `rulesFor(world, record)` giving every record its effective rules. When Chat reaches dice and sheets, build them on `core/rules` so a character's sheet in Chat is the same as in the Studio and the adventure. CharacterRoom's dice presets (D&D 5e, Blades and the rest) can be rulesets there. The Studio session will also add a place and a condition to schedule events, additively; please agree the shape with it before changing `scheduleEventSchema` again.
