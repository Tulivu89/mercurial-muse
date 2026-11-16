# Chat v0: brief

Nov 9, 2026 · @AmbiProp · Hand-off for the session that builds Inkwyrm's chat side (roadmap step 5)

You are building the chat side of Inkwyrm: CharacterRoom, the owner's NovelAI script, rebuilt as a web app on the site's shared core. It should be a chat app that holds its own against any character chat service, and it should keep as much of CharacterRoom as fits. Read this whole page before writing code. Where it decides something, build that. Where it leaves a question open, ask the owner.

## Read first

In this repository (`Tulivu89/mercurial-muse`):
1. `CLAUDE.md` and `README.md`: rules, layout, checks. The owner doesn't use git, so you handle branches and pull requests and give them plain merge steps. Never use the owner's real name anywhere; sign docs `@AmbiProp`.
2. `docs/roadmap.md`: where this sits. Decisions 2 to 4 bind you: folders named by job, one shared core, browser storage first.
3. `docs/records.md`: the record model. Chat runs on it. Its Settled list is settled.
4. `docs/brand.md`: the Wet Ink look, its tokens and type.
5. `core/records/` and `core/narration/`: the record model and the provider code you build on. `studio/` shows how a second app is built, served and tested.
6. `docs/mascot-record.md`: Errata, the mascot and house muse, mapped onto the record model. She is the first character the chat should run well.

In CharacterRoom (`Tulivu89/CharacterRoom`, public; clone it read-only):
1. `README.md`: the feature list as players see it.
2. `CR-PLAN.md`, the full plan:
   - §1 decisions;
   - §3.6 the feature inventory (F-01 to F-30);
   - §3.7 the kernel contract: exactly how context is built;
   - §6 the surfaces: clock, schedules, side generations, bubbles, Stage mode, group chat.
3. `characterroom.naiscript`: the script. Its kernel region is the reference for the context build. Side-generation prompts are in it too.
4. `tests/`: the parity harness and its fixtures (`cr-parity-harness.js`), which check CR's kernel against AnotherRoom 1.1.5.

CharacterRoom's context management is the owner's own rewrite (AnotherRoom came from what was left of AetherRoom, for Xialong only). Porting it to the site is settled and fine.

## What you are building

A new app, `chat/`, served at `/chat/` like the Studio, with its context kernel in `core/chat/`. Characters, personas and scenarios are records from the Studio's worlds. A chat is an instance: it never writes to the records.

**At the top of every chat's context:** the character, the player's persona, the scenario, and the example chats. That's in place of the adventure's rules and world. Then come brains and memories by reach, the transcript, and the moment.

**Anyone with an API key can use it,** like the owner's Discord bot. Keys go through the site's relay (`core/narration`, served by the adventure's server), sent per request and never stored on the server. The work is fitting the context to whatever model the player brings.

## Decisions already made

1. **Two context profiles in `core/chat/`, one input.** The kernel takes the same chat state either way and builds a different layout:
   - **AetherRoom** for Xialong (`xialong-v1` on NovelAI). Build exactly what CR-PLAN §3.7 describes, byte for byte, because that is the layout Xialong was trained on. Prove it with CR's parity fixtures ported into `core/tests/`.
   - **General** for every other model. The same content laid out as `docs/records.md` describes, stable parts first so provider caches hit:
     1. rules;
     2. the character's Here sections and the persona;
     3. the scenario;
     4. example chats;
     5. the journal;
     6. the transcript;
     7. the moment: Named and When brains, memories, time apart, current events, mood, plans.

     Rendered through `core/narration/formats.ts`: one prompt in the model's own format with a prefill where the provider has completions, chat messages where it doesn't.
2. **Records, not cards, are the source.**
   - The CharacterRoom card import in `core/records/charactercard.ts` is the way existing characters come in. Extend it with the schedule, the CR user card (to a Persona) and the CR scenario card (to a Scenario, its brains as sections).
   - Card brains map as already decided: always-on brains are Here, keyed brains are Named, intimacy-gated brains are When behind the shared bond conditions.
   - Floaty brains are Lore records the chat can turn on and off.
3. **Jots are character journals** (records.md, Settled 7): per pairing, the same mechanism as the adventure's journal, sent as CR sends "Facts About {user}". Remember this, on any message, adds one.
4. **Intimacy is chat state.** The relationship set on a chat (stranger, acquaintance, close, romantic) decides which bond conditions hold.
5. **Storage stays in the browser.** Chats live in IndexedDB on this device, with export and import and a Back up everything file. Worlds stay in the Studio's store; read them from there.
6. **Shared browser code moves to a new `kit/` workspace** when chat needs it, not before: the Wet Ink stylesheet, the mark, world storage, file helpers, fields, and the connection settings. The Studio switches to it in the same change.
7. **One connection for the whole site.** The adventure keeps the player's provider, key and model in `localStorage` (`praxis.provider`, `praxis.novelai.token`, `praxis.key.<provider>`, `praxis.model.<provider>`; see `adventure/src/ui/narration.ts`). Chat reads and writes the same keys through `kit/`, so a player connects once. Don't rename the keys: players would lose their connections.
8. **Group chat stays pinned** (records.md). Don't build it.
9. **Images come later** (roadmap step 7). Portraits are uploaded: an avatar plus the 24 emotion slots, with CR's emotion fallback chain (CR-PLAN §6.5) so a partial set works.

## Features, in three phases

One pull request per phase at most; smaller is fine. Stop after Phase A and show the owner before going on.

### Phase A: a chat app worth switching to

**Getting started:**
- A home screen of characters from the Studio's worlds, with recent chats on top: avatar, name, last line, time. Errata is bundled as the first character.
- **Import,** onto the character list:
  - CharacterRoom cards, through the extended `core/records` import;
  - Character Card V2 and V3 JSON, and PNG cards with the card in a `chara` or `ccv3` text chunk, which is what most of the character-sharing world uses. Map:
    - `description` and `personality` to Here sections;
    - `scenario` to a Scenario;
    - `first_mes` and `alternate_greetings` to greetings;
    - `mes_example` (`<START>` blocks of `{{user}}:` and `{{char}}:` lines) to example chats;
    - `character_book` entries to Named sections with their keys, constant entries to Here;
    - `creator_notes` to Never;
    - `system_prompt` and `post_history_instructions` kept, but not sent by default.
- **A new chat** asks only what CR's chat settings ask:
  - persona;
  - scenario;
  - relationship;
  - style (chat, roleplay, novel);
  - response length;
  - which greeting.

**The chat screen,** mobile first:
- The character's portrait in the header changes with the emotion of their last reply.
- Bubbles in the Wet Ink look render the house format: *narration* in italic, speech plain, (thoughts) set apart, [notes] outside the story.
- **Streaming replies.** The relay doesn't stream yet. Add server-sent events through it for providers that stream, and fall back to a whole reply for those that don't. Streaming is table stakes for a chat app.
- **Message actions:**
  - swipe or step between alternative replies, keeping every one;
  - regenerate;
  - continue;
  - edit any message in place;
  - delete;
  - copy;
  - Remember this.
- A composer that keeps its draft, with send, stop, and an action/speech toggle that wraps the text in asterisks.
- **Context kernel, both profiles:**
  - the greeting;
  - macros (F-27);
  - brains by reach;
  - journal facts;
  - the style line;
  - rollover trimming that keeps the prefix stable (F-26), generalized from Xialong's fixed budget to the model's window, the reply length and a reserve, the way the adventure sizes its window;
  - emotion parsing of `Name: text` and `  Emotion: word` replies, with neutral as the fallback.
- **What was sent:** the exact request for the last reply, as the adventure has it, plus the Studio's In context now view for this chat. This is how the owner debugs a bad reply.
- Chat export and import, and Back up everything.

**Settings:** connection (shared with the adventure), model, the context window, display (text size, paper or night), and the 24 emotion portraits per character.

### Phase B: time and memory

- **The clock.** Real time or story time per chat, story time moved by hand or by a step per reply (CR-PLAN §6.6), with undo rewinding it. Time Apart (F-15).
- **Schedules** in the record model:
  - add `schedule` to characters in `core/records`, in CR's shape: days, events in minutes, required intimacy;
  - Current Events in the context;
  - the status line under the header;
  - CR's week view to edit it in the Studio;
  - the card import keeps the schedule it currently skips.

  CLAUDE.md asks for schedules in times of day for authored worlds. CR's minute ranges are the storage; the editor can offer times of day as presets.
- **Emotional modes,** all nine (F-16).
- **Memories.** Diary (F-19) and Process, or emotional memories (F-23): generated from the chat when the player asks, recalled by key as Named entries under their owner's name.
- **Plans** (F-20): the AI's or the player's, limited or ongoing, counting down by turns.
  - In the AetherRoom profile, as `<think>` on the reply, exactly as CR does.
  - In the General profile, as a brief note in the moment, never as a fake thinking block.
- **Side generations use CR's prompts,** each budgeted, started by the player, and showing what it will send. Moved to the player's model, they are written in its format.

### Phase C: home and socials

Changed by the owner on Nov 10: dice, sheets and small games are no part of the chat side. Phase C is Home and socials. The idea: look at your characters, see them go about their days, manage them and their moods and memories, then jump into a chat with them. CharacterRoom has not finished this; it is finished here.

- **Home** (CR-PLAN §6.12, CharacterRoom's Tamagotchi mode). Built first, as Chat 0.3.0:
  - a place with everyone in it: a scenario's rooms as pictures, each character drawn in the room and at the spot their schedule puts them, with layers over and under them and simple movement;
  - a character's day belongs to the character, on this device: one clock, one relationship, their needs and where they are, shared by Home and every chat with them;
  - needs that fall with the clock and move with the schedule, actions that change them, a bond that follows how well they are kept, and a replay of what happened while you were away;
  - pictures are uploaded. Image generation comes with roadmap step 7.
- **Socials** (F-21, Posts): a feed about the chat or the character's day, with comments from other characters, the player and strangers the model names; a post can be kept on the profile. **Built Nov 16, as Chat 0.5.0** (`core/chat/posts.ts`), with CharacterRoom's own prompts, time frame and one-press comments. The away replay's one-press narration is still to do.
- **Later, if wanted:** Stage mode (CR-PLAN §6.8b), bubble styling per character (§6.8c), the emoji set (F-04), Imitate (F-22), the farewell on delete (F-29), a place's atmosphere lines.

## Gotchas already found

- **Xialong:**
  - The owner's Discord bot reaches `xialong-v1` through NovelAI's OpenAI-style chat endpoint (`https://text.novelai.net/oa/v1/chat/completions`), sending AnotherRoom's exact context.
  - The bot had to decode token ids, which it did with a GLM vocabulary file. Probe what the endpoint returns before building on it, and say what you find.
  - The bot's sampling: temperature 0.85, top_p 0.95, top_k 250, min_p 0; replies up to 1,000 tokens and side generations 250; context 28,672 tokens plus an 8,192-token rollover window.
- **Lessons from running CR characters live:**
  - The examples steer more than any instruction.
  - Never add formatting rules to the system prompt (it breaks parity, and the examples win anyway); add blank lines at display time instead.
  - A schedule stop says what the character is doing, never how they arrive, because current events go into every reply.
  - An old bad turn keeps teaching the model, so the owner needs an easy way to edit or remove one.
- **Thinking models** (DeepSeek, Qwen, GLM through some providers) can leave reasoning in the reply. `core/narration` already strips it; keep it that way.
- **Keys:** `crypto.randomUUID` doesn't exist on plain http pages. Use `getRandomValues`, as `studio/src/util.ts` does.

## Checks before each pull request

- From the root: `npm test`, `npm run lint`, `npm run build`. Add `chat/` to the root scripts and to the Site workflow's paths, and have CI check that `/chat/` answers, as it does `/studio/`.
- Tests:
  - the kernel against CR's ported parity fixtures for the AetherRoom profile;
  - layout tests for the General profile;
  - card import tests for CR cards and V2/V3 JSON and PNG;
  - interface tests for the chat screen.
- Drive the built app in a headless browser at 390 and 1280 px wide: start a chat with a stubbed provider, stream a reply, swipe, edit, reload and find it saved. No console errors, no sideways scroll.
- Versioning: `chat/` starts at 0.1.0 with a changelog in its README. Bump the adventure only when its code changes. Update `docs/roadmap.md` step 5, the charter's progress table and `CLAUDE.md`'s layout list.

## Ask the owner early

1. Which providers and models matter most to test against first: Xialong on NovelAI, GLM-4.6, DeepSeek, OpenRouter models?
2. Bundle Errata as the default character: yes or no? Her card is in the owner's CharacterVault (`Characters/Errata/Errata - Inkwyrm.md`), not in this repository.
3. Character Card V2/V3 import is proposed here for reach. Confirm.
4. After Phase A: does the chat feel right before time, memory and play go on top?
