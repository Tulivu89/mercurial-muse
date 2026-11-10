# Studio

Inkwyrm's Studio, at `/studio/` on the site: make worlds and characters in the record model (`docs/records.md`), and see exactly what each part sends the model.

## What it does (0.3.0)

- **Worlds** in this browser's storage, with a premise, genre, tone and shared conditions.
- **Records of every kind:** characters, places, groups, items, lore, threads, scenarios and personas.
  - Places nest inside places.
  - A group can be a species, family, faction, crew or profession, and anyone can belong to several.
- **Sections, each with a reach:** Always, Here, Named (by its own keys, or the record's), When (a shared condition) or Never. New records start from a template the author can change.
- **Sets:** one entry in use at a time, such as outfits or a scenario's locations. An entry can be locked behind a condition, so a player can pick it only once it holds.
- **Schedules** (0.2.0), for characters: CharacterRoom's week view. A strip for each day and one for Daily, with every event drawn where it falls; pick a day to add events from the times of day (morning, afternoon, evening, night) and edit their words, hours, day, who gets told, and which outfit and which room of a scenario go with them.
- **Greetings and example chats** for characters, for chat only.
- **Rules on every record** (0.3.0). Everything made here can be played by the rules the moment it exists, with nothing authored:
  - **A Rules panel** on every character, place, item, group and persona, folded to one plain line until opened. It lists what a player can do there, by approach, with how hard it is; how each state reads to the narrator right now, and whether that sentence would be sent; and where every value came from: the standard, this world, a tier, a group, or set here. Change a value where it stands, and **Put back** returns it.
  - **Only what is changed is stored.** A record's rules are worked out from its kind, its tier, its groups and the world's ruleset. A group gives its members defaults (a species' most Health, a crew's tier), which sit above the tier and below what a member's own page sets.
  - **World › Rules:** the ruleset in plain words, with every part open to change and marked standard or this world's. The approaches and what going wrong costs; every state with its bands, the words for the player and for anyone else, what moves it and where it ends; the tiers; the dice, setbacks and rest; deeds; growth; trade and making; and the names and worth of the standard goods. A change that would leave a rule pointing at nothing is refused, with the reason. Standing and Resources for groups are one tap to add.
  - **An item is a good:** what it is worth and what it does (a weapon, armour, a help, something used up). People can sell and carry the standard goods and the world's items.
- **Genre:** the purse's words are the Coin state's bands and the catalog's names are editable, so a modern world's hundred *could buy a car*.
- **In context now:** put people and a place in the scene, type what was just said, tick what holds, and see what the world would send, with a rough token count. From 0.3.0 it shows the sentence of every state that is off its resting band, under the record it belongs to, as the narrator would read it.
- **Files:** a world exports as `<name>.world.json` (`studio-world/1`) and opens again. Cards import into the open world (0.1.1):
  - a CharacterRoom contact card as a character: persona and appearance become Here sections, brains become sections, conditional brains become Named or When sections behind CharacterRoom's bond tiers, the species becomes a group, and the schedule is kept;
  - a CharacterRoom user card as a persona, and a scenario card as a scenario;
  - a Character Card V1, V2 or V3, as JSON or PNG: description and personality as Here sections, the scenario as a Scenario, greetings and example chats, the lorebook as Named sections, and the card's own system prompt kept as a Never section.

  Pictures on a card are kept by Chat, which is where portraits live; import there to bring them.

## Phases (`docs/studio-brief.md`)

| Phase | What | State |
| --- | --- | --- |
| S1 | Rules on every record: `core/rules/`, World › Rules, the Rules panel, state sentences in In context now. | Built, 0.3.0. |
| S2 | Bogwater and Port Covenant into the Studio and back out as modules; Play in the adventure; Chat with. | Next. |
| S3 | Routes, scene actions, the calendar and world states, threads, goods, one schedule model with Chat, and a Checks panel. | After S2. |

## Not yet

- Playing a Studio world in the adventure (S2). Chat (`/chat/`) plays Studio characters now.
- On World › Rules: taking an approach away (the four can be renamed and re-costed, and a fifth added with its rating state), the fight and follow rules, craft's steps, the calendar, travel and scene actions (S3).
- Generate buttons, guided builders and images.

The shared look, world storage and fields moved to `kit/` in 0.1.1, for Chat to use too.

## Develop

From the repository root:

```bash
npm install
npm run dev:studio
```

Open `http://localhost:5177/studio/`. The record model itself is in `core/records/` and the rules in `core/rules/`, with their tests in `core/tests/`.
