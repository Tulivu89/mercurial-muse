# Chat

Inkwyrm's chat side, at `/chat/` on the site: CharacterRoom, rebuilt as a web app on the shared core. Characters, personas and scenarios are records from the Studio's worlds. A chat is an instance and never writes to them. The plan is `docs/chat-brief.md`.

## What it does (0.3.0: Phases A and B, and Home)

- **Home:** recent chats on top, then every character in the Studio's worlds. Errata, the house muse, comes bundled.
- **Import** onto the character list:
  - CharacterRoom contact, user and scenario cards, pictures included;
  - Character Card V1, V2 and V3 as JSON, PNG cards with the card in a `chara` or `ccv3` chunk, and the older Pygmalion shape.

  Imports land in a world named Imported, which the Studio can edit.
- **A new chat** asks what CharacterRoom asks: persona, scenario, relationship, style, response length and which greeting.
- **The chat screen** is built for reading:
  - the transcript takes the whole screen, in the house format (*narration*, plain speech, (thoughts), [notes]), as bubbles or as a page with no bubbles;
  - on a phone the header tucks away while you read down and comes back on the way up;
  - a message's controls stay hidden until you touch it; the latest reply shows only its alternatives and a regenerate button;
  - the portrait follows the emotion of the last reply: small in the header, large in a column beside the chat on a wide screen, and full size when you tap it;
  - a picture a card wrote into a message (`![](address)`) is drawn under its words.
- **On any message:** step between alternative replies (or swipe the last one), regenerate, continue, edit in place, delete, copy, and Remember this.
- **The composer** keeps its draft, sends on Enter, stops a reply midway, and can send what you type as an action, in asterisks.
- **Time:**
  - each chat runs on real time or story time. Story time stands still until you move it, by hand or by a step with each reply, and deleting the latest reply puts it back;
  - when the clock is on, the character is told how long you've been apart and what their schedule has on, and the header shows what they are doing now;
  - sets follow the schedule: the outfit an event calls for, and the room of the scenario it happens in. A chat can pin one instead; a locked one waits for the relationship.
- **Memory:**
  - the journal: facts the character keeps about you, sent with every reply;
  - a diary (Reflect) and feelings (Process), written by the model when you ask, and recalled when one of their keys is said;
  - plans (Plan, or your own): limited to a few turns or ongoing, counting down by your messages;
  - moods: the character's last few emotions, or time away, put them in one of nine states of mind;
  - each generation shows what it will send and what it costs before it is sent.
- **Home** (0.3.0), beside Chats: a place with everyone in it.
  - Pick a scenario with rooms. Each room is a picture; each character who lives there is drawn in the room and at the spot their schedule puts them, with layers (lantern light, steam) over or under them, and a little movement.
  - Tap a character to see what they are doing, how their needs stand, and what you can do for them. Actions move needs and a bond; a cooldown or the relationship can hold one back.
  - Their day is theirs, not a chat's: one clock, one relationship and one set of needs per character on this device, read by Home and by every chat with them.
  - Nothing runs while you are away. Where they are and how they are is worked out from the clock whenever you look, and While you were away replays what the gap held.
  - Needs stand still until you choose to keep them. Once kept, chat is told how they stand, as CharacterRoom's Needs entry.
  - Arrange is where a room gets its picture and layers, and a figure its spot, size and picture. Pictures are uploaded; a cut-out with a clear background sits best.
  - A room locked behind a relationship hides whoever is in it until you reach it.
- **Under the hood** (the token count in the header): the exact request for the last reply and what came back; In context now, by reach; Memory; Time; and this chat's settings, sets and lore switches.
- **Settings:** the connection (the site's own, shared with the adventure), the model and how it is sent, the context window, reply length and temperature, paper or night, text size, bubbles or a page, and an avatar plus 24 emotion portraits per character, where a partial set works.
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

- **Socials:** posts about the chat or the character's day, with comments, and a one-press narration of the away replay. Next.
- Dice, sheets and games are no part of Chat (the owner's decision, Nov 10). Stage mode, bubble styling, the emoji set, Imitate and the farewell on delete wait.
- In Home: a place's atmosphere lines (lamps lit at dusk), characters from more than one world in one place, and generating pictures.
- Group chat stays pinned (`docs/records.md`). Image generation is roadmap step 7.

## To check with a real key

The build sessions have no key and cannot reach NovelAI. The owner's first live test (Nov 10) settled the first question: NovelAI's chat endpoint streams `xialong-v1` as plain text, in OpenAI's shape, so no token decoding is needed. Still open:

1. **An open turn on xialong.** Continue, a plan's think block, and the primer of a diary, feeling or plan are each sent as the last assistant message for the model to carry on, as CharacterRoom does inside NovelAI. Whether the endpoint continues it or starts a new turn needs one try of each. If a Reflect comes back empty, What gets sent on its card shows the request.
2. **The General rules on GLM-4.6, DeepSeek and an OpenRouter model.** Check that replies end with an Emotion line and stay on the character's side.

## How the Phase B parts reach each model

| | Xialong (AetherRoom) | Every other model (General) |
| --- | --- | --- |
| Time apart, the schedule, the mood | CharacterRoom's own entries (`Time Apart`, `Current Events`, `X's Mood`), placed by its kernel before the style line | The same words, as lines in the moment |
| A set's member in use | A brain named `Set: Member`, as CharacterRoom writes it | A line on the character or scenario |
| Diary and feelings | Keyed entries, `Type: diary entry` and `Type: emotional memory` | Lines in the moment, under the character's name |
| Plans | `<think>` on the reply, exactly as CharacterRoom does | A note in the moment, never a thinking block |
| Reflect, Process, Plan | CharacterRoom's prompts and budgets (250, 250 and 300 tokens): the sheet, the story, the shape, the style, a primer | The same shape and style, asked as a note and started on `Title:` |

The plan countdown for other models is held to the kernel's by a test.

## From a CharacterRoom card

Beyond the card itself, the import reads what CharacterRoom adds under `cr`:
- `sets` become sets on the record, with each version's lock as a bond condition;
- `schedLinks` and `lineHome` are folded into the schedule's events, so an event knows which outfit and which room go with it;
- the card's relationship, style and response length become the defaults of a new chat.

- `lineHome`, `homeIdle`, `pics`, `needs`, `homeActions`, `lineNeeds` and `bond` become Home's parts of the record: where she stands for each event, her figures, her needs and what can be done for her; a room's `layers` come in with the scenario.

Not read yet: image prompts and tags, bubble colours, a place's atmosphere lines. The pictures themselves are not in a card file; upload them in Home's Arrange.

## Errata

Her record (`src/errata.ts`) is the owner's card, *Errata - Inkwyrm* v1, laid out by reach as `docs/mascot-record.md` maps it. A browser that took the earlier draft gets the real one the next time Chat opens; anything else added to her world is left alone.

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

### 0.3.2 - Chat with, by address - 2026-11-13

- **`#/with/<world>/<record>`** opens the new-chat sheet for that character, as the Studio's *Chat with* and the Overview's *Meet Errata* ask. It creates no chat until **Start the chat**. A character this browser doesn't have says so.
- A chat that really opens is noted for the Overview's Continue (`kit/src/activity.ts`).

### 0.3.1 - The site's header - 2026-11-12

- **One header for the site** (`kit/src/SiteHeader.tsx`): the bubble, the three sides with Chat underlined, and a gear for Settings. Chats and Home sit under it as Chat's own two places. On a phone the header no longer wraps onto a second row.
- **Edit in the Studio:** a chat's details link to the character's record, which opens there on its own page.

### 0.3.0 - Home - 2026-11-10

- **Home:** a scenario's rooms as pictures with layers and movement, characters placed by their schedule, needs, actions, a bond, and a replay of the time away.
- **A character's day is the character's:** the clock, the relationship and set pins moved from each chat to one life per character, which Home and every chat with them share. Chats from before carry on from their own settings.
- **Needs in context,** once kept, as CharacterRoom's Needs entry for Xialong and a line in the moment for other models.
- **Card import** reads CharacterRoom's Home data.

### 0.2.0 - Phase B, and a screen for reading - 2026-11-10

- **Time:** real or story time per chat, moved by hand or by a step with each reply, rewound when the latest reply is deleted; Time Apart; the schedule in context (Current Events) and as a status line in the header.
- **Sets that choose themselves:** an outfit or a scenario's room follows the schedule event that links it, unless the chat pins one. Locked ones wait for the relationship.
- **Memory:** diary and feelings recalled by key, plans that count down, and the nine moods, each reaching xialong in CharacterRoom's own form and other models as notes in the moment.
- **Reflect, Process and Plan** use CharacterRoom's prompts and budgets, and show what they will send before sending it.
- **The chat screen** was rebuilt for reading: a header that tucks away, controls that hide until a message is touched, a large portrait beside the chat on a wide screen, a page layout without bubbles, and pictures in messages.
- **Card import** reads CharacterRoom's sets, schedule links and chat defaults.
- **Errata** carries her real card.

### 0.1.0 - Phase A - 2026-11-09

First version: everything above.
