# Praxis — Charter

Nov 6, 2026 · @AmbiProp

The whole project's order and the decisions that cross its parts are in `docs/roadmap.md`.

Praxis is a single-player chat RPG: text-adventure roleplay with optional dice-driven mechanics, modeled on Character Engine. It loads a world module whose starting records come from Orbis, and keeps the live records in the player's own save.

## Settled

| Topic | Decision |
| --- | --- |
| Repository | `Tulivu89/mercurial-muse`, in `adventure/` since 0.22.0 (`praxis/` from Nov 6, 2026), with the narration code shared from `core/`. One npm install at the root. Earlier history is in HowlingWhispers/HW-Praxis (the Java prototype at `d3b13ee`). |
| Stack | TypeScript throughout: React and Vite for the interface, a thin Express server, zod schemas, Vitest. The same stack as Orbis and Speculus. Pieces are lifted from Speculus where they fit; the interface is our own. |
| Players | Single player. No accounts, no multiplayer. |
| Saves | In the browser (IndexedDB). Clearing site data clears them, so exporting and importing a save file is a core feature. The server stores nothing about play. |
| Generation | Any OpenAI-compatible provider, from 0.21.0, with the player's own key: NovelAI, OpenRouter, Featherless, ArliAI, Infermatic, NanoGPT, DeepSeek, Z.ai, more added by the server operator with `NARRATION_PROVIDERS` (`PRAXIS_PROVIDERS` before 0.22.0), or a server of the player's own. Listed providers go through a relay on the Praxis server that forwards only to them, with the key sent per request and never stored; the player's own server is called from the browser. By default one prompt in the model's own format (GLM, ChatML, Qwen 3, Llama 3, Mistral, Gemma, DeepSeek) goes to the completions endpoint, so the prefill works; providers without one get chat messages. This stays until Orbis's generation gateway can carry Praxis. |
| Mechanics | *Four approaches on Genesys dice* (proposal 0.1), on Character Engine's state primitive. Its open questions use Genesys defaults for now (below). |
| Four Approaches everywhere | Every person, thing and place can be acted on with the Four Approaches without authoring: states owned by approaches, deeds (Finesse against a person: it works or fails, and failure raises Alert), and Focus building Leverage (people) or Prepared (things, places) that another approach spends. Difficulty comes from the target, its tier, or a random roll fixed per save. Anything the story mentions can be added on the spot. Modules extend the standard ruleset `four-approaches/1`, which lives in `core/rules/` from 0.23.0 so the Studio shows the same rules on every record it makes. |
| Narrator | GLM-4.6 first; Xialong on hold. A traditional text adventure in second person, present tense. The rules are written as what to do. The house format: speech plain, with no quotation marks; *narration and action* in asterisks; (thoughts) in parentheses; [notes] in square brackets, outside the story. |
| The narrator's context | Laid out as NovelAI lays out a story, each thing sent once. In order: (1) a fixed system message: rules, the format shown by example, and the world; (2) the lorebook section: story so far, you, where you are, the dramatis personae, and lore switched on by key and kept until you leave; (3) the transcript, with each past outcome beside its words; (4) your words; (5) a prefill in NovelAI's shape carrying the outcome and every condition to keep true. Outcomes and conditions are brief and say what they mean. *Records and Context Map* §1–3 has the detail. |
| Growth, challenge and economy | From *Praxis — Growth, Challenge and Economy*, all decided Oct 17 and built in 0.17.0 to 0.19.0. XP is earned from what the engine sees: overcoming people, obstacles, lessons and module milestones. It is spent at Genesys's prices on ratings and a charge ladder to Master. Every approach has one secondary lane. Challenge grows by rank and gangs, with one potential enemy to a place, and a fight that ends is over. Coin goes on a ten-step scale, and the narrator reads its band. Each good does one job (help, weapon, armour, use). Bribes are paid only if taken. Bargains, terms that count down, and making things with Focus. |
| People in the scene | Schedules hold while you're with someone. Followers (companion by bond tier, captive, won over, or by hand) travel with you, keep no schedule, and are checked again on every journey. |
| Optional mechanics | Anything can be set by hand. The player can change any state directly, put themselves anywhere, take a closed way anyway, or resolve any check as an automatic success. Every override is recorded in the ledger as the player's edit. |
| Interface | One play screen and one scroll: the story, the prompt at its end, and the menu under the prompt. The menu is five sections, all closed until one is opened, one open at a time, most present first: Scene, You, Map, World, Settings. No header bar and no menu button: the player scrolls past the prompt to reach it. A check opens in the prompt's place; the journal, the rules guide and the record form open where the menu was. The design canvas is *Praxis play screen* in the owner's artifacts. Look, from 0.26.0: Wet Ink (`docs/brand.md`), paper by day and ink by night by the site's one setting; Literata for the story with narration in italic grey ink and speech plain, Atkinson Hyperlegible Next for the interface, Fraunces for headings; the seal for the one thing to press (Send, or a check's roll), blue-black for anything the player did by hand, and the four approach colours, darkened for paper. The site's header shows on the start screen and never in play. |
| Journal | The primary record of the story so far, sent with every turn. The player can write anything. When story is about to leave the model's window, Praxis suggests a short entry for it; past the journal's budget, it suggests combining the oldest entries. Nothing joins the journal until the player keeps it, and both suggestions can be switched off. Character Engine's shape: active entries are sent, archived ones are kept and never sent. |
| Local records | Players add people, places, things, groups and notes to their save, and start bonds with people they meet. The narrator reads them like canon and they can be exported to bring into another save. Organizing them under the player's Orbis space is Orbis's job. |
| Rules reference | An in-app guide, *How Praxis plays*, that every part of the game can point to. |
| Draft markers | Shown only while testing (Settings › Testing). |
| Relationship to Speculus | Settled: Praxis is free to become what it needs to be. |
| Test module | *Abernys: Bogwater*, from 0.20.0: a fen town in the autumn eel run, played by a runaway from a Port Covenant indenture. Its design is the Claude Doc *Praxis — Bogwater Module Plan*. *Abernys: Port Covenant*, whose content was shaped by its tests, stays loaded until Bogwater's tests cover what its tests do, then retires. |
| Images | After everything else is established. |
| Deployment | Live since Nov 7, 2026 on a Hetzner server of the owner's own, at `135-181-31-213.sslip.io`: `deploy/setup-server.sh` once on a fresh Ubuntu 24.04 box (or `deploy/cloud-config.yaml` pasted into Hetzner's Cloud config box, which runs it with no terminal), then `bash /srv/muse/deploy/deploy.sh` for updates. From 0.22.0 the site runs as the `inkwyrm` service (`deploy/inkwyrm.service`) from `/srv/muse/adventure`, on 127.0.0.1:8791 behind nginx with HTTPS; the server account is still `praxis`. |

## How work lands

Claude's sessions can push only to `claude/*` branches, and cannot merge into `main` without a person approving. Each change goes to a branch, passes the CI check (tests, type checks, build, and a check that the production server answers), and arrives as a pull request. The owner can try any branch first in a GitHub codespace, which builds and starts Praxis by itself (the repository's `.devcontainer`); then they merge it on GitHub: open the pull request, click **Merge pull request**, then **Confirm merge**.

## Four Approaches: interim answers

The proposal's open questions, answered with Genesys defaults adapted to four approaches and charges until we decide otherwise.

| Question | For now |
| --- | --- |
| Creation budget | As the proposal: every approach starts at 1, add 4 points, none above 3. Charges: one Trained, two Practiced, one Raw. |
| Difficulty | The Genesys ladder in purple dice: Simple 0, Easy 1, Average 2, Hard 3, Daunting 4, Formidable 5. |
| Injuries | The Genesys severities. Minor is Easy, serious is Average, grave is Hard. Treating an injury is a Focus check at its severity's difficulty. |
| Recovery | Health returns 1 per full rest (Genesys: one wound per night). Strain clears at the end of a scene (Genesys: at the end of an encounter). |
| Bonds | Shown as words, not numbers. Genesys has no bond track, so this follows Character Engine's band display. |
| Encounter states and difficulties | Authored in the module's ruleset. They move to Orbis as part of the proposal. |
| Faction standing | The proposal's 0 to 4 with five bands, built in v0.4. |

## Architecture

**Canon and instance.** A module is read-only canon: a snapshot of Orbis records, a ruleset and a scenario. The instance is the save: the current value of every runtime record, the transcript, the ledger, the journal, the player's own records and the save's settings. Play never rewrites the module.

**The engine is pure.** All rules live in one TypeScript module with no DOM and no network access. It takes state and an action, and returns a state change and a directive. The interface and the provider are adapters around it, which keeps it testable without a browser and lets rules move to a server later.

**Who may move state.**
- The rules, through a resolved action.
- The player, through an override.
- Never the model. The model narrates. Where a model's judgment is needed, it returns a label from a closed list, and a table the author wrote says what that label does (Character Engine's evaluator pattern). Journal suggestions are model text the player keeps or discards; they move no state.

People's schedules are rules too: they move people when the rules move the clock, and the ledger records each move as the rules'.

**The turn.** Speaking or acting opens a turn. An action is resolved by the rules first and its outcome is given to the narrator for that turn only. A reroll replaces the narration and never resolves the action again. Undo restores the world as it was before the turn.

**Context.** *Praxis — Records and Context Map* has the full map: what each record type sends, when, and what is proposed next. Laid out by how often each part changes, least first, so consecutive calls share the longest prefix:

| Part | Changes when |
| --- | --- |
| The narrator's rules | Never |
| The world's canon, and a who's who of its people, groups, places and the player's notes | The player adds a record |
| The story so far: the journal's active entries, trimmed from the oldest to its budget | An entry is kept or changed |
| The transcript, from the window's start | Grows at the end; its start moves only at a cut |
| The moment: the scene; who is here, each with their dossier and what their day has them doing; what is here; the groups and history bearing on it; relationships between people who are both here; standing facts; the ways out; the outcome; the player's words | Every turn |

The transcript gets what the model's window has left after the reply, the journal's budget, a fixed reserve for the moment (2,500 tokens, of which present people's dossiers take up to 1,200), and the prefix. When it outgrows that, a whole piece leaves at once (6,000 tokens by default), so its start stays put between cuts; a window that slid every turn would change the prompt from its first transcript line down on every call. Before a piece leaves, the journal is asked to record it. Tokens are estimated from characters and corrected from the provider's own prompt counts. A state reaches the model only through its bands; the clock only through its time band. The interface shows the exact messages that were sent.

**Local records.** Laid over the module when a save is played, with Orbis field names, so every rule treats them like canon. They are never written into the module.

**Travel** (0.27.0, `docs/bids/maps/decision.md`). A journey climbs out of each place to the one that holds both ends, crosses that place's map by the cheapest walk over its cells (quicker on a road), and steps in again. A step costs the holding place's level step; a crossing costs cells times what a cell is worth, a quarter of the level's typical trip unless the map sets its own. Levels go by kind: a land, a region, open country, a settlement or site, a building. A place can say what crossing to or from it asks, and a walk goes around a place the player couldn't cross. A journey resolves in one step, so nothing happens in places nobody was watching. Areas (regions and larger) are stepped through for nothing and never arrived at. Routes retired with this.

**Tiers.** A character can carry their own maximum for a state, and bands can read as a share of it, so one set of Health bands serves a player with 8 and a minion with 2.

**Schedules.** Character Engine's shape: a day of stops by the hour, the last running past midnight, and rules picking another day by weekday, month, day of the month or a span of days. A rule can also wait on a state (the person's own, the player's or the world's), so a thread's outcome moves people. People move only when the clock crosses into a new stop, so a hand placement stays until the person's day next moves them. A wait reports who left, arrived, or came by and went on; elsewhere, nothing happens in places nobody was watching.

**Relationships.** One record per pair, Character Engine's shape: what it is, what happens when both are in the room, and what each side wants. Its bond is an ordinary relationship-scoped state owned by the pair's key, whose bands are the tiers, so the ledger, overrides and the off-rest rule apply unchanged. A triumph against someone with the approach that owns the bond warms it a tier, and a despair cools it (Four Approaches: Flair).

## Module format (draft)

Versioned as `praxis-module/1` and validated with zod.

| Part | Contents |
| --- | --- |
| `world` | Orbis record shapes with Orbis field names and IDs: the world record (identity, lore, rules, time and weather) and its places, species, factions, societies, families and memories, plus characters (with optional starting values and maximums, a dossier in `role`, `appearance`, `personality` and `speech`, `workplaceLocationIds`, and a `schedule`), relationships (a Praxis addition, below), items and personas. A later Orbis loader then replaces a file read rather than a translation. `routes` is a Praxis addition using Orbis's travel vocabulary. Praxis reads Orbis's own links to decide what bears on a scene: society `settlementLocationIds`, `territoryLocationIds` and `factionIds`, character `factionIds`, and memory `locationIds` and `affectedCharacterIds`. |
| `relationships` | One record per pair: `personIds`, `shape`, `together`, `wants` by person, `bondStateId` and starting `states`. A Praxis addition, in Character Engine's shape, and part of the Orbis proposal. |
| `ruleset` | State definitions (scope, bounds, start, bands and their basis, resting band, terminals, owning and secondary approaches; bond kinds are relationship-scoped states), the calendar, travel pricing, scene actions (where they are offered, their conditions, their effects on the player's character, the player's line and the narrator's outcome), approaches and their costs, the dice, and the rest rule. |
| `scenario` | Starting place and time, the player's character, the cast present at the start, opening text; later story threads with milestones. |

Saves are `praxis-save/1`, exports `praxis-export/1` (a save with its module), and the player's records on their own `praxis-records/1`.

## Scope by release

| Release | Contents |
| --- | --- |
| v0.1 Core loop | Module loading, scene presence, travel, clock and calendar, the state primitive with bands and terminals, context injection, transcript with branches and reroll, journal, save export and import, manual overrides. |
| v0.2 Mechanics | The Four Approaches dice pool, rolls with receipts, approach ownership and failure costs, Story Points and momentum, Edge, NPC tiers, automatic success. |
| v0.3 Living world | Character dossiers and voices, schedules, pair relationships with bond tiers, the evaluator. |
| v0.4 | Items, equipment and item condition; factions and standing; encounters, obstacles and Alert. |
| Later | Images. Background character passes (thoughts, hooks), only if the generation test below shows they are affordable. |
| Out of scope | World authoring (Orbis's job), the hex map, character chat. |

## Progress

| Date | Change |
| --- | --- |
| Oct 14, 2026 | 0.5.0 rebuild merged (PR #1): the state primitive, the `praxis-module/1` format, a development shell and CI. |
| Oct 14, 2026 | 0.6.0 merged (PR #2): clock and calendar, places and travel, scene presence, the save and its ledger, player overrides, and the *Abernys: Port Covenant* module. |
| Oct 14, 2026 | 0.7.0 merged (PR #3): turns with reroll and undo, the context compiler, NPC tier maximums, the NovelAI relay, browser saves with export and import, and narration in the shell. |
| Oct 15, 2026 | 0.7.1 and 0.7.2 merged (PR #4): narration diagnostics, and GLM-4.6 sent as one prompt in its own format, which made narration work. |
| Oct 15, 2026 | 0.7.3 merged (PR #5): codespaces build and start Praxis by themselves. |
| Oct 15, 2026 | 0.8.0 merged (PR #6): the play screen and menu, the context sized to the window, the journal, local records, scene actions and the rules guide. |
| Oct 15, 2026 | 0.9.0 merged (PR #7): checks on the Four Approaches and Genesys dice, with charges, pushing, Edge, Story Points, momentum, setbacks, full rest and no-roll success. |
| Oct 16, 2026 | 0.9.1 merged (PR #8): the menu moved under the prompt in the story's scroll, as first intended, and the generation test page. |
| Oct 16, 2026 | 0.10.0 merged (PR #9): dossiers, schedules, and relationships with bond tiers, with bonds started in play. Port Covenant 0.4.0. |
| Oct 16, 2026 | 0.10.1 merged (PR #10): a one-command deploy script. *Records and Context Map* written. |
| Oct 16, 2026 | 0.11.0 merged (PR #11): the narrator's rules rewritten for GLM-4.6 as a second-person text adventure, mentioned records, and the gaps the map found. |
| Oct 16, 2026 | 0.12.0 merged (PR #12) and deployed: the Four Approaches on every person, thing and place; Focus's Leverage and Prepared; difficulty by record, tier or seeded random; Something in the story; the standard ruleset `four-approaches/1`. Port Covenant 0.5.0. |
| Oct 16, 2026 | 0.13.0 merged (PR #13): the house format (plain speech, *narration*, (thoughts), [notes]); the context ladder; statuses and outcomes as story. Port Covenant 0.6.0. |
| Oct 16, 2026 | 0.14.0 merged (PR #14): NovelAI's layout with a lorebook section, the dramatis personae and a prefill; key-activated lore kept for the scene; brief imperative outcomes and conditions; schedules that hold; followers. |
| Oct 16, 2026 | 0.14.1 merged (PR #15): stakes on a check ("What you want from it"), stated outright in the outcome; a turn exported in one click with its replies; "Try this turn 5 more times" to count how often a ruling is followed. The owner's first measurements: 5 of 6 replies followed the ruling, twice. |
| Oct 17, 2026 | 0.15.0 merged (PR #16): the prefill as clean sentences; pronouns; only the story kept after a turn resolves; editable replies with Continue from here; a minion falls to one success. The owner's Force test: 6 of 7 replies followed the ruling, and edit-and-continue worked. |
| Oct 17, 2026 | 0.16.0 merged (PR #17): the outer lanes (the Tarred Rope, the Reddles, the contract hall), Coin, Bound by contract and In your pay; scene actions that need people present and change their states. Port Covenant 0.8.0. |
| Oct 17, 2026 | 0.16.1 merged (PR #18): wait or go quietly, moving the clock or the player by the rules without a turn or narration, to correct drift; and a fight that ends stays over (the standard `fight` rule). *Praxis — Growth, Challenge and Economy* proposed: Genesys's costs with our own earning, rank and gangs for challenge, coin on a ten-step scale, and bribes as Leverage you pay for. |
| Oct 17, 2026 | 0.17.0 merged (PR #19): experience and growth, one secondary lane per approach, rank and gangs. Port Covenant 0.9.0. |
| Oct 17, 2026 | 0.18.0 merged (PR #20): coin, goods, buying, selling and taking, bribes, bargains, terms that count down, opening hours. Port Covenant 0.10.0. |
| Oct 17, 2026 | 0.19.0 merged (PR #21): making things with Focus. Port Covenant 0.11.0. |
| Oct 18, 2026 | 0.20.0 merged (PR #22): *Abernys: Bogwater*, the new test module, with 17 people, 38 places, 16 scene actions and a forty-day census test that fails on more than four people in one place; schedule rules that wait on a state; scene actions that set world states. *Praxis — Bogwater Module Plan* written. |
| Nov 5, 2026 | 0.21.0 opened as PR #24: narration from any OpenAI-compatible provider or the player's own server; prompt formats for the main open-model families; `PRAXIS_PROVIDERS` for a partner's endpoint; windows up to 128k. |
| Nov 6, 2026 | Moved to `Tulivu89/mercurial-muse` at 0.21.0. Setup from a phone with `deploy/cloud-config.yaml` (PR #2). |
| Nov 7, 2026 | Live on the owner's Hetzner server at `135-181-31-213.sslip.io`. *Roadmap* written (`docs/roadmap.md`): brand, the shared core, the hub, the chat side. |
| Nov 9, 2026 | Brand decided: Inkwyrm, the Wet Ink look (`docs/brand.md`). Record model settled (`docs/records.md`). 0.22.0 opened: `praxis/` becomes `adventure/`, narration moves to `core/`, neutral format names with the old still read, the `inkwyrm` service, Orbis and Ember out of the tree. |
| Nov 9, 2026 | 0.22.1 and Studio 0.1.0 opened: the record model in `core/records/` and the Studio at `/studio/`, which the adventure's server now serves and its start screen links to. |
| Nov 9, 2026 | Chat 0.1.0, Studio 0.1.1 and 0.22.2 opened: Chat's Phase A at `/chat/` (`docs/chat-brief.md`), with CharacterRoom's kernel ported to `core/chat/` and held to its parity fixtures, a General context for other models, streaming through the relay (`/api/narration/stream`), Character Card import, and `kit/` for the Studio and Chat to share. |
| Nov 10, 2026 | Chat 0.1.0 merged (PR #8) and tried live on Xialong. Chat 0.2.0 and Studio 0.2.0 opened: Chat's Phase B (the clock, schedules, sets that follow them, moods, memories, plans, side generations), a chat screen rebuilt for reading, the Studio's week view, and Errata's real card. |
| Nov 10, 2026 | Chat 0.2.0 merged (PR #9). The owner set Chat's last phase to Home and socials, with no dice or games. Chat 0.3.0 opened: Home, with a character's clock, relationship and needs kept per character and shared by every chat with them. |
| Nov 10, 2026 | 0.23.0 and Studio 0.3.0 opened: the first phase of `docs/studio-brief.md`. The state primitive, the clock, the standard ruleset and the ruleset's schemas move to `core/rules/`, re-exported by the engine with no change in play. The Studio gains a Rules page for the world and a Rules panel on every character, place, item and group, read through `rulesFor(world, record)`. |
| Nov 10, 2026 | 0.24.0 and Studio 0.4.0 added to the same pull request: the brief's second phase. `core/convert/` turns modules into Studio worlds and back; Bogwater and Port Covenant round-trip to the same modules, and the suite runs a second time on the round-tripped ones. The Studio gets Play in the adventure, module export and import, and Chat with; the start screen lists worlds sent from the Studio. |
| Nov 10, 2026 | Studio 0.5.0 and 0.24.1 opened: the brief's third phase. Schedule events gain a place and a condition and convert to day plans and back; routes become a typed part of a world; the Studio writes routes, scene actions, the calendar, goods and the scenario's start, and checks a world before it is played. |
| Nov 11, 2026 | 0.25.0 and Studio 0.6.0 opened: threads with milestones (Character Engine's), reached by the rules or marked by hand, paying experience, with the followed thread's next beat sent to the narrator; the Journal lists them; Bogwater 0.2.0 has its five. `docs/maps-brief.md` asks other models for map proposals, and the Studio brief plans the helper for writing fields. |
| Nov 11, 2026 | 0.25.1 and Studio 0.7.0 opened: the Studio at scale (one searchable record picker, Find and order in the list, a jump bar on record pages), and Inkwyrm in place of Praxis wherever players read it. `docs/bids/` set up for questions put to several models: the maps plan written from four bids, and briefs out for the look and layout and for worldbuilding tools, each with Claude's own proposal written first. |
| Nov 12, 2026 | 0.26.0, Studio 0.8.0 and Chat 0.3.1 opened: the look and layout, decided from three bids and Claude's own (`docs/bids/ui/decision.md`) and built in the same pass. The adventure wears Wet Ink in paper and night with its layout untouched: the tokens and marks from `kit/src/ink.css`, the seal on Send, actions that wrap, the site's header on the start screen only. The Studio's list goes one level at a time, a record's page is the writing with doors to its other jobs, every page has an address, and World › Rules is a list of its parts. One header for the three sides. |
| Nov 12, 2026 | Studio 0.9.0 opened: maps, phase M1 of `docs/bids/maps/decision.md` (approved the same day, after three revisions and a prototype). `core/map/` lays every place that holds others out as a sheet of hexes from the place tree, draws the circles from those sheets, and times a journey by the levels and the map; `kit/src/MapView.tsx` draws circles and ground; the Studio has a read-only Map page and Travel by level on World › Rules. The adventure still travels by its routes until M2. |
| Nov 12, 2026 | 0.27.0 and Studio 0.10.0 opened: maps, phase M2. The adventure travels by the levels and the map (`adventure/src/engine/world.ts` on `core/map/`): up, across, down, with roads and a place's own crossing rule; routes, walking pace and travel tiers retired. The Map section draws the shared map, circles or ground, in place of the spokes, and a picked place shows its legs. Bogwater 0.3.0 and Port Covenant 0.12.0 had their routes traced into roads on sheets laid out by the old times, and their two gated routes became crossing rules on Nest's island and Port Covenant. |
| Nov 12, 2026 | Studio 0.11.0 opened: maps, phase M3. On the Map page's ground an author refines what laid itself out: Move, Bigger and Smaller, Paint (one cell, seven, or Fill), Road, what a cell is worth, Keep this layout, Reroll, Reset this sheet, Add a place here. The first change keeps every centre on the sheet; only what changed is kept on the world's map (`core/map/edit.ts`). Checks finds map data for a place that is gone or has moved. |
| Nov 12, 2026 | 0.27.1 and Studio 0.12.0 opened: maps, phase M4. A world picks icons to suit its genre (old, modern, far) and a place can pick its own (`kit/src/map-icons.ts`, a few kilobytes for all three sets); Colour paints cells as a look, never a rule; long names on the circles wrap between words. The adventure's map shows the world's icons. |
| Nov 13, 2026 | 0.27.2, Studio 0.14.1, Chat 0.3.2 and the Overview 0.1.0 opened: the front page at `/overview/` (`docs/front-page/`). The adventure opens a save named in the address (`/?save=<id>`) and never starts a new game in its place; Chat reads `#/with/<world>/<record>`; the Studio opens a bundled world by address (`#/bring/bogwater`). Each side notes what really opened in `kit/src/activity.ts`, which the Overview reads for its one Continue. The root is still the adventure. |

**v0.1 still to do:** branches (keeping alternate continuations rather than only replacing the latest).

**v0.2** is done with 0.9.0, except NPC opposition dice (opponents' approaches and ranks building the difficulty); every check is Average until NPCs carry ratings.

**v0.3** is done with 0.10.0 except the evaluator, which waits on the generation test. The evaluator also lets free text propose a check instead of the player choosing one.

**Next, in order:**
1. Compare narrators on the same Bogwater turn with "Try this turn 5 more times": GLM-4.6 on NovelAI against the same model on another provider, then one or two other large models. Count how often each follows the ruling and the conditions.
2. Play Bogwater from the opening, in the net at the long fence:
   - earn a coin at the smokehouse or on the fence, and hire Gethin and his flatboat;
   - load Cadfan's barrels on boat day (day 4, a Monday);
   - get tamecap from the Woed's edge to Morwen before day 8, or see Lowri get loose on day 9;
   - expose Corran before the raid on day 13, or see the raid;
   - end the Pact's claim one way: the buyout, the drowned man, or the Low Road.
3. The checks from 0.16 to 0.19, on Port Covenant before it retires: quiet moves and a fight that ends; earning and spending experience; trade at the Tarred Rope (buy, haggle with Pell, take from Garrick or the dock toughs once they are down, bribe the gate guard); making lockpicks; hiring Garrick, buying Wren's contract, and following Tomas through his day.
4. Balance from play: the numbers in *Growth, Challenge and Economy* are first guesses.
5. What Bogwater asks of the engine, listed on its tab under Where it stands: partitions; calendar events that call people by group; weather that shuts a crossing or slows a journey (ways of travel and conditions, `docs/bids/maps/decision.md`); rumour lines on world states. (Milestones without a scene action came with threads in 0.25.0.) Then the coverage audit, and Port Covenant retires.
6. Still open from the growth proposal:
   - item wear and mending;
   - knacks;
   - holdings;
   - a key that opens its lock;
   - NPC opposition dice (opponents' approaches set the difficulty).
7. The evaluator: reads free text, proposes a check, and fills in what you want. It waits on the generation test results.
8. Transcript branches.
Xialong stays on hold.

## Abernys: Bogwater

The test module from 0.20.0, built from the Fenmire, Woed, Cairn Maw and Port Covenant docs. Everything invented is `canonStatus: "draft"`. Every dossier, number and reason is on the Bogwater tab of *Praxis — Bogwater Module Plan*, with the owner's questions.

- Bogwater in the autumn eel run: the landing, the Myrtle, the Crones' house, Nest's and Morwen's islands, the eel traps and the fen, with Grey Water, the Woed's edge and the exits beyond. Rooms are child places with free hops until partitions exist.
- Day 1 is Friday 1 September. Four threads on clocks meet on sitting day, the 14th: the ink (Orlo and the Pact's claim), Corran's war, tamecap for Lowri, and Cadfan's barrels, with the bend fence quarrel as a lever on either Crone.
- The runaway's purse is the only economy: a coin a shift, ten for a job, a hundred and ten for the buyout.
- Schedules are one daily round in the four times of day a player notices, with exceptions only for the people the threads turn on.
- The salamander species record is new, and waits on the owner with the module's other questions.

## Abernys: Port Covenant

The module is built from the region seed, Port Covenant, Fenmire and Cairn Maw docs. Anything invented to make it playable is marked `canonStatus: "draft"` and is open for the worldbuilding side to replace:

- Every route distance (gate to Bogwater 22 km, to the Aurochs downs 26 km, to Caerwyn 64 km; Bogwater to Caerwyn 48 km).
- The names of the landward gate, the harbour, the Arbiters' registry, the garrison, the Governor's court and the outer lanes.
- The gate Arbiter (a rival) and the garrison guard (a minion), and the placeholder player character.
- Signing the Covenant at the landward gate as a scene action (0.2.0).
- The approach table (what failure and threat cost), the traveller's charges (Flair trained, Force and Finesse practiced, Focus raw), the setback rules and the rest rule (0.3.0).
- A calendar for Abernys. The module uses the real one until there is an island calendar.
- Every dossier field (appearance, personality, speech), every schedule (including Cadfan's Thursday market day in Caerwyn), the four bond kinds and their tier wording (Acquaintance, Rivals, Friends, Uneasy allies), and the three relationships: the Governor and the High Arbiter as rivals, the Governor and the garrison captain as uneasy allies, and the gate staff (0.4.0). The captain knowing the last ship carried no orders is from the societies doc.
- The outer lanes test content (0.8.0): the Tarred Rope with Pell and Garrick Hale, the Reddles (a mixed marriage outside the wall, after the Port Covenant doc), the contract hall with Odile Fenn and Wren, the prices (ten coin to hire, twenty-five for a contract), the traveller's forty coin, and the Bound and In your pay states.

0.2.0 also links the Pact to Port Covenant (`settlementLocationIds`) and to the Arbiters (`factionIds`), following the Port Covenant doc's record map.

## Generation test

Before v0.3 commits to anything beyond narration, we measure:

1. Whether NovelAI's API reuses a repeated prompt prefix for each model. NovelAI's usage reports no cached-token count (`prompt_tokens_details` is empty), so this is measured by time on a repeated long prompt. Narration so far takes 7 to 14 seconds for prompts of 700 to 1,200 tokens.
2. Whether alternating models evicts that reuse. A cache cannot be shared between two different models, so the question is whether narration on Xialong and helper calls on GLM-4.6 each keep their own.
3. Whether staged helper calls that share the narration's prefix on one model cost meaningfully less than fresh calls.

The result decides between narration-only, helper calls on GLM-4.6, and staged calls on the narration model. Journal suggestions are the first helper call; they go to the model chosen in Settings (GLM-4.6 by default) about once per piece of story.

The test page is built (Settings › Testing › Generation test, PR #8) and needs the owner's key in their own browser. Per model it makes 11 short replies: three short prompts for the fixed cost of a call, two fresh prompts of about 4,000 tokens and two of about 16,000 for the cost of reading, and the first large prompt again word for word and with new endings. With a second model, the first model's large prompt is tried again after the second has run. Times are measured on the Praxis server around NovelAI's answer (`upstreamMs`). A repeat that saves half or more of the reading time counts as reuse. **Copy the results** gives the numbers to paste back.

## Orbis proposal (collected as we build)

Superseded: the project no longer builds on Orbis (`docs/roadmap.md`). These stay as input for `docs/records.md`, since each is something the adventure needs from its records.

1. A Praxis launch and generation route, following the existing Ember pattern.
2. A region bundle export: the world plus every record inside a chosen region.
3. Route records between places (`distanceKm`, `terrain`, `routeClass`, and conditions for use). Orbis currently stores each place's distance from a hub, not the roads between places.
4. Record shapes for authored rules: state definitions, approaches, resolution, NPC tiers (per-character maximums), encounter states and difficulties, scene actions, and a calendar.
5. A save archive with an overview (place, time, cast, latest scene) shown before a save is opened.
6. Decisions on the open questions from the Four Approaches proposal, starting from the interim answers above.
7. Location links on factions as well as societies (`territoryLocationIds`, `settlementLocationIds`), so a group can bear on a scene without anyone from it present.
8. A way to bring a player's `praxis-records/1` file into their own Orbis space: people, places, things, groups, notes and bonds already in Orbis field names.
9. Character fields Praxis reads: `role`, `appearance`, `personality` and `speech` (the persona record's names), `workplaceLocationIds`, and a `schedule` in Character Engine's shape.
10. A relationships collection: one record per pair, with `personIds`, `shape`, `together`, `wants` and a bond kind. Orbis families already link people (`relationships` with `kind` and `notes`); this would cover ties outside a family.
