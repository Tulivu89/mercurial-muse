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
- **Files:** a world exports as `<name>.world.json` (`studio-world/1`) and opens again. A CharacterRoom contact card imports as a character:
  - persona and appearance become Here sections;
  - brains become sections;
  - conditional brains become Named or When sections, behind CharacterRoom's bond tiers;
  - the species becomes a group.

  Schedules don't come across yet.

## Not yet

Schedules, generate buttons, guided builders, images, and playing a Studio world in chat or the adventure.

## Develop

From the repository root:

```bash
npm install
npm run dev:studio
```

Open `http://localhost:5177/studio/`. The record model itself is in `core/records/`, with its tests in `core/tests/`.
