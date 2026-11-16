# HOG Wild: the report

Nov 15, 2026 · @AmbiProp · Both waves are written: six residents, the house, the thread and `content/hog-wild/world.json`. The checker is clean and the world has its own test. This page says what the owner's notes changed, what was corrected in the frame, what was added past it, and what still needs a person.

## What to read

| File | What it is |
| --- | --- |
| `<name>-1-core.md` | Each record's fields, sets, keyed and bond-gated sections, with the calls behind them. |
| `<name>-2-chats.md` | Each greeting and seven example chats, with what the critique changed. Wave 2's carry their palette table. |
| `content/hog-wild/world.json` | The world: 36 records. Bring it into the Studio to read or change it. |
| `wave-1-lab-scores.md` | The lab suite's scores from wave 1's first run, before the revisions below. |

## The owner's notes, and what they changed

**1. A section is keyed only when it is about a situation, or long enough to need budgeting.** Anything always true is in the profile or the scenario.

- **The Feed and Bids were lore behind keys.** Both are true in every scene, so they are in the scenario's Situation, which is sent every turn, and the two lore entries are gone.
- **Lux's eye camera is in her Appearance.** It was behind the acquaintance tier, and a model playing her to a stranger didn't know the ring was a camera.
- **Primus's damper is in his Appearance,** and his *Guns* and *Chrome* notes are one section, *Stunts*.
- **Nova's *What She Is*, *Wants* and *Overclock*, and everyone's *Wants*,** are in their Personalities.
- **What stays keyed is lore that a topic brings in:** Fishbowl, Halcyon and The House (the groups), Chrome and Overclock (lore), and each lead's Background and hooks.

**2. Each In Bed section has a kink that comes from the person.**

| Resident | The kink | Where it comes from |
| --- | --- | --- |
| **Nova** | Doll play on her own call, and only then. Being edited with her eyes open, one small setting, told first. Being told she is the version someone would keep. | She is partly the product she dislikes being treated as, and her changes land while she is off. |
| **Lux** | Being told: a plain order, done at once. Being watched. Being won, with no number in it. | She can't choose, she lives on camera, and a bid is how she is wanted. |
| **Primus** | Being handled: pain he asks for, orders he doesn't, the chrome hand held flat by a word, and praise by name. | He feels little, he needs to be told he was good, and the hand is dangerous. |
| **Patch** | The bedroom camera on a loop. A brat who bottoms. Being called pretty with their wrists held. | The feed owns everything else, and cute is the word they can't stand in daylight. |
| **Maeve** | Marks: teeth, bruises and nail lines the first Maeve never had. | Her body came without a scar, and nothing on it is hers yet. |
| **Pipa** | Free. Spoiled first, then her terms; the scruff of her neck; the root of her tail. | She prices everything, and her body has rules she didn't write. |

**3. Nova** has two configurations, doesn't question her rules, and holds to what she likes because that is what can be edited.

## Wave 2, as written

Wave 2 went straight to prose, as asked, so the brains plans and palette tables are in each character's files and weren't a separate checkpoint.

- **Patch** makes the selling out the joke and means the takedowns under it. Their tips come from a source they think they cultivated. They won't touch a private person or the lower city.
- **Maeve** walks in as the biggest thing in the room, says *I* about everything the first Maeve did, and tests people by playing a riff wrong. She remembers her own gigs from the crowd's side.
- **Pipa** has two voices and a price list. She prices in gifts (a peach, a lantern, a dragon boat), never in money. Her liking for someone shows as things coming off the list.
- **The thread, *Who Picks the Targets*,** has its three milestones, marked by hand. Chat doesn't send a thread to a chat today, so a model playing Patch isn't told the secret, which suits it.
- **Their rooms and outside places** (the Squat, the Shrine, the Night Market) are in, and The House's entry holds everyone's ties once.

## Corrected in the frame

- **Nova's line** said *three minutes awake*; her changelog ends on Day 3. It says *three days*.
- **Lux's eye and the Cold Room.** She can't switch the eye off, and nothing is filmed in the Cold Room. Halcyon's contract blanks her eye feed at that door, the one hour it is dark and nobody docks her.
- **Primus's numbness** needed a cause the looks could carry: one chrome arm, and a damper on his spine that came with it.
- **Primus's bike** was in both his greeting and a chat. It stays the greeting's.
- **Lux's hot tub** had no outfit. Her fifth is a bikini under an open shirt.
- **Maeve's Sundays at the Shrine** ran over her three o'clock greeting. They start at four.
- **The personas were Always,** which put all five in every moment. They are Here, which is what Chat reads for the one in use.

## Added past the frame

Each is small and is flagged in the character's own file.

- **Lux's Background:** the changing room, and that she leaves out who she was before the brand.
- **Primus's Background is a story he sells** (a lower-city boy). The true one is behind close.
- **Maeve's biggest song is *Not For Sale*.** It needed a title. How the first Maeve died is left unsaid.
- **Pipa's tail rings report to the trial company.**
- **Maeve's and Pipa's looks aren't rolled,** so their Appearance uses my picks from the options in `looks.md`. If a roll lands elsewhere, it is a few words.
- **A seventh example chat for each of wave 1's three,** on a bracketed directive. Wave 2's three have theirs inside the job chat.
- **Real things named:** Nova's films, Maeve's *The Auld Triangle*, Pipa's two palace dramas, Patch's ways in.

## The checker

```
npm run content:check -- "$PWD/content/hog-wild/world.json"
```

**0 missing, 0 over budget, 0 checks, 0 catches.** `studio/tests/hog-wild.test.ts` holds it there, and also holds the house format (no blank lines, no quotation marks, no brackets in a resident's own turn), the thread's milestones and the lab suite's ids.

| Lead | Here | Named | When | Always | Greeting and chats |
| --- | ---: | ---: | ---: | ---: | ---: |
| Nova | 822 | 252 | 445 | 118 | 1,955 |
| Lux | 713 | 298 | 387 | 0 | 2,093 |
| Primus | 750 | 264 | 478 | 0 | 2,123 |
| Patch | 677 | 208 | 501 | 0 | 2,046 |
| Maeve | 694 | 224 | 431 | 0 | 2,147 |
| Pipa | 707 | 289 | 339 | 0 | 2,134 |
| Budget | 1,400 | 300 | none | none | 2,400 |

**The budget that bit was the moment's.** The checker puts the four heaviest people in one room and allows 4,000 tokens. With six leads, that meant cutting every profile to about 700 to 800 tokens, down from wave 1's first draft of about 900 to 1,150. The heaviest moment is now 3,967. The profiles are leaner for it, and close to the resort's size.

## The lab suite

`content/hog-wild/lab-suite.json` has 18 cases now: three per resident. The suite builds all 18 requests, and each one starts in the right room, outfit and scenario for its hour.

**It hasn't been played since the revisions.** Wave 1's first run (`wave-1-lab-scores.md`) was mine, so it wasn't blind, and it predates the changes above. The run that counts is a blind one on a light model, in another app:

> Read `AGENTS.md`. Run `npm ci`, then `npm run chat:lab -- suite content/hog-wild/lab-suite.json`, and follow the `README.md` it writes, blind. Then score it, write `findings.md`, and hand back `findings.md` and `scores.md` as files. Don't commit anything.

## For the site

Done Nov 16:

- **HOG Wild is on the site.** Chat's Home and Add characters, the Studio's home and the Overview's examples each bring it in. The resort stays the house, so a first visitor doesn't get HOG Wild without asking.
- **Residents' notes stay in their own chats.** In a chat with Nova, *kiss* brought in all six In Bed sections, opened by the bond with Nova, and *where are you from* brought in four Backgrounds. A chat character now brings nothing into another's chat; The House's entry carries who they are to each other. This was the decisions' item 2.
- **`npm run content:check` takes a path from wherever it's typed,** as `chat:lab` already did.
- **The checker holds a lead's Named sections to 300 each,** as the standard says. Other tiers keep their budget for all their Named sections together.

Still open:

- **A thread's Next beat doesn't reach a chat.** That is right for this thread; it is worth deciding on purpose.
- **Items 1, 3 and 4 in `01-decisions.md`.** The world plays without them.

## Next

- **Play it.** Bring the world into Chat and talk to each of the six, on a weak model and a strong one.
- **Roll Maeve and Pipa** from `looks.md`, and say if either Appearance needs to move.
- **A fix pass** on whatever the play and a blind lab run turn up.
