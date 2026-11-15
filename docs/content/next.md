# What gets written next

Nov 15, 2026 · @AmbiProp · The plan after the pilot: the play-test, then three days of Fable 5.2 spent on the content everything later is compared to and the seeds it grows from. Read with `docs/content/standard.md` (seed, frame, fill) and `docs/content/process-retrospective.md` (what made the pilot land in one pass).

## Where things stand

- **The dragon's resort is in.** `content/dragons-resort/world.json`: Qiulong, Errata and Echydna at Autumn's Leaves, 20 records, checker clean (0 missing, 0 over budget, 0 checks, 0 catches), every schedule stop real, round trip to an adventure module green. A test holds it there (`studio/tests/resort.test.ts`). The working papers for stages 0 to 7 are in `docs/content/dragons-resort/`.
- **It can be played.** Chat › Home › **Bring in The dragon's resort** puts the three in Home and in the collection. The Studio's home has the same button; the Overview lists it and points Home at it.
- **What's left of the pilot:** stage 8, the play-test, and one open question: whether the mascot in `chat/src/errata.ts` becomes the resort's Errata or stays her own version.

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

Then the same openings on a 128k model. **Send back:** Chat › Settings › back up (it holds the chats), plus one line per bad reply saying what was wrong. That file is the brief for the resort's fix pass (stream 5).

## Three days of Fable 5.2

Fable's time goes where a strong model matters most and review is cheapest: the gold sets later work is shown, the frames it fills, and seeds that later sessions can build without it. In priority order, so if fewer sessions run at once, start at the top.

| Day | Stream 1: Landfall village | Stream 2: HOG Wild | Stream 3: Bogwater gold | Stream 4: seeds | Stream 5: resort fixes |
| --- | --- | --- | --- | --- | --- |
| **1** | Three candidate villages as one-liners → owner picks → the frame, lines only | House concept, then three seed pitches each for Nova and the influencer | 87 lines and the field split for the sixteen people | Volungraiv seed, as a checkpoint | (waits on the play-test) |
| **2** | Owner reviews the frame → fill | Nova: appearance → persona → brains → palette → examples | Checker clean; Bogwater world file in | Mythic Overdrive: answers to its open questions as options, then its seed | Fixes from the play-test file |
| **3** | Fill finished, checker clean; review a sample | The influencer through the same stages; house, ties, schedules, records | (done) | The Rim, if the owner brings its material | Budgets back into the standard |

**Owner review per day:** about an hour and a half, mostly lines and short checkpoints. The checkpoints that matter most are the village frame (Day 1 to 2) and the seeds (Day 1 for HOG Wild).

### Stream 1: the first village from a frame (the scale test)

This is the standard's seed → frame → fill done for real, and the only stream that answers A7 (does reviewing lines catch most problems?) and A8 (does Fable fill well from a frame and a gold set?) inside the window. Bogwater is the seed village; the Landfall Coast docs hold the region.

- **Checkpoint 1:** three candidate villages for the Landfall Coast, one or two lines each, saying what a player would do there that they can't in Bogwater.
- **Checkpoint 2, the frame:** about ten places and twelve to twenty people, lines only, in one table: name, kind, parent, line, and the scene or rule that needs it; for each person job, want, pattern, Aside, home and work, ties to two or three others. Groups and one or two threads. The owner reads it in five minutes and cuts or redirects lines.
- **Fill:** entries written from the approved frame, shown Bogwater and the resort as gold, as `content/<village>/world.json`, checker clean. The owner reads the leads and anything the checker flags, and counts what the frame caught against what the fill got wrong.

### Stream 2: HOG Wild, the second Home

The house of glass: a cyberpunk influencer house the world watches. It's chat-first like the resort, so the pilot's pipeline applies stage for stage, and it's the world outside fantasy the front page wants. Nova has a card in `docs/bids/content/`; the influencer has a paragraph in `Initial content ideas.md`.

- **Checkpoint 1:** the house (what the cameras see, who's in it, what the audience pays for), then three seed pitches each for Nova and the influencer, each a positive vibe plus a temperament someone would recognise, and how each sits against the other.
- **Then, one character at a time,** the retrospective's order and gates. Grounding questions answered before the persona (what trash she likes, what makes her laugh outside her job, what makes her snap, what quiet damage keeps her from being a trope). Palette table before the example chats.
- **Last:** the house and their ties, schedules, and `content/hog-wild/world.json`, checker clean.

### Stream 3: Bogwater as a gold world

Every village fill is shown Bogwater, and Bogwater is approved writing in the old shape: 71 of its 87 records have no line, and its people aren't split into Appearance, Personality and Speech. Fixing that gives fills a gold set in the shape they're writing.

- **Checkpoint:** all 87 lines in one table, 25 words at most, and the field split for two people. The owner reads it in ten minutes.
- **Then:** the other people split the same way, adding no facts, and `content/abernys-bogwater/world.json`, checker clean. The adventure's module stays what it plays until roadmap step 6; the session doesn't change it.

### Stream 4: seeds that outlast the window

Seeds are short, they carry most of the value, and any model can grow them later. Each one, to the standard: a premise, the two to four groups everything leans on, one place with its rooms, three or four people as lines with job, want and pattern, and one thread. Handed back as a checkpoint document, not a world file.

- **Volungraiv,** from `Initial content ideas.md` and the Dark Lord Funk workbook and card (adapt the characters; the setting has drifted). The obvious first place is Qetzal, the one city in the Badlands, but the session pitches two or three and the owner picks.
- **Mythic Overdrive,** from `mo-00` to `mo-03`. Its open questions come first, each answered as two or three options to pick from, because the seed waits on them (names that pull the wrong priors, the five mismatched sources, Eclipse).
- **The Rim,** only if the owner brings its material into the repository.

### Stream 5: the resort, fixed from play

Starts when the play-test file is in. Fixes go into the resort's records, not around them; whatever the test shows about budgets goes into the standard's tiers and its assumptions table (A2, A4, A5, A6), so every later fill writes to numbers from play.

## Prompts for the sessions

Paste one into a new session per stream. Each assumes the repository is attached.

**Stream 1.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 1 and the rules), `docs/content/standard.md`, `docs/content/process-retrospective.md`, the `inkwyrm-records` skill, `docs/abernys/` and `adventure/modules/abernys-bogwater.json`. Pitch three candidate villages on the Landfall Coast, one or two lines each, and stop. After the owner picks, write the frame as a table of lines and stop again. Fill only from the approved frame. Hand every checkpoint back as a markdown file the owner can open, then open a pull request with plain steps to merge.

**Stream 2.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 2 and the rules), `docs/content/process-retrospective.md`, `docs/content/pilot-brief.md` for how the pilot worked, the HOG Wild section of `docs/bids/content/Initial content ideas.md` and Nova's card in `docs/bids/content/`. Load the bot-writing skill, and pulp-voice at the example chats. Read the resort's three characters in `content/dragons-resort/world.json` as the standard to meet. Start with the house and three seed pitches each for Nova and the influencer, and stop. One character, one stage at a time after that. Hand back markdown files and a pull request.

**Stream 3.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 3), `docs/content/standard.md` (the field table) and the `inkwyrm-records` skill. Bring `adventure/modules/abernys-bogwater.json` into a world with `core/convert`. Write a line for every record and the field split for two people, hand them back as one markdown table, and stop. After approval, split the rest without adding facts and write `content/abernys-bogwater/world.json`, checker clean. Don't change the module.

**Stream 4.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 4), `docs/content/standard.md` (seed, frame, fill) and the sources it names for one world at a time. For Mythic Overdrive, answer its open questions as options first and stop. Each seed is one checkpoint document; don't write records until the owner approves it.

**Stream 5.**
> Read `CLAUDE.md`, `docs/content/next.md` (Stream 5), `docs/content/standard.md`, the `inkwyrm-records` skill and `content/dragons-resort/world.json`, then the owner's play-test file. List each problem with the record and section it comes from and the fix, and stop. After approval, fix the records, update the standard's budgets and assumptions from what played, and keep `studio/tests/resort.test.ts` green.

## Not in the window

- **The Studio's Look inside** (read-only preview) and moving the root to the Overview (F4): code, not content; any model.
- **Errata on the site:** a decision, not a session. If the resort's Errata becomes the mascot, `chat/src/errata.ts` takes her record and the Overview's Meet Errata points at her.
- **Port Covenant** retires after the coverage audit; it doesn't get a gold pass.
