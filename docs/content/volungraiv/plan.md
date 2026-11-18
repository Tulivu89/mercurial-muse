# Volungraiv: the plan

Nov 18, 2026 · @AmbiProp · The adventure's first module and its test bed. Where it starts, how it gets built from sources, what finished looks like, and what the owner decides first. Read with `docs/content/sources/README.md` (the source method), `docs/content/modules/process.md` (slice, pattern, frames and fills) and `docs/content/standard.md`. Nothing here is canon until the owner answers the questions at the end.

## In short

- **The method:** every region, town, faction, family, lead and thread starts from a named source: a lead source and one or two for seasoning. Each source gives a shape, a list of questions and a bar for quality. We keep the dynamics and re-root them in Volungraiv's own material (titan blood, the kin, the planes, contracts on skin), and never keep names or details. A source sheet turns into a frame; the frame turns into a fill.
- **Where it starts:** settle the canon (the two drafts disagree), write a one-page atlas, then build **Qetzal** as the slice. Qetzal's source sheet is already drafted as a worked example (`sources/qetzal.md`).
- **What finished means:** version 1 is **the Badlands, with Qetzal at its centre**, played end to end. The Witch Queen's kingdom and the Wandering Woods are edges in version 1 (rumours, a border place, people who came from there) and become full regions in versions 2 and 3.
- **What it costs the owner:** about two hours to settle the canon and the atlas, then the six checkpoints of the slice, then five to fifteen minutes per frame after that.

## Where we're starting

### What exists

| What | Where | State |
| --- | --- | --- |
| The premise, seven kin, three regions | `docs/bids/content/Initial content ideas.md` | The owner's current direction. A sketch. |
| Dark Lord Funk: a premise, style, standing ladders, 48 places in four regions, 7 factions, 13 characters | `docs/bids/content/darklordfunk_workbook.md` and the card | An older take. The owner: the characters can mostly be adapted; the setting has drifted. |
| The module process | `docs/content/modules/process.md` | Written for exactly this, with Qetzal named as the first place |
| The standard, the checker, the records skill | `docs/content/standard.md`, `npm run content:check`, `.claude/skills/inkwyrm-records/` | Proven on the resort and HOG Wild (Homes, not modules) |
| The rules a module can use | `core/rules/`, `core/map/` | Four approaches, tiers and ranks, states, standing, goods and prices, threads and milestones, travel by level on hex maps, the evaluator (adventure 0.28.0) |
| What's coming that the module has to feed | `docs/reviews/adventure/decision.md` (A2, A3) | Opponents' moves, progress clocks, story events a narrator can trip |

### Where the two drafts disagree

Each row needs a call before the atlas. The proposal is a recommendation, not a decision.

| Topic | Dark Lord Funk | Initial ideas | Proposal |
| --- | --- | --- | --- |
| **Who rules** | Three Witch Queens: Gildra (gold, debt, pleasure), Soriana (fire, arena, zealots), Escrutia (death, a legion that waits) | One Witch Queen, "one such remaining tyrant" | **One Witch Queen.** "Remaining" means others fell. The Badlands are what's left of a fallen tyrant's realm (below). Gildra and Soriana's material goes into the Witch Queen and her court; Escrutia stays out of version 1 or becomes the dead tyrant. |
| **The map** | Ironpeak Crags, the Ashlands, the Gilded Expanse, the Sunless Coast | The Witch Queen's kingdom, the Badlands and the Bastards, the Wandering Woods | **The three regions from Initial ideas.** DLF's places are mined for parts: the Titan's Ribcage becomes a Bastard's hold, the arena and the ziggurat go to the kingdom, the Broken Steppes become Badlands ground. |
| **Peoples** | Goblins, wolven, tauren, saurian, "Orekin Fae", "Cinderkin Fae", revenants | Cinderkin, Orekin, Beastkin, Lunarkin, Solarkin, Succori, humans | **The seven kin.** Wolven, tauren, saurian, vulpen and pantheren are beastkin peoples. Goblins need a call: beastkin, small Succori, or cut. |
| **The player** | Echidna's apex descendant, come to conquer and break the taboo | Not set | **An open start in Qetzal**, with a few backgrounds. The conqueror is kept as a later scenario: it's a strong one, and the Badlands are built for a player who takes ground. |
| **The taboo** | Titan blood must never cross with Echidna's line | Not mentioned | Keep it as deep lore, and decide whether the resort's Echydna is the same Mother of Monsters (a cross-world nod; no feature links worlds). |
| **The tone** | Richard K. Morgan's hard surface and Tanith Lee's decadence; explicit; second person, present | "Heavy metal" tyranny, orgies of sacrifice | **Keep DLF's style lines** as the world's narrator instruction, checked against pulp-voice. |

### What the module has to give the rules

From `docs/content/next.md`, so each feature has something to bite on. The slice's coverage table (process, checkpoint 5) must fill every row.

| The adventure needs | Volungraiv's first answer |
| --- | --- |
| Things worth a check, with difficulty set on purpose | The Peace token at Qetzal's gate, a Lunarkin contract, a lock in the counting-house, the glass storm |
| An opponent with a tier and approaches (A2) | A Bastard's enforcer in the pits; a behemoth on the road, which can't be fought, only avoided |
| A thread with milestones on a clock (A2) | The Witch Queen's envoy coming for Qetzal's answer, on a clock the player can hear ticking |
| Moments a narrator can trip by name (A3) | **The storm bell** (glass storm: everyone under a roof), **the caravan comes in**, **the envoy arrives** |
| Routes and a map that make travel cost time | Qetzal at a crossroads; the next town days away across open ground; storms that close a road |

## The method, for Volungraiv

The full method is `docs/content/sources/README.md`. In this world it has one more layer: **the cosmology is the re-rooting.** Volungraiv is the mortal crossing point of the primal planes. Every borrowed drama is answered through what the planes, the titans and the kin make true here and nowhere else.

### The cosmology, as a working table (proposal)

| Plane | Who came from it | What it does to the world |
| --- | --- | --- |
| The titans' planes (fire, earth and metal) | The titans; through them the Blooded, Cinderkin and Orekin. Humans share their ancestors | Titan bones as landmarks; places where a titan died still run hot or heavy |
| The planes of light | Solarkin | Glyphs on the skin: identity, and crimes written where everyone can read them |
| The planes of darkness and night | Lunarkin | Contracts on the skin: who owns whom is legible to anyone who can read it |
| The Woed | Beastkin, once human, sent back changed | The Wandering Woods are where the Woed touches the world (to confirm) |
| Damhaven | Succori, the latest arrivals | Distrust, a shut-out quarter, and rumours of a door still open somewhere |
| The seam between planes | Nobody; it's weather | **Glass storms** (lightning and sand fused into falling glass), wandering behemoths. The Badlands sit on the seam. |

This gives every region its weather and every people its use to a story. Three of these are rules as much as lore:

- **Skin you can read.** A Lunarkin's arms say who they work for; a Solarkin's crimes are on show; a Cinderkin's scars glow and are hard to hide at night. Reading someone is a Focus check with something real to find, and a forged or redacted mark is a scene.
- **Contracts that bind.** A contract inked on a Lunarkin is the deal, and breaking it marks them for life. That's leverage with teeth, and the player can end up with ink of their own.
- **Storms that stop everything.** When the glass storm comes, everyone in Qetzal shares a roof with whoever's next to them. It's a named event, a travel hazard and the best scene engine the city has.

### The atlas, first pass

Each region and major faction with its sources. The owner cuts and redirects here; it's cheaper than anywhere later. Sources are named for their shape only.

| Region | Lead source | Seasoning | What we take | Re-rooted in |
| --- | --- | --- | --- | --- |
| **Qetzal**, the free city | Ankh-Morpork's licensed guilds, inverted: the guilds really rule and the titular baron is for show | Palmyra, the caravan city between two empires; Mos Eisley's every-kind-of-traveller crowd | Crime that's licensed and taxed; a city that lives because two powers need it neutral; a crowd where every kin rubs shoulders | The Peace is a Lunarkin contract; the glass storm; the only roof in the Badlands |
| **The Badlands and the Bastards** | Mad Max's wasteland warlords, each holding one thing everyone needs | Deadwood's frontier camps; Yojimbo's town between two bosses | Fiefs built on monopolies (water, a pass, fuel); colourful bosses; towns that are one bad week from changing hands | The Bastards are the unacknowledged Blooded heirs of the fallen tyrant, fighting over the estate. Behemoths, glass storms, titan bones. |
| **The Witch Queen's kingdom** | Slaver's Bay: pyramid-ruled cities, bought soldiers, fighting pits | Commodus's Rome, where the ruler fights in her own arena; Dark Sun's sorcerer-king city with its templars and ziggurat | Order bought with chains; the arena as politics; a priesthood that is also the police | She is Blooded, a near-god by birth. Her cult is the old titan priesthood that still supplies her consorts. |
| **The Wandering Woods** | The fae court in *Jonathan Strange & Mr Norrell*, which steals people for a ball that never ends | Ravenloft's mists, which take people from anywhere; The Witcher's swamp hags, three sisters behind closed doors | A court with rules that are traps; a border that comes to you; bargains | The Woed, the plane that made the beastkin. The woods remember them. |

| Faction | Lead source | Seasoning | Where |
| --- | --- | --- | --- |
| The guilds of Qetzal (the Compact) | Venice's councils | Ankh-Morpork's guilds | Qetzal |
| The underguilds | Riften's broken thieves' guild | The Camorra; yakuza ink (it meets the Lunarkin's) | Qetzal |
| A Lunarkin counting-house | The Iron Bank of Braavos | The Medici | Qetzal, with branches in the kingdom |
| The Bastards (each one a faction of one) | Mad Max's warlords | Renaissance condottieri | The Badlands |
| Beastkin packs and herds (DLF's wolven, tauren, saurian) | DLF's own factions, which are good | Khajiit caravans that camp outside city walls | The Badlands, outside Qetzal's gate |
| The Witch Queen's cult | Dark Sun's templars | The Inquisition | The kingdom; an envoy in Qetzal |
| Her enslaved host | The Unsullied | The Mamluks, the slave soldiers who took the throne | The kingdom; the envoy's guard |
| The pit houses | House Batiatus's ludus | The Hippodrome's Blues and Greens, who rioted and nearly took the city | The kingdom's arena; one small pit in Qetzal |
| The Wandering Court | The Seelie and Unseelie courts of folklore | Changeling's bargains | The Woods |

### Lead characters

The owner's example is the right goal. Players want the old wizard, and the vampire's daughter who walks out on her father's war. Each lead gets a source line in Mythic Overdrive's form; DLF's characters bring their own drafts as raw material, and the source line outranks the draft.

| Who | From | Source (proposal) | Where they'd live |
| --- | --- | --- | --- |
| The Witch Queen | Gildra, with Soriana's arena | To pick: Cersei's court and appetite, or Daenerys at her hardest in Meereen | Her temple-palace; version 2 |
| Her heir, who wants out | New | Serana of Skyrim's Dawnguard: the daughter of a monstrous parent, sealed away for a plan she won't serve, and a companion | Comes to Qetzal in version 1. A follower and a thread. |
| A wandering wizard | Nostromandu, re-sourced | Gandalf: arrives when he means to, knows more than he says, fond of small people, terrible when roused | Passes through Qetzal. A door to every region. |
| A pit fighter | Vigga (wolven) | Spartacus or Crixus, to pick | Qetzal's pit in version 1; the kingdom's arena in version 2 |
| A thief | Yumiko (vulpen) | To pick | Qetzal's underguilds |
| A merchant | Nefera (pantheren) | To pick | Qetzal's market |
| An assassin | Kaelen (Orekin) | To pick | Wherever her contract sends her |
| A priestess | Ilia (human) | To pick | The Witch Queen's cult, or its envoy in Qetzal |
| Qetzal's titular baron | New | Deadwood's Swearengen, cut down to a figurehead who knows it and minds | Qetzal |
| Four Bastards | DLF's chieftains, and new | Mad Max's warlords, one shape each | Their holds in the Badlands |

### How it makes stories without us

A module can't script its way to emergent play. It has to be built so that play makes the story. Six rules for every frame:

1. **Pressures, not plots.** Every settlement holds two forces that want things they can't both have, each on a clock. The player tips them; nobody waits for the player.
2. **Vacancies.** Somewhere in every region there's a title, a seat or a name that can be taken: a barony, a seat on the Compact, a champion's place in the pit. The Badlands are built for this. A Bastard can fall, and the player can be the next one.
3. **Every kin wants something from every other.** The kin are built so that meeting is already a hook: who reads whose skin, who owes whom, who is shut out where.
4. **What the player does stays done.** A milestone flips When sections and states. The quarter after the riot is a different place, and the people in it say so.
5. **Rumours travel.** What the player did reaches other towns as lore keyed on their name and deeds, one region over and a few days late.
6. **Every person is a use** (process.md): a door, a lever, a threat, a prize or a mark. Ties are the web that makes a lever in one place pull a person in another.

## The order of work

| Stage | What's made | The owner | Sessions |
| --- | --- | --- | --- |
| **0. Canon and atlas** | Answers to the questions below; the atlas as `atlas.md`; the world's premise, tone and narrator lines | About an hour, mostly picks | 1 |
| **1. Qetzal's sheet** | `sources/qetzal.md`, finished from the owner's picks (a worked draft is already there) | 10 minutes | Part of stage 2 |
| **2. The slice** | The module process, part 1, checkpoints 1 to 6: Qetzal's gate and market quarter, played | Six short checkpoints, and an evening of play | 2 or 3 |
| **3. The pattern** | `pattern.md`: the gold set, the voice, names, numbers, decisions, budgets | 15 minutes | 1 |
| **4. Qetzal whole** | Its other quarters, its factions, three or four threads; sheets for the families and the underguilds | A sheet and a frame per round | 2 or 3 |
| **5. The Badlands** (version 1 done) | Three or four towns, four Bastards' holds, the roads and wild ground; each from its own sheet | The same, per town | 4 to 6 |
| **6. The kingdom** (version 2) | The capital, the arena, the temple-palace, the cult | The same | 4 to 6 |
| **7. The Woods** (version 3) | The court and its edges, which may want engine work (below) | The same | 3 or 4 |

The writing sessions and the adventure's code sessions (A2, A3) can run side by side. The slice is what A2 and A3 get built against.

### What finished looks like, roughly

Guesses, to size the work. The real numbers come from the slice and the pattern page.

| | Places | People | Groups | Threads | Items and lore |
| --- | --- | --- | --- | --- | --- |
| The slice | 6 | 6 | 4 (2 kin, a faction, a family) | 1 | 6 |
| Qetzal whole | 25 | 35 | 10 | 4 | 30 |
| Version 1 (the Badlands) | 80 | 100 | 20 | 10 | 70 |
| The full module | 200 | 250 | 35 | 25 | 150 |

Most of those records are a Line and little else, which is the point of the tiers. Fewer than one person in five is a lead or someone a thread turns on.

## What could go wrong, and how we'd catch it

| Risk | Catch |
| --- | --- |
| A place reads as a copy of its source | Blend rule; the owner's read of every sheet; no name points back |
| A drama that would play the same anywhere | The re-root test on every sheet's dramas |
| Sources from memory that are wrong | They only need to be right in shape. The owner confirms each lead source. |
| Too many sources, and the place turns to mush | One lead, two seasoning at most |
| Sheets add review time instead of saving it | Measured (below). If a sheet doesn't shorten the frame review, it shrinks. |
| The Woods need a place with no fixed parent | It's a question for the map code, raised before stage 7, not a reason to bend the slice |
| The kin's skin rules spread into every record | The kin's group records hold them; a member shows them in one trait (house rule) |
| DLF's explicit material sits wrong in a module | The world's tone is decided at stage 0, with the site's 18+ setting in mind |

## Testing the method

This build answers two of the standard's open assumptions (A7: does reviewing lines catch most problems? A8: does a fill from a pattern hold up?). It adds two of its own:

- **S1: a sheet makes the frame review faster and better.** Count the owner's cuts and redirects on Qetzal's frame, made from a sheet, against HOG Wild's frame, made without one.
- **S2: a source bar catches what the checker can't.** At each fill, read ten records against the sheet's bar, and count what it flagged that the checker didn't.

## Questions for the owner

Short answers are enough. The first four block the atlas; the rest can wait for the slice.

1. **One Witch Queen or three?** Proposal: one, with the Badlands as the fallen tyrant's realm and the Bastards as its unacknowledged heirs.
2. **The map:** the three regions from Initial ideas, with DLF's places mined for parts?
3. **Goblins:** beastkin, small Succori, or cut?
4. **The player:** an open start in Qetzal, with the conqueror kept as a later scenario?
5. **Is the Wandering Woods where the Woed touches the world?**
6. **The taboo and Echydna:** keep the taboo? Is the resort's Echydna the same Mother of Monsters?
7. **Sources:** is anything off-limits, or anything you especially want used? Games, books, film and real history are all on the table.
8. **The Witch Queen's lead source:** Cersei or Daenerys at her hardest, or another?
9. **The slice:** Qetzal's gate and market quarter (`sources/qetzal.md` has the case), or another quarter?

## The next session

> Read `CLAUDE.md`, `docs/content/volungraiv/plan.md` with the owner's answers, `docs/content/sources/README.md`, `docs/content/volungraiv/sources/qetzal.md`, `docs/content/modules/process.md`, `docs/content/standard.md`, the `inkwyrm-records` skill, and the Volungraiv sources in `docs/bids/content/` (Initial content ideas, the Dark Lord Funk workbook and card). Don't read or draw on `docs/abernys/` or Bogwater. This is the adventure's next module and test bed; read `docs/reviews/adventure/decision.md` for what its first slice must give the rules. Write `docs/content/volungraiv/atlas.md` from the answers, finish Qetzal's sheet, and run the module process's part 1 from checkpoint 1. Hand each checkpoint back as one markdown file and stop. Never use the owner's real name; sign docs `@AmbiProp`.
