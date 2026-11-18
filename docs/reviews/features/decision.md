# Feature sweep: decision

Nov 18, 2026 · @AmbiProp · Answered by the owner Nov 18; F1 built (Chat 0.9.0)

From the brief and the inventory of five apps (`apps.md`). The test is the owner's: a feature earns its place if it makes a part good or joins the parts up (`docs/value.md`).

## The plan in a few lines

Inkwyrm has the hard, joined-up parts: memory, schedules, Home, posts, rules, maps, the Studio. It lacks some small things every other app has, and players will notice them in the first hour. So:
1. **Small things first:** branch a chat from a message, write my turn, read a reply aloud, install the site to a phone's home screen.
2. **Group chat** next. It's already designed, and every app has it.
3. **Characters who message first,** from their schedules. That joins Chat, Home and the clock.
4. **Images**, which every app has and step 7 already plans. Moved up because posts and portraits already want them.

Skip the scripting languages, plugins, documents/RAG, translation and mini-games.

## The calls

| Feature | Call | Why |
| --- | --- | --- |
| **Branches** | **Adopt.** *Branch from here* on any message makes a new chat up to that message, with the shown alternative, the journal, memory and chapters as they stood. The two chats are linked in Conversations | All five apps have it, and players expect to try a scene another way. Cheap: a copy of a chat |
| **Write my turn** (impersonate) | **Adopt.** A button by the message box: the model drafts your next message into the box, to edit before sending. One request, your persona's voice | All five have it. Useful on a phone |
| **Read aloud** | **Adopt, small first:** the browser's own voice (free, on every phone), a voice per character from what the device has. Provider voices (ElevenLabs, OpenAI, NovelAI) after accounts or partner models | All five have it, and it makes the phone experience. The browser voice costs nothing |
| **Install on a phone** | **Adopt:** a web app manifest and icons, so "Add to home screen" opens Inkwyrm full-screen. No app store | Marinara ships an Android APK and an iOS PWA. Ours is a few files |
| **Group chat** | **Adopt, as designed** in `docs/model-jobs.md` (G1 onward): the cast, who speaks next (named, else quiet longest, else a Side pick), private memories only in the speaker's part | All five have it, and Home's households are made for it |
| **Characters message first** | **Adopt:** when you open a chat or Home after time away, a character whose schedule has them free may have written to you, from the schedule and how long it's been. Off per character; at most one waiting | Marinara's schedules do this. Ours are richer (stops, places, outfits), and the Discord bot already keys openers to the schedule |
| **Image generation** | **Adopt, moved up as the next big piece after group chat:** the player's own provider (NovelAI first, then OpenAI-compatible), for post photos, portraits per emotion and Home's rooms, from the fields CE's image prompts already define | Every app has it; posts already write the line a photo would be made from |
| Reply suggestions | **Later, in the adventure:** choices fit an adventure's turn better than a chat's | Agnai's and Marinara's are game modes |
| Steering a reply | **Have it:** notes in brackets, and "After every turn" | Covers "start the reply with" and Author's Note |
| Trackers / HUD | **Have the parts:** states, needs, bond. A visible tracker comes with the adventure on the new records (step 6) | Our rules keep the numbers; the model never moves them |
| Regex, slash commands, triggers, Lua, plugins | **Skip** | Power-user tooling for self-hosters. Our rules engine and records are the structured way. A scripting surface on a hosted site is a security job of its own |
| Documents / RAG, web search in chat | **Skip** (the Studio helper's search stays planned) | Lore with keys covers worlds; chapters cover chats |
| Translation | **Skip for now** | Not asked for; a model can be told to write in another language through "After every turn" |
| Shared live rooms | **After accounts** (step 8) | Needs a server that holds chats, which we don't |
| Card-site browser in the app | **Skip, as the standards review decided** | Their terms, our server fetching. Download and import works |
| Mini-games, ambient sound, video, logprobs, CFG | **Skip** | Not part of the combination |
| Companion mode (no edits) | **Note it** for Home: an option for players who want a character with consequences | Agnai's idea; small if wanted |

## The competitor to watch

Marinara Engine has nearly our combination: schedules with first messages, a social feed, a game mode with rulesets, trackers, Discord and phone builds. What it doesn't have:
- **Hosting:** it's self-run; Inkwyrm is a site.
- **A record model** that one character carries through Chat, Home, the Studio and the adventure.
- **A content standard and flagship worlds.**
- **Memory that carries between chats.**

`docs/value.md` should name it: the combination isn't unique, so it has to be better made and easier to reach.

## Phases

| Phase | What | Size |
| --- | --- | --- |
| **F1, the small things** | Branch from here; Write my turn; Read aloud with the browser's voices; install to home screen | One PR |
| **F2, group chat** | G1 to G3 in `docs/model-jobs.md` | Several PRs |
| **F3, first messages** | Characters who write first after time away, from their schedules | One PR |
| **F4, images** | Roadmap step 7, moved up: the player's own image provider for posts, portraits and rooms | Several PRs |

The memory review's last phase (C4) can go before or after F1.

## The owner's answers (Nov 18)

1. **The order doesn't matter;** batch whatever goes together efficiently. F1 and the memory review's C4 go first, in one pull request.
2. **Read aloud starts with the free built-in voices.**
3. **Yes to a closer look at Marinara's game mode,** because the adventure has a lot still to do. **Our AI-friendly dice system is the priority:** it bridges the model's creative side and the rules' deterministic side. Other rule systems should be addable too, though they won't slot in the way ours does. Their group chats are compared with our plan at the same time (`docs/reviews/adventure/` and `docs/reviews/group-chat/`).
