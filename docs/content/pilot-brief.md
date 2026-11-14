# The pilot: the dragon's resort

Nov 14, 2026 · @AmbiProp · **Version 2.** The brief for the dedicated writing sessions on the pilot (C1 in `docs/content/standard.md`). It replaces the Nov 13 brief, whose first hand-back the owner rejected; that brief and its two documents are in the history (commits `56971df` and `febe3c9`).

## What this is for

Three dragon women who share a space, written as chat characters someone would want to talk to for months: Qiulong and Errata, who exist, and Echydna, who is a concept. If it works, it's the gold set later characters are shown, the example Home the front page is waiting for, and the evidence that rewrites the standard for chat characters.

It's written in dedicated sessions on a strong model, in this repository. It is never drafted by the model connected to the site.

## Why the first attempt failed

Kept here so the next session doesn't repeat it.
- **It repaired the cards instead of starting from people.** The owner said they weren't good; the session audited them sentence by sentence and kept the frame.
- **It built a system.** Floors, rent, three currencies, a room each was barred from, a test question each. Every trait became a rule, and a rule repeats every turn: pattern, then spam.
- **It wrote from an editor's kit.** The standard, the failure list and an overlap table were loaded before any character existed, so differences were invented to break overlaps (ink that runs in hot water, a name written on a hand) instead of coming from who each woman is.
- **It wrote the ensemble before the people,** so one character's want became another character.
- **It settled what wasn't its to settle:** Echydna's body, and how Home fits several characters in context.

## Decided by the owner

1. **People first.** A character stands on her own and talks to anyone. Her personality is who she is at her core and what guides her decisions and reactions. Who she is to the player is a paragraph in the persona, or the scenario, layered on top.
2. **Example chats steer most,** especially on weak models. Anything better shown than described (her voice, her style, her body, her tells) goes in an example and nowhere else. Nothing is said twice between the persona and the examples.
3. **Chat characters are bigger than NPCs, and the two aren't swapped freely.** A chat character's voice lives in example chats a narrator never sees. The pilot works on the basis that a character can have a chat version and an adventure version, as CharacterVault keeps profiles (to confirm; see the open questions).
4. **Range over motif.** A character you can get to know, clash with, anger, sadden and be missed by. Her theme (autumn, ink, monsters) is one paragraph and a few details, never every reply.
5. **Stoic, dry or analytical types** lead with how and when they come alive, then give the baseline once. Otherwise they go poetic, robotic or philosophical.
6. **Echydna**, spelled that way, inspired by Echidna, Mother of Monsters: *an almost terrifying-yet-sexy near-cosmic entity; the most aloof and alien, and the most intense if you manage to catch her interest.* She has legs and feet. Her look gets its own pass, offered as options (parts, colours, silhouettes) for the owner to piece together.
7. **The house.** A teahouse at the edge of myth, where beings from the old stories and the mortals who reach it by effort or by dream come to rest. Walkers arrive at the front door, dreamers wake in the top room, and you go down to the baths. The baths are everyone's. No room is barred to anyone, though each woman can have a space of her own. Visitors from the owner's other worlds can check in.
8. **The old keeper is background lore,** perhaps an old god who looks like an old man when he chooses. He isn't a character.
9. **No grading people** (letter grades, scores, ratings), no house economies, no quirks built to be memorable.
10. **Group chat isn't built,** and Home with several leads isn't the pilot's problem. No plan puts four full characters in context at once. CharacterRoom gave each character's turn its own call with its own card and examples.

## Read first

1. The account's **bot-writing** skill (`/anthropic-skills:bot-writing`): its workflow, the field guide and the persona anti-patterns. It's the method for every chat stage.
2. The **pulp-voice** skill (`.claude/skills/pulp-voice/`) when the work reaches greetings and example chats.
3. The owner's two Discord cards (below): what a broad chat character looks like.

**Not before the records stage:** `docs/content/standard.md`, the `inkwyrm-records` skill, `docs/bids/content/mo-03-style.md`'s failure list. They are the edit pass and the file format, used once a character exists.

## The sources

In `docs/bids/content/sources/`, copied from the owner's CharacterVault on Nov 13 (commit `a0d5c54`) or given by the owner:

| File | What it is | Use |
| --- | --- | --- |
| `qiulong/Qiulong - Discord.json` | Her Discord card. Nearly the Teahouse persona, with one paragraph for who she is to the owner, and five new example chats that carry her range: a flirt, a prank, a real opinion, anger, comfort | **The model of a chat persona.** Also kept for the Discord side later |
| `depravitae/Depravitae - Discord Bot.md` | The owner's other Discord card | The same method on a different character |
| `qiulong/Qiulong - Teahouse Before Frost.md` | Her Teahouse card | Her persona, brains and schedule; its examples are narrower than the Discord set |
| `qiulong/Qiulong.md` | Her character page | Her look |
| `errata/Errata - Inkwyrm.md` | Her Inkwyrm card, never played | What to keep and what to rebuild |
| `errata/Errata.md` | Her character page | Her look |
| `qiulong/Qiulong - Adult.md`, `errata/Errata - Inkwyrm - Adult.md` | After Dark material | For the romantic tier |
| `docs/bids/content/Initial content ideas.md` | The owner's notes on the resort and Echydna | |

`chat/src/errata.ts` is the Errata Chat ships today. If the pilot changes her, that file changes too, with `HOUSE_VERSION` raised.

## The work, in order

Each stage follows bot-writing: draft privately, critique against its anti-patterns and pulp-voice, revise, then hand back only that stage with short notes on what the critique changed. Each stage is reviewed before the next starts. Work one character at a time where it helps.

1. **Personality.** Each character alone, tested in a different world, a Discord-style chat, and a plain getting-to-know-you. Echydna starts as thin pitches for the owner to choose or mix; Errata is rebuilt for range; Qiulong's stands, with fixes. → `docs/content/pilot/personas.md`
2. **Appearance.** Qiulong's and Errata's from their pages. Echydna as an options sheet first, then a draft.
3. **Greetings and example chats.** The palette for each character planned as a set before any chat is written (bot-writing's *Example sets*), then four or five chats each. What the examples show comes out of the persona.
4. **Brains and hooks.** Always-on kept lean; keyed entries for what she goes long about; the bond tiers.
5. **The house and the ensemble.** Why each of them is there, in a paragraph or two of lore. The rooms a scene uses. Ties between the three, a line or two each, written after the people exist.
6. **Schedules.** A normal day's cadence, each slot handing her something current.
7. **Records.** One Studio world file, `content/dragons-resort/world.json`: each character's chat version in the card's shape. Then the standard and the failure list as an edit pass, and `npm run content:check`.
8. **Play-test.** Short scenes for the owner to play on GLM-4.6 or Xialong and on one 128k model, including the same character with and without her example chats (assumption A4).

After the pilot: the standard gets a section for chat characters, written from what the pilot showed.

## Open questions

- **Chat and adventure versions:** confirm the split, and whether a chat character's sections follow the card (persona, appearance, brains) instead of the standard's Personality / Appearance / Speech.
- **Errata on the site:** is the resort's Errata the site's mascot, or a second version of her?
- **The newest Qiulong Discord card.** The bot-writing skill says a later one (chat style, very long replies, a server job, a stranger example first) lives in the owner's bot project. The copy here matches the skill's older one.

## The prompt for the next session

---

You're continuing the dragon's resort pilot for Inkwyrm. Read `docs/content/pilot-brief.md` (version 2), then load the bot-writing skill, and pulp-voice when you reach greetings and examples. Read the owner's two Discord cards before writing anything. Pick up at the first stage the owner hasn't approved, hand back only that stage, and stop. Don't load the content standard or the inkwyrm-records skill until the records stage. Work on a branch and open a pull request when you hand anything back; the owner doesn't use git, so give the plain steps. Never use the owner's real name; sign docs `@AmbiProp`.
