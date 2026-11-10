# Records

Nov 9, 2026 · @AmbiProp · Draft, revised after the owner's review

What a world and its characters are made of, and when each part reaches the model. The test of every field here: does it help decide what is in context, and when, so a big world or a long story stays manageable? A field that never reaches the model and never drives a rule doesn't belong.

Sources: Character Engine (profiles, states, threads, the journal, nested places, schedules), CharacterRoom and the Discord bot (cards, brains, Jots (now journals), memories, greetings, example chats), and Praxis (canon and instance, the context layout, the budget).

## The idea

A record is a lorebook entry with a shape. The author writes text, gives it a few keys, and says when each part of it may enter the context. On top of the text sit the parts the engine owns (states, the clock, schedules, standing), which become sentences only when they have something to say. The model never writes to a record.

Everything below is one of three things:
- **Text** the author wrote, with a reach.
- **Links** between records (this person works here, this place is inside that one).
- **Numbers** the rules keep, which reach the model as a sentence from their band.

## Reach: when text enters context

Every block of text carries one reach.

| Reach | Enters context | Used for |
| --- | --- | --- |
| **Always** | Every turn. Kept to very little. | The world's premise, the player's persona line, the active thread's next beat. |
| **Here** | While the record is part of the scene: the place you're in, people present, things carried or in the room, the character you're chatting with. | The core of a profile; a place's entry and atmosphere. |
| **Named** | When one of its keys appears in the player's words or the last few turns. It stays until the scene changes, so it doesn't flicker in and out. | The rest of a profile, never repeating what Here already sends; lore; off-stage people and places. |
| **When** | Only while a condition holds. | Schedules, outfits by time of day, what she admits once you're friends, a place after the raid. |
| **Never** | Not sent as written. | Mechanics (states, numbers, rules), which reach the model only as the sentences the rules write for them; the author's notes; image prompts. |

**Conditions are shared.** The time of day, bond tiers, world states and thread statuses are defined once, in the world and its ruleset, and every record's When text points at them. Nobody writes the same condition twice.

### A character, reach by reach

| Reach | What of a character |
| --- | --- |
| Always | Nothing, or at most one line in a cast list of the people in the current region. Open. |
| Here | The profile the scene needs while she's present: how she looks, how she talks, how she treats people. |
| Named | The rest of her profile, not overlapping Here, when her keys come up: history, the things she goes long about, people she knows. |
| When | Her schedule stop for this time of day, her current outfit, sections behind a bond tier. |
| Never | Her states and ratings, written as sentences by the rules; the author's notes about her. |

### Line and entry

Every record has two lengths:
- **Line:** one sentence, who or what this is to a stranger. Used when the record is named but not here, in lists ("people nearby", exits), and when the budget is tight.
- **Entry:** everything with a reach that currently holds.

This is what keeps a big world cheap. A town of forty people costs forty lines at most, and only the ones named or nearby. The four people in the room get their entries.

### Sets: one of several

A **set** is a group of entries where only one is in context at a time. The one in use takes the set's reach.
- **A character's outfits:** everyday, work, formal. The player picks, or a schedule stop or a When condition does.
- **A scenario's locations:** a chat with only a scenario and no world keeps one location's details in context at a time.
- **Versions of a character:** the same person in two worlds, each version holding only what differs.

This is CharacterRoom's set brains, made general.

## How a turn's context is laid out

From Praxis, ordered by how often each part changes, so consecutive calls share the longest prefix and providers that cache it can reuse it.

1. **Rules:** the narrator's or the chat partner's instructions and the house format. Change never.
2. **World:** the premise, the ruleset's sentences, and a who's who of lines for the current region. Change when the player crosses into a new region or adds a record.
3. **Story so far:** the journal's active entries, oldest trimmed first to its budget. Change when an entry is kept.
4. **Transcript:** from the window's start. It grows at the end, and its start moves only when a whole piece leaves, after the journal is asked to cover it.
5. **The moment:** the place and its atmosphere, who's here with their entries and what their day has them doing, what's here, Named and When lore, relationships between people present, states out of their resting band, the active thread's beat, the outcome, the player's words. Changes every turn.

In chat, the same layout holds with the partner's card in place of the narrator's rules, and the greeting and example chats in part 1.

### When the budget runs short

Cut in this order, cheapest loss first:
1. Named lore that came up longest ago.
2. People present beyond the first four drop from entry to line.
3. Parent places drop from entry to line.
4. The journal's oldest active entries (Praxis suggests combining them first).
5. The transcript's oldest piece, which the journal already covers.

Always text and the moment's core (place, the player, the outcome) are never cut. If they don't fit, the studio says so when the record is saved, not mid-story.

## Kinds

| Kind | For | Entry reach by default | Notes |
| --- | --- | --- | --- |
| **World** | The container: premise, genre, tone, calendar, ruleset, and every record inside. | Premise: Always | Any genre. Nothing assumes swords or species. |
| **Place** | Anywhere you can be, nested to any depth: region, town, building, room. | Here | The place you're in sends its entry; its parent sends its entry, cut first; further up, lines only. Siblings and children appear as exits by name. |
| **Character** | Anyone: chat partner, adventure NPC, companion. One record for both sides. | Here | Below. |
| **Persona** | The player's own card. Several per player, one chosen per chat or save. | Line: Always. Entry: Here in chat | CharacterRoom's user card and the bot's personas. |
| **Item** | A thing that matters to a scene or a rule. | Here when in the room. Folded into the carrier's entry while carried or worn | Character Engine's rule: a carried item reads as part of whoever has it. |
| **Group** | Anything a person belongs to: species, family, faction, crew, profession. A person belongs to as many as fit. Factions carry a standing ladder and resources. | Line when a member is present; entry Named | Character Engine's species and bestiary are groups of the kind species, so a character shows their species in a trait or two and the group holds the rest. |
| **Lore** | Any free entry: history, a custom, a rumour, a rule of the world. | Named | CharacterRoom's brains are Lore with Always, Named or When. |
| **Thread** | What's pushing the story: the five questions (pressure, objective, opposition, cost, consequence), a kind, milestones, a status. | The active thread's current milestone: Always. Others: Named | From Character Engine. |
| **Scenario** | A starting situation: where, when, who, and what's happening. | Always for the chat or save it starts, until replaced | CharacterRoom's scenario cards; the bot's scenes. |
| **Ruleset** | State definitions, how a roll is built and judged, outcomes, terminals. | Not text: its numbers reach context as band sentences | The four approaches or a preset (Blades, Year Zero and the rest). |

## Character

A conventional profile with room to change it. In the end it is a lorebook entry plus the dynamic parts.

- **Name, keys** (aliases, nicknames), **pronouns, tags.**
- **Line:** who they are to a stranger, in one sentence.
- **Sections:** titled blocks of text, each with a reach. The default set:
  - Appearance;
  - Personality;
  - Speech;
  - Background;
  - Wants;
  - Relationships.

  Authors add, rename, remove and reorder sections freely. Templates offer other sets, such as Character Engine's Profile Plus (Presence, Drive, Pattern, Resistance, Conduct). The engine reads only titles, text and reach, so any template works.
- **Reach by section:** the core sections are Here, the rest Named, and anything behind a condition When (what she admits once you're friends, what shows when she's drunk).
- **Sets:** outfits, and versions of her for other worlds.
- **Groups:** her species, family, faction and the rest, as links.
- **Chat parts:**
  - **Greetings:** one or more openers. Each can be keyed to a schedule stop, as the bot's `greetings.json` is.
  - **Example chats:** named exchanges with speakers and an emotion per message.
  - **Emotion set and portraits.**

  The examples steer more than any section does, so the studio treats them as first-class and doesn't bury them. Greetings and example chats are for chat only; the adventure narrator never gets them, and the Speech section carries her voice there.
- **Dynamic parts:**
  - **Schedule:** plans of stops in times of day, with alternates ("market day"). A stop says what they're doing, never how they arrive.
  - **States:** values for the ruleset's definitions.
  - **Relationships:** a link to another character with a kind and a line.
  - **Home and work places.**
  - **Inventory.**

What a character learns in play (Jots about you, diary entries, plans, mood) belongs to the chat or save, not the card. One card can be in many stories without them bleeding into each other.

## Place

- **Name, keys, parent, line.**
- **Entry:** facts: who runs it, what happens there, what it's known for.
- **Atmosphere:** what it's like now, written as a schedule by time of day. Sent while you're here, whether or not anyone names the place.
- **Routes:** links to other places, with a distance or time and the conditions for using them.
- **States:** the place's own numbers, such as Alert.

## Rules on records

Decided in `docs/studio-brief.md`, built in Studio 0.3.0 (`core/rules/`).

- **The world has a ruleset,** the standard Four Approaches (`four-approaches/1`) unless it changes a part. The world stores only the parts it changed.
- **A record's rules are worked out, not stored.** They come from its kind, its tier, its groups and the world's ruleset. A record's `rules` block holds only what its author set there:
  - **character:** tier, rank, gang, charges, where states start and their most, difficulty by approach, purse, price, what they sell and carry;
  - **place:** its kind, difficulty by approach, where its states start;
  - **item:** what kind of good it is, its worth, harm or armour, what it helps or restores, and difficulty to take or break;
  - **group:** where its own states start (a faction's standing), and defaults for its members.
- **The order, weakest first:** the standard, the world, a tier, a group, set here. Every value says which it came from.
- **Mechanics stay Never text.** A state reaches the model as the sentence its band writes, and only while it is off its resting band.

## Play data (instances)

The world is never changed by play. A save (adventure) or a chat holds:

- **Transcript.**
- **Journal:** active entries (sent) and archived (kept, never sent), for the story and per character.
- **Character journals:** what a character keeps about the player, per pairing. CharacterRoom's Jots fold in here: they work like the adventure's journal, with the same active and archived entries, budget and suggestions to combine.
- **Memories:** diary entries and feelings with keys (Named), and plans with a countdown (When). They are the same reaches as everything else. In the adventure, with several people present, each one is written in the third person under its owner's name and sent only while its owner is here, so one person's memory never reads as another's.
- **Clock, positions, state values, standing,** and the player's own records, laid over canon.
- **The ledger:** every change, and who made it: a rule, or the player's hand.

## Bringing records in

- **CharacterRoom and AetherRoom cards:**
  - persona and appearance become sections;
  - the description becomes the line;
  - the greeting and example chats carry over;
  - card brains become Lore (static as Always, conditional as When by intimacy);
  - the schedule and emotion set carry over.
- **Discord character packs:** `card.json` as above; `user.json` becomes a Persona; `greetings.json` becomes greetings keyed to schedule stops; `settings.json` gives the portrait folder and colour.
- **Character Engine:** profile shapes become sections; states, threads, places and factions map one to one.
- **Praxis's records and modules:** `role`, `appearance`, `personality` and `speech` become sections. Bogwater and Port Covenant become worlds.

## Writing rules for records

- Pulp-voice: concrete, plain, no AI-slop patterns. The model copies the records' voice.
- Single newlines inside text.
- A line is one sentence, under about 25 words.
- A section says what someone could see or test in a scene, not a summary of their virtues.
- The full rules are in `docs/praxis/bogwater-plan.md` under Writing rules, and in the bot-writing skill for cards.

## Worked example

`docs/mascot-record.md` maps Errata, Inkwyrm's mascot, onto this shape: her card in the owner's CharacterVault, section by section, by reach.

## Settled on Nov 9

1. **Five reaches,** with When conditions shared across records rather than written per record.
2. **Example chats and greetings are chat only.**
3. **Sets** for choose-one entries: outfits, scenario locations, versions of a character.
4. **Groups hold species** as well as families and factions, and a person can belong to several.
5. **Memories in the adventure** are written under their owner's name and sent only while the owner is here.
6. **Always for characters,** for now: in the adventure, one line each in a cast list for the current region (Praxis's who's who); in chat, nothing.
7. **Jots fold into journals.** A character's journal about the player works like the adventure's journal, so there is one mechanism, not two.

## Pinned

1. **Group chats.** CharacterRoom and the Discord bot make one call per character, because swapping one shared cache between characters is expensive. Two ways for Inkwyrm:
   - **One call per speaker.** Each character keeps a fixed prefix of their own (the rules, their card, their examples), then the shared world and transcript. Each prefix stays warm in the provider's cache, the voices stay strongest, and each reply costs a call.
   - **One narrator call** that writes everyone, the adventure's way. One cache and the cheapest, but no per-character examples, so the voices are weaker.

   Pinned on Nov 9: there is plenty else to build for chat first. Which providers keep several prefixes warm at once is a question for the generation test.
