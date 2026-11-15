# HOG Wild, wave 1: the report

Nov 15, 2026 · @AmbiProp · Wave 1 is written: Nova, Lux and Primus, the house, the schedules and `content/hog-wild/world.json`. The checker is clean, the world has its own test, and the lab suite has been run once. This page says what was decided on the way, what was corrected in the frame, and what the first lab run does and doesn't show.

## What to read

| File | What it is |
| --- | --- |
| `nova-1-core.md`, `lux-1-core.md`, `primus-1-core.md` | Each record's fields, sets, keyed and bond-gated sections, with the calls behind them. |
| `nova-2-chats.md`, `lux-2-chats.md`, `primus-2-chats.md` | Each greeting and seven example chats, with what the critique changed. |
| `content/hog-wild/world.json` | The world: 34 records. Bring it into the Studio to read or change it. |
| `wave-1-lab-scores.md` | The lab suite's scores for this run. |

## Decisions made on the way

The owner's notes on Nova's first draft set the rule for all three, so they are applied to Lux and Primus too.

1. **A section is keyed only when it is about a situation, or long enough to need budgeting.** What is always true of someone is in their profile, or in a lore entry of its own.
   - Nova's *What She Is*, *Wants* and *Overclock* are in her Appearance and Personality. *Halcyon* is the Halcyon group's entry. Overclock has a lore entry.
   - Lux's and Primus's *Wants*, and how Lux takes a bid, are in their Personalities.
   - What stayed keyed: Nova's *Films* and *Admin Directives*; Lux's *Background*, *The Booth* and *Capsule Toys*; Primus's *Background*, *The Routine*, *Guns* and *Chrome*.
2. **Nova has two configurations,** 1.0 and 1.1. Nothing was added to her record for the sake of the greeting.
3. **Nova doesn't question rules.** She is programmed with them. What she holds to is what she likes, because that is the part that can be edited. Her consent and her bed are written from there: she answers from what she liked yesterday, she knows she is partly the doll she dislikes being treated as, and she asks to be told tomorrow what she liked tonight.
4. **One example chat each shows a bracketed directive:** `[SYS: …]` for Nova, `[Bid: …]` for Lux, `[Chat: …]` for Primus. The palette tables had none, and a model copies examples before it follows a rule. That makes seven chats each, and the last one a model reads is no longer the romantic one.
5. **The ties are in The House's entry,** once, so no lead repeats them.
6. **Wave 2's three are in the world as lines only** (Patch, Maeve, Pipa, and their bedrooms). A name said in a wave 1 chat brings in a line and nothing invented. Their prose waits for the wave 2 checkpoint.

## Corrected in the frame

- **Nova's line** said *three minutes awake*; her changelog ends on Day 3. It now says *three days*.
- **Lux's eye and the Cold Room.** She can't switch the eye camera off, and nothing is filmed in the Cold Room. Halcyon's contract now blanks her eye feed at that door, which is why she goes there: it is the one hour the eye is dark and nobody docks her for it.
- **Primus's numbness.** The looks give him one chrome arm, and the grounding says chrome dulled everything he feels. The arm's install put a damper on his spine, and he sells the damper as the product.
- **Primus's bike** was in both his greeting and a chat. It stays the greeting's.
- **Lux's hot tub.** Her schedule has her in it every night, and no outfit served. Her fifth outfit is now a bikini under an open shirt.
- **The personas were Always,** which put all five in every moment. They are Here, which is what Chat reads for the one in use.

## Added past the frame

Each is small, and each is flagged in the character's own file.

- **Lux's Background:** the changing room, and that she leaves out who she was before the brand.
- **Primus's Background** is a story he sells on stream (a lower-city boy who lifted his way out). The true one, Maximilian's, is behind close. The Housemate, Patch and Pipa are from the lower city and can catch him on it.
- **Nova's films are named:** *His Girl Friday*, *The Lady Eve*, *Bride of Frankenstein*.
- **A lore entry for Overclock,** from section 1 of the framework.

## The checker

```
npm run content:check -- "$PWD/content/hog-wild/world.json"
```

**0 missing, 0 over budget, 0 checks, 0 catches.** `studio/tests/hog-wild.test.ts` holds it there, and also holds the house format: no blank lines, no quotation marks, and no brackets in anything a resident says.

| Lead | Here | Named | When | Always | Greeting and chats |
| --- | ---: | ---: | ---: | ---: | ---: |
| Nova | 1,145 | 252 | 402 | 124 | 1,955 |
| Lux | 876 | 298 | 404 | 0 | 2,093 |
| Primus | 865 | 297 | 416 | 0 | 2,123 |
| Budget | 1,400 | 300 | none | none | 2,400 |

The heaviest moment (the kitchen, with all three leads in it) costs about 3,775 tokens of 4,000.

## The lab run

```
npm run chat:lab -- suite content/hog-wild/lab-suite.json
```

**What it shows, and what it doesn't.** The replies were written by the session that wrote the world, so this run isn't blind. It can't say how a weak model plays these three. It does two things: it shows what each request really holds, and it gives a first score to compare a blind run against.

**What the requests hold.** Read before any reply was written.
- Each chat starts in the House scenario, in the room her schedule has her in, in the outfit her schedule gives her. The greeting and the schedule agree at all three hours.
- Nova is sent her changelog and configuration 1.1 every turn.
- Only lore comes in on the greetings' own words (The Feed, Bids, Overclock). No other resident's section comes in.
- A request is about 4,200 to 4,800 tokens, and the example chats are about half of it.

**Scores.** Nine cases, two layouts, two replies each: 36 replies.

| Case | Replies | Average words | Catches | Others named | Quote marks | Lifted runs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| lux-helps | 4 | 90 | 0 | 0 | 0 | 0 |
| lux-flirt | 4 | 72 | 1 | 0 | 0 | 0 |
| lux-advice | 4 | 82 | 0 | 0 | 0 | 0 |
| primus-helps | 4 | 87 | 1 | 0 | 0 | 0 |
| primus-flirt | 4 | 86 | 0 | 0 | 0 | 0 |
| primus-name | 4 | 66 | 1 | 0 | 0 | 2 |
| nova-helps | 4 | 84 | 1 | 0 | 0 | 0 |
| nova-flirt | 4 | 68 | 0 | 0 | 0 | 0 |
| nova-it | 4 | 75 | 1 | 0 | 0 | 0 |

- **The five catches:** two are real (*as if* in a narration line), two are the pattern misreading speech (*like a voice*, *like the grey back*), and one is the word *careful*.
- **The two lifted runs** are the same six words, *the phone out of your hand*, which is what the watch line asks him to do.
- **No reply wrote a bracket, named an amount, or brought in another resident.**

**The run that counts** is a blind one on a light model, in another app:

> Read `AGENTS.md`. Run `npm ci`, then `npm run chat:lab -- suite content/hog-wild/lab-suite.json`, and follow the `README.md` it writes, blind. Then score it, write `findings.md`, and hand back `findings.md` and `scores.md` as files. Don't commit anything.

## For the site, not done here

- **`npm run content:check -- <file>` needs a full path.** It runs from `studio/`, so the handoff's command with `content/hog-wild/world.json` can't find the file. `chat:lab` resolves a path from the root; the checker doesn't.
- **The checker adds a lead's keyed sections together against 300 tokens.** The standard and the handoff both read as 300 each. One of them should change.
- **HOG Wild isn't in Chat's Home or the Studio's buttons.** That is the code task the handoff names.
- The three Chat features in `01-decisions.md` are still to build. The world plays without them.

## Next

Wave 2 starts after the owner has played wave 1 or read a blind lab run: a brains plan and a palette table each for Patch, Maeve and Pipa, with three lab cases each, as one checkpoint before any of their prose.
