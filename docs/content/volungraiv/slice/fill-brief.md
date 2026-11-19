# Lowgate: the fill brief

Nov 19, 2026 · @AmbiProp · Everything the fill session needs, in one place: checkpoint 5 of the module process's part 1. Read this first, then the files it names.

## The job

Write every record in Lowgate's frame (`3-frame.md`, with the owner's answers at its end) into `content/volungraiv/world.json`. The gold pair, **the Lee and Tamsin**, is already in that file. It was chosen from four bids and Claude's own entry (`docs/bids/volungraiv-gold/decision.md`). Match it field by field: its sizes, its density, and its habit of putting the world into things a player can touch.

**Not in this fill.** These wait for the ceiling gold (`docs/bids/volungraiv-ceiling/`), and the frame's lines hold their place until then:
- the Temple of Koriar and Koriar's Floor;
- the Vaults and the Spire;
- the Temple of Koriar faction;
- Koriar's lore.

Sela is a person, and she's filled now.

## Read

1. `CLAUDE.md`, then `docs/content/volungraiv/atlas.md` (the world on one page).
2. `docs/content/volungraiv/slice/3-frame.md`: every record as a line, with the owner's answers. **Its settled facts are fixed.** The bids changed some (Hollis leasing the Lee); don't.
3. `docs/bids/volungraiv-gold/decision.md`: the gold pair, why it won, and what the bids got wrong.
4. `docs/content/standard.md` (the failure list), the `inkwyrm-records` skill, and pulp-voice's `references/anti-patterns.md`.
5. `docs/content/modules/process.md`, part 1, checkpoint 5 and the checks after a fill.

Don't read or draw on `docs/abernys/` or Bogwater. Dark Lord Funk is lore to mine, never a plan.

## The standard, in short

- **Every sentence playable** at a bench, a bar or a door, with no plot running.
- **Behaviour, not description.** People are written *when this, they do that*. Places are what's going on in them now.
- **The world in things:** a token checked before a key, a room let again the same day. Never explain the Peace; show the cord.
- **When sections move bodies.** Someone goes somewhere new or seeks someone out; not just a change of mood.
- **Each person's tell is wired to the city,** where it can be. Tamsin's thumb goes to her wrist when a name is spoken, because names are what Qetzal inks.
- **Sizes:**
  - lines at 25 words or fewer;
  - each person's Appearance, Personality and Speech under 420 characters (the adventure cuts the rest);
  - Named sections short (60 to 80 words);
  - a place's Entry and Atmosphere together near 120 tokens.
- **The never-list** (standard, *The failure list*). Above all:
  - no comparisons;
  - no counts the story doesn't need;
  - no paperwork wants;
  - no clichés about what things cost;
  - no clothing in a body;
  - no sample lines in Speech.
- **Economy is the world's.** Show money in what people do.

## Rules: by tier, not by number (the owner, Nov 19)

Records are about character, worldbuilding and prose, not mechanics.
- **Tier says how big a threat or how important someone is:**
  - most people are the baseline: give them no tier;
  - a real threat is a **rival**;
  - a power is a **nemesis**.
- **A number goes on a record only when the story needs it,** and no reason is written for it beyond that. Tamsin's purse is 1 because she hasn't been paid. The Lee's Alert is 2 because the porters watch the yard.
- **What the slice's records carry:**
  - Teague: a rival;
  - Tamsin: a rival (already set);
  - Teague's crew and the Marrow's Golkin: minions, as gangs;
  - everyone else: baseline;
  - Vigga: for sale at the Pit;
  - goods only where someone sells or carries them.

**The world's rules**, the only mechanics this fill adds:
- **Scene actions:**
  - paying for the Peace at the toll house;
  - buying out a Peace at the Counting-House, with Wenna present;
  - buying Vigga's book at the Pit.
- **World states:**
  - the Gate shut;
  - which way *Bought Out* ended.
- **The underguilds' standing,** with the work each band gives.
- **The thread's milestones:** milestone 4 is one beat with three ways, until the code session builds alternatives. The envoy arrives on day 3, held in the rules and never named in the text.
- **The world's conditions** for the When sections.

## Also in this session

- `studio/tests/volungraiv.test.ts`, beside `hog-wild.test.ts`, holding the world to the standard: checker clean, Checks clean, every schedule stop real.
- Bring the world into the Studio the way HOG Wild comes in (`kit/src/included.ts`), so it can be launched as an adventure.
- `npm test`, `npm run lint` and `npm run build`, green.

## Check your own work, then hand back

Run the process's checks:
- the census: four named people at most in a place at any hour;
- every want, then every body, read side by side;
- reach: every fact someone needs can be got to;
- a sample read against the gold pair.

Put the coverage table and what you found in `slice/5-fill.md`.

**Hand back the way the owner reads** (Nov 19):
- **In the reply:** the five people the thread turns on (Wenna, Hollis, Ansel, Nefera and Teague) in full, each with two lines on why they meet the gold. Then the decisions the owner must make, distilled to a short numbered list.
- **Not in the reply:** everything else stays in the files, with a pointer.
- **A pull request,** with plain steps to merge.

If the session runs long, split it. Do the people and the thread first, hand back, and stop. Places, lore and items come next.

## The prompt

> Read `docs/content/volungraiv/slice/fill-brief.md` and do what it says. Never use the owner's real name; sign docs `@AmbiProp`.
