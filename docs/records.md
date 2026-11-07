# Records

Nov 7, 2026 · @AmbiProp · Draft for the owner's review

What a world and its characters are made of, and when each part reaches the model. The test of every field here: does it help decide what is in context, and when, so a big world or a long story stays manageable? A field that never reaches the model and never drives a rule doesn't belong.

Sources: Character Engine (profiles, states, threads, the journal, nested places, schedules), CharacterRoom and the Discord bot (cards, brains, Jots, memories, greetings, example chats), and Praxis (canon and instance, the context layout, the budget).

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
| **Always** | Every turn. | The world's premise, the player's persona, the active thread's next beat, a character's core in chat. Kept small. |
| **Here** | While the record is part of the scene: the place you're in, people present, things carried or in the room, the character you're chatting with. | Most of a character's profile; a place's entry and atmosphere. |
| **Named** | When one of its keys appears in the player's words or the last few turns. It stays until the scene changes, so it doesn't flicker in and out. | Lore, off-stage people and places, history. |
| **When** | Only while a condition holds: a state's band, a bond tier, the time of day, a world state, a thread's status. Combines with Here or Named. | Secrets, intimacy-gated brains, what a place is like after the raid. |
| **Never** | Not sent. Visible in the studio only. | The author's notes, design reasons, image prompts. |

### Line and entry

Every record has two lengths:
- **Line:** one sentence, who or what this is to a stranger. Used when the record is named but not here, in lists ("people nearby", exits), and when the budget is tight.
- **Entry:** everything with a reach that currently holds.

This is what keeps a big world cheap. A town of forty people costs forty lines at most, and only the ones named or nearby. The four people in the room get their entries.

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
| **Group** | A faction, family, crew or court, with its standing ladder and resources. | Line when a member is present; entry Named | |
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
- **Hidden sections:** a section with a When reach: what she admits once you're Friends, what shows when she's drunk.
- **Chat parts:**
  - **Greetings:** one or more openers. Each can be keyed to a schedule stop, as the bot's `greetings.json` is.
  - **Example chats:** named exchanges with speakers and an emotion per message.
  - **Emotion set and portraits.**

  The examples steer more than any section does, so the studio treats them as first-class and doesn't bury them.
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

## Play data (instances)

The world is never changed by play. A save (adventure) or a chat holds:

- **Transcript.**
- **Journal:** active entries (sent) and archived (kept, never sent), for the story and per character.
- **Jots:** short facts a character keeps about the player, per pairing. Always, with a cap.
- **Memories:** diary entries and feelings with keys (Named), and plans with a countdown (When).
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

## Open questions

1. Is five reaches the right set, or should When fold into the other four as an optional condition on any of them?
2. Should example chats also reach the adventure narrator for characters present, as a short voice sample, or stay chat-only?
3. Group chat: does each character present send their whole entry, or does the one replying get their entry and the others their lines?
4. How many Jots before the oldest are dropped or combined?
