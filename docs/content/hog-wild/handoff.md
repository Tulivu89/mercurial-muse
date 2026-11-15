# HOG Wild: the handoff to Fable

Nov 15, 2026 · @AmbiProp · The brief for the Fable 5.2 sessions that write HOG Wild from its framework. The framework settles every decision, so Fable's job is to write well to it, not to decide. Where the framework is silent on something structural, Fable stops and asks. It doesn't choose quietly.

**Status, Nov 15:** wave 1 is written and checked (`wave-1-report.md`). The owner asked for it in one batch, not stop by stop, and for the short keyed notes to be folded into each profile. Wave 2 waits for the owner to play wave 1 or read a blind lab run.

## Before Fable starts

The framework is merged and every decision is settled, including the owner's notes on personas, the changelog's notation, Nova's directives and bracketed directives. Paste the prompt at the end of this file into a new session.

## What Fable reads, in order

1. `CLAUDE.md`, then `docs/content/process-retrospective.md` (why the pilot landed) and `docs/content/dragons-resort/greetings-v2.md` (what the pilot got wrong at the door).
2. The framework: `docs/content/hog-wild/00-framework.md`, `01-decisions.md`, `02-frame.md` and `looks.md`.
3. The standard to meet: the resort's three characters in `content/dragons-resort/world.json`, and `docs/content/standard.md`.
4. Nova's old card, `docs/bids/content/Character_Nova_…json`. Its configuration, changelog, schedule and tablet carry into her record. Its admin directives become the pseudo-code section behind `$directives` (decision 3).
5. The skills: **bot-writing** for every character stage, **pulp-voice** for the greetings and example chats, **inkwyrm-records** for the world file at the end.

## The rules that don't bend

- **Write to the framework.** Seeds, grounding, ties, schedules, greeting briefs, brains plans and palette tables are settled. Don't add a person, a place, a system or a backstory event that isn't in the frame. If one is needed, stop and say why.
- **Persona is the decision core:** what she wakes up for, what makes her laugh, snap or soften, and what she hides. It's not a list of speech quirks.
- **The field split:** Appearance is the body and its tells, with no clothes and no voice. Personality is *when this, she does that*. Speech is tone, cadence and register, with no sample lines. Clothes live only in the Outfits set.
- **The palette tables are a contract.** Every prop, outfit and tell appears in the one chat the table gives it, and none repeats the greeting's. At most two chats on her job, at least four not erotic, and the first is never the flirt.
- **The greetings follow their briefs exactly:** the hour, the place, what she's doing, what she hands the person, and the physical beat. No body on display, no sizing up, no dare. A door opens, and the rest is hers.
- **Triggers are her own words.** Never *want, past, family, background*, or a body part on a note that isn't intimate. Questions come in as phrases (*what do you want*, *where are you from*).
- **Brackets are the person's.** `[Chat: …]`, `[Bid: …]` and `[SYS: …]` are directives the person drops in. Residents react to them in their own way and never write brackets themselves. There are no amounts and nothing keeps count (`01-decisions.md`, decision 4).
- **Nothing assumes who the person is.** Their persona decides it: housemate, contestant, visitor, Nova's tech or the producer. Greetings and examples use `{{user}}` with no fixed job (decision 1).
- **Nova's changes use one notation,** *Day N · Field: old → new · who*, in her changelog and anywhere she reads a change out (decision 2).
- **No reference similes in records.** Similes stay in prose and image prompts (the retrospective's Stage 7 finding).
- **Budgets:** a named section at most 300 tokens, a whole example chat at most 2,400.
- **The house format:** speech plain, actions in asterisks, thoughts in parentheses, notes in brackets, single newlines in anything the model reads.
- **Never use the owner's real name;** sign docs `@AmbiProp`. Don't draw on Abernys.

## Wave 1: Nova, then Lux, then Primus

One character at a time, with two stops each, so the owner reviews each before the next starts.

**Stop A: the core.** Appearance, Personality and Speech, then the brains: the Outfits set (and Nova's Configuration set), the keyed sections and the bond-gated sections from the brains plan in `02-frame.md`. The owner reads it in a few minutes, as fields and short sections. Write it to `docs/content/hog-wild/<name>-1-core.md`.

**Stop B: the door and the chats.** The greeting from its brief, then the six example chats from the palette table, and a short note on what changed in critique. Write it to `docs/content/hog-wild/<name>-2-chats.md`.

**After all three:** the house's records from the frame (groups, lore, the scenario, places, and the five light personas), the schedules from the schedule frame (times of day, sets, rooms), and `content/hog-wild/world.json` as `studio-world/1`.
- `npm run content:check -- content/hog-wild/world.json` comes back clean: 0 missing, 0 over budget, 0 checks, 0 catches.
- Then run the lab suite, which is already written:

```bash
npm run chat:lab -- suite content/hog-wild/lab-suite.json
```

  Hand back the scores with the world.
- Add a test like `studio/tests/resort.test.ts` that holds the world to the standard.

## Wave 2: Patch, Maeve and Pipa

This starts after the owner has played wave 1 or read its lab run.

1. **One checkpoint first:** a brains plan and a palette table for each, by wave 1's pattern, plus three lab cases each. The owner approves it before any prose.
2. Then the same two stops per character, in this order: Patch, Maeve, Pipa.
3. Then the thread (*Who picks the targets*) and their outside places go into the world file, and it's checked clean again.

## What Fable doesn't do

- **Change the site's code.** Three Chat features are noted in `01-decisions.md` (a pinned set member told to the model, notes that don't key when their character is absent, memories mid-chat). They're separate code tasks. The world is written to work without them.
- **Wire HOG Wild into Chat's Home or the Studio's buttons.** That's a code task after wave 1 lands.
- **Roll images.** The looks are the owner's (`looks.md`). Nova, Lux and Primus are locked; Fable writes Appearance from those tags, in flat literal words.

## The prompt

> Read `docs/content/hog-wild/handoff.md` and do what it says, starting with wave 1, Nova, stop A. Read everything it lists first, and load the bot-writing skill, and pulp-voice when you reach the example chats. The framework in `docs/content/hog-wild/` settles every decision: write to it, and if it's silent on something structural, stop and ask instead of choosing. Hand back each stop as a markdown file the owner can open, with a pull request, then stop. Never use the owner's real name; sign docs `@AmbiProp`. Abernys is retired: don't draw on it.
