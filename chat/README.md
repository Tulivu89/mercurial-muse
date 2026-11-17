# Chat

Inkwyrm's chat side, at `/chat/` on the site: CharacterRoom, rebuilt as a web app on the shared core. Characters, personas and scenarios are records from the Studio's worlds. A chat is an instance and never writes to them. The plan is `docs/chat-brief.md`.

## What it does (0.5.0: Home, finished)

- **Collection:** a portrait gallery of the characters you choose, with direct Continue/New chat, conversation selection, favorites, shelves, archive, artwork and framing controls. World NPCs stay in Add characters until chosen. The collection title, layout, density, sort, image playback and visible metadata are personal display preferences.
- **Conversations:** every conversation remains accessible, including those with people removed from the collection. A character page brings their conversations and images together.
- **Images:** GIF, APNG and animated WebP originals and their timing survive upload and backup/restore. Posters keep browsing light; full originals load on demand. Playback supports Still, Selected and Visible, respects reduced motion and stops offscreen/background playback.
- See [the collection guide](../docs/chat-collection/README.md) for the data boundaries and verification.
- **Import** onto the character list:
  - CharacterRoom contact, user and scenario cards, pictures included;
  - Character Card V1, V2 and V3 as JSON, PNG cards with the card in a `chara` or `ccv3` chunk, and the older Pygmalion shape.

  Imports land in a world named Imported, which the Studio can edit.
- **You:** the personas you chat as, beside Collection, Conversations and Homes. A persona is the name they call you, your pronouns, who you are and how you look, with a picture. Make one, edit it, import a user card, and choose your usual; a new chat starts as your usual, and any chat can change who you are in it. Personas are records, so the Studio can edit the rest.
- **A new chat** asks what CharacterRoom asks: persona, scenario, relationship, style, response length and which greeting.
- **The chat screen** is built for reading:
  - the transcript takes the whole screen, in the house format (*narration*, plain speech, (thoughts), [notes]), as bubbles or as a page with no bubbles;
  - on a phone the header tucks away while you read down and comes back on the way up;
  - a message's controls stay hidden until you touch it; the latest reply shows only its alternatives and a regenerate button;
  - the portrait follows the emotion of the last reply: small in the header, large in a column beside the chat on a wide screen, and full size when you tap it;
  - a picture a card wrote into a message (`![](address)`) is drawn under its words.
- **On any message:** step between alternative replies (or swipe the last one), regenerate, continue, edit in place, delete, copy, and Memory, which reads the chat as it stood at that message.
- **The composer** keeps its draft, sends on Enter and stops a reply midway. Beside the box are two buttons: Memory (the brain) and a note (the brackets).
- **Notes:** a line in square brackets is a directive from outside the story, such as `[SYS: The power is out]`, `[Chat: …]`, `[Bid: …]` or `[Later that night]`. A draft that is nothing but bracketed lines goes in as a note, however it is sent, and the note button puts the brackets on plain words. A note asks for no reply: the next message, or Send with the box empty, has the character answer it. It is drawn in the middle of the chat, as nobody's turn.
- **The character's sheet:** press the header. **Now** shows who they are this minute and every set as a row of choices (an outfit, a room, a configuration), with the one in use marked; pick one to hold it for this chat, or let it follow their day. The chat's lore is switched on and off there too. **Home** is their day in the house they live in, with needs, actions and the way to the house. **Posts** is their feed. **You** is who you are in this chat.
- **Time:**
  - each chat runs on real time or story time. Story time stands still until you move it, by hand or by a step with each reply, and deleting the latest reply puts it back;
  - when the clock is on, the character is told how long you've been apart and what their schedule has on, and the header shows what they are doing now;
  - sets follow the schedule: the outfit an event calls for, and the room of the scenario it happens in. A chat can pin one instead; a locked one waits for the relationship.
- **Memory:**
  - the brain button beside the message box asks which of four to keep: a journal entry you write, or a diary entry, a feeling or a plan the character writes from the chat so far. Each generated one shows what it will send first;
  - the journal: facts the character keeps about you, sent with every reply;
  - a diary (Reflect) and feelings (Process), written by the model when you ask, and recalled when one of their keys is said;
  - plans (Plan, or your own): limited to a few turns or ongoing, counting down by your messages;
  - moods: the character's last few emotions, or time away, put them in one of nine states of mind;
  - each generation shows what it will send and what it costs before it is sent.
- **Homes** (0.3.0, finished in 0.5.0): places with everyone in them.
  - Homes opens on a list: each home is a card with its picture, its world, and who is in and what they are doing right now. There is no dropdown. A home has an address (`#/home/<world>/<scenario>`), and its posts have one too.
  - A home is a scenario with rooms. The Studio builds one (a household, its rooms, who lives there); a CharacterRoom scenario card with locations comes in as one.
  - Each room is a picture; each character who lives there is drawn in the room and at the spot their schedule puts them, with layers (lantern light, steam) over or under them, and a little movement.
  - Tap a character to see what they are doing, how their needs stand, and what you can do for them. Actions move needs and a bond; a cooldown or the relationship can hold one back.
  - Their day is theirs, not a chat's: one clock, one relationship and one set of needs per character on this device, read by Home and by every chat with them.
  - Nothing runs while you are away. Where they are and how they are is worked out from the clock whenever you look, and While you were away replays what the gap held.
  - Needs stand still until you choose to keep them. Once kept, chat is told how they stand, as CharacterRoom's Needs entry.
  - Arrange is where a room gets its picture and layers, and a figure its spot, size and picture. Pictures are uploaded; a cut-out with a clear background sits best.
  - A room locked behind a relationship hides whoever is in it until you reach it.
  - A chat opened from a home goes back to it, and a character's card in the collection says where they live.
- **Posts** (0.5.0), CharacterRoom's, in a home's Posts tab and on a character's sheet in a chat:
  - A post is written when you ask for one: **About their day**, what they did away from you, or **About your chat**. It is shown what it will send first, with the time it will be told: now, when you last spoke or they last posted (as a clock time and as how long ago), what their schedule put in the gap, and what they are doing this minute.
  - Under a post, **A comment** writes one, as its own small request: sometimes someone else from the house, now and then the author, otherwise a stranger the model names. **A few** writes three, each able to answer the last, and can be stopped. You can comment too. A commenter is shown the post and the comments, never the chat.
  - **Ask what they would attach** has the character describe the photo in one plain line, kept on the post. A picture is uploaded for now; the line is what an image will be made from when the site makes images (roadmap step 7).
  - A post can be edited, deleted, or kept on the profile. A feed holds a character's last 60, and never drops a kept one.
- **Under the hood** (the token count in the header): the exact request for the last reply and what came back; In context now, by reach; Memory; Time; and this chat's settings, sets and lore switches.
- **Settings:** the connection (the site's own, shared with the adventure), the model and how it is sent, the context window, reply length and temperature, paper or night, text size, bubbles or a page, and an avatar plus 24 emotion portraits per character, where a partial set works.
- **Files:** a chat exports and imports as `<name>.chat.json`; Back up everything includes worlds, chats, lives, posts, image originals/posters and collection curation. Adventure saves and Studio authoring talks have separate exports.

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

  A note the player dropped in rides in the player's turn, in its brackets, where it was written. The rules say a bracketed line on its own is a directive, true from then on. For Xialong it is a system message in the chat, the way the style line is one.

  Character turns keep CharacterRoom's shape (`Name: text`, then `  Emotion: word`), so one parser reads every model. Where the provider can continue text, the reply is started with the character's name.

When a chat outgrows the window, the oldest messages leave a piece at a time and the start stays put between cuts.

## Not yet

- A one-press narration of the away replay, and telling the model when a set member was pinned by hand (`docs/content/hog-wild/01-decisions.md`).
- Dice, sheets and games are no part of Chat (the owner's decision, Nov 10). Stage mode, bubble styling, the emoji set, Imitate and the farewell on delete wait.
- In Home: a place's atmosphere lines (lamps lit at dusk), characters from more than one world in one place, and generating pictures: a room's, a figure's, and a post's photo from the line already kept on it.
- Group chat is being tried in the chat lab first, with two layouts (`docs/model-jobs.md`, Group chat); no chat screen until the owner reads the scores. Image generation is roadmap step 7.

## To check with a real key

The build sessions have no key and cannot reach NovelAI. The owner's first live test (Nov 10) settled the first question: NovelAI's chat endpoint streams `xialong-v1` as plain text, in OpenAI's shape, so no token decoding is needed. Still open:

1. **An open turn on xialong.** Continue, a plan's think block, and the primer of a diary, feeling or plan are each sent as the last assistant message for the model to carry on, as CharacterRoom does inside NovelAI. Whether the endpoint continues it or starts a new turn needs one try of each. If a Reflect comes back empty, What gets sent on its card shows the request.
2. **The General rules on GLM-4.6, DeepSeek and an OpenRouter model.** Check that replies end with an Emotion line and stay on the character's side.
3. **A post on Xialong.** It is sent CharacterRoom's messages and started on `Thread:`, the same open turn as item 1. A comment is started on the commenter's name when a housemate writes it.
4. **A note on Xialong.** It goes as a system message in the chat. If she answers a note out loud instead of taking it as true, say so, and it can ride in the player's turn as it does for other models.

## How the Phase B parts reach each model

| | Xialong (AetherRoom) | Every other model (General) |
| --- | --- | --- |
| Time apart, the schedule, the mood | CharacterRoom's own entries (`Time Apart`, `Current Events`, `X's Mood`), placed by its kernel before the style line | The same words, as lines in the moment |
| A set's member in use | A brain named `Set: Member`, as CharacterRoom writes it | A line on the character or scenario |
| Diary and feelings | Keyed entries, `Type: diary entry` and `Type: emotional memory` | Lines in the moment, under the character's name |
| Plans | `<think>` on the reply, exactly as CharacterRoom does | A note in the moment, never a thinking block |
| Reflect, Process, Plan | CharacterRoom's prompts and budgets (250, 250 and 300 tokens): the sheet, the story, the shape, the style, a primer | The same shape and style, asked as a note and started on `Title:` |
| A note | A system message in the chat, in its brackets | In the player's turn, in its brackets |
| A post | CharacterRoom's thread prompt (250 tokens): the sheet, the story, the thread's shape, the time frame, the style, started on `Thread:` | The same, asked as a note with the layout said in a sentence |
| A comment, a photo line | CharacterRoom's messages (220 and 80 tokens): the thread, the commenter's short sheet or the stranger's brief, the format, the style | One instruction with the same content |

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

### 0.5.1 - The site's own pictures - 2026-11-17

- **Worlds that come with the site bring their pictures.** A world's `pictures.json` names a face for each character and a cover and pictures for a Home's rooms, from its `pictures/` folder (`kit/src/pictures.ts`; how to add or change one is `content/PICTURES.md`). A built site reads them from GitHub through jsDelivr, pinned to the commit it was built from, so the web server sends none of them. A picture set in the browser wins. HOG Wild has its six faces, nine rooms and the outside of the house.
- **A Home's cover** is its own `cover` picture when it has one, before its first room's, in Homes and on the Overview.

### 0.5.0 - Home, finished: personas, homes, notes, memory, posts - 2026-11-16

The owner's eight, from a pass over Chat and Home.

- **You: personas.** A fourth place beside Collection, Conversations and Homes: make a persona, write who you are and how you look, give it a picture, pick your usual, delete it, import a user card. A new chat starts as your usual. A chat's sheet changes who you are in it.
- **Homes say what they are.** Home opened on a dropdown and a room, with nothing to say what it was. It now opens on a list headed by one paragraph, each home a card that says who is in and what they are doing. The dropdown is gone.
- **A household is not an adventure.** A world can say it is a household, made for Chat (`use` on the world). The dragon's resort, HOG Wild and Chat's own shelf of imported cards are marked, in place, in a browser that already has them. The Studio offers a household to Chat instead of to the adventure, and the Overview lists it under Homes, never under Worlds.
- **Homes are built in the Studio** (Studio 0.15.0): New household, and a Home door on every scenario for its rooms, who may go in, and who lives there.
- **Homes on the Overview** (Overview 0.3.0): a Homes panel with who is in and what they are doing, and a home that was opened can be the page's Continue.
- **Notes in square brackets.** A bracketed line is a directive and goes into the chat without asking for a reply, from the note button or just by typing it in brackets. It is nobody's turn: a system message for Xialong, the player's turn for other models.
- **Memory from the prompt bar.** The button under a message saved its first 300 characters as a fact. It is now a brain button that opens Memory's four choices, reading the chat as it stood at that message, with the whole message there to cut down for a journal entry. The same button sits beside the message box for the chat so far.
- **Posts.** CharacterRoom's feed, in each home and on each character's sheet: a post about their day or about a chat, comments from housemates and strangers, your own, and the line a photo will be made from.
- **The character's sheet in a chat.** Pressing the header gives the sets as choices and the lore as switches, their day at home with needs and actions, their posts, and who you are. A house button in the header goes straight to Home's part, and Go to the house opens the home on them; Back from a chat opened in a home returns there.

### 0.4.6 - HOG Wild, and a card that says each thing once - 2026-11-16

- **HOG Wild can be brought in** from Home and from Add characters, beside the dragon's resort. Its six residents join the collection and its house is a place in Home. It isn't put in a first visitor's browser: the resort stays the house.
- **Another chat character's notes stay out of a chat.** A resident's keyed and bond-gated sections were written for chats with her, but they could key into anyone's: in a chat with Nova, *kiss* brought in all six In Bed sections, opened by the bond with Nova, and *where are you from* brought in four Backgrounds. Now a chat character brings nothing into another's chat (`sceneFor` in `core/chat/scene.ts`); who they are to each other is in groups and lore. Anyone in the world who isn't a chat character still comes in on their name, without bond-gated sections.
- **The character card says each thing once.** It was printing the schedule line three times, once as what she is doing and again as the reason for each outfit and room. Now: the relationship and her look (if not neutral), her line, what she is doing, the time, and each set's member, marked only when pinned. *Not sent* reads as *Errata isn't told the time*.

### 0.4.5 - Tag triggers on Xialong - 2026-11-15

- **A trigger with a symbol on it now fires with Xialong.** CharacterRoom's kernel strips symbols from the ends of words before matching, so a tag such as `$directives` never fired. Chat now sends each trigger the way the kernel reads it (`keyVariants` in `core/chat/sheet.ts`). HOG Wild keys Nova's admin directives on `$directives` (`docs/content/hog-wild/01-decisions.md`).

### 0.4.4 - New greetings, triggers that fire - 2026-11-15

- **The resort's greetings are rewritten** (`docs/content/dragons-resort/greetings-v2.md`): each woman in the middle of her own day, at an hour her schedule agrees with, handing the person something to do. A browser that has the resort takes the new version; chats already started keep their greeting.
- **Triggers fire on capitals with Xialong.** CharacterRoom's kernel matches triggers case for case, so each one is now sent capitalised as well (`keyVariants` in `core/chat/sheet.ts`). The resort's loose triggers (*past, want, horns*) are gone.

### 0.4.3 - The resort is the house - 2026-11-15

- **The resort's Errata is the site's Errata.** A first visit gets the dragon's resort (Qiulong, Errata and Echydna) instead of the old mascot's world, and a browser that has the old world loses it. Chats with the old Errata stay readable until deleted.
- **No say/do switch.** Actions are written in asterisks, as the house format already has them.

### 0.4.2 - Save for a test - 2026-11-15

- **Save for a test**, at the top of Under the hood › Sent and in › Chat: **Everything** (one file with the chat, its world as the chat sees it, the settings without the key, what the next reply would be sent, and the last request with its reply), **The chat** and **Settings**. Settings has its own **Save settings** too.
- **Copy as text** and **Save as text** for the last request and its reply (Sent), and for the whole next request (Context), laid out to paste into another app.
- A new chat starts in the scenario where the character's schedule puts her, or her world's only scenario, instead of none. Without one, she didn't know where she was.
- `npm run chat:lab` turns a saved file into the same turn under several setups, for another app's model to play and the lab to score (`docs/testing/chat-lab.md`).

### 0.4.1 - The dragon's resort - 2026-11-15

- **Home's first household:** Qiulong, Errata and Echydna at Autumn's Leaves, from `content/dragons-resort/world.json`. Home offers **Bring in The dragon's resort** until this browser has it; the three join the collection. It's the pilot's world, put here for its play-test (stage 8 of `docs/content/pilot-brief.md`).
- The resort's Errata is a separate character from the mascot in `chat/src/errata.ts`, in her own world. Which one the site keeps is still the owner's call.

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
