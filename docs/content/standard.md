# The content standard

Nov 13, 2026 · @AmbiProp · **Version 0.** What a flagship record is, what it costs, and how a few handmade records grow into a region. Every number here is either measured (and says from what) or provisional (and says how it gets tested). The list of assumptions at the end is the part to keep honest: nothing gets built on one until it has been tested.

Read with `docs/records.md` (the record model and reach), `.claude/skills/pulp-voice/` (prose), and `.claude/skills/inkwyrm-records/` (the working version of this page for a writing session). The checker is `npm run content:check -- <file>`.

## Why records decide the quality

The narrator and the chat partner copy the records' voice. Whatever a record says lands in the prompt again and again for the whole story, so a slop phrase in a record becomes a slop habit in play, and a concrete behaviour becomes a scene. Weak models lean on the prompt harder than strong ones, so plain, behaviour-first records help them most. That's the whole case for spending effort here instead of on longer prompts.

## What lands in context: measured

Measured on Nov 13 with the Studio's own context code (`core/records/context.ts`), Chat's (`core/chat/`), the two Abernys modules, and the owner's Qiulong and Errata cards in CharacterVault. Tokens are rough (four characters each).

| What | Cost | Measured from |
| --- | ---: | --- |
| An adventure moment at its heaviest: a place, its parent, the four heaviest people, nothing named | about 900 | Bogwater (87 records); Port Covenant is about 720 |
| The same with four more people and three places named, every condition holding | about 1,050 | Bogwater; Port Covenant about 1,015 |
| A Bogwater person, Here | 85 typical, 134 at most | 16 people |
| A Bogwater place, Here | 35 typical, 79 at most | 38 places |
| A group, Named | 30 typical, 64 at most | 18 groups |
| Every line in Bogwater together (a who's-who of everything) | about 550 | 87 records |
| A chat lead's card, present every turn: persona, appearance, greeting, example chats | about 3,400 | Qiulong's Teahouse card; Errata's is about 2,300 |
| The same lead's keyed brains, each arriving on its own keys | 100 to 160 each | Qiulong's six |
| Chat's own reserve before history | 2,200 | `core/chat/aetherroom.ts` |

**What that means.**
- **The moment isn't where the window goes.** On a 28,000-token model, an adventure moment from Bogwater is about 4% of it. The transcript is what records compete with, and they barely do. Records can afford to be richer than Bogwater's where richness steers play. They can't afford to be vague at any length.
- **A chat lead is the expensive record.** About 12% of a 28k window, every turn, and the example chats are more than half of it. That's fine for one partner, and it's why a chat with several leads present needs a plan of its own (open, below).
- **At region scale, lines and keys are the economy.** A town of forty people costs forty lines at most, and only when they're named or nearby (`docs/records.md`). That only works if every record *has* a line. **71 of Bogwater's 87 records have none,** because the adventure's module format has nowhere to keep a line for a place, group or lore. Flagship content should be written as Studio worlds (`studio-world/1`), where every record has one.

## How a model uses each part

| Part | When it's there | What the model does with it | So write it as |
| --- | --- | --- | --- |
| **Line** | Named, nearby, in lists, or when the budget is tight | Treats it as the whole identity | One sentence a stranger could use: job, place, the one thing that would make you look twice |
| **Here** | Every turn the record is in the scene | Generates behaviour from it, every turn | What they do and how they talk, in acts a scene can use. No history, no creed |
| **Named** | When a key comes up, until the scene moves on | Reaches for it to answer, then folds it in | Hooks: history, things they go long about, people they know. Each section stands alone, because it arrives alone |
| **When** | While a shared condition holds (a time, a bond tier, a world state) | Treats it as current fact | Only what changes under that condition |
| **Greetings and example chats** | Chat only, every turn | Copies their rhythm, format and register more than anything else | The character at their best, doing what the sections say |
| **Never** | Not sent as written | Nothing; rules turn states into sentences | Author's notes, mechanics, image prompts |

Two habits follow from this table:
- **Write each Here sentence so the model could act on it at a noodle stall,** with no plot in the scene (the owner's Core test from Mythic Overdrive).
- **Never repeat Here in Named, or a group in its members.** A model sent the same fact twice treats it as twice as important.

## A character's fields: one job each

A character is written in the Studio's default sections (the owner, Nov 13). Each one answers a different question the model asks while it plays the character, so a fact lives in exactly one of them. Profile Plus (Presence, Core, Resistance, Conduct) stays what it was in Character Engine: a way of thinking a character through before writing, not the record's shape.

| Field | Reach | The question it answers for the model | Holds | Never holds |
| --- | --- | --- | --- | --- |
| **Line** | Named, lists | Who is this, if I only get one sentence? | Job, place, and the one thing that makes a stranger look twice | Anything only a friend would know |
| **Appearance** | Here | What would someone see right now, and what does the body do? | Build, face, colouring, their kind in one or two traits; how the body moves and rests; involuntary tells (a tail that snaps before the face shows anything) | Clothes (a set), voice (Speech), chosen gestures that answer someone (Personality) |
| **Personality** | Here | How does this character respond? | What they do when someone asks, refuses, flirts, lies, helps, hurts one of theirs; what they go after in an exchange; what they won't do. Each line is a response the model can play on its next turn: *when this, they do that.* | How the body moves (Appearance), how the words come out (Speech), why they're like this (Background), the goal they're working on (Wants), creeds and adjectives with no act under them |
| **Speech** | Here | How do the words come out? | The voice's sound; sentence length and rhythm; register; words they use and won't; verbal habits; how all of that changes with mood or with whom | What they say about anything in particular (that's Personality or a hook); sample lines (example chats carry those) |
| **Background** | Named | What comes up when someone asks about their past? | Where they're from, what happened to them, family, past work: only what a scene could bring up | The parts of the past that explain a response; write the response in Personality and leave the explanation out |
| **Wants** | Named | What are they working on, and what's in the way? | The current goal and its obstacle; what would change things between them and the player | Their general character |
| **Hooks** | Named, each with its own keys | What do they go long about when it comes up? | A hoard, a place they keep, a craft: each stands alone, because it arrives alone | Anything Here already says |
| **When sections** | When | What changes under this condition? | Only what changes: what she admits at a bond tier, how she is at night or drunk | A second copy of Here |

**The test for where a fact goes:** ask which question the model would be answering when it needs the fact. "She bounces on her feet" answers *what does the body do?*: Appearance. "She asks personal questions early and tells you what she thinks of the answers" answers *how does she respond?*: Personality. "Short sentences, a lot of questions, interrupts once she has the answer" answers *how do the words come out?*: Speech. "Her grandmother was a jeweller" answers *what comes up when someone asks?*: Background. If a fact seems to fit two fields, it's usually two facts; write each where it works.

**Why the split matters for weak models:** a model reads Personality when it decides what the character does next, and Speech when it words it. A Personality padded with posture and history gives it less to decide with; a Speech section full of opinions makes every line sound like a speech.

## Tiers and shapes

Budgets are **provisional**: roughly twice the measured typical size, so the checker's "over" means "unusually heavy, look", not "wrong". The pilot replaces them with numbers from play.

| Tier | What | Sections and reach | Provisional budget |
| --- | --- | --- | --- |
| **Lead** | A featured chat partner or a character a thread turns on | The fields above, all of them: Appearance, Personality, Speech (Here); Background, Wants and hooks such as a hoard or a portrait hall (Named, each with its own keys); what she admits at a bond tier (When). Greetings and three to five example chats. A schedule. | Here 1,400 · each Named 300 · chat parts 2,400 |
| **Person** | Anyone else in a world | The same fields, shorter: Appearance, Personality, Speech (Here, a few lines each); Background or Wants (Named) only if a scene could bring them up. A schedule only if a thread turns on them; otherwise met where they live or work. | Here 200 · Named 250 |
| **Place** | Anywhere you can be | Entry (what it is and who's there), Atmosphere (what you hear and smell now): Here. History: Named, if a scene needs it. | Here 120 |
| **Group** | Species, family, faction, crew, profession | Entry: Named. Holds what members share, so a member shows it in one or two traits and a colouring. | Named 150 |
| **Item** | A thing a scene or rule uses | Entry: Here. | Here 80 |
| **Lore** | A custom, a rumour, a rule of the world | Entry: Named, with keys. | Named 200 |
| **Thread** | What's pushing the story | Next beat: Always. The five questions: Never. Milestones. | Always 40 |
| **Scenario** | Where play starts | Situation: Always. | Always 300 |
| **World** | The container | Premise: Always. Genre and tone. | Premise 150 |

A record that doesn't need a section leaves it out. An empty section costs nothing; a padded one costs every turn.

**Building a person, from the owner's method** (`docs/bids/content/mo-03-style.md`):
- A concept has a **job** (what they do all day, where, with whom), a **want**, and a **pattern** (how the want runs into trouble: contradiction, wantneed, defense, ruleset, appetite, mask, collateral). Settle these, plus one **Aside** the want doesn't touch, before writing a field.
- Spread patterns across a cast: no more than two people on one pattern.
- Read a cast's wants side by side and re-aim any two that converge.
- Bodies are lines, weight and movement, never a parts inventory. Each body closes on a different feature. No clothing in the body: outfits are a set, and an outfit has no pose in it.
- A name a model already knows pulls that meaning in. Choose names that point where you mean, and that a reader can say on first sight.

## The failure list for records

The owner's list from Mythic Overdrive (`docs/bids/content/mo-03-style.md`), which outranks this summary. Records are stricter than prose: **a reference entry uses no comparisons at all.** The checker flags the ones a pattern can find; a person or a reviewing model reads for the rest.

| # | Catch | Checker |
| --- | --- | --- |
| 1 | Abstract stand-in (a wound, a hunger, a weight) | read |
| 2 | Comparison as description | flags *like a, as if, as though* |
| 3 | Verdict closer | read |
| 4 | Significance by announcement | flags *noticed, never mentioned, never once* |
| 5 | Contrast framing | flags *not X but Y, rather than* |
| 6 | Reader address or instruction | read |
| 7 | Narrated story function | read |
| 8 | Trait word without an act | read |
| 9 | Hedging | flags *perhaps, maybe, seems to* |
| 10 | Invented counts | read |
| 11 | Interchangeable with three others in the cast | read, side by side |
| 12 | Prompt echo | read |
| 13 | Litotes | flags *not un-* |
| 14 | "The kind of X who" | flags |
| 15 | Aphorism | read |
| 16 | Totalizers as intensifiers | read |
| 17 | Stock micro-expressions | flags |
| 18 | Analyst vocabulary | flags *precise, deliberate, careful, texture, earned* |
| 19 | Colon reveal | read |
| — | Stock composure; stock senses and names | flags *unhurried, serene, goes still; woodsmoke, ozone, Kael* |
| — | Concept level: hidden softness, hyper-perception, default tragic origin, theme as personality | read |

On Bogwater, which the owner approved, the checker raises two catches in 87 records, both fair. It's quiet enough to run on every draft.

## Growing a world: seed, frame, fill

Too much to handcraft, so the work is shaped so that review happens where it's cheapest: on lines, before anyone writes entries.

1. **Seed** (handmade: the owner with Opus 5.5). A premise, the two to four groups everything else leans on, one place with its rooms, three or four people at full quality, one thread. This is the gold set: the examples every later step is shown.
2. **Frame** (a strong model, from the seed). A manifest of slots, **lines only**: each place (name, kind, parent, line, the scene or rule that needs it), each person (name, line, job, want, pattern, Aside, home and work, ties to two or three others), each group, each thread. One line each, so a whole village reads in five minutes. **This is the main review gate.** Cutting or redirecting a line costs nothing; cutting a written entry wastes it.
3. **Fill** (Fable 5.2 at scale). Entries written from the approved frame, shown the gold set, each checked by `content:check`. Review is a sample, not every record: the leads, plus any record the checker flags.
4. **Grow.** Seed and fill make a village (about ten places, twelve to twenty people). A frame of villages, roads and region-wide groups makes a region; each new village is framed, reviewed as lines, then filled.

The web between people lives in the frame: each person's ties name two or three others, and each tie is one line both of them can use. Schedules use the times of day (morning from 6, afternoon from 12, evening from 18, night from 22), with one daily round for most people and exceptions only for the people threads turn on. No place has more than four named people at once; the checker runs the adventure's Checks for that.

## Who does what

| Step | Who | Reviewed by |
| --- | --- | --- |
| The standard and the skill | Claude, with the owner's method | The owner |
| Seed (gold) | The owner and Opus 5.5 | The owner, then play |
| Frame | Opus 5.5 or Fable 5.2 | The owner, at the line level |
| Fill | Fable 5.2 | The checker on every file; Opus or the owner on a sample |
| Play test | The owner, on GLM-4.6 or Xialong and one 128k model | Fixes go back into the gold set and the skill |

Content is never written by whatever model is connected to the site (the owner, Nov 13). The site's helper is for authors.

## Assumptions, and how each gets tested

| # | Assumption | Status | Test |
| --- | --- | --- | --- |
| A1 | The moment isn't the squeeze; the transcript is. | **Measured** on Bogwater and Port Covenant | Re-measure on the pilot and the first village |
| A2 | Budgets at about twice the measured typical size are right. | Provisional | Play the pilot on a 28k model; set budgets from what plays well, not from what was written |
| A3 | Every record needs a line, at 25 words or fewer. | From `docs/records.md`; unmeasured in play | A region scene where most of the cast is lines only |
| A4 | Example chats steer a chat partner more than her sections do. | Claimed in `docs/records.md` | Pilot: the same lead with and without her examples, on the weak model |
| A5 | Behaviour-first, comparison-free records help weak models more than longer ones. | The premise of this page | Pilot: the same scene on GLM-4.6 with a gold record and with a slop-flagged one |
| A6 | Every character uses the Studio's default sections, with the field definitions above; Profile Plus is a thinking template, not a shape. | **Decided** by the owner, Nov 13 | The pilot checks the definitions hold: no fact fits two fields, and the split plays better on a weak model |
| A7 | Reviewing frames as lines catches most problems before they cost anything. | Provisional | The first village: count what review caught at the frame versus after the fill |
| A8 | Fable 5.2 fills from a frame and the gold set at acceptable quality, with sample review. | Provisional | Fill one village, review all of it once, then decide the sample rate |
| A9 | The checker's catches are low-noise. | **Measured:** 2 in 87 approved records | Watch the rate on the pilot and the first fill |
| A10 | Flagship content is authored as Studio worlds, not adventure modules. | Follows from the measured line gap | Confirm the adventure plays a Studio world with its lines intact (the converter) |

**Still open:**
- **Several leads at once in a chat.** A Home with three leads present costs about 10,000 tokens of cards. Home's context plan decides whether that's affordable on 28k, or whether present-but-not-speaking leads drop to their Here.
- **Explicit content in flagship worlds.** A reach question as much as a writing one: what goes behind a bond tier (When), and what a first visit sees.

## The pilot (C1)

The dragon's resort: Qiulong (her Teahouse card is already gold-standard), Errata (her Inkwyrm card is drafted and untested), Echydna (concept only; the name is Echydna, and the myth of Echidna, Mother of Monsters, is the owner's chosen inspiration for her and for other characters and stories), the teahouse and its rooms, and their schedules. It's small, it's chat-first, it's the Home the front page is missing, and it tests A2, A4, A5 and A6 directly. It's written as one Studio world file, checked with `content:check`, and played on GLM-4.6 or Xialong before anything is scaled. The brief for its dedicated session is `docs/content/pilot-brief.md`.
