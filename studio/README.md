# Studio

Inkwyrm's Studio, at `/studio/` on the site: make worlds and characters in the record model (`docs/records.md`), and see exactly what each part sends the model.

## What it does (0.1.0)

- **Worlds** in this browser's storage, with a premise, genre, tone and shared conditions.
- **Records of every kind:** characters, places, groups, items, lore, threads, scenarios and personas.
  - Places nest inside places.
  - A group can be a species, family, faction, crew or profession, and anyone can belong to several.
- **Sections, each with a reach:** Always, Here, Named (by its own keys, or the record's), When (a shared condition) or Never. New records start from a template the author can change.
- **Sets:** one entry in use at a time, such as outfits.
- **Greetings and example chats** for characters, for chat only.
- **In context now:** put people and a place in the scene, type what was just said, tick what holds, and see what the world would send, with a rough token count.
- **Files:** a world exports as `<name>.world.json` (`studio-world/1`) and opens again. Cards import into the open world (0.1.1):
  - a CharacterRoom contact card as a character: persona and appearance become Here sections, brains become sections, conditional brains become Named or When sections behind CharacterRoom's bond tiers, the species becomes a group, and the schedule is kept;
  - a CharacterRoom user card as a persona, and a scenario card as a scenario;
  - a Character Card V1, V2 or V3, as JSON or PNG: description and personality as Here sections, the scenario as a Scenario, greetings and example chats, the lorebook as Named sections, and the card's own system prompt kept as a Never section.

  Pictures on a card are kept by Chat, which is where portraits live; import there to bring them.

## Not yet

A schedule editor, a gender field, generate buttons, guided builders, images, and playing a Studio world in the adventure. Chat (`/chat/`) plays Studio characters now.

The shared look, world storage and fields moved to `kit/` in 0.1.1, for Chat to use too.

## Develop

From the repository root:

```bash
npm install
npm run dev:studio
```

Open `http://localhost:5177/studio/`. The record model itself is in `core/records/`, with its tests in `core/tests/`.
