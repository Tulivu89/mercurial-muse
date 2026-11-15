# HOG Wild: the framework chat

Nov 15, 2026 · @AmbiProp · How to build HOG Wild's framework in one planning chat, so that Fable 5.2 can write the characters and the world from it without coming back for decisions. Read with `docs/content/process-retrospective.md` (what made the pilot land), `docs/content/dragons-resort/greetings-v2.md` (what the pilot got wrong at the door) and `docs/content/next.md` (Stream 1).

## Why a framework first

The pilot landed because every stage started with something the owner could read in a few minutes, and the owner put in the missing human complication before any prose was written. HOG Wild needs more of that than the resort did. The resort was three dragons in a teahouse, and the record model already had a place for everything. HOG Wild has ideas the records don't hold yet: a woman whose settings can be changed and who reads her own changelog; an audience that pays to decide things; a house the world watches. If Fable meets those questions halfway through writing a character, it will answer them itself, and quietly.

So the planning chat settles everything that is a decision. Fable gets a framework with no open questions and writes to it.

## What the framework holds

One file, `docs/content/hog-wild/00-framework.md`, built up over five checkpoints. Nothing in it is finished prose; everything in it is decided.

1. **The show.** The positive vibe in two sentences: what it looks like, and the fantasy it sells. Who owns the house and who pays. What the cameras see, and the one place they don't. What the audience can buy: a choice, a date, a breakup, a change to Nova. What's dark here: a self that is sold, and a self that can be edited. And one ordinary thing (a broken dishwasher, a sponsor's energy drink nobody likes) that keeps it a house people live in.
2. **The house map.** Six to ten rooms. Each one is needed by a scene or a schedule stop, and the confessional is the room without cameras, or the decision says why there isn't one. Plus one place outside the house for each lead, as the resort had.
3. **The cast and their lanes.** Nova and the influencer, and a decision on a third resident, made now. Each lead gets her lane in one line, and the line is checked against the other leads and against the resort's three, so no two share a temperament.
4. **Per lead:**
   - the chosen seed (from three pitches);
   - grounding answers to the four questions: the trash she likes, what makes her laugh outside her job, what makes her snap, and the quiet damage that keeps her from being a trope;
   - her look, as options to pick from, then the picks;
   - the brains plan: an outfits set, keyed hooks, and bond-gated sections;
   - a palette table for the example chats, with every prop and tell assigned to one chat;
   - her greeting brief: the hour, the place, what she's doing and what she hands the person. Never a dare or an up-and-down look.
5. **The mapping decisions** (below): how the things that are new here fit the record model.
6. **The frame:** every record as lines only, in one table: places, groups, lore, the scenario, the leads, and anyone else a scene needs. Each person gets job, want, pattern, Aside and ties.
7. **The schedule frame:** each lead's daily round in times of day, the live hours, and where everyone is when the stream is on.
8. **The lab suite:** three cases per lead, written before the characters are: an ordinary reply to her greeting, a stranger flirting, and the push that should set her off her own way. Each case has a *watch* line saying what a judge looks for. It ends up as `content/hog-wild/lab-suite.json`, so the first play-test is ready the day the world is.

## The decisions only HOG Wild has

The chat answers each one with two or three options, and the owner picks.

- **Who is the person in the chat?** A housemate, a new contestant, a viewer who won a visit, the tech who maintains Nova, or the producer. It sets every greeting and the bond tiers.
- **Nova's configuration and changelog in the records.** Her card keeps her configuration and changelog as brains, and the Studio has sets: a set member could be a configuration, and the schedule could move between them. Can the person change her in chat, and if so, how does the change reach her record? This is the one place a new feature might be needed; the chat says so plainly if it is, instead of inventing a workaround in prose.
- **Nova's admin directives.** Her card has hard-coded refusals (no sexual or violent content). Are they part of who she is, a lock she knows about and can talk about, or are they retired so the house's content can be adult? That's an owner's call, and it shapes her whole lane.
- **The audience on the page.** How the stream's chat and its bids show up in text, in the house format: speech plain, actions in asterisks, thoughts in parentheses, notes in brackets. The format has to be one a weak model copies cleanly. Settle it with two short sample turns.
- **What is bought, and what it changes.** The pilot brief's rule holds: no invented systems. A bid is what the influencer reacts to, not a currency the model keeps track of. Anything that would need a number moved belongs to a rule, and rules wait.
- **Ties to the rest of the site.** Whether anyone from the resort can visit. Default: no, and the decision says why.

## The checkpoints

Each one is short enough to review in a few minutes. Hand it back as a markdown file and stop.

| # | The chat hands back | The owner adds |
| --- | --- | --- |
| 1 | The show and the house map, one page | The complication: what's really for sale |
| 2 | Cast lanes, then three seed pitches per lead (a positive vibe and a temperament someone would recognise, no trait lists) | The pick, and the human detail |
| 3 | Grounding answers and look options per lead | Picks; the flaw that makes her a person |
| 4 | The mapping decisions, two or three options each | The decisions |
| 5 | The frame, the schedule frame, the palette tables, the greeting briefs and the lab suite | Approval: from here Fable runs |

Then Stream 1 in `docs/content/next.md` runs from the framework: one lead at a time through appearance, persona, brains, palette, greeting and examples, then the house, schedules and `content/hog-wild/world.json`, checked clean with `npm run content:check` and played with `npm run chat:lab -- suite content/hog-wild/lab-suite.json`.

## What the pilot taught, written into the framework

- **Positive vibe first**, then what she must not overlap.
- **The persona is the decision core:** what she wakes up for, what makes her laugh, snap or soften, what she hides. Not a list of speech quirks.
- **At most two example chats on her job or archetype, and at least four not erotic.** One at most with a stranger at the door, and the first example is never the flirt.
- **Greetings in her own day:** at an hour her schedule agrees with, doing something that would happen anyway, handing the person a task or a question. No body on display, no sizing up, no dare (`greetings-v2.md`).
- **Specific triggers.** Never *want, past, family* or a body part on a note that isn't intimate. Phrases for questions (*what do you want*). Each character's notes come in on her own words.
- **No reference simile** in records; similes stay in prose and image prompts.

## The prompt for the framework chat

> You're building the framework for HOG Wild, Inkwyrm's second Home: a cyberpunk influencer house the world watches. Read `docs/content/hog-wild/plan.md` and do what it says, one checkpoint at a time. Read `docs/content/process-retrospective.md`, `docs/content/dragons-resort/greetings-v2.md`, the HOG Wild section of `docs/bids/content/Initial content ideas.md`, Nova's card in `docs/bids/content/`, and the resort's three characters in `content/dragons-resort/world.json` as the standard to meet. Load the bot-writing skill for the character checkpoints. Write no prose a character would say until checkpoint 5 is approved; the framework is decisions, not drafts. Hand each checkpoint back as a markdown file the owner can open, then stop. Never use the owner's real name; sign docs `@AmbiProp`. Abernys is retired: don't draw on it.
