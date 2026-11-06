# Praxis — Bogwater Module Plan

Oct 18, 2026 · @AmbiProp

## Decided

Bogwater, with a runaway from a Port Covenant indenture as the protagonist and the autumn eel run as the start. Port Covenant retires as the test module once Bogwater covers its tests, since its content was shaped by them. The Dyffryn waits for the owner's core idea.

This revision points the plan at fantasy adventure: high stakes and hijinks first, ordinary life only as the reason people are where they are. The fen's trade is no longer simulated; the protagonist's purse is. Places and people earn records by use, and partitions are proposed below. The structure itself is on Bogwater.

## Ground rules

Bogwater has to be worth an adventure first and believable second. Ordinary life explains why a door is open at night; it is never the content.

1. **Adventure first.** Every thread carries something people can die over, lose their freedom over or start a war over, and leaves room for hijinks.
2. **A place earns a record by use.** It exists if a thread stages a scene there, or the rules need it: rest, trade, a way between, an obstacle, a line you can't cross. Each place should serve several threads and both day and night. Nothing exists only to hold people between stops.
3. **A person earns a record by use.** Each named person is at least one of these to an adventure: a door (passage, access, information), a lever (bought, won, blackmailed), a threat, a prize or a mark. Relatives who are none of these stay names in their family record.
4. **Few people at once.** At most four named people in a partition at any hour, plus a crowd line ("eel-catchers mending traps"). The census test holds schedules to it.
5. **World first, tests second.** Nothing is authored only to exercise a feature. The coverage audit maps features onto what exists; a gap is filled with something the fen would have anyway, or stays listed.
6. **Mechanics follow character.** Tier, rank, price and difficulty come from who someone is, with a one-line reason on the record. Test notes live in the test map, never in a record.
7. **Labels as in the Abernys docs.** Owner, Suggestion, Belief. Every invention is `canonStatus: "draft"`, and owner material is never bent to suit play.

## Partitions

**Recommended: build them.** A partition is a named part of one place, with the place's description and lore, its own people, and no travel between. It answers both worries at once: fewer place records, and fewer people in a scene.

|  | Partition | Child place (what Praxis has now) |
| --- | --- | --- |
| Record | A line inside its place | A full place record |
| Description and lore | The place's, plus one line for the partition | Its own |
| Moving there | Free and quiet | A hop at its depth tier's minutes |
| Map | Listed inside the place | A destination of its own |
| Who is present | Only that partition's people | Only its own people |
| Alert | The place's: noise carries | Its own |
| Use it for | Rooms, yards, stretches of the same ground | Anywhere with its own lore, access, danger or distance |

**How it works:**

- **Schedules** name a place and, optionally, a partition. No partition means the place's first one, its common ground.
- **Presence.** The dramatis personae lists only your partition: `[ Present in the Myrtle, the loft, at night: … ]`. Others in the same place are neither sent nor shown.
- **Moving** between partitions is a quiet move: no time, no turn, and followers come along. Saying it in the story ("I go up to the loft") works too.
- **Alert is shared.** A fight in the taproom puts the loft on guard. Nobody crosses partitions to join a fight unless their schedule or a follow already brings them, as with a fight that ends.
- **Things** sit in a partition: Morwen's chest is in her workroom, not loose on her island.
- **Closed partitions** use the closed-way rule. Entering anyway is allowed, and counts as trespass.
- **Promotion.** A partition that needs its own lore entry, Alert, danger or distance becomes a child place, like a lord's chambers with an artifact in them.
- **Offstage.** A schedule stop can send someone offstage, so homes that host no scene stay unmodelled. Praxis needs this with or without partitions.

**Engine work, about one release:** `partitions` on places; a `partition` on schedule stops, things and the player's position; presence filtered by partition in the context compiler; a rooms list in the Scene menu; the census test counting heads per partition.

**Without partitions** the module still works on child places and tighter schedules, at the cost of more records and more map clutter. The places on the Bogwater tab are written so either works.

## Time, calendar and change

Time data lives on the cheapest record that can hold it, and change comes from consequences more than from the calendar. Most saves will play a month or two, so the month is the unit worth authoring.

| Layer | Lives on | Holds | Burden at 100+ people |
| --- | --- | --- | --- |
| A day | Each person | One daily round: where they are, hour by hour. Exceptions only for primary people, one or two rules each, such as Cadfan's trip downriver | One round each; perhaps 15 people with exceptions |
| A month | Each region's calendar | Weekly and monthly events (boat day, sitting day) and a few yearly festivals. Each names its place and hours, and who comes by group: every Crone, every trap crew, all of Bogwater | Five to eight events a region |
| A season | Each region | Four season lines, and a weather table the clock rolls each morning. Fog closes the ways marked for it; a storm makes a run night | Four lines and one table a region |
| A story | Each thread | One-off story events counted from the save's start, such as Orlo at the dock on day 11, and the world states they set | A handful a thread |

**Events call people by group, not by name.** A festival overrides the day of everyone in its groups for its hours, so it costs one record instead of forty schedule edits. While it runs it can change its place too: a crowd line, the hours, prices, which partitions are open.

**The calendar** stays the real one until Abernys has its own, and nothing here depends on its shape.

**What makes the world feel like it moves,** cheapest first:

1. **Consequences set world states, and states switch on lines.** A place or person can carry a short line that only shows while a state holds: "While the fen is at war: the trap crews carry spears out to the fences." One line per consequence, never a new record or schedule.
2. **Standing opens the map.** Bonds, and later fen standing, open partitions, prices, scene actions and routes. Progress shows as places that let you in.
3. **Travellers carry news.** A few people with weekly or monthly loops between regions (traders, patrols, envoys) tie the regions together. Each world state can carry one rumour line that anyone in the right group may pass on, so what the player did reaches the next region before they do.
4. **Threads end and the region shifts.** A region holds a few threads on clocks of two to four weeks. When they resolve, its states change, and an aftermath thread or the next authored one starts.
5. **Hour and weather do the rest.** Day and night rounds and the morning's weather make two visits to one place different, at no cost per record.

**Engine work:** events with group attendance and effects on their place; world states with conditional lines on places and people; seasons and a daily weather roll on regions; rumour lines on states. Daily rounds with weekday and month exceptions exist already.

## Growing the cast

The ripple stays, with the use test as its brake: households and schedules still name the next people and places, but only the ones an adventure can use get records.

1. **Anchors.** The twelve the threads can't run without (Bogwater tab).
2. **Household.** A family record for each anchor: who they live with, who they owe, who they won't speak to. Members who pass the use test become records; the rest stay names in the family.
3. **Day.** One daily round, with exceptions only for primary people. Each stop lands on a place and partition that already exists, argues for a new one under rule 2, or goes offstage.
4. **Who else is there.** Each stop asks who else is in that partition at that hour. Anyone who passes the use test is the next ring.
5. **Stop rule.** A ring closes when it adds no new place and nobody new who passes the use test. Expect about 12 people in full and 12 light. Everyone else is a name in a family or part of a crowd line.

**The census** runs the clock through two weeks after each ring and fails on anyone in two places, any partition over four named people, any place nobody visits, and a quiet landing on an eel night.

## Coverage against Praxis

Everything Port Covenant tests has a native home in Bogwater, which is what lets it retire. Phase 6 checks this against the finished records; a feature with nothing native stays a listed gap rather than getting a prop.

| Feature | In Bogwater |
| --- | --- |
| Schedules, holds, wait and rest | Boat day, sitting day, eel nights, the patrol's rota, night work |
| Travel and routes | The channel, the causeways, flatboats; fog closing ways |
| Partitions (new) | The landing, the Myrtle, the Crones' house, Morwen's island |
| Followers: companion, captive, won over | Gethin the boatman; a patrol soldier taken alive; Ellis won over |
| Bonds and tiers | Every fen relationship starting cool, and colder for the colony's ink |
| Gangs, rank, a fight that ends, a nemesis | The patrol; Corran; Orlo, the returns officer |
| Obstacles | Cadfan's store, Morwen's workroom and chest, the back-room bar and the loft trap door |
| Alert and Finesse deeds | Nest's island; the landing at night; the patrol's camp |
| Leverage and Prepared | Grudges three generations deep; the fen's ways |
| Coin, buying, selling, bargains, bribes, not for sale | The landing, the store, the buyer; the sergeant for sale, the officer and the Crones not |
| In your pay | Gethin and his flatboat by the day |
| Bound, and freeing | The runaway's own indenture |
| Making with Focus | Smoke pots, moss dressings, a fen pole, a forged release |
| Milestones and experience | Thread beats |

**Not built yet, and where Bogwater will press on it:** partitions and offstage stops; an "open" good (a flatboat, a Crone's token); standing with the fen as a whole; holdings (somewhere to lie low that's yours); item wear; NPC opposition dice; and weather the clock moves, for fog that closes the causeways.

## Writing rules

Pulp-voice holds for every record field, because the narrator copies the records' voice before it follows any rule. Section numbers refer to its anti-patterns list.

- **Descriptions show what's there:** bodies, objects, work, weather. No narrator commentary, no guessing at absent people's reasons (§14), no "shouldn't have but did" (§15), no "Not X. Y." (§16).
- **Personality is behaviour a scene can test:** "counts the barrels twice and the coin once". No adjective strings, no named feelings (§1), no both-ways character held up for inspection (§4).
- **One tell a person, and one comparison a record at most,** concrete and mundane, never extended past its first image (§11).
- **People show their people, briefly.** One or two traits and a colouring, so a reader knows a salamander or a badger at a glance: "glossy black with orange blotches", "the white of his face stripe gone yellow". Never a restated species record. Colourings can be bold; bodies stay real.
- **Speech is rhythm and habit:** how they talk past people, deflect and lie (§6). No sample lines, by house rule.
- **Violence costs.** A record says what a wound does to someone afterwards, and threads carry the consequence forward (§5).
- **Humour lives in people and situations,** shoved up against danger and never flagged (§10). Hijinks need people who'd fall for them and people who'd pull them.
- **Names read aloud on first sight.** Welsh and Old English are the inspiration, not the spelling: Bronwen, Ellis, Tegan, Lowri, Gethin, Edric, Corran. Anything a reader would stumble on gets anglicised, as Meurig becomes Meyrick. A few plain fantasy names are fine; the stock shelf isn't: Elara, Kael, Lyra, Thorne, Seraphina, Vex, Rowan, Nyx.
- **No glossary words.** Plain words over trade words: dock, not staithe; eel fence, not weir; channel, not lode; island, not hummock; flatboat, not punt. The setting's own names (the Woed, the Crones, tamecap) are fine, because the lore explains them.
- **Prompt echo.** Words from these docs and reviews ("hijinks", "grounded", "stakes") stay out of the records.
- **The supernatural stays where the owner put it.** Witchcraft is unconfirmed, and nothing the Woed doc keeps open is settled here, Rabitis included.
- **After each batch,** run the anti-patterns checklist, then read for families built to one pattern and people who all talk like the narrator.

## Phases

Each phase ends with something to read and react to before the next begins. Records are written in Orbis field names throughout, so the finished slice doubles as an Orbis proposal.

**Status, 18 October.** Frame, anchors, ring and numbers are done, and the module is built and in CI in [PR #22](https://github.com/HowlingWhispers/HW-Praxis/pull/22) (Praxis 0.20.0), so phase 7 is down to playing it. It runs on child places with free hops, so phase 1 can come later without rewriting records. Phase 6, the coverage audit, is next, and Port Covenant stays until it's done.

- [ ] **Partitions in Praxis,** alongside the frame, so the module is written for them from the start.
- [x] **Frame.** The Bogwater tab made concrete: each place with its partitions, access and hours; each thread's beats and milestones; the opening scene; the purse's numbers.
- [x] **Anchors.** The twelve in full, with households and daily rounds.
- [x] **Ring.** The use test over every household and stop until it closes, with the census after each pass.
- [x] **Numbers.** Tier, rank, price and difficulty for each person; the goods list and loot; experience per milestone.
- [ ] **Coverage audit.** The test map, filled from what exists.
- [ ] **Build and play.** `abernys-bogwater` in `praxis-module/1`, the census test in CI, then play. Port Covenant retires when Bogwater covers its tests.

## Decisions still open

The module is built as proposed, so any of these can still change: Lowri is the one turning, the test character is the shipwright's runaway, all four routes to freedom are in, and rooms are child places.

- [ ] **Partitions.** Build them, or child places with tighter schedules.
- [ ] **Who is turning.** Morwen's ward, as proposed, or someone else in the fen.
- [ ] **The test character.** Proposed on the Bogwater tab: a human who walked off a shipwright's indenture, with Flair as their weak approach. The player can change all of it.
- [ ] **Routes to freedom.** Keep all four, or narrow them.
- [ ] **For the owner,** in one batch, now the frame is done. The current list is on the Bogwater tab, under Where it stands:
  - What salamanders are like as a people. The species record is drafted on the Bogwater tab.
  - Whether the fen shelters runaways from the colony, and what it does with a human one.
  - Whether Cadfan can be the Low Road's man in the fen.
  - Whether a fen burning can stand in for a death the Pact will record, and whether Meurig can be spelled Meyrick, the way it's said.
