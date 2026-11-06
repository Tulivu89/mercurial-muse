Speculus proposal 0.1, a best guess built on Character Engine's state model

# Four approaches on Genesys dice

Every value is one bounded number. A roll builds a Genesys dice pool from an approach and a charge. Each approach owns the states it can move, so how you act decides what can change and what it costs. The engine works in numbers; the model only ever reads words.

Approach 2 with a +2 charge against Average difficulty: two yellow dice against two purple.

## The character

Four approaches, Force, Finesse, Focus and Flair, each rated 1 to 4. A new character starts at 1 in each and adds 4 points, with no approach above 3.

Skills become **charges**: one-use bonuses held per approach. A character gets one Trained approach (+1, +2, +3), two Practiced (+1, +2) and one Raw (+1). You spend one charge on a roll. Spent charges come back once every charge on that approach has been used, or on a full rest. Rolling with no charge is always allowed and doesn't count toward the reset. To **push**, take 2 Strain and reuse a spent charge.

Write-in skills survive as optional tags: when the player says one fits, it adds a boost die.

## Building the pool

Take the approach rating and the charge. The higher number is how many dice you roll; the lower is how many of those are upgraded from green to yellow. This is Genesys's own rule with a charge in the skill slot.

Difficulty comes from one of three places: an author-set action, an opponent (their approach and rank build the purple and red dice the same way), or Average, two purple, by default. Boost dice come from Edge, Prepared and tools. Setback dice come from injuries, being watched, a roused scene, and using an approach off its home ground.

## Reading the result

- One net success succeeds. Each extra success adds one to the stake, so degree matters.
- Net advantage or threat of 1 adds a clause to what the model is told. Two or more also does something: advantage grants **Edge** (a boost die on your next roll), threat triggers the approach's threat cost. Advantage never refunds the same roll's cost.
- Triumph on a success and despair on a failure replace the outcome with a bigger one. On the other side of the line, each counts as two advantage or two threat.
- A terminal, such as someone going down, replaces everything.
- The model receives exactly one directive.

## Approaches own states

Every state that can be targeted names the approach that owns it. The owner can move it. An approach marked secondary can move it with one setback die, and pays the owner's cost on failure, because it's playing on the owner's ground. An approach with no claim can't move it at all. That's what keeps all four approaches common without any one of them working everywhere.

Opposition acts through failure costs. There are no separate NPC turns: a missed strike is the guard's club landing.

## Story Points, momentum and risk

Two Story Points, one on each side. The player spends one to upgrade a die, and it flips to the rules side. When the rules side holds both, it spends one on the player's next roll, upgrading a difficulty die, and it flips back. The model never spends them.

A hidden **momentum** counter moves +1 per success and −1 per failure. At +3 a point flips to the rules side; at −3 one flips to the player. Volunteering a harder roll and failing also flips a point to the player.

## Scales

Health and Strain are hidden points under prose bands. Points let extra successes count; the bands are what the player reads in the HUD and what the model receives. A player character has 8 Health and 6 Strain.

### NPC tiers

| Tier | Health | Strain | Ratings | Charges |
| --- | --- | --- | --- | --- |
| Minion | 2 | 1 | One rating for everything, rank 0 | None |
| Rival | 5 | 4 | Per approach, fixed rank 1–2 | None |
| Nemesis | 8 | 6 | Per approach | Like a player |

### State catalog

Every row is the same CE primitive with different switches. Rows without bands never reach the model.

| State | Scope | Range | Bands | What it does |
| --- | --- | --- | --- | --- |
| Force, Finesse, Focus, Flair | char | 1–4 | none | Set pool size |
| Charges | char | +1 to +3 per slot | none | Upgrade dice; cycle when all are spent |
| Health | char | 8 (PC), by tier | 4 + down | Force target. At 0: down with an injury. Down while gravely injured: death |
| Strain | char | 6 (PC), by tier | 3 + spent | Flair target on NPCs; push cost. At 0: a PC is spent, an NPC gives way |
| Injury | char | minor, serious, grave | 3 | Setback on a related approach until treated with Focus |
| Edge | protagonist | 0–1 | none | Boost die on the next roll |
| Prepared | protagonist | 0–2, named | 2 | Focus output; boost on matching rolls |
| Leverage | relationship | 0–2 | 2 | Focus output; downgrades a difficulty die against that person |
| Story Points | protagonist | 0–2 | none | Player side; the rules side is what's left |
| Momentum | protagonist | −3 to +3 | none | Hidden; flips a Story Point at either end |
| Alert | place, event | 0–3 | 3 | Finesse's cost. At 3: the scene is roused |
| Obstacles (lock, integrity) | event | author-set | author-set | Owned by an approach; opening one can end the encounter |
| Bond tiers | relationship | existing | existing | Flair triumph or despair moves a tier |
| Time | world | clock | phase | Focus's cost; schedules fire on the hour |
| Item condition | item | 0–3 | 3 | Despair target; gear adds damage, armour or boost |
| Faction standing | faction | 0–4 | 5 | Later |

## Two channels to the model

Standing facts: each banded state that isn't at rest writes one line into its owner's lorebook entry, such as *\[Vess is bruised.\]* The moment's outcome: one plain directive, placed just before the model writes, used once. The Encounter tab shows both after every roll.

## Open questions

- Creation budget numbers, and whether Orbis already has its own.
- Injury list and what treats each severity.
- Whether Bonds show numbers to the player.
- Who authors encounter states and difficulties, Orbis or Speculus.
- Faction standing scale and what moves it.

## The dice

Genesys uses six custom dice. Good dice add success and advantage; bad dice add failure and threat. Opposite symbols cancel, then you read what's left. Triumph and despair don't cancel each other; each also counts as a success or failure.

## Build a pool

[ ] Spend a Story Point

## Where the odds come from

These aren't simulated. Every face of every die is combined exactly, so each percentage is the true chance for that pool. The table below shows one character's chance to succeed against Average difficulty, by approach rating and charge spent.

Each charge adds roughly six points. A charge higher than your approach also adds a die, which is why big charges matter most on weak approaches.

## What each approach owns and pays

Each approach pays from a different place: Force in Health and noise, Finesse in Alert, Focus in time, Flair in Strain. Each owns states the others can't touch.

## The ownership rule

- **Owner:** moves the state normally.
- **Secondary:** one setback die, and failure costs what the owner would pay. Force can lower a guard's Strain through intimidation, but it's Flair's ground.
- **No claim:** can't move it. Charming a gate does nothing to its lock.

Authors set ownership per state. The defaults on this page mean most scenes offer every approach something, at a different price.

## The factor's yard

Night in Hollowmere's warehouse district. A Brackenjaw consignment sits behind a barred oak gate, and a badgerfolk guard walks the yard with a club. Vess, a foxfolk courier, wants through the gate.

Illustrative scene and characters, not canon. Vess has Force 1, Finesse 3, Focus 2 and Flair 2, a knife and lockpicks. The guard is a rival with leather armour.
