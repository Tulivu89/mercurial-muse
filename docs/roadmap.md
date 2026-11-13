# Roadmap

Nov 7, 2026 · @AmbiProp

The plan for the whole project now that it stands on its own. *Praxis — Charter* keeps the adventure's own decisions; this page keeps the direction, the order of work, and the decisions that cross the parts.

## Direction

We are independent of Howling Whispers, and we go our own way rather than carry its shapes forward.

- **Our own records.** Characters and worlds get a shape of our own, designed fresh. Orbis's record shapes are not the base.
- **Any kind of story.** Fantasy is one genre among many: modern, crime, science fiction, horror, romance, slice of life. Nothing in a record assumes swords, species or a medieval calendar.
- **Character Engine and CharacterRoom are the foundation.** They are the owner's NovelAI scripts. Orbis and Praxis grew out of them, and they hold the owner's style more fully than either.
- **Praxis gives the site its working parts.** The web stack, the pure engine, the provider relay, the prompt formats for each model family, browser saves, and the server and its deploy scripts all stay.

## What each source gives

| Source | What we take | What stays behind |
| --- | --- | --- |
| [Character Engine](https://github.com/Tulivu89/Character-Engine) | Profile Plus (Presence, Drive, Pattern, Resistance, Conduct, Facets) as a section template; pressure (Hook, Pursuit, Position) with its history. States as bounded numbers with bands, a resting band, a scope and terminals. The four approaches, rolls and stakes. Threads (five questions, a kind, milestones, one active). The journal with active and archived entries. Places nested inside places, with description, lorebook entry and atmosphere. Schedules as plans of stops. Factions with standing ladders and resources. Chat modes, including the interview. Image prompt fields and presets. | NovelAI's script platform: the lorebook and Author's Note injection, the bridge userscript, the story-file storage. |
| [CharacterRoom](https://github.com/Tulivu89/CharacterRoom) | Its context management, rewritten by the owner, and the chat side's features: Contact, user and scenario cards; example chats; brains (keyed lore); Jots, Diary, Plans and Process; posts with comments; story time and schedules with a week view; emotions and portraits; the dice system and its presets; sheets per person; group chat; Stage mode; chat bubbles; card import and export. | The Xialong-only prompt and the NovelAI panels. |
| Praxis | Stack, engine pattern, relay, formats, saves, server, deploy, CI. Canon and instance: a world is read-only, and play lives in the save. | Its Orbis-shaped records, once the new ones are in. Bogwater and Port Covenant become worlds on the new records. |
| The Discord bot | Character packs, per-person keys and personas, schedule-keyed openers, rooms with several people, the helper with search. | Discord itself: the bot stays separate. |
| Orbis, Ember | Nothing. They left the tree in 0.22.0; their code is in the history. | Everything. |

### The Discord bot

A Python bot that plays a CharacterRoom character in Discord on Xialong, with CharacterRoom's context. It is character-agnostic: each character is a pack (`card.json`, `user.json`, `greetings.json`, `settings.json`). What it adds that the site wants:
- **Whoever triggers it pays:** each person links their own key.
- **Personas per person.**
- **Jots, brains and memories per character.**
- **Openers keyed to the schedule:** a stop says what she's doing; the arrival lives with the greetings.
- **Several people in one room.**
- **A helper model with search.**

Its lessons go into the chat side, the most important being that examples steer more than any profile text, and that schedule stops never say how she arrives. The bot stays its own thing, and the site imports its packs.

### Context code

CharacterRoom's context management is the owner's own rewrite. AnotherRoom itself came from what remained of AetherRoom, for Xialong only. The site carries CharacterRoom's context management across and grows it to serve every model family the adventure already formats for.

## The design: one world model, three ways in

**Records (canon).** Made once, used everywhere:
- **Character:** one record for chat and adventure alike. A conventional profile of titled sections the author can add to, rename and reorder (Profile Plus is one template among others), plus greetings, example chats, emotions and portraits, a schedule, an inventory, and states. At heart, a lorebook entry plus the dynamic parts.
- **Place:** nested to any depth (region, town, building, room), with description, lorebook entry and atmosphere by time of day.
- **Item, Faction, Thread, Lore entry** (brains), **Scenario** (a starting situation), **Persona** (the player's own card).
- **World:** the container. Genre, tone, calendar, the state definitions and the ruleset, and every record inside.
- **Ruleset:** state definitions, how a roll is built and judged (the four approaches, or a preset such as Blades or Year Zero), and the outcomes.

**Play (instances).** The save holds what changed; canon never changes in play:
- **Adventure:** a world played as a text adventure, with rules, a narrator, a clock and the player's own records (Praxis today).
- **Chat:** one or more characters in conversation, with Jots, Diary, Plans, posts and story time (CharacterRoom today).
- The two can meet: an adventure character opens a chat, and a chat can be summarised into the adventure's journal, as CE's interview does.

**Making (the studio, called the hub until it has a name).** Where records are written, with the guided builders and generate buttons that CE has, and import from CharacterRoom cards and from Praxis's records.

**The rule over all of it:** the model never moves a number. States, pressure and standing change by a rule firing on something that happened, or by the player's hand. The model narrates. Where its judgment is needed, it picks a label from a closed list, and a table says what that label does.

## Decisions (open to the owner's veto)

1. **The record model is designed before any studio code.** `docs/records.md` (drafted Nov 7) is built around context management: every block of text has a reach (Always, Here, Named, When, Never), and every record has a one-sentence line and a full entry, so a big world costs lines for what is off stage. The owner reviews it; everything else waits on it.
2. **Folders and code are named by job, not by brand.** `core/`, `adventure/`, `chat/`, `studio/`. Brand names live in one file of display text per side.
3. **One shared core.** The provider relay, prompt formats, context budget, journal, records and state engine live in `core/`. Adventure and chat both import it.
4. **Browser storage first.** Records, saves and chats live in the player's browser, with export and import, and a **Back up everything** file. Nothing about play is stored on the server, and keys are sent per request and never kept. Testers lose nothing they have backed up, and the server has nothing of theirs to leak.
5. **Neutral format names before outside players arrive.** Done in 0.22.0: the files players handle are `adventure-module/1`, `adventure-save/1`, `adventure-export/1` and `adventure-records/1`, and the server reads `NARRATION_PROVIDERS`; the old names are still read. The `praxis` browser database and settings keys keep their names, because players never see them and renaming them risks losing saves.

## Accounts

Not needed for testing: decision 4 keeps testers safe and costs nothing. When people want their work on two devices or want to share it, the light version is:
- sign-in by emailed link, with no passwords to store;
- one SQLite file on the same server, holding each person's records and saves as they are exported now;
- an email sender's free tier, which needs the domain from the brand step;
- Hetzner backups (about a fifth more on the server bill), a privacy page and a delete-my-account button.

That fits on the current server. It waits until the studio and chat are worth syncing.

## Order

Each step is one or more pull requests. The adventure keeps its own list (charter, *Next, in order*) alongside, on its current records, until step 6.

1. **The record model.** Settled on Nov 9 (`docs/records.md`), with Errata as its worked example. Group chats are pinned.
2. **Brand: decided Nov 9.** Inkwyrm, the Wet Ink look, the ink-drop mark family and the line *Characters who remember you. Worlds that keep their rules.* (`docs/brand.md`). The mascot, Errata, is drafted as the first record in the new model (`docs/mascot-record.md`), and her visual design is briefed for a separate chat (`docs/mascot-brief.md`). Still to do: domains, final logo drawings, mascot art.
3. **Repository shape.** Done in 0.22.0: `praxis/` is `adventure/`, narration is in `core/`, one npm install at the root, neutral format names, the `inkwyrm` service, and Orbis and Ember out of the tree. The rest of the core (records, the state engine, the journal and context budget) moves when the Studio and chat need it, so its shape comes from two users, not one.
4. **Studio v0.** First version in 0.1.0 (Nov 9), at `/studio/`:
   - the record model in `core/records/`, with tests;
   - worlds in the browser, every record kind, nested places, groups that hold species;
   - sections by reach with shared conditions, sets, greetings and example chats;
   - an "In context now" panel that shows what a moment would send;
   - world files, and CharacterRoom card import.

   Schedules came with Chat's Phase B (Studio 0.2.0). The next stage is briefed in `docs/studio-brief.md`, in three phases:
   - **S1, rules on every record: built Nov 10 (Studio 0.3.0, adventure 0.23.0).** The rules moved to `core/rules/`. A world has a ruleset, the standard Four Approaches unless it changes a part, on a Rules page that says what is standard and what is the world's. Every character, place, item and group has a Rules panel: what a player can do there, how its states read to the narrator, and where each value came from, with one tap to change and one to put back. Groups give their members defaults. In context now shows the state sentences.
   - **S2, Bogwater both ways: built Nov 10 (Studio 0.4.0, adventure 0.24.0).** `core/convert/` turns a module into a world and a world into a module. Bogwater and Port Covenant come back as the same modules, and the adventure's whole suite runs on the round-tripped ones, census included. A world's page has **Play in the adventure**, a character's has **Chat with**, and the adventure's start screen lists the worlds sent to it. Routes, relationships, a day's stops and the scenario's start are carried through unchanged, with no editor until S3.
   - **S3, authoring what the adventure needs: built Nov 10 (Studio 0.5.0).** One schedule model: an event can name a place and a condition, and converts to the adventure's day plans and back. Routes on each place's page, scene actions, the calendar, walking pace and a world's own goods on World › Rules, where play starts on the scenario, and a Checks page with Bogwater's census as a tool.

   **Then, in order:**
   - **Threads with milestones: built Nov 11 (Studio 0.6.0, adventure 0.25.0).** Character Engine's threads in `core/rules/threads.ts`: five questions for the author, milestones reached when their conditions hold (or marked by the player's hand) that pay experience, and missed once their day is over. The narrator hears only the next beat of the thread the player follows. Bogwater has its five, with the plan's 90 experience. The Studio edits them on a thread's page and checks them.
   - **The Studio at scale: built Nov 11 (Studio 0.7.0, adventure 0.25.1).** One searchable picker for every choice of a record (recent picks first, then by kind A to Z, each place with what it's inside); the record list with Find, A to Z or as added, and kinds that fold; a jump bar on a record's page. The adventure says Inkwyrm wherever players read it.
   - **The helper, and generate buttons: approved Nov 12.** The plan (`docs/bids/worldbuilding/decision.md`), from two bids, Claude's own, Story Engine 0.15 and `docs/Prompt Engineering Principles.md`: one field per call in plain text; Errata asks in rounds of answers to pick, and picks become Settled; field writes read Settled and never carry Errata; a record's Never sections are the canon its visible sections keep back; drafts wait under their fields; a wrong answer goes back once with the fix; Try a scene; the author's own library of questions and templates; the workshop on the world or on one place, with Check. Talks stay in the browser, with an export of their own. Phases W1 (generate buttons) to W6; W1 and W2 built Nov 12 (Studio 0.13.0 and 0.14.0).
   - **The front page: started Nov 13 (Overview 0.1.0 at `/overview/`).** The handoff is `docs/front-page/`; how it fits the Studio's work and the build order are in `docs/front-page/integration.md`, approved Nov 13. A first visit shows Errata, two worlds and an opening; a return gets one exact Continue, from what each side notes when something really opens. Examples are written in a dedicated session on a strong model, not by the site's helper. Next: the read-only Look inside, then the example content, then moving the root (F4).
   - **Character and persona relationships.** Only the player's relationship with a character needs depth: a "with the player" panel on a character's page, the starting bond and its kind, read by the adventure and by Chat's Home. Ties between two characters stay in their sections; a module's relationships still come through unchanged.
   - **Maps: approved Nov 12; M1 to M4 built the same day (Studio 0.9.0 to 0.12.0, adventure 0.27.0 and 0.27.1).** The plan (`docs/bids/maps/decision.md`, with a prototype in `docs/bids/maps/prototype.html`): each containing place has a sheet of hexes made from the tree with no setup; circles draw every sheet nested at the hexes' centres under Character Engine's legibility rules, so the map zooms from a room to the world; travel comes from levels by kind and the map, a journey climbing to where both ends sit side by side, taking the cheapest walk across that sheet's cells and coming down; roads painted on cells replace routes; the author refines the ground by moving, sizing, painting and laying roads, and only what changed is stored. M1 is `core/map/`, the map in `kit/`, the Studio's read-only Map page and Travel by level on World › Rules. M2 moved the adventure onto it: journeys up, across and down, crossing rules on places, the shared map in the Map section, and routes retired. M3 lets an author refine the ground in the Studio: move, size, paint, roads, what a cell is worth. M4 gave the map icons by genre and by choice, colour paint and wrapped names. Next: M5, a picture under a sheet.
   - **The look and layout: built Nov 12 (Studio 0.8.0, adventure 0.26.0, Chat 0.3.1).** Three bids and Claude's own, decided in `docs/bids/ui/decision.md` and built in the same pass at the owner's word. The Studio's list goes one level at a time (the world, a kind, inside a place) with the line on every row; a record's page is the writing, with doors to its day, rules, adventure part, chat and In context now; every page has an address, so Back works; World › Rules is a list of its parts with a filter for what's changed. The adventure wears Wet Ink, paper and night, with its layout untouched. One header across the three sides (`kit/src/SiteHeader.tsx`).

   **Bids.** Some questions go to several models at once, and the answers come back to `docs/bids/` (`docs/bids/README.md`). For each, Claude writes the brief; writes its own proposal from scratch before any bid is read, where it holds something the bidders don't; then reads every bid and writes the decision, saying where its own was beaten. The owner approves, and the decision becomes a phase.

   Then the owner's own setting, built in the Studio from the start.
5. **Chat v0.** Briefed in `docs/chat-brief.md`. **Phase A built Nov 9 (Chat 0.1.0, at `/chat/`):** the context kernel in `core/chat/` with both profiles (AetherRoom for Xialong, byte for byte against CharacterRoom's fixtures; General for every other model), streaming through the relay, the chat screen, card import (CharacterRoom, Character Card V1 to V3, PNG), portraits, and `kit/` for what the Studio and Chat share. **Phase B built Nov 10 (Chat 0.2.0, Studio 0.2.0):** the chat clock and story time, schedules in context with a status line and the Studio's week view, sets that follow the schedule, moods, diary and feelings, plans, and CharacterRoom's side generations, each in CharacterRoom's form for Xialong and as notes for other models; and the chat screen rebuilt for reading. The owner's first live test confirmed Xialong streams as plain text through the relay. **Home built Nov 10 (Chat 0.3.0):** the owner cut dice and games from the chat side and made Phase C Home and socials. Home is CharacterRoom's Tamagotchi mode, finished here: a place with everyone in it, a day that belongs to the character, needs, actions and a bond. Socials (posts) are next.
6. **The adventure on the new records.** Praxis's engine reads them through the core; Bogwater and Port Covenant are converted; CE's pressure and threads join its rules.
7. **Images** through the player's own image provider, after everything else is established, as the charter already says.
8. **Accounts,** when syncing and sharing are wanted.
9. **Partner models,** when a partner provides them.

## Questions for the owner

1. The record model's open questions, at the end of `docs/records.md`.
2. A name from `docs/brand.md`, or a direction to look in instead.
