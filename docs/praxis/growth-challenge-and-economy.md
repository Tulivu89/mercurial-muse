# Praxis — Growth, Challenge and Economy

Oct 17, 2026 · @AmbiProp

This is the proposal for Charter next steps 2 and 3. Every point in it was decided on Oct 17, and it was built in 0.17.0, 0.18.0 and 0.19.0 (see *Decided* and *Built* at the end). It also checks whether secondary approaches are worth using. It covers three things:

- how a character grows;
- how the world's challenges are pitched against that growth;
- how money changes hands.

Every percentage is exact: it is computed with Praxis's own dice code over every face of every die. Nothing here is built yet. The decisions it needs are listed at the end.

## How Genesys handles advancement

- **One currency, experience (XP).** The GM awards it after each session. The rulebook leaves the amount to the GM, and tables commonly give 15 to 25 a session.
- **Characteristics** are bought at creation only, at 10 × the new rating, with 5 as the maximum. After creation the only way up is Dedication, a tier 5 talent.
- **Skills** cost 5 × the new rank, or 5 more for a non-career skill. A skill can be at most rank 2 at creation and rank 5 overall.
- **Talents** cost 5, 10, 15, 20 or 25 XP by tier. Under the pyramid rule you need more talents in each lower tier than in the tier above, so nobody can save up for a tier 5 talent.
- **The world does not level up.** Difficulty comes from the task (Easy to Formidable) and from the opponent's tier and numbers. Growth shows as harder things becoming possible.
- **Money** is the setting's currency. Characters start with 500, and items carry a price and a Rarity that says how hard they are to find.

## Adapt or make our own

Adapt the spending and replace the earning.

- **Keep Genesys's cost curve.** It is tested, and it slows growth near the top. Its two prices map straight onto ours: approach ratings are characteristics, and charges are skill ranks.
- **Replace the awards.** Genesys depends on a GM handing out XP each session. Praxis has no sessions and no GM, and the narrator never moves state, so XP has to come from things the engine can see.
- **Leave the talent tree out for now.** Four approaches with charge ladders already give real choices. A short list of knacks can come later (see the end).

## Earning experience

Experience is a state on the player. The ledger records every gain, and a module's scene actions can grant XP with the machinery they already have.

| Source | XP | When |
| --- | --- | --- |
| Overcome a minion | 1 | The first time a check brings them to a terminal: down, or given way. Once per person and terminal. |
| Overcome a rival | 4 | The same. A rival who recovers and is beaten again gives nothing. |
| Overcome a nemesis | 10 | The same. |
| Open an obstacle | 1, or 2 if Hard or worse | A lock, a gate, a barred way. |
| A lesson | 1 | Failing a check against a rival or nemesis, at most once a scene. This is optional: it makes a hard fight pay something even when it goes badly. |
| A milestone | set by the module | A scene action or story beat, such as signing the Covenant or finishing an arc. 5 to 20 each. |
| By hand | any | As with every value, recorded as yours. |

For scale: overcoming everyone in Port Covenant once is 43 XP (five minions, seven rivals, one nemesis). With a few milestones, a module the size of Port Covenant is worth 70 to 80.

## Spending experience

| Step | Cost | Genesys equivalent |
| --- | --- | --- |
| One step up a charge ladder | 5 × the new top charge | A skill rank, at 5 × the new rank |
| An approach rating +1, up to 4 | 10 × the new rating | A characteristic, at 10 × the new rating |

Each ladder step adds one charge:

| Step | Charges | Cost to reach |
| --- | --- | --- |
| Raw | +1 | 5 |
| Practiced | +1, +2 | 10 |
| Trained | +1, +2, +3 | 15 |
| Expert | +1 to +4 | 20 |
| Master | +1 to +5 | 25 |

In Genesys a characteristic rises after creation only through Dedication. I'd let ratings be bought directly at the characteristic price instead: there are only four of them, and at 40 XP for a 4, a rating is already the slowest thing to raise. Equipment is a second axis beside this, not a replacement: see *Items* below for what a sword does compared with a rating step.

Growing from the traveller's start to 4 in every approach at Master takes about 500 XP, which is roughly six or seven modules.

### What growth looks like

The table follows the Port Covenant traveller at three points. They start at Flair 3 Trained, Force 2 Practiced, Finesse 2 Practiced and Focus 1 Raw.

- **Success** is averaged over one charge cycle, spending the highest charge first.
- **Rolls** is the expected number of rolls to bring a track of that size to zero, at the tier's difficulty:
  - a rival is Average;
  - the nemesis is rank 1, Hard plus one red die.

| Stage | Approach | Easy | Average | Hard | Rival, Strain 4 | Rival, Health 5 | Nemesis, Strain 6 | Nemesis, Health 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Start, 0 XP | Flair 3 Trained | 82% | 70% | 58% | 3.0 | 3.6 | 6.2 | 8.1 |
| | Force 2 Practiced | 69% | 53% | 41% | 4.8 | 5.8 | 11.4 | 15.0 |
| | Finesse 2 Practiced | 69% | 53% | 41% | 4.8 | 5.8 | 11.4 | 15.0 |
| | Focus 1 Raw | 46% | 31% | 21% | 10.3 | 12.8 | 31.3 | 41.2 |
| Seasoned, 75 XP | Flair 3 Expert | 85% | 73% | 62% | 2.5 | 3.1 | 5.2 | 6.8 |
| | Force 2 Trained | 73% | 59% | 46% | 3.8 | 4.7 | 8.7 | 11.5 |
| | Finesse 3 Practiced | 80% | 68% | 55% | 3.3 | 3.9 | 6.8 | 8.9 |
| | Focus 1 Practiced | 56% | 41% | 30% | 6.8 | 8.4 | 18.0 | 23.7 |
| Veteran, 240 XP | Flair 4 Master | 92% | 83% | 74% | 1.8 | 2.2 | 3.5 | 4.6 |
| | Force 3 Expert | 85% | 73% | 62% | 2.5 | 3.1 | 5.2 | 6.8 |
| | Finesse 3 Trained | 82% | 70% | 58% | 3.0 | 3.6 | 6.2 | 8.1 |
| | Focus 2 Trained | 73% | 59% | 46% | 3.8 | 4.7 | 8.7 | 11.5 |

What each stage bought:

- **Seasoned, 75 XP:**
  - Flair to Expert (20)
  - Force to Trained (15)
  - Finesse to 3 (30)
  - Focus to Practiced (10)
- **Veteran, 165 more (240 in all):**
  - Flair to 4 and Master (65)
  - Force to 3 and Expert (50)
  - Finesse to Trained (15)
  - Focus to 2 and Trained (35)

In short:

- **Your best approach** goes from 70% to 83% against Average, and a rival falls in about 2 rolls instead of 3.
- **A nemesis** at first takes 6 to 8 rolls, a fight that spans scenes and wants Leverage, Prepared and Story Points. A veteran beats one in 3 to 5.
- **A minion** falls to your best approach on the first roll 86% of the time at the start, and 96% as a veteran.

A rating step is the bigger jump; a ladder step is the cheaper one. Both stay worth buying.

### The odds for any pool

Here is the chance to succeed by approach rating (rows) and the charge spent (columns).

**Average (2 purple)**

| Rating | No charge | +1 | +2 | +3 | +4 | +5 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 23% | 31% | 50% | 65% | 76% | 84% |
| 2 | 44% | 50% | 57% | 70% | 80% | 87% |
| 3 | 60% | 65% | 70% | 75% | 83% | 89% |
| 4 | 72% | 76% | 80% | 83% | 86% | 91% |

**Hard (3 purple)**

| Rating | No charge | +1 | +2 | +3 | +4 | +5 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 16% | 21% | 38% | 53% | 65% | 75% |
| 2 | 32% | 38% | 43% | 58% | 69% | 78% |
| 3 | 48% | 53% | 58% | 63% | 73% | 81% |
| 4 | 61% | 65% | 69% | 73% | 77% | 84% |

## Challenge growth

- **The world doesn't level up with you.** A gate guard is a minion for good. That is Genesys's way, and it is what makes growth visible.
- **The tiers stay as they are:**

  | Tier | Difficulty | Health | Strain |
  | --- | --- | --- | --- |
  | Minion | Easy | 1 | 1 |
  | Rival | Average | 5 | 4 |
  | Nemesis | Hard | 8 | 6 |

  A minion falls to one success.
- **Rank, for the people who matter.** A person's rank, 0 to 2, upgrades that many of their difficulty dice to red challenge dice.
  - Port Covenant's rivals are rank 0. A captain in Cairn Maw might be rank 1, and a warlord nemesis rank 2.
  - This is where NPC opposition dice (Charter step 5) plug in. Once people carry approach ratings, their rating and rank build their dice the way yours do.
- **Gangs.** Minions in a group act as one target, with Health equal to their number and that many difficulty dice, up to 4. One guard is one roll; three guards are a fight.
- **One opposition per place.** The narrator gets one turn, not one per enemy, so several attackers are always one gang. Modules keep one potential enemy (a person or a gang) to a place at a time.
- **A fight that ends is over** (built in 0.16.1). When a check puts the last one in a fight down, or makes them yield to Force, and no one else here is hurt but still standing:
  - the outcome says the fight is over and that no one else takes it up or comes to join it;
  - the place's Alert falls to uneasy, so a roused scene no longer invites the narrator to bring in new attackers;
  - talking someone round is not a fight.
- **Danger by region.** Authors put the rank 1 and rank 2 people further from the start, so the player chooses when to go.

**Rank.** The chance per roll; the bracket is the rolls to win the person over (Strain 4 for a rival, 6 for a nemesis).

| Against | Flair 3 Trained (start) | Force 2 Practiced (start) | Flair 4 Master (veteran) |
| --- | --- | --- | --- |
| Rival, rank 0 (Average) | 70% (3.0) | 53% | 83% (1.8) |
| Rival, rank 1 (+1 red) | 64% (3.4) | 46% | 79% (2.0) |
| Rival, rank 2 (+2 red) | 57% (3.9) | 38% | 75% (2.2) |
| Nemesis, rank 0 (Hard) | 58% (5.4) | 41% | 74% (3.1) |
| Nemesis, rank 1 (+1 red) | 52% (6.2) | 34% | 69% (3.5) |
| Nemesis, rank 2 (+2 red) | 46% (7.3) | 28% | 64% (3.9) |

**Gangs.** The expected rolls to break one:

| Gang | Force 2 Practiced | Flair 3 Trained |
| --- | --- | --- |
| 1 | 1.4 | 1.2 |
| 2 | 2.6 | 1.7 |
| 3 | 5.0 | 2.9 |
| 4 | 8.8 | 4.8 |

A secondary approach against a rival at the start takes a long time: Force 2 Practiced needs about 6 rolls for Health 5, and each failure costs Health. I'd keep that, because it pushes you to the right approach, or to Focus first. If fights drag in play, a rival at Health 4 brings it under 5.

## Are secondary approaches worth it?

A secondary approach moves another approach's state at one setback die, and pays the owner's cost when it fails. The question is whether a strong secondary is worth using when your primary approach is weak, or whether you would do better not to try.

The table shows winning a rival over (Strain 4, Average). Strain spent counts 1 for each failure, 2 on a despair, and 1 for two or more threat, which is Flair's cost.

| Route | Per roll | Rolls to win | Strain you spend |
| --- | --- | --- | --- |
| Flair 1 Raw | 31% | 10.3 | 10.1 |
| Flair 2 Practiced | 53% | 4.8 | 3.0 |
| Flair 3 Trained | 70% | 3.0 | 1.2 |
| Force 2 Practiced, intimidating | 44% | 5.9 | 4.8 |
| Force 3 Trained, intimidating | 62% | 3.5 | 1.9 |

Against a minion (Strain 1, Easy), Flair 1 Raw succeeds on 46% of rolls, and Force 3 Trained intimidating on 74%. Against a nemesis (Strain 6, Hard), Flair 1 Raw takes 23 rolls and 30 Strain; Force 3 Trained intimidating takes 6.4 rolls and 5.2 Strain.

**What this shows:**

- **A secondary is worth about one rating step less than its owner.** That step is the setback die. Force 3 Trained intimidating sits between Flair 2 and Flair 3.
- **It is the right choice when your primary is 1 or 2 and the secondary is 3.**
- **A weak primary against a rival is worse than not trying.** Flair 1 Raw spends about 10 Strain on average, more than the 6 you have, so you would be spent before you won.
- **The gap was that only Strain had a secondary.** In 0.17.0 every approach got one lane onto another's ground:
  - Force can intimidate (Strain).
  - Finesse can strike from cover (Health).
  - Flair can talk suspicion down (Alert).
  - Focus can work out a lock (Security).
- **Other ways round a weak approach:**
  - Focus first, for Leverage;
  - a bribe, which works like Leverage you pay for;
  - a tool that fits;
  - choosing another target.

## Economy

### Scale

Prices go up in steps of ten, and each step is named for what it buys. Only exchanges are counted: items, people and services changing hands, and bribes. Drinks, meals and a bed for the night are never counted while you have any coin at all.

| Scale | Coin | Things | People and services | A bribe that tempts |
| --- | --- | --- | --- | --- |
| A drink | not counted | a drink, a meal, a bed, a tip | a message carried | — |
| A knife | 1 | a knife, a lantern, a week's board | a guide for a day | a gate guard, a clerk |
| A sword | 10 | a sword, a mail shirt, a mule | a sellsword for a month, passage by sea | a sergeant, a broker |
| A horse | 100 | a horse, a small boat, plate armour | someone's contract, a crew for a voyage | a captain, a magistrate |
| A house | 1,000 | a townhouse, a ship | a company for a season | a governor |
| A castle | 10,000 | a keep, a fleet | an army | a prince |

A sword and a better sword cost the same. Authors can price inside a step (Wren's contract is 25), but the step is what matters.

### What the narrator reads

Coin stays a number for you. The narrator reads it as a band, so it knows what you can afford without counting:

| Coin | The narrator reads |
| --- | --- |
| 0 | You have no money at all, not for a drink, a meal or a bed. |
| 1 to 9 | You can pay for food, drink, a bed and small things. |
| 10 to 99 | You could buy a sword or hire a blade for a month. |
| 100 to 999 | You could buy a horse or someone's contract. |
| 1,000 to 9,999 | You could buy a house or a ship. |
| 10,000 or more | You could buy a castle. |

### Exchanges

- **Buying and selling.** A thing has a worth.
  - Buying it at its worth needs no roll. The coin and the thing change hands in the ledger, and the narrator is told it happened.
  - A buyer who wants a thing pays its worth. Selling it in a hurry, or selling stolen goods, gets half.
- **Hiring.** A service is paid by the term: a day, a week, a month or a season.
  - *In your pay* lasts until the term runs out. Then they go back to their own day.
  - This needs one new kind of state, one that counts down by the day. The same primitive can later heal injuries and let Alert cool.
- **Contracts.** Buying someone's contract makes them *Bound*.
  - Freeing them is a scene action that sets it back.
  - When a bound person stops following, they go to your holding if you have one, or stay where they are. This settles where Wren goes.
- **Holdings.** A house or a castle is a place with an owner.
  - Resting there is safe, things can be left there, and the people bound to you wait there.
  - Income from holdings can come later.
- **Loot.** Someone down or given way carries a purse by tier, unless the module says otherwise:
  - a minion, a knife's worth;
  - a rival, a sword's;
  - a nemesis, a horse's.

  Taking it from someone down needs no roll. Taking it from someone standing is a Finesse deed.

### Bribes

A bribe is Leverage you pay for.

- **Price.** Everyone has a price: the scale that tempts them.
  - By default a minion's is a knife, a rival's a sword and a nemesis's a horse.
  - A module can set it per person, or mark someone as not for sale.
- **Effect.** Offering their price makes the check one step easier; a scale above makes it two steps easier. Less does nothing.
  - It helps Flair and Finesse against that person, not Force.
  - A minion takes their price without a roll.
- **Payment.**
  - The money changes hands only if the check succeeds.
  - On a failure they refuse it.
  - On a despair they take it and refuse anyway.
- **Not for sale.** Someone who is not for sale takes the offer badly: one setback die on the check. An Arbiter of the Covenant is the obvious case.

The odds against a rival:

| Approach | No bribe | Their price (a sword) | A scale above (a horse) |
| --- | --- | --- | --- |
| Flair 3 Trained | 70% | 82% | 94% |
| Flair 2 Practiced | 53% | 69% | 86% |
| Flair 1 Raw | 31% | 46% | 67% |

A bribe can also be a scene action with a fixed price and a certain result, like a toll.

### Why not an abstract Wealth rating

A Means rating from 0 to 5 saves arithmetic, but it needs rules for spending it down. "I paid ten and have thirty left" is easier to read and to author than "my Means dropped a step". The ten-step ladder already gives the abstraction where it matters, because the narrator only ever sees the band.

## Items

An item does one of four things, and has a worth on the scale. A better sword does nothing a sword doesn't; a knife, a sword and a castle differ.

| Kind | What it does | Examples (worth) |
| --- | --- | --- |
| Help | One boost die on a check it fits: an approach, with a kind of target or a named one. One item helps a check at a time. | lockpicks for Finesse on locks (a knife); a fine coat for Flair at court (a sword); a forged writ for Flair with the Arbiters (a sword) |
| Arm | A weapon adds to the harm of a Force success against a person. Armour adds to your Health while you wear it. | a knife or club, +1 harm, can be hidden (a knife); a sword, axe or spear, +2 harm, worn openly (a sword); a jerkin +1 Health (a knife); mail +2 Health (a sword); plate +3 Health and one setback die on Finesse (a horse) |
| Use up | Spent when used. | a poultice gives back 2 Health; a tonic 2 Strain; a smoke pot lowers Alert by 1; a gift counts as a bribe at its worth |
| Open | No dice. It opens a way or offers a scene action outright. | a key opens its lock; a writ gets you through the gate; holding someone's contract makes them Bound to you |

- **Carrying and owning.**
  - What you carry is part of who you are to the narrator: "You carry a sword, a mail shirt and lockpicks."
  - What you own but don't carry stays at a place, such as a holding.
  - Someone down drops what they carry.
- **Wear.** A despair on a check that used an item damages it. It stops helping until it is mended, which is a Focus check (Easy, an hour).
- **Where items come from:** buying, looting, making, and rewards. A module's milestone can hand you a named thing.

### What an item is worth in odds

**A tool**, one boost die, averaged over a charge cycle:

| Approach | Average, without | Average, with | Hard, without | Hard, with |
| --- | --- | --- | --- | --- |
| 1 Raw | 31% | 42% | 21% | 30% |
| 2 Practiced | 53% | 62% | 41% | 49% |
| 3 Trained | 70% | 76% | 58% | 64% |

**A weapon**, Force against a rival (Health 5, Average). Each cell gives the expected rolls to drop them and the Health you lose on the way, at Force's failure cost of 1 a failure and 2 on a despair:

| Force | Bare hands | Knife or club (+1) | Sword (+2) |
| --- | --- | --- | --- |
| 1 Raw | 12.8 rolls, 8.8 Health | 7.9, 5.4 | 6.4, 4.4 |
| 2 Practiced | 5.8, 2.7 | 4.0, 1.9 | 3.3, 1.5 |
| 3 Trained | 3.6, 1.1 | 2.7, 0.8 | 2.2, 0.6 |

**What this means:**

- **A sword** does for fighting about what a rating step does: Force 2 Practiced with a sword takes 3.3 rolls, against 3.6 for Force 3 bare-handed. But it works only for fighting, only while you have it, and it costs coin, not XP.
- **Mail's +2 Health** is about one rival fight's worth of blows at Force 2.
- **Why ratings are still bought with XP:** items are the second axis. They are bought with coin, found or made, and they can be taken from you.

## Crafting with Focus

Leverage and Prepared help the next check against the same target. A made thing carries that help to any later target it fits. This is how Focus helps later rolls.

- **A work is a track** that grows, like Prepared, and Focus owns it. Each success adds its successes, and when the track is full the thing is made. The track's size follows the scale:

  | What you make | Track |
  | --- | --- |
  | A knife's worth | 1 |
  | A sword's | 2 |
  | A horse's | 3 |
  | A house's | 5 |
  | A castle's | 8, and it needs hands: a crew |

- **Difficulty** is Average. Fine or secret work is Hard: a forgery, a poison, a lock that keeps a master out.
- **Materials** cost half the worth, paid when you start. Selling what you make is a living, slowed by the time it takes.
- **Time.** Each check takes time by scale: an hour for a knife's worth, half a day for a sword's, a day for a horse's, a week for a house's.
  - Focus pays in time, so a failure takes as long again.
  - A despair spoils the materials.
- **What Focus makes:**
  - aids for later targets: a skeleton key for locks, a forged writ, a map of the garrison, a disguise;
  - things to use up;
  - repairs;
  - goods to sell.

The expected checks to finish a work at Average:

| Focus | A knife's worth (1) | A sword's (2) | A horse's (3) | A house's (5) |
| --- | --- | --- | --- | --- |
| 1 Raw | 3.2 | 5.4 | 7.9 | 12.8 |
| 2 Practiced | 1.8 | 2.6 | 3.7 | 5.8 |
| 3 Trained | 1.4 | 1.7 | 2.3 | 3.6 |

The traveller, at Focus 1 Raw, is a poor maker. A character built on Focus makes a sword in a day or so.

## Deals

- **Bargaining.** A seller can carry a Bargain state, owned by Flair and grown like Leverage.
  - Each point takes a quarter off your next purchase from them, up to half, and is spent on it.
  - Failing costs Strain, as Flair does.
  - A despair means they won't deal with you today.
- **After a check.** Scene actions can already be offered only when a state allows them. For example:
  - the forger's back room, once Finesse has found it;
  - a lower price, once you have Leverage on the seller.
- **Market days.** Scene actions offered on certain days or hours, following the seller's schedule. Scene actions need to read the clock for this, which is a small change.

## Later: knacks

If the approaches and ladders feel thin, add a short list of knacks. They cost 5, 10 or 15 XP by tier, and each tier needs two knacks from the tier below.

- **Tier 1:**
  - **Tough** (ranked): +2 Health.
  - **Steady** (ranked): +2 Strain.
  - **Quick study:** a Focus success builds one more point of Leverage or Prepared.
  - **Streetwise:** your bribes work one scale lower.
- **Tier 2:**
  - **Second wind:** once a scene, recover 2 Strain.
  - **Hard to kill:** once per rest, Health stops at 1 instead of 0.

## Decided, Oct 17

1. **Earning:** as in the table, lessons included.
2. **Challenge:**
   - Rank, and gangs as the only way to bring several attackers.
   - One potential enemy to a place.
   - A fight that ends is over.
3. **Coin:** on the ten-step ladder, with the narrator reading the band.
4. **Prices:** Port Covenant's are test values. Things should sometimes be cheaper, or available only after a check.
5. **Bribes:** paid only on success.
6. **Approach ratings:** bought directly with experience, with items as a second axis.
7. **Items:**
   - The four kinds: help, arm, use up, open.
   - Their numbers: a knife +1 and a sword +2 harm; a jerkin 1, mail 2 and plate 3 armour.
8. **Crafting:** a Focus track whose size follows the scale, materials at half the worth, and time by scale.
9. **Bargain:** a Flair state on a seller, a quarter off per point, up to half.

## Built

| Release | What |
| --- | --- |
| 0.16.1 | A fight that ends is over: the outcome says so, and the place settles to uneasy. Quiet waiting and travel. |
| 0.17.0 | Experience earned and spent, and the charge ladder to Master. One secondary lane per approach. Rank and gangs. Port Covenant: signing the Covenant as a milestone, Brond at rank 1, and the dock toughs as a gang. |
| 0.18.0 | Coin as a standard state, with the narrator reading its band. Goods (help, weapons, armour, things you use up), a pack and the ledger. Buying, selling and taking. Bribes, bargains, terms that count down, and opening hours. Port Covenant: sellers, carried goods, Pell's writ after a check, and Cadfan's market-day mail. |
| 0.19.0 | Making things with Focus. |

**Not built yet:**

- **Item wear and mending.** A despair damaging what you used, and Focus mending it.
- **Knacks.** None are built yet.
- **Holdings,** where bound people wait when they stop following.
- **An "open" good**, such as a key that opens its lock outright. For now, a scene action can take a good from your pack, so you need one to do it.
- **NPC opposition dice.** People's own approach ratings would build their dice.
