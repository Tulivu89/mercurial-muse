# The pilot: the dragon's resort

Nov 13, 2026 · @AmbiProp · The brief for a dedicated writing session (C1 in `docs/content/standard.md`). The prompt to paste into that session is at the end.

## What this is for

The first flagship records, written to the content standard, and the first test of whether that standard is right. Three dragon women who share a space: Qiulong and Errata, who already exist and were never written to meet, and Echydna, who is a concept. If it works, it becomes the gold set every later world is shown, the example Home the front page is waiting for, and the first evidence for or against the standard's assumptions.

It's written in a dedicated session on a strong model (Opus 5.5 suggested), in this repository, with its skills. It is never drafted by the model connected to the site.

## Read first

1. `docs/content/standard.md`, all of it. Especially *A character's fields: one job each*, the failure list, and the assumptions table.
2. `.claude/skills/inkwyrm-records/SKILL.md` and `.claude/skills/pulp-voice/` (its SKILL.md, then `references/anti-patterns.md`, `voices.md` and `heat.md` when the work reaches them).
3. `docs/bids/content/mo-03-style.md`: the owner's own failure list and method. It outranks the standard's summary.
4. `docs/records.md` on reach, and `docs/praxis/bogwater-plan.md` under *Writing rules*.

## The sources

Copied from the owner's CharacterVault on Nov 13 (commit `a0d5c54`), in `docs/bids/content/sources/`:

| File | What it is | State |
| --- | --- | --- |
| `qiulong/Qiulong - Teahouse Before Frost.md` | Her chat card: persona, appearance, greeting, five example chats, hoard brains, the portrait hall and the cabinet behind bond tiers, a weekly schedule | Gold standard. Written for NovelAI Xialong, as a Qiulong-only setting |
| `qiulong/Qiulong.md` | Her character page: signature features, appearance, notes | Source of truth for her look |
| `qiulong/Qiulong - Adult.md` | Her After Dark material | For When sections behind the closest bond tier |
| `errata/Errata - Inkwyrm.md` | Her chat card for Inkwyrm | Drafted, never played |
| `errata/Errata.md` | Her character page, including a schedule and recurring ties | Source of truth for her look |
| `errata/Errata - Inkwyrm - Adult.md` | Her After Dark material | As for Qiulong |

Also:
- `chat/src/errata.ts` is the Errata Chat ships today, built from her Inkwyrm card. If the pilot changes her, that file changes too, with `HOUSE_VERSION` raised so browsers take the new record.
- `docs/mascot-record.md` maps Errata onto the record model, section by section.
- `docs/bids/content/Initial content ideas.md` holds the owner's notes on the resort and on Echydna.

## Decided by the owner

1. **Sections.** Every character uses the Studio's default sections, with the definitions in the standard. Profile Plus is a way to think a character through, not the record's shape.
2. **Echydna**, spelled that way. The myth of Echidna, Mother of Monsters, is the inspiration: for her, and for other characters and stories to come. The owner's concept: *an almost terrifying-yet-sexy near-cosmic entity; the most aloof and alien, and the most intense if you manage to catch her interest.*
3. **First make what exists work together.** Neither card was written to share a space. The work starts with how they complement and conflict without re-treading each other.
4. **The teahouse was Qiulong's alone.** If the pilot includes a Home, it grows to fit three, and how it grows is this session's call.

## Overlaps already found

A first read of the two cards side by side. The session confirms these and finds the rest:

| Both cards say | Qiulong | Errata |
| --- | --- | --- |
| They claim out loud | Calls things and people *mine*, keeps track of where they are | Marks what she claims with ink, and leaves it |
| They hoard | Well-made things, sorted and labelled; a portrait hall of her people | Other people's errata: first drafts, crossed-out lines |
| They grade flirting | Laughs at cheap lines and grades them | Grades flirting like a draft |
| They admit being wrong flatly | Argues past it, then says *I was wrong* and changes the subject | Says so flat and fast, and writes it down |
| Anger at harm to one of theirs | Goes quiet and polite, and lasts until she's dealt with them | Goes short, polite and very specific |
| How they move | Takes her time, settles somewhere warm; moves all at once with no wind-up | Settles in high places and stays put; moves all at once |
| The greeting's person | Third person | **First person**: a format clash in the same chat space |

Some of this should stay shared, because they're both dragons, and the shared trait can become a point between them. Most should be split so each owns her version. The test is the standard's *interchangeable* catch: a line that could be written for either of them fails.

## The work, in order

### 1. Audit each card against the fields

For Qiulong and Errata, map every sentence of the card to one field (Appearance, Personality, Speech, Background, Wants, a hook, a When section, an outfit), using the standard's question test. Record each sentence that belongs somewhere else, or that is two facts, and anything the failure list catches. Change nothing yet.

### 2. The ensemble

How do three dragons share a space, and what does each do that the others don't?
- **Why they're together.** Ownership, debt, a wager, a lease. Whatever it is, it should give scenes.
- **Who owns which trait.** For each overlap above, keep it shared on purpose, split it, or cut it from one of them.
- **Ties.** Qiulong and Errata, and each of them with Echydna: one line each that both sides could use, with the friction in it.
- **Distinct patterns, wants and voices.** Their patterns (of the seven) should differ, as should their wants. Their Speech sections should sound different read aloud, and each body should close on a different feature.
- **How they complement.** Three conversations a player could have with two of them at once, where each plays off the other.

### 3. Echydna, as a frame first

Lines only, per the skill: name, line, job, want, pattern, Aside, ties, home, and her form in a room the others share. Then the hooks the myth gives her (the mother of monsters, her children, what she wants from someone who catches her interest), and what she is in a chat on a 28k model. Near-cosmic doesn't mean vague. Every line still has to be something a scene can use.

### 4. The Home: in or out

Decide with the owner whether the pilot includes a Home. If it does:
- The teahouse grows to fit three: its rooms, what each is for, who's in which when, by the times of day, and never more than four named people at once.
- **Note for the front page:** it plans an example Home with Errata's writing room and her evening schedule (`docs/front-page/README.md`). Her greeting is already set in a writing room. If that room belongs here, say so.

### Stop: the owner reviews

Hand back stages 1 to 4 as one short document, `docs/content/pilot/ensemble.md`, before writing any records. It should hold:
- the audit findings;
- the trait decisions;
- the ties;
- Echydna's frame;
- the Home proposal;
- and the questions only the owner can answer.

### 5. Write the records

Once the owner has reviewed, write one Studio world file, `content/dragons-resort/world.json`, in the format the skill gives. It holds:
- the three leads, with greetings and three to five example chats each;
- their hooks and When sections;
- the bond-tier conditions;
- their dragon group, if one is needed, so none of them restates it;
- the Home's places, if it's in;
- their schedules.

Qiulong's card is gold. Keep her voice, and change only what the audit and the ensemble call for, naming each change.

### 6. Check and test

- Run `npm run content:check -- content/dragons-resort/world.json`, then fix or answer each finding.
- Write `docs/content/pilot/play-test.md`: five or six short scenes for the owner to play in Chat on GLM-4.6 or Xialong and on one 128k model. Each scene says what to type and what a good reply does. Include:
  - one scene with each pair of the three;
  - one with all three in a room;
  - one where a bond-tier section should arrive;
  - the same lead **with and without her example chats** (assumption A4);
  - one record's best section **beside a flagged draft of it** (assumption A5).

## Handing it over

- **The paths:** `ensemble.md`, `world.json`, `play-test.md`.
- **The checker's report.**
- **Every change to Qiulong's or Errata's existing text, with its reason.**
- **Only the judgement calls,** not a summary of what the records say.
- **Anything in the standard the work showed to be wrong,** as proposed edits. The standard is version 0, and this pilot exists to correct it.

## The prompt for the session

Copy everything below the line into a new Claude Code session on this repository, set to Opus 5.5.

---

You're writing Inkwyrm's first flagship records: the dragon's resort pilot. Read `docs/content/pilot-brief.md` and do what it says, in order. Load the `inkwyrm-records` skill, and the `pulp-voice` skill when you reach greetings and example chats. The owner's calibration outranks everything: `docs/bids/content/mo-03-style.md`, then `docs/content/standard.md`.

Start with stages 1 to 4: the audit of Qiulong's and Errata's cards against the field definitions, the ensemble of the three, Echydna's frame, and the Home question. Then stop and hand back `docs/content/pilot/ensemble.md` for the owner's review. Write no records until the owner has answered.

Work on a branch and open a pull request when you hand anything back. The owner doesn't use git: give them the plain steps to review and merge. Never use the owner's real name; sign docs `@AmbiProp`.
