# Lowgate: the fill

Nov 19, 2026 · @AmbiProp · Checkpoint 5 of the module process's part 1 (`../../modules/process.md`): every record in Lowgate's frame (`3-frame.md`) written into `content/volungraiv/world.json`, matched to the gold pair (the Lee and Tamsin, kept exactly as approved). The brief was `fill-brief.md`. This file holds the coverage table, the checks the process asks for after a fill, what was invented or changed past the frame, and the decisions left for the owner.

## What's in the file

66 records, checker clean (below).

| Kind | Count | Notes |
| --- | ---: | --- |
| Places | 21 | The Badlands, Qetzal, the Old Road, the Camps, Lowgate and its six (the Gate, the Lee, Room Six, the Awnings, the Counting-House, the Pit, the Marrow's Mouth), the Climb; seeds: the Succori Quarter, the Heights, the Far Gate, the Marrow; held for the ceiling: the Temple of Koriar, Koriar's Floor, the Vaults, the Spire |
| People | 12, and a persona | Leads (the thread turns on them): Hollis, Wenna, Teague, Nefera, Ansel, Tamsin. People: Vigga, Quill, Sela, Ivo (dead). Gangs: Teague's Crew, Marrow Golkin. Seed: the Envoy. Persona: the Newcomer |
| Groups | 13 | Nine kin; the Compact, the Underguilds (with a When per standing band), the Court of Tribute; Koriar's Priests held for the ceiling |
| Items | 7 | The token, the Peace book, the Golkin's string, the change-book, a gilded crown, knucklebones, storm glass |
| Lore | 8 | Four customs, three rumours, and Koriar held for the ceiling |
| Threads | 2 | *Bought Out* in full; *The Envoy* as a clock and a first beat |
| Scenario | 1 | *Lowgate, Before the Bell*: the Gate at 17:00 on day 0 |

**Held for the ceiling gold** (`docs/bids/volungraiv-ceiling/`): the Temple of Koriar, Koriar's Floor, the Vaults, the Spire, Koriar's Priests and the lore *Koriar* are in the file as the frame's line and nothing else. They have to exist, because Sela's and Ansel's days, Hollis's rest-day and the change-book all stand on Koriar's Floor; every schedule stop must be a real place.

## The rules this fill adds

Records carry tier, and numbers only where the story needs one (the owner, Nov 19).

| | What | Values |
| --- | --- | --- |
| **Tiers** | Teague and Tamsin rivals; Teague's Crew and Marrow Golkin minions, as gangs; everyone else baseline | Gangs of 5 and 6 |
| **Purses and prices** | Tamsin's purse 1 (unpaid); Ansel's 100 (he pays for everything); Vigga's price 100 (her book) | |
| **Goods** | Nefera sells fine clothes and storm glass; Sela sells knucklebones; Teague carries a club and a jerkin, his crew clubs, Quill lockpicks and a knife, the Golkin knives and the Golkin's string | The token is a good so the toll house can hand it over |
| **States** | *The Peace* on every person (none, held, bought out); world states *Gate shut*, *Bought Out ended* (four ways, below), *Vigga's book*; the underguilds' *Standing* | Ansel starts holding the Peace |
| **Scene actions** | *Pay for the Peace* at the Gate, with Hollis, 6:00 to 18:00; *Buy out Ansel's Peace* at the Counting-House, with Wenna; *Buy Vigga's book* at the Pit, with Vigga | 1, 10 and 100 Coin |
| **The player** | The Newcomer: every approach at 2 (the adventure's plain traveller), and a little coin | 14 Coin: the Peace, then a buy-out, with a little left |
| **Milestones** | 1 to 3 by the player's hand; 4 when *Bought Out ended* is set; 5 on day 3, by the rules | The day is never named in the text |
| **Conditions** | 13, every one used: the Gate shut; milestones 1 to 3; the four endings; the five standing bands | Each label names the milestone or state the code session wires it to |

**Milestone 4 is one beat with three ways**, and the world state says which:

| *Bought Out ended* | The way | Set by |
| --- | --- | --- |
| 1 | The Peace refused by the underguilds: Teague holds the Gate | Hand, until the code session |
| 2 | The Peace refused at the bearer's desk: Wenna won't ink Gildra's buy-outs, and Hollis keeps the Gate | Hand |
| 3 | The buyer bought out | The scene action |
| 4 | Sold to the Queen | Hand |

## Coverage

| The adventure does | The slice has it as |
| --- | --- |
| Schedules, waiting, resting | Ten days, every stop a real place; Hollis's rest-day at Koriar's Floor; the opening at 17:00 agrees with them (Hollis at the Gate, Tamsin at the Pit) |
| Travel between parts | The place tree: the Badlands, the Old Road, Qetzal, the Camps outside the Gate, Lowgate's six, the Climb to the seeds. No crossing rules: the Gate's bell is a world state, not a door |
| Trade | Nefera's stall, Sela's knucklebones, the Peace at the toll house, a buy-out at the Counting-House, Vigga's book. Drinks and beds are never counted |
| A fight that ends | Teague (a rival with a club), his crew (a gang of five), the Marrow Golkin (a gang of six, who carry the string), Tamsin (a rival) |
| A lock, a guard, a climb | The Peace book in its iron box under Wenna's desk; the Lee's porters (Alert 2); the climb down the Marrow's Mouth. All at the standard's difficulty |
| Leverage | Hollis's deal with the Queen and Ivo's harp behind his bar; Wenna and Ivo; Teague's crew keeping score; Nefera told Ansel which room; Ansel's gifts can be taken back; Tamsin is owed; Sela's unfinished rite; Vigga's book; Quill's want of the vaults |
| Standing | The Underguilds, five bands, a When section each, keyed on Teague and work |
| Milestones | *Bought Out* 1 to 5; *The Envoy*'s arrival on the same day |

## The checks

**The checker** (`npm run content:check -- content/volungraiv/world.json`): no catches, no Checks, nothing missing. One over budget, the Lee at 143 tokens against 120, approved with the gold pair. Every other place was cut to 120 or under. The heaviest moment (Room Six, its parent, the four heaviest people) is about 2,300 tokens against 4,000.

**Tests:** `studio/tests/volungraiv.test.ts` holds the world to the standard (the checker but the Lee, the Checks, schedule stops, sizes, the thread, every condition used). `adventure/tests/engine-volungraiv.test.ts` plays it: the opening, paying for the Peace, buying out Ansel to reach milestone 4, Vigga's book out of reach, and the envoy on day 3.

### The census

Four named people at most in a place, at every hour (the Checks run it over forty days, rest-days included). The busiest:

| Hour | Place | Who |
| --- | --- | --- |
| Afternoon | The Awnings | Teague, his crew, Nefera, Quill |
| Evening | The Lee | Hollis, Nefera, Tamsin, Ansel (on rest-day Hollis is at Koriar's Floor, so three) |
| Night | The Lee | Nefera, Quill, Tamsin, Ansel |
| Evening | The Pit | Teague, his crew, Vigga |

### Wants, side by side

| Who | Wants | In the way | Pattern |
| --- | --- | --- | --- |
| Hollis | To keep the Lee, whoever holds the Gate | Every stand-down ties it to the Queen's side | Collateral |
| Wenna | Whoever paid for Ivo to answer for it | She inks what's paid, and she inked his | Ruleset |
| Teague | The Gate | His crew watching him stand down | Wantneed |
| Vigga | Out of the Pit and Qetzal, owing nobody | The Pit owns her book | Defense |
| Nefera | Too useful to be handed over again | She owes the court, and told Ansel which room | Contradiction |
| Quill | Into Koriar's vaults | No leave, no sponsor | Appetite |
| Tamsin | Paid for Ivo | Collecting means naming whose gold it is | Ruleset |
| Ansel | The Peace worth nothing when the envoy comes | One person laying the buy-outs side by side | Mask |
| Sela | Her scars finished in Koriar's name | No rite for it | Wantneed |

Two pairs touch on purpose and don't converge: Hollis and Teague both turn on the Gate (one keeps the Lee whoever holds it, one wants to hold it), and Wenna and Tamsin both turn on Ivo (one wants the payer to answer, one wants paying). No pattern is used more than twice.

### Bodies, side by side

Each closes on a different feature, and each tell fires on something the city does.

| Who | Closes on | Fires when |
| --- | --- | --- |
| Tamsin | The inside of her left wrist | A name is spoken (names are what Qetzal inks) |
| Hollis | His eyes, to the horizon over the Gate | The wind stirs the bell rope |
| Wenna | Her shoulder blades drawing together | Someone stands behind her (the Peace is on her back) |
| Teague | The copper bright along his neck | A stand-down is mentioned |
| Vigga | Her ears | A bout is fixed, or someone sits beside her |
| Nefera | Her tail round her ankle | The Witch Queen's court is named |
| Quill | The chipped tip of her left horn | (An underguild club; she looks at your cord before your face) |
| Ansel | His thumb turning his rings | The Witch Queen's name (her gifts can be taken back) |
| Sela | The light in her scars | The titan or the bone is named (the old faith) |
| Teague's Crew | Camps dust to the knee | |
| Marrow Golkin | Teeth worn flat on Peace tokens | |

### Reach: every fact the thread needs can be got to

| Beat | Where a player finds it |
| --- | --- |
| 1, the stand-down | Teague (asked about Room Six he spits; his Wants and his When send him looking for whoever asks); Hollis points up the Climb; the Compact and *The Peace* lore name the stand-down |
| 2, the count | The Peace book in the iron box at the Counting-House (Wenna, or the lock); the Golkin's string, carried by the Marrow Golkin and taken when they're beaten; *What the Golkin Keep* points at it; Nefera has done her own count |
| 3, the coin | Sela and the change-book on Koriar's Floor; the gilded crown in Sela's keeping; Hollis has done the count; Tamsin saw the Queen's face on her first fee |
| 4, the ending | The buy-out at the Counting-House (a scene action); Teague's crew and Wenna's desk for the refusals; Ansel's offer for the sale |
| 5, the envoy | The rules, on day 3 |

**One gap:** beat 3 is found on Koriar's Floor, which has only its line until the ceiling fill. Sela and the change-book carry it; the room around them is thin.

### A sample, read against the gold

Read: the five leads (in the reply), Vigga, Quill, Sela, the Gate, the Counting-House, Room Six, the Peace book, *The Peace* and *What the Golkin Keep*.

- **Fixed in the read:** a belt in Hollis's body; counts the story didn't need (wagons two wide, two porters); a line telling the player what to do in Teague's Wants; milestone 4's wording; every place over 120 tokens and two lines over 25 words.
- **Held:** every Here field under 420 characters; Named sections 40 to 75 words; Personality as *when this, they do that*, with one line each won't cross; Speech with words they use and no sample lines; When sections that move a body or an object.
- **Drift to watch:** every Personality opens on *Asked…*, which is the gold's own shape, so a cast read aloud starts to sound alike (catch 11). The leads' ties are written as Named sections of their own (*His People*, *Vigga and Quill*, *Lowgate's People*, *Vigga's Purse*), a shape the gold doesn't have; they're short and keyed on the other person's name.

## Changed from the frame

- **Names that would have tripped the code.** A character's first word is also a key (`core/records/context.ts`, `ownTerms`), so a character called *The Marrow's Golkin* would be named by every "the". It's **Marrow Golkin**. The envoy is **Envoy of the Witch Queen** (keyed on "envoy"), since *The Envoy* is the thread. The temple faction is **Koriar's Priests**, since *The Temple of Koriar* is the place. The vaults rumour is **Robbing the Vaults**, since *Koriar's Vaults* is the place.
- **The Old Road's lore is the road's own History**, so the same fact isn't sent twice under one name. It carries the empire's road-house, which the gold decision moved there.
- **Milestone 5 reads as the envoy coming, not arriving,** so a narrator hearing it as the next beat doesn't stage the arrival early. The rules still reach it on day 3.
- **Ending 4a is two ways in the world state** (the underguilds, or the bearer), because who holds the Gate afterwards differs.
- **Times are timeless.** Room Six's line and the scenario say "the night before you came", where the frame had "last night": these are sent every turn, for days.

## Invented past the frame

For the owner to strike:

- The Newcomer, the player's persona, and the three prices
- Ivo's harp behind the Lee's bar, held against his room; the fresh notch in Room Six's door bar
- Hollis came as a caravan cook and bought the Lee; got the Gate when the last warden couldn't keep the Camps quiet
- Wenna's terms copied a line a night; she has seen them only in a mirror
- Teague has never bought the Peace (and buys it once he holds the Gate); the last collector's Peace was bought out
- Teague's brindle racing dog; dog races at the Pit on rest-day mornings
- Caravan masters tip water on the first mile-stone out of any town
- Ansel came with credit at Koriar's table; he thanks people for things they haven't done yet
- Nefera's leather cases; Vigga's purse in a tin under the stall
- The first look at the Golkin (pale, long-fingered); the First Children's look is left to the owner, as the atlas says

## For the code session

Found while filling, for `docs/next-sessions.md` session 2:

- **When sections don't reach the adventure yet**, so the endings, the standing bands and the Gate shut play in the Studio and Chat only. Every condition's label names what it waits on.
- **The Gate shut and endings 1, 2 and 4 are set by hand** in the adventure's overrides until A3's events can set them.
- **A place's starting states don't cross:** the Lee's Alert of 2 starts at rest in the adventure (the converter says so).
- **`ownTerms` takes "The" as a first name** for any character or persona whose name starts with it. Personas are always present, so it's harmless there; a character named that way is named by every sentence.

## Decisions for the owner

1. **The player and the prices.** The Newcomer starts with every approach at 2 and 14 Coin. The Peace costs 1, buying out Ansel 10, Vigga's book 100. Keep, or set your own.
2. **Ending 4a as two ways:** the underguilds refuse and Teague takes the Gate, or Wenna refuses and Hollis keeps it. Keep both, or pick one.
3. **Rest-day.** The default calendar's last day is Saturday, so the clock says Saturday where the records say rest-day. Keep it, or give Qetzal a week of its own whose last day is called Rest-day (one rules block; the schedules already use the weekday, not its name).
4. **The renames** above (Marrow Golkin, Envoy of the Witch Queen, Koriar's Priests, Robbing the Vaults) and the Old Road's lore folded into the road.
5. **Strike anything** on the invented list.
6. **Play next (checkpoint 6)** before the code session lands? Checks, travel, trade, the scene actions, schedules and milestones all work today; set *Gate shut* by hand when the bell rings at 18:00.
