# What gets written next

Nov 15, 2026 · @AmbiProp · The plan after the pilot: the play-test, then three days of Fable 5.2 spent on the content everything later is compared to and the seeds it grows from. Read with `docs/content/standard.md` (seed, frame, fill) and `docs/content/process-retrospective.md` (what made the pilot land in one pass).

## Next priority (Nov 18): the adventure module

The owner's call: **worldbuilding for an adventure module comes next**, so adventure development can go on. Bogwater is retired, and the adventure now has features with nothing to test them on. These are the evaluator (free text proposes a check, adventure 0.28.0) and, coming, opponents' moves, progress clocks and story events (`docs/reviews/adventure/decision.md`, A2 and A3). The module is their test bed.

- **Which setting:** the owner picks. Volungraiv (Stream 2 below, starting from Qetzal) is the one the module process was written around. Mythic Overdrive (Stream 3) is the other candidate.
- **Volungraiv's plan (Nov 18):** `docs/content/volungraiv/plan.md`. Every region, town, faction, family and lead starts from a named source (`docs/content/sources/README.md`); Qetzal's sheet is drafted (`docs/content/volungraiv/sources/qetzal.md`). The owner's answers to the plan's questions come first. **Nov 19:** answered; the world is on one page (`docs/content/volungraiv/atlas.md`), Qetzal's sheet is finished against the town kit, and the slice's checkpoint 2 is answered (`docs/content/volungraiv/slice/2-premise.md`). Checkpoint 3, the frame of Lowgate, is answered (`docs/content/volungraiv/slice/3-frame.md`), and checkpoint 4, the gold pair, is with the owner (`docs/content/volungraiv/slice/4-gold.md`, with the plan for the fill and play). The gold pair is the start of `content/volungraiv/world.json`. **Nov 19, first run:** the owner played the filled slice. What it found and the order of work are in `docs/content/volungraiv/run-1.md`: lines lost on the way into the adventure, an opening that names before it explains, and leads written as jobs. A character and world review comes before any more fill.
- **How:** `docs/content/modules/process.md`. A slice built by hand over six checkpoints until it plays, a pattern page written from it, then frames and fills. The standard (`docs/content/standard.md`) is the last pass.
- **What the first slice has to give the rules,** so each feature has something to bite on:
  - **Things worth a check:** people, things and places with states and difficulties set on purpose, not left at Average.
  - **At least one opponent with a tier and approaches,** for A2's opponent moves.
  - **One thread with milestones on a clock,** for progress clocks.
  - **Two or three moments a narrator could trip by name:** an arrival, a meeting, a deadline. These are A3's events. They can be written as plain notes now; the engine catches up.
  - **Routes and a map that need travel time,** so the clock and levels matter.
- **HOG Wild** is written and on the site; it waits on play and a lab run, not on a writing session. The adventure module can start in parallel.
- **The session prompt** is Stream 2's below, with two changes: name the chosen setting, and add "This is the adventure's next module and test bed; read `docs/reviews/adventure/decision.md` for what its first slice must give the rules."

## Where things stand

- **The dragon's resort is in.** `content/dragons-resort/world.json`: Qiulong, Errata and Echydna at Autumn's Leaves, 20 records, checker clean (0 missing, 0 over budget, 0 checks, 0 catches), every schedule stop real, round trip to an adventure module green. A test holds it there (`studio/tests/resort.test.ts`). The working papers for stages 0 to 7 are in `docs/content/dragons-resort/`.
- **It can be played.** Chat › Home › **Bring in The dragon's resort** puts the three in Home and in the collection. The Studio's home has the same button; the Overview lists it and points Home at it.
- **What's left of the pilot:** stage 8, the play-test. The resort's Errata is the site's Errata now (Nov 15): Chat puts the resort in a first visitor's browser, and the old mascot is gone.
- **Abernys is retired (Nov 15).** Bogwater, Port Covenant and the rest of the setting aren't developed or suggested for work. Bogwater stays as the adventure's test module until a replacement comes; the docs stay in `docs/abernys/` and `docs/praxis/`, marked not in use.

## The rules every session below follows

From the retrospective, because they're why the pilot landed:

1. **Checkpoint first, prose second.** Every stream starts with something the owner reads in a few minutes: three seed lines, a table of lines, a one-page plan. The owner adds the missing human complication there. Then the full writing goes in one pass.
2. **Positive vibe first.** Say what a character or place *is* (its look, its role, the fantasy it serves) before listing what it must not overlap.
3. **The pilot's stage order:** seed → appearance and visual hooks → persona core → brains (outfits as a set, keyed hooks, bond-gated sections) → palette table → greeting and example chats → house and ties → schedules → records.
4. **The palette quotas** for example chats: one or two on her job or archetype, at least four not erotic, one at most with a stranger at the door, every tell and prop used once, mapped in a table before writing.
5. **The standard is the last pass**, and `npm run content:check -- <file>` comes back clean before anything is handed back.
6. **One session, one stream.** Sessions run side by side so one writes while the owner reviews another. Each hands back markdown files and a pull request; the owner merges.

## Today: play the resort (the owner, no Fable needed)

The whole point of the pilot is to learn what plays on a weak model before anything scales. An hour of play now decides budgets for everything Fable writes. Set up: merge this pull request, then Chat › Settings, connect GLM-4.6 or Xialong, then Chat › Home › **Bring in The dragon's resort**.

| Test | What to do | What it answers |
| --- | --- | --- |
| **Voices** | One scene with each of the three, fifteen turns or more. Open with something ordinary: tea, a bad morning, the television. | Do the field split and the examples hold her voice on a weak model? (A5, A6) |
| **Examples on and off** | In the Studio press **The dragon's resort** again for a copy. In the copy, delete Echydna's example chats. Open the same scene with both Echydnas. | How much do the examples steer, against her sections? (A4) |
| **How long she holds** | In a long chat, note the turn where she forgets her outfit, her room, or how she talks. Chat's **In context now** shows what she costs. | Are the budgets right for 28k? (A2) |
| **The day** | Home with story time on: step the clock through a day. | Does everyone sit where the schedule says, wearing what it says? |

Then the same openings on a 128k model. **Send back:** for each chat with a bad reply, Under the hood › Sent › Save for a test › **Everything**, plus one line per bad reply saying what was wrong. Those files are the brief for the resort's fix pass (stream 4), and `npm run chat:lab` turns each one into a test another app's model can run (`docs/testing/chat-lab.md`). Start each chat from Chat › Home, or pick Autumn's Leaves as its scenario; without one, she doesn't know where she is.

## Three days of Fable 5.2

Fable's time goes where a strong model matters most and review is cheapest: the gold sets later work is shown, the frames it fills, and seeds that later sessions can build without it. In priority order, so if fewer sessions run at once, start at the top.

| Day | Stream 1: HOG Wild | Stream 2: Volungraiv | Stream 3: Mythic Overdrive | Stream 4: resort fixes |
| --- | --- | --- | --- | --- |
| **1** | House concept, then three seed pitches each for Nova and the influencer | Two or three candidate first places → owner picks → the seed | Answers to its open questions, as options to pick | (waits on the play-test) |
| **2** | Nova: appearance → persona → brains → palette → examples | Owner reviews the seed → the frame, lines only | The seed | Fixes from the test packs |
| **3** | The influencer through the same stages; house, ties, schedules, records | Owner reviews the frame → fill, checker clean | The Rim, if the owner brings its material | Budgets back into the standard |

**Owner review per day:** about an hour and a half, mostly lines and short checkpoints. The checkpoints that matter most are the HOG Wild seeds (Day 1) and the Volungraiv seed and frame (Days 1 and 2).

### Stream 1: HOG Wild, the second Home

The house of glass: a cyberpunk influencer house the world watches. It's chat-first like the resort, so the pilot's pipeline applies stage for stage, and it's the world outside fantasy the front page wants. Nova has a card in `docs/bids/content/`; the influencer has a paragraph in `Initial content ideas.md`.

**It starts with the framework chat** (`docs/content/hog-wild/plan.md`): five short checkpoints that settle the show, the cast, the looks, how Nova's configuration and the audience fit the records, the frame and a lab suite, before Fable writes a line. Fable then runs the stages below from that framework. **The framework is done (Nov 15):** `docs/content/hog-wild/00-framework.md`, `01-decisions.md`, `02-frame.md`, `looks.md`, the wave 1 lab suite in `content/hog-wild/lab-suite.json`, and Fable's brief in `docs/content/hog-wild/handoff.md`. Six residents, written in two waves. **Both waves are written (Nov 15):** six residents, the house, the thread and `content/hog-wild/world.json`, checker clean (`docs/content/hog-wild/report.md`). Next is play and a blind lab run.

- **Checkpoint 1:** the house (what the cameras see, who's in it, what the audience pays for), then three seed pitches each for Nova and the influencer, each a positive vibe plus a temperament someone would recognise, and how each sits against the other.
- **Then, one character at a time,** the retrospective's order and gates. Grounding questions answered before the persona (what trash she likes, what makes her laugh outside her job, what makes her snap, what quiet damage keeps her from being a trope). Palette table before the example chats.
- **Last:** the house and their ties, schedules, and `content/hog-wild/world.json`, checker clean.

### Stream 2: Volungraiv, from seed to a filled first place (the scale test)

**The process for this stream and the next is `docs/content/modules/process.md`** (Nov 16): a slice built by hand over six checkpoints, a pattern page written from it, then frames and fills. It replaces the checkpoints listed below where they differ.

The standard's seed → frame → fill done for real, on the owner's setting. It's the only stream that answers A7 (does reviewing lines catch most problems?) and A8 (does Fable fill well from a frame and a gold set?) inside the window. Sources: `Initial content ideas.md` and the Dark Lord Funk workbook and card (adapt the characters; the setting has drifted).

- **Checkpoint 1:** two or three candidate first places, one or two lines each. Qetzal, the one city in the Badlands, is the obvious one; the owner picks.
- **Checkpoint 2, the seed:** a premise, the two to four groups everything leans on (the kin are the species), the place with its rooms, three or four people at full quality, and one thread. This is the gold set the fill is shown, with the resort.
- **Checkpoint 3, the frame:** about ten places and twelve to twenty people, lines only, in one table: name, kind, parent, line, and the scene or rule that needs it; for each person job, want, pattern, Aside, home and work, ties to two or three others. The owner reads it in five minutes and cuts or redirects lines.
- **Fill:** entries from the approved frame, as `content/volungraiv/world.json`, checker clean. The owner reads the leads and anything the checker flags, and counts what the frame caught against what the fill got wrong.

### Stream 3: Mythic Overdrive, the seed

From `mo-00` to `mo-03`. Its open questions come first, each answered as two or three options to pick from, because the seed waits on them: names that pull the wrong priors, the five mismatched sources, Eclipse. Then a seed to the standard, as a checkpoint document, not a world file. **The Rim** follows the same way, only if the owner brings its material into the repository.

### Stream 4: the resort, fixed from play

Starts when the test packs are in. Fixes go into the resort's records, not around them. What's already known is in `docs/testing/chat-lab.md`: other characters' sections arriving on loose keys, and a greeting that disagrees with the schedule. Whatever the test shows about budgets goes into the standard's tiers and its assumptions table (A2, A4, A5, A6), so every later fill writes to numbers from play.

## Prompts for the sessions

Paste one into a new session per stream. Each assumes the repository is attached.

**Stream 1.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 1 and the rules), `docs/content/process-retrospective.md`, `docs/content/pilot-brief.md` for how the pilot worked, the HOG Wild section of `docs/bids/content/Initial content ideas.md` and Nova's card in `docs/bids/content/`. Load the bot-writing skill, and pulp-voice at the example chats. Read the resort's three characters in `content/dragons-resort/world.json` as the standard to meet. Start with the house and three seed pitches each for Nova and the influencer, and stop. One character, one stage at a time after that. Hand back markdown files and a pull request.

**Stream 2.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 2 and the rules), `docs/content/standard.md`, `docs/content/process-retrospective.md`, the `inkwyrm-records` skill, the Volungraiv section of `docs/bids/content/Initial content ideas.md`, and the Dark Lord Funk workbook and card in `docs/bids/content/`. Don't read or draw on `docs/abernys/` or Bogwater: that setting is retired. Pitch two or three candidate first places, one or two lines each, and stop. After the owner picks, write the seed and stop; then the frame as a table of lines and stop again. Fill only from the approved frame. Hand every checkpoint back as a markdown file the owner can open, then open a pull request with plain steps to merge.

**Stream 3.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 3), `docs/content/standard.md` (seed, frame, fill) and `docs/bids/content/mo-00-handoff.md` to `mo-03-style.md`. Answer Mythic Overdrive's open questions as options first and stop. The seed is one checkpoint document; don't write records until the owner approves it.

**Stream 4.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 4), `docs/testing/chat-lab.md` (its first run lists what's known), `docs/content/standard.md`, the `inkwyrm-records` skill and `content/dragons-resort/world.json`, then the owner's test packs, running `npm run chat:lab` on each. List each problem with the record and section it comes from and the fix, and stop. After approval, fix the records, update the standard's budgets and assumptions from what played, and keep `studio/tests/resort.test.ts` green.

## Not in the window

- **The Studio's Look inside** (read-only preview) and moving the root to the Overview (F4): code, not content; any model.
- ~~A game for the adventure~~: now the next priority (above).
- **Abernys:** retired. Nothing in it gets a session.
