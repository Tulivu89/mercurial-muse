# Chat

Inkwyrm's chat side, at `/chat/` on the site: CharacterRoom, rebuilt as a web app on the shared core. Characters, personas and scenarios are records from the Studio's worlds. A chat is an instance and never writes to them. The plan is `docs/chat-brief.md`.

## What it does (0.1.0, Phase A)

- **Home:** recent chats on top, then every character in the Studio's worlds. Errata, the house muse, comes bundled.
- **Import** onto the character list:
  - CharacterRoom contact, user and scenario cards, pictures included;
  - Character Card V1, V2 and V3 as JSON, PNG cards with the card in a `chara` or `ccv3` chunk, and the older Pygmalion shape.

  Imports land in a world named Imported, which the Studio can edit.
- **A new chat** asks what CharacterRoom asks: persona, scenario, relationship, style, response length and which greeting.
- **The chat screen:** bubbles in the house format (*narration*, plain speech, (thoughts), [notes]), a portrait that follows the emotion of the last reply, and replies that stream in.
- **On any message:** step between alternative replies (or swipe the last one), regenerate, continue, edit in place, delete, copy, and Remember this.
- **The composer** keeps its draft, sends on Enter, stops a reply midway, and can wrap what you type in asterisks as an action.
- **Under the hood:** the exact request for the last reply and what came back; In context now for this chat, by reach; the character's journal about you; and this chat's settings and lore switches.
- **Settings:** the connection (the site's own, shared with the adventure), the model and how it is sent, the context window, reply length and temperature, paper or night, text size, and an avatar plus 24 emotion portraits per character, where a partial set works.
- **Files:** a chat exports and imports as `<name>.chat.json`; Back up everything makes one file of every world, chat and portrait in this browser.

Everything is kept in this browser (IndexedDB `inkwyrm-chat`; worlds in the Studio's `inkwyrm-studio`). Keys go through the site's relay per request and are never stored on the server.

## The two contexts

The kernel is in `core/chat/`. It takes the same chat either way and builds a different layout for the model.

- **AetherRoom,** for `xialong-v1`: CharacterRoom's kernel, ported in `core/chat/aetherroom.ts`. `core/tests/aetherroom-parity.test.ts` holds it byte for byte to outputs recorded from CharacterRoom's own kernel (engine 1.0.20) on its 21 parity fixtures, 52 steps. Records are read as CharacterRoom cards by `core/chat/sheet.ts`:
  - a Personality and an Appearance section fill the sheet's own fields;
  - other Here sections and the outfit in use become always-on brains;
  - Named sections become keyed brains;
  - a section behind a bond condition is in when the relationship reaches it.

  It is sent as chat messages with CharacterRoom's sampling (temperature 0.85, top-p 0.95, top-k 250), on a window of 28,672 tokens with an 8,192-token rollover.
- **General,** for every other model (`core/chat/general.ts`), in this order, so the start of the context stays the same from turn to turn and provider caches hit:
  1. rules;
  2. the character's standing sections, then the persona;
  3. the scenario;
  4. example chats;
  5. the journal;
  6. the transcript;
  7. the moment: Named and When sections and the style line, as a note in square brackets on the last message.

  Character turns keep CharacterRoom's shape (`Name: text`, then `  Emotion: word`), so one parser reads every model. Where the provider can continue text, the reply is started with the character's name.

When a chat outgrows the window, the oldest messages leave a piece at a time and the start stays put between cuts.

## Not yet

- **Phase B:** the clock and story time, Time Apart, schedules in context and the status line, emotional modes, Diary and Process memories, plans, side generations. The kernel already carries all of these for xialong (the parity fixtures cover them); they have no state or screens yet.
- **Phase C:** posts, dice and sheets, small games, Stage mode, bubble styling, the emoji set, Imitate, the farewell on delete.
- Group chat stays pinned (`docs/records.md`). Image generation is roadmap step 7.

## To check with a real key

These could not be tried from the build session, which has no key and cannot reach NovelAI.

1. **What NovelAI's chat endpoint returns for `xialong-v1`.** The Discord bot had to decode token ids. If a reply comes back empty or as numbers, What was sent shows the first raw chunk under Settings and diagnostics; send that back.
2. **Continue on xialong.** The open turn is sent as the last assistant message for the model to carry on, as CharacterRoom does inside NovelAI. Whether the endpoint continues it or starts a new turn needs one try.
3. **The General rules on GLM-4.6, DeepSeek and an OpenRouter model.** Check that replies end with an Emotion line and stay on the character's side.

## Errata

Her record (`src/errata.ts`) follows `docs/mascot-record.md` section by section. Her card is in the owner's CharacterVault and not in this repository, so her greeting and five example chats are drafts written on the mapping's titles. Replace them with the vault card's text, in the Studio or in that file.

## Develop

From the repository root:

```bash
npm install
```

```bash
npm run dev:all
```

```bash
npm run dev:chat
```

Open `http://localhost:5178/chat/`. The first command installs, the second starts the adventure's API (the relay), the third starts Chat.

## Changelog

### 0.1.0 - Phase A - 2026-11-09

First version: everything above.
