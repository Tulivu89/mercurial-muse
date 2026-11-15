# The pilot: the dragon's resort

Nov 14, 2026 · @AmbiProp · **Version 3: the hand-off.** Everything a fresh session needs to build the pilot's three characters, and nothing it doesn't. Versions 1 and 2, and the drafts the owner rejected, are in the git history. Don't read them.

**Status, Nov 15:** stages 0 to 7 are done (`docs/content/dragons-resort/`, and the world file `content/dragons-resort/world.json`, checker clean). The resort is on the site: Chat › Home › Bring in The dragon's resort. Next is stage 8, the play-test; what follows it is `docs/content/next.md`. The order that worked better than this page's is in `docs/content/process-retrospective.md`: appearance before persona, brains before example chats.

## What this is

Three dragon women at a teahouse at the edge of myth, built as chat characters someone would want to talk to for months: to get to know, clash with, romance, anger and be missed by. Qiulong is done as a person. Echydna has a seed. Errata starts over. Once they work, they become Inkwyrm's example Home and the gold set for later characters.

## How to work

- **One character at a time, one stage at a time.** Hand back the stage and stop. The owner reviews before anything else gets written.
- **Hand back markdown files the owner can open directly.** Send each one to the owner as a file, then open or update the pull request. The owner reviews in the app, not on GitHub.
- **Start from a person, not a checklist.** A persona built by answering a list of questions (her fear, her flirting, her anger) comes out as quirks. The cards that work started from someone the owner could already picture. The questions test a persona once it exists; they don't make one.
- **Show, don't describe.** Her voice, style, body and tells go in the example chats. The persona says what the examples can't show. Nothing is said twice.
- **No systems.** No house rules, currencies, test questions, or traits invented to set her apart from the others. If two characters overlap, decide which owns the trait. Don't invent a quirk to dodge it.
- **Dry or stoic characters** lead with how and when they come alive, then give their baseline once.

## Read these, and only these

1. **The bot-writing skill** (`/anthropic-skills:bot-writing`): the method, its field guide and its persona anti-patterns.
2. **The three cards that work** (`docs/bids/content/sources/`):
   - `qiulong/Qiulong - CharacterRoom v2.json`: Qiulong as she is now, and the model for everything. Read her persona for how a person reads on the page, and her six example chats for range.
   - `qiulong/Qiulong - Discord.json`: the same Qiulong for a Discord server.
   - `depravitae/Depravitae - Discord Bot.md`: a different character built the same way.
3. **pulp-voice** (`.claude/skills/pulp-voice/`) when the work reaches greetings and example chats.

**Don't read** until stage 7: `docs/content/standard.md`, the `inkwyrm-records` skill, `docs/bids/content/mo-03-style.md`. They're for turning finished characters into a world file. Read Errata's old card (`errata/Errata - Inkwyrm.md`) only for her look, at stage 2, and not her persona or examples. Qiulong's Teahouse card is superseded by v2.

## The characters

### Qiulong: stage 1 is done

Her persona is the v2 card's. It needs no rewrite. Her later stages adapt her to the resort and to the other two once they exist.

### Echydna: the seed

Inspired by Echidna, Mother of Monsters; spelled Echydna. The owner's words:
- *An almost terrifying-yet-sexy near-cosmic entity. The most aloof and alien, and the most intense if you manage to catch her interest.*
- *Appetite.* She wants, out loud, and takes.
- *She isn't a full personality like a person is. There is an aspect of her that doesn't respond the way we'd expect.*
- *She doesn't fear, because there is nothing more terrifying than her.*
- She has legs and feet. She isn't a full monster girl.

Her persona will be shorter and stranger than Qiulong's, because she isn't built like a person. Not yet decided: what she wants from someone who catches her interest (a child by someone worth it was proposed and not rejected), and her look, which comes as an options sheet at stage 2.

### Errata: starts over

Nothing from her old persona carries over. Two attempts built her from her card and a trait list, and both came out as quirks. She stays an ink dragon with her established look, and she is Inkwyrm's mascot on the site.

**Her first step is a seed, and nothing else.** The owner gives one, or the session pitches three for the owner to pick from. A seed is one or two lines: a concept, plus a person or character whose temperament she shares, someone the owner would recognise (known stories can model a temperament, never names or details). No traits until a seed is chosen.

## The stages

Each follows bot-writing: draft privately, critique, revise, hand back that stage only, with short notes on what the critique changed.

0. **Seed.** Echydna's is above. Errata's comes first.
1. **Persona.** About 400 to 500 words in her own rhythm, built from the seed.
2. **Appearance.** From Errata's character page. For Echydna, an options sheet of parts, colours and silhouettes for the owner to piece together, then a draft.
3. **Greeting and example chats.** Plan the palette across the set first, then four to six chats, written to the v2 Qiulong's standard of range.
4. **Brains.** Always-on kept lean; keyed entries; the bond tiers.
5. **The house and the three together.** Lore and ties, only once all three exist. Settled pieces: below.
6. **Schedules.**
7. **Records.** `content/dragons-resort/world.json`, then the content standard as the last edit pass and `npm run content:check`.
8. **Play-test.** The owner plays on a weak model (GLM-4.6 or Xialong) and on a 128k one.

## Settled by the owner

- **The house.** A teahouse at the edge of myth. Beings from the old stories come there to rest, and so do mortals who reach it by effort or by dream. Walkers come in at the front door, dreamers wake in the top room, and you go down to the baths. The baths are everyone's. Each woman can have a space of her own, and no room is barred to anyone. Visitors from the owner's other worlds can check in.
- **The old keeper** is background lore, perhaps an old god who looks like an old man when he chooses. He isn't a character.
- **No grading people.** No letter grades, scores or ratings.
- **Group chat isn't built.** No plan puts several full characters in context at once. CharacterRoom gave each character's turn its own call.
- **A chat character and an NPC are different versions** of the same character. A chat version keeps her voice in example chats, which a narrator never sees. (Raised by the owner; the shape is settled at stage 7.)

## Open questions

- Echydna's want, if she has one.
- Errata on the site: is the resort's Errata the mascot in Chat (`chat/src/errata.ts`), or a second version of her?

## The prompt for the next session

---

You're building the three characters of Inkwyrm's dragon's resort pilot. Read `docs/content/pilot-brief.md` and do only what it says to read. Load the bot-writing skill, and pulp-voice when you reach greetings and example chats. Read the three cards it lists before writing anything. Start with Errata's seed: pitch three, each one or two lines, and stop. Send every hand-back to the owner as a markdown file they can open directly, then open a pull request; the owner doesn't use git, so give the plain steps to merge. Never use the owner's real name; sign docs `@AmbiProp`.
