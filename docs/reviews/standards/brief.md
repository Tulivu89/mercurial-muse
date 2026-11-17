# Standards: brief

Nov 17, 2026 · @AmbiProp

Which file formats and conventions do players already carry between roleplay apps, and which should Inkwyrm read, write or follow? The first review, because it is the cheapest and players hit it on their first day: they arrive with cards and lorebooks from somewhere else.

## The questions

1. **Cards.** We import Character Card V1 to V3. What do we drop or get wrong on the way in, and should we write cards out?
2. **Lorebooks.** A card's book and SillyTavern's World Info are how most lore travels. How do their activation settings map onto our reaches (Always, Here, Named, When, Never)?
3. **Chats.** Can a player bring a chat from SillyTavern, and take one of ours out?
4. **Macros.** Cards are written with `{{char}}`, `{{user}}` and more. Which ones must we replace so nothing leaks into the prompt as raw braces?
5. **Personas and presets.** Is there a shared file worth reading?
6. **What not to adopt.** Where a standard fights our record model or our rules.

## What Inkwyrm does now

- **Card import** (`core/records/tavern.ts`, `core/records/import.ts`): V1, V2 (`chara_card_v2`), V3 (`chara_card_v3`) and the old Pygmalion shape, as JSON or from a PNG's `ccv3` or `chara` chunk (V3 first). Description and personality become Here sections; the scenario a Scenario record; first and alternate greetings become greetings; example messages are parsed from `<START>` blocks; the card's book becomes Named sections (constant entries Here, disabled entries Never), or Lore records past 60 entries; creator notes, the system prompt and post-history instructions are kept as Never sections and not sent. A PNG card is its own portrait in Chat.
- **CharacterRoom cards** (`core/records/charactercard.ts`): contact, user and scenario cards, with brains, intimacy-gated brains, emotions, schedule and example chats.
- **No card export.** A character leaves only inside a world file (`*.world.json`) or a backup.
- **Chats**: our own export (`exportChat`, `readChatFile` in `core/chat/chat.ts`). Nothing else is read.
- **Macros** (`core/chat/macros.ts`): CharacterRoom's set: `{{char}}`, `{{user}}`, `{{date}}`, `{{time}}`, `{{time24}}`, `$c`, `$u`. Applied by both chat profiles.
- **Providers**: every provider speaks the OpenAI-style API, and prompt formats cover the main open model families (`core/narration/`). That is already the standard; nothing to review.

## Read for this review

- The Character Card V3 spec (kwaroran/character-card-spec-v3, MIT) and the V2 spec (malfoyslastname/character-card-spec-v2).
- SillyTavern 1.19.0's source (AGPL-3.0), from its npm package: World Info, card import and export, chat files, macros, personas, the summarizer. Its docs site was not reachable from the session.
- Agnai 1.0.555's source (AGPL-3.0), from its npm package: what it reads and writes.
- RisuAI (GPL-3.0): its README, wiki and source for CHARX, modules and the lorebook.
