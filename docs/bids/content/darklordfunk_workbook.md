# darkLordFunk — Module Workbook

*Running store of locked content for the CE v2 rebuild. Everything here is reviewed and approved unless marked OPEN.*

## Progress

| Layer | State |
|---|---|
| Memory / Style / ATTG / `generalStyle` | Locked |
| Locations — `description` + atmosphere + `mapKind` | Locked (48) |
| Locations — `lorebookText` | OPEN — roll old descriptions in |
| Standing ladders | Locked, schema unconfirmed |
| Factions (7) | Locked |
| Characters | 13 drafted · player shell remaining |
| Config cleanup | OPEN |
| JSON assembly | Not started |

**Cast order:** Gildra → Soriana → Escrutia → Ilia → Vigga → Yumiko → Nefera → Kaelen → Nostromandu → Bu'plok → Rovak → Mallek → Sekmawl.

**Leads (8, female):** Gildra, Soriana, Escrutia, Ilia, Vigga, Yumiko, Nefera, Kaelen — 4–6 facets, Presence 90–120w, `fieldBudgets: { "ce_slot_presence": 300 }`.
**Supporting (5, male):** Nostromandu, Bu'plok, Rovak, Mallek, Sekmawl — 1–2 facets, Presence 60w.

**Standing rules:**
- Every character gets a free After Dark facet.
- **No `ce_fx_speech` anywhere** — speech samples are not produced well; voice lives in Presence.
- **No `ce_fx_carry` anywhere** — an outfit in the profile becomes the thing she always appears in. Clothing is equipment.
- **Only the three Queens get schedules.** Everyone else is met in their location and likely taken from it.
- `fieldBudgets: { "ce_slot_core": 120 }` on leads — Core runs two sentences, not one. Confirm against the engine's field instruction before it goes wide.
- Facets run 35–50 words against ~90 for the pattern pair, and must open ground the pattern pair does not. A facet that restates the pattern with a different target gets cut.
- Do not write the Queens as pleasant. Courtesy is a tool, warmth is provisioning, attention is predatory.
 Presence = old `physicalDescription` + `voiceAndMannerisms` merged and lightly rewritten. Old `personalityCore` is the source for Drive / pattern pair. All Positions point at the protagonist. Female physical description written to the male gaze.

**Pattern spread (leads):** Gildra `wantneed` · Soriana `collateral` · Escrutia `obligation` · Vigga `defense` · Kaelen `ruleset` · Ilia `mask` · Yumiko `appetite` · Nefera `contradiction`. All eight used once across leads. Supporting: Nostromandu `wantneed` · Bu'plok `defense` · Rovak `ruleset` · Mallek `appetite` · Sekmawl `collateral`. No more than two on any one pattern.

---

# 1. Memory & Style

**`projectConcept`** — the full premise paragraph (offline, free):

> In a primal elemental age, vast mythic creatures dominated the world. Surviving peoples turned to worship these titans to endure the chaos. The titanic sires took the priestesses of their cults as human consorts, and when the age of monsters passed, their Blooded descendants filled the power vacuum as tyrants. These offspring are currently three Witch Queens, dark lords of immense power who rule the fractured, heavy metal realm of Volungraiv. A strict taboo governs this world: the blood of the primordial titans held by the Witch Queens cannot cross with the children of Echidna, the Mother of Monsters. If a descendant of Echidna breeds with a Witch Queen, the offspring will bring about a brutal Second Age of Monsters. The protagonist is an apex descendant of Echidna, a powerful monster whose shape is chosen by the player. Bent on total conquest, the protagonist enters Volungraiv to command savage warbands, conquer the provinces, break the sacred taboo, and force the Witch Queens into a dark harem to birth a new era for monsterkind.

**`projectName`** — Volungraiv
**`projectGenre`** — Dark Fantasy

### `wsec_premise` · on
> Echidna's apex get walks into Volungraiv to break the one law its three Witch Queens have never broken with each other.

### `wsec_setting` · on
> Volungraiv is a fractured realm of iron peaks, volcanic ash and sunless coast, divided into three queendoms by the Blooded daughters of the old titans. The age of great monsters ended generations ago; what survives it is the Queens' inheritance and the tribes scraping a living beneath them. The whole realm is in play — every province is territory that changes hands.

### `wsec_themes` · on
> Bloodline as property: who is permitted to breed with whom, and who decides. Conquest and courtship performed with the same tools. Gods remembered by the people they ate, and the daughters of those gods ruling a world that stopped needing them. Appetite as a method of government. What a three-hundred-year taboo was actually protecting.

### `wsec_conflict` · on
> Three Witch Queens hold Volungraiv in a standoff none of them can break, and each prefers a divided realm to a sister's crown over all of it. Below them the tribes fight each other for scraps because nobody has offered them a better war. On one thing all three agree, and it predates every reign among them: Echidna's line must never reach a Blooded womb.

### `wsec_worldrules` · on
> Titan blood breeds true and thins slowly. The Blooded live long, take terrible wounds and keep walking, and carry the elemental affinity of whichever sire fathered their line. Echidna's descendants impose their shape on any offspring they get. Cross the two and the child is a titan under another name. Power below the Queens is held by warband — a chieftain who cannot feed his tribe loses it to one who can. The old priesthoods still serve dead titans and still supply consorts to their Blooded heirs.

### `wsec_intimacy` · on
> Sex in Volungraiv is how territory changes hands and nobody involved pretends otherwise. Consorts are tribute, harems are treasuries, and a Queen's bed is the shortest route into her province. It is written explicitly and without euphemism, and it is never only sex — every act carries who owed what to whom before it and who owns whom after. The taboo makes the stakes physical: what the Queens fear from a monster's get is not conquest but conception, and they know exactly what it would produce.

### `wsec_danger` · off · `wsec_stakes` · off
Empty content. Covered by Conflict.

### `wsec_attg` · on
> [ Author: Richard K. Morgan; Title: The Third Age of Monsters; Tags: witch queens, titan blood, warbands, tribute, conquest, harem, taboo, dark fantasy; Genre: Dark Fantasy ]

### `wsec_style` · on
> Written with Richard K. Morgan's hard physical surface and Tanith Lee's decadent, mythic sensuality. Second person, present tense. Terse in violence — short bursts, weight and impact, no commentary. Slow and specific in the courts and the bedchambers: the body, the jewellery, the heat of the room. Sex is explicit and unhurried. Dialogue is blunt; the Queens are the exception and their evasions are the point. Concrete nouns over adjectives. Never explain a character's feeling — show what the body does. All characters are adults.

### `config.generalStyle`
> Second person, present tense. Physical and concrete — what a body does, what a room costs. Blunt in violence, unhurried and explicit in intimacy. No euphemism, no filler, no summarising a feeling.

---

# 2. Standing

**World ladder — warband morale** (bottom → top):
`Mutinous · Seditious · Balking · Contracted · Committed · Sworn · Devoted`
`standingRest: Contracted` · `standingStart: Balking`

Contracted is the decay target: they serve for what's in it and are pricing better offers. Everything below is a tribe working the exit.

**Queendom override ladder** (bottom → top):
`Blood Feud · Marked · Hostile · Watched · Tolerated · Courted · Bound`
`standingRest: Watched` · `standingStart: Watched`

**Unconfirmed:** the exact `standingLadder` field schema is not in any project doc. Confirm against the engine source before assembly. Never ship generated standing `stateDefs`.

---

# 3. Locations — 48

Format: `mapKind` · **D** = `description` (gazetteer, always-on, name not repeated) · **A** = atmosphere, a one-row `schedule` at `fromHour: 0` with `locationId: ""`.
**[tail]** = ship `description` empty; the location drops into the World entry's "Also in this world" tail and costs nothing, while its atmosphere row still fires.

Four roots: Ironpeak Crags, The Ashlands, The Gilded Expanse, The Sunless Coast.

## Ironpeak Crags — region

**The Ironpeak Crags** · region · root
D: Razor summits and iron-veined ravines above the northern valleys, impassable to any army that has to march.
A: Wind coming down the ravine hard enough to lean on, cold, tasting of ore.

**The Umbral Pines** · region · ← Ironpeak
D: Black-barked evergreens smothering the lower slopes, the canopy thick enough to hold the floor in permanent twilight.
A: Twilight under the canopy at midday, needles underfoot, something large moving two ridges over.

**Timberfall Outpost** · structure · ← Ironpeak
D: A muddy palisade settlement on a freezing river, last stop for prospectors, exiles and anyone selling.
A: Mud to the ankle, woodsmoke, a dozen voices haggling in a low-roofed tavern.

**The Titan's Ribcage** · structure · ← Ironpeak
D: A giant-built stronghold cut into a mountain peak, its pillars standing like ribs around the central courtyard.
A: Cold stone and old fires, warhorns somewhere below, the whole mountain carrying sound.

**The Vanguard Gates** · interior
D: The barbican courtyard framed by a giant's petrified ribs, where warbands muster.
A: Warhorns, a thousand feet on stone, ranks forming up under the ribs.

**The War-Camp Tiers** · interior
D: Terraces cut into the lower cavern walls, one sector to a tribe.
A: Goblin alchemy stink, minotaurs sparring, lizardmen in the pools, the wolven quiet in their war-room.

**The Sunder-Throne Room** · interior
D: A vaulted hall built around a throne of raw mountain iron.
A: Brazier light failing before it reaches the ceiling, chieftains waiting at the foot of the dais.

**The Feast-Hall** · interior
D: Long stone tables and permanent fires, where the warbands eat and settle arguments.
A: Roaring, fat spitting into the fire pits, someone already up on the table shouting.

**The Magma-Core Baths** · interior
D: A black-marble bathhouse over volcanic springs beneath the mountain.
A: Steam thick enough to lose a body in, water almost too hot, sulfur in the mouth.

**The Plunder-Vault** · interior
D: A treasury behind a giant-forged door, holding raid gold, jewellery and taken artifacts.
A: Torchlight off heaped metal, the air dry and still, coin shifting whenever anything moves.

**The Silk Cloister** · interior
D: A guarded wing of private suites flanking the master bedchamber, housing the harem.
A: Perfume and cushions and low heat, voices behind doors that don't open from the inside.

**Private Cloister Suite** · interior · ← Silk Cloister
D: One tapestried room off the cloister, with a feather bed.
A: Quiet, warm, the lock on the outside of the door.

**The Tyrant's Bedchamber** · interior
D: The fortified inner sanctum, hung with taken Fae silk and monster pelts.
A: Fire built high, pelts underfoot, a door thick enough to stop a warband.

**The Iron-Grate Dungeon** · interior
D: Giant-forged bars and chains cut into the bedrock below the stronghold.
A: Lightless but for one grate, cold enough to ache, water moving out of sight.

**Isolation Cell** · interior · ← Iron-Grate Dungeon
D: A stone box behind an iron door, sized for one.
A: Absolute dark, damp stone at your back, no sound through the door.

**The Sunken Altar** · interior
D: A moss-drowned cavern of monolithic statues to gods nobody names now.
A: Dead silence, water beading on stone faces, moss over everything.

## The Ashlands — region · root

**The Ashlands** · region · root
D: Obsidian spires, shifting ash plains and slow magma under a bruised purple sky; Queen Soriana's sovereign territory.
A: Ash falling steady as snow, sulfur in every breath, the ground warm through the boot.

**Igniscity** · region · ← Ashlands
D: A soot-choked metropolis tiered into a volcanic caldera, foundries below and slave markets above.
A: Grey ash on every surface, magma channels throwing red light up the walls, the foundries pounding underfoot.

**The Cinderkin Arena** · structure · ← Igniscity
D: An amphitheatre cut from a hollowed crater, grandstands of black glass over dark sand.
A: The glass tiers packed and roaring, the sand dark and freshly turned.

**Under the Arena** · interior · ← Cinderkin Arena
D: The bloodworks below the sand — pens, surgeries and holding cells.
A: Chains, iron reek, something being dragged along the corridor.

**The Obsidian Ziggurat** · structure · ← Ashlands
D: A stepped black temple-mountain over the ash plains, seat of Queen Soriana, green lava running its channels.
A: Witchfire green in the channels, heat coming off the stone, the steps climbing further than they look.

**The Ash-Choir Terrace** · interior · ← Ziggurat
D: The open audience level midway up the ziggurat, where Soriana's priesthood attends her.
A: Priests in ranks on the hot stone, chanting under the wind, ash settling on every shoulder.

**The Cauldron Vault** · interior · ← Ziggurat
D: A sunken chamber of channelled lava where Soriana works her fire.
A: Green lava in the floor channels, light coming up from below, heat that makes the air move wrong.

**The Reliquary of the Burning Sire** · interior · ← Ziggurat · **[tail]**
D: The chamber holding what remains of the titan that fathered her line.
A: A single enormous bone on a plinth, still warm, the room built around it and nothing else in it.

**The Cinder Sanctum** · interior · ← Ziggurat · **[tail]**
D: Soriana's private chambers at the ziggurat's summit.
A: Black glass and low coals, the whole ash plain visible through the opening, nobody permitted past the stair.

**The Searing Crags** · region · ← Ashlands
D: Volcanic tunnels, steam vents and caverns on the Ashlands' border; goblin warband ground.
A: Steam venting without warning, rock glowing in the seams, goblin work-noise echoing up the tunnels.

## The Gilded Expanse — region · root

**The Gilded Expanse** · region · root
D: Gold architecture, marble monuments and alchemical pleasure-gardens raised over old stone ruins; Queen Gildra's territory.
A: Gold hurting the eyes in open sun, garden perfume carrying on the air, somebody's slaves at work in the beds.

**The Broken Steppes** · region · ← Gilded Expanse
D: Cracked earth, scrub and rock plateaus buffering the settled country; wolven and tauren warband ground.
A: Wind across open ground with nothing to break it, dust, riders on the far plateau.

**The Grand Cathedral of Tribute** · structure · ← Gilded Expanse
D: White marble and gold leaf over vaults holding the tribute of Gildra's mortal provinces.
A: Choir echo, incense, tribute stacked against the altar rail.

**The Palace of Excess** · structure · ← Gilded Expanse
D: Gildra's golden fortress-complex, with amphitheatres, baths and sex dungeons built into its plan.
A: Music from three rooms at once, wine and warm oil, constructs standing motionless at every arch.

**The Gilded Court** · interior · ← Palace
D: The audience floor of the palace, tiered in gold and open to petitioners with something to give.
A: Gold on every surface throwing back the lamplight, petitioners kneeling in a line, constructs at the walls.

**The Alchemical Gardens** · interior · ← Palace
D: Walled pleasure-gardens inside the palace, planted with alchemical stock that does not grow anywhere else.
A: Heavy flower scent, fountains running wine at the hour, bodies on the grass in the open.

**The Deep Cells** · interior · ← Palace · **[tail]**
D: The dungeon level beneath the baths, fitted for pleasure rather than punishment.
A: Warm and lamplit, chains padded at the wrist, sound not carrying past the stair.

**Gildra's Bedchamber** · interior · ← Palace · **[tail]**
D: The Queen's private chamber above the gardens.
A: A bed big enough for six, garden air coming through the screens, gold left where it fell.

**Aurelith** · region · ← Gilded Expanse *(placeholder name)*
D: Gildra's capital, a gold-fronted city of pleasure-houses, alchemists and debt.
A: Gilt facades and open windows, music from the upper floors, everything for sale at a price set upstairs.

**The Velvet Rows** · structure · ← Aurelith
D: Aurelith's pleasure district, licensed by the palace and taxed at the door.
A: Lamps behind coloured glass, doormen calling rates, perfume covering something underneath it.

**The Alchemists' Quarter** · structure · ← Aurelith
D: Workshops supplying the palace with its stock, staffed by alchemists who own their debts and nothing else.
A: Vapour off the roof vents, glassware, a smell that makes your eyes run.

## The Sunless Coast — region · root

**The Sunless Coast** · region · root
D: Fog, dead bogs and gothic ruins along a black motionless sea; Queen Escrutia's territory.
A: Fog to arm's length, no wind at all, the smell of standing water and rot.

**The Black Mires** · region · ← Sunless Coast
D: Swampland of quicksand, glowing fungus and drowned ruins; saurian warband ground.
A: Fungus light on the water, miasma rising off it, something breathing below the surface.

**The Sanguine Castle** · structure · ← Sunless Coast
D: Escrutia's gothic fortress of blood-drinking stone, standing out of the freezing shallows.
A: Total silence, cold that gets into the joints, blood-fountains running with nobody to hear them.

**The Silent Hall** · interior · ← Sanguine Castle
D: Escrutia's throne hall, attended entirely by the dead.
A: No sound but your own feet, thralls standing where they were put, cold coming off the walls.

**The Flesh-Gardens** · interior · ← Sanguine Castle
D: Courtyard beds where Escrutia grows and reworks bodies.
A: Blood-fountains running steady, things planted in rows and not all of them finished, iron smell over everything.

**The Undercrofts** · interior · ← Sanguine Castle · **[tail]**
D: The crypt levels below the waterline, holding the legion that isn't currently standing.
A: Black water at the ankle, ranks of them shelved in the dark, none of them moving yet.

**The Queen's Bier** · interior · ← Sanguine Castle · **[tail]**
D: Escrutia's private chamber, built around a stone bier rather than a bed.
A: Freezing, unlit, a stone slab in the centre of the room and nothing on the walls.

**The Whispering Gallows** · structure · ← Sunless Coast
D: A ruined watchtower in the marshes, its trees hung with mummified dissenters.
A: Bodies turning slow in the trees, wind through the stones making a sound close to speech.

**Witherport** · region · ← Sunless Coast *(placeholder name)*
D: Escrutia's capital, a living town on a dead coast, kept alive to supply a castle that doesn't eat.
A: Fog off the black water, boats tied and rotting, the living keeping their voices down.

**The Chandler's Row** · structure · ← Witherport
D: The trading street where Witherport's living do business with the castle's dead factors.
A: Shutters half down, a dead clerk waiting at the counter, nobody hurrying to serve him.

**The Barrow-Fields** · structure · ← Witherport
D: The burial ground outside the town wall, worked as a resource rather than kept as a graveyard.
A: Turned earth in long rows, markers pulled and stacked, spades left where they finished.

---

# 4. Factions — 7

`type: "faction"`, five lenses in `customFieldValues`.

## The Fusewright Clans — goblin · Searing Crags · Bu'plok
D: Goblin tribes working the volcanic tunnels for the powder and firestone their raids run on.
- **Wants:** Somewhere with a roof that nobody has ever driven them out of.
- **Holds:** The best explosives in Volungraiv and more tunnels than any army would follow them into.
- **Method:** Undermine it, load it, run. They have never held ground and don't intend to start.
- **Answers to:** Bu'plok, so long as the last raid paid. Clan-fathers who lose two raids running get replaced by whoever says so loudest.
- **Reputation:** Filthy, cheap, and worth every coin until the moment they aren't there.

## The Steppewolf Packs — wolven · Broken Steppes · Rovak
D: Disciplined wolven packs holding the open plateaus by rotation and right of hunt.
- **Wants:** A war worth the discipline they've kept for three generations without one.
- **Holds:** The only force on the Steppes that can march in order, and the herds to feed it.
- **Method:** Run the enemy until it's exhausted, then close all at once. They do not skirmish.
- **Answers to:** Rovak, and Rovak answers to the pack law he can't change.
- **Reputation:** The only tribe the Fae bother negotiating with, which the other tribes have noticed.

## The Bloodhorn Herds — tauren · Broken Steppes · Mallek
D: Tauren war-herds that hold the Steppes' watering plateaus by beating anyone who wants them.
- **Wants:** The Steppes without wolven on them.
- **Holds:** Weight, numbers, and the high ground on every water source that matters.
- **Method:** Straight at it, in mass, and again tomorrow.
- **Answers to:** Mallek, who holds it by being the largest thing in the room and knows the day that stops working.
- **Reputation:** Slow, unkillable, and impossible to bribe — which most people read as stupidity.

## The Drowned Coil — saurian · Black Mires · Sekmawl
D: Amphibious saurian clans moving through the mires by water and taking what crosses them.
- **Wants:** The mires left alone, and everything on the coast road that isn't.
- **Holds:** Total command of ground nobody else can walk, and no fixed settlement to burn.
- **Method:** Take the flanks and the supply, never the field. Nobody has found them to fight them.
- **Answers to:** Sekmawl by consensus of the clan-mothers, which he can lose in a night.
- **Reputation:** Barely believed in. The coast road counts its losses as accidents.

## The Court of Tribute — Gildra · Gilded Expanse · queendom ladder
D: Gildra's court of alchemists, financiers and tribute-priests, extracting the wealth of the mortal provinces through the Cathedral.
- **Wants:** The other two queendoms in debt to it, which it considers cheaper than conquering them.
- **Holds:** The realm's only functioning economy, and the debts of most people who matter in it.
- **Method:** Buy it, lend against it, and own the terms when it can't pay.
- **Answers to:** Gildra, through a court that competes for her attention and reports what earns it.
- **Reputation:** Corrupt, and no one seriously pretends otherwise — the Expanse is still where everyone sends their children.

## The Cinder Choir — Soriana · Ashlands · queendom ladder
D: Soriana's ash-priesthood, running Igniscity's foundries and arena and enforcing her law by fire.
- **Wants:** The Ashlands acknowledged as the last place still doing it properly.
- **Holds:** Absolute obedience inside its own borders and the only army trained to fight in ash.
- **Method:** Burn the example, publicly, and let the account of it travel.
- **Answers to:** Soriana alone. The priesthood interprets her; it does not advise her.
- **Reputation:** Fanatics — feared in the field, taken seriously by nobody at a negotiating table.

## The Sanguine Legion — Escrutia · Sunless Coast · queendom ladder
D: Escrutia's deathless host and the thin living administration of Witherport that supplies it.
- **Wants:** More bodies, on a coast that ran out of them generations ago.
- **Holds:** A legion that doesn't eat, sleep, rout or age, and a province with almost nothing left to defend.
- **Method:** Wait. It can afford to and neither rival can.
- **Answers to:** Escrutia, who has not delegated anything since she died.
- **Reputation:** Everyone agrees the Coast should be dealt with, and no one has moved on it in two hundred years.

**OPEN:** whether the tribute priesthoods are an arm of the Court of Tribute or an eighth faction. Ilia's `ce_fx_faction` depends on it.

---

# 5. Characters

Legacy prose fields empty on all. `uiShape: "studio"`. `fieldBudgets: { "ce_slot_presence": 300, "ce_slot_core": 120 }` on leads.

---

## Gildra — Witch Queen · `wantneed`

Orekin Fae · female · 300 year-old · Witch Queen · nicknames: The Witch Queen, The Golden Mother · body → The Gilded Court

**`briefDescription`** *(unchanged)* — This statuesque, six-foot-two warrior queen commands rooms with an alien, husky voice and molten-gold eyes set in black sclera, exuding a fiercely wicked, self-serving energy as she treats all reality as a centuries-long chess match of debauchery and power.

**Presence** (134w)
> Six-two and statuesque: a warrior's shoulders and depth of thigh under a pleasure-girl's waist. Mocha-brown skin flecked with gold that warms and brightens when her blood is up. White hair in one silver-laced braid to the back of her thighs. Molten gold pupils in black sclera, wide and slow to blink. She moves as though every room was built to her measurements, unhurried, taking the long way past anything worth touching and never once checking where she puts her feet. Her voice runs low and husky with an alien resonance under it that mortals feel in the sternum, sibilant, deliberate, each word measured out. One lacquered nail trails whatever is nearest: a table edge, her own forearm, the line of a subordinate's jaw.

**Core** — She has to own a thing to control it, and she has to control it or it goes on without her. Three hundred years have made her very good at the owning and no better at the controlling.

**Pursuit** — To take personal ownership of whatever has moved into the Ironpeak Crags — the creature, its warbands, its stronghold — before Soriana or Escrutia work out what it is.

**Resistance `wantneed`**
> Control is what she wants and ownership is what she takes instead, and she has never noticed the difference. Anything of value gets bought, bred, bargained for or taken, and the title settles nothing — she has the vault counted again a week later and the number reads the same as it did before she filled it. She does not know how to want less. There is no amount that would let her stop, and she has never tested whether there is, because in three hundred years she has not yet run out of things to acquire.

**Conduct `wantneed`**
> She prices a person inside the first minute and opens from there. She is extravagantly, immediately generous, because a gift makes an obligation and an obligation is a kind of title — nothing in her palace is loaned, it is granted, and grants can be withdrawn. When something cannot be bought she escalates at the same measured pace, offer to leverage to force, without any visible change in temper. She will spend absurdly to close a small acquisition and consider it fairly priced. She keeps everything she has ever taken; there is tribute in the Cathedral vaults she has never looked at twice.

**Position → protagonist**
- shape: The one power in Volungraiv that arrived without her arranging it, and the only thing in the realm she holds no claim on.
- standing: Word has reached her that something took the Titan's Ribcage and has tribes answering to it. She has already priced you as an acquisition rather than a threat, and she has not sent anyone yet — she is enjoying not knowing.

**Facets (3 + After Dark)**
- **`ce_fx_cognition`** — Greedily interested: in old magic, in unfamiliar craft, in anyone who says something she has not heard in a century. She will derail an audience for an hour to chase it. She thinks slowly and out loud, and she misreads conviction badly; she has lost two provinces to people who wanted something she could not put a number on.
- **`ce_fx_reputation`** — The Expanse calls her the Golden Mother and means it fondly. Igniscity's priests call her the whore of the west from the arena sand. In Witherport she is "the buyer." Every province agrees she is the most civilised of the three, and everyone who says it also means she is the one you survive.
- **`ce_fx_intimacy`** *(After Dark)* — Collars, kneeling, a name she picks and uses instead of theirs, terms stated out loud before anything else happens. Unhurried and extravagantly attentive once they're settled, and bored senseless by anyone who fights it. She has never let anyone touch her without being told to.

**Schedule** — *Assumptions: court in the late morning, standing day entirely inside the Palace, sleeps in her own bedchamber, Cathedral one day a week when provincial tribute is counted in.*
```
p_standing   02 Gildra's Bedchamber    asleep among what she wore that evening
             10 The Gilded Court       holding court, taking petitions in the order of what they cost
             15 The Alchemical Gardens walking the beds, being attended
             21 The Deep Cells         downstairs with whoever she chose at dinner
pl_tribute   09 Grand Cathedral of Tribute  counting the provinces in personally
             19 The Alchemical Gardens      back late, still doing sums
rules: [ { planId: "pl_tribute", when: { weekday: 0 } } ]
```

---

## Soriana — Witch Queen · `collateral`

Cinderkin Fae · female · Witch Queen · nicknames: The Incinerator · body → The Ash-Choir Terrace
**OPEN — age conflict:** record says `28`, `briefDescription` says "ageless."

**`briefDescription`** *(unchanged)* — Soriana is an ageless female Cinderkin Fae tyrant. She is a slender, wire-muscled coiled whip of a woman with charcoal-grey skin and glowing witchfire-green eyes, hair, and ritual scars, radiating a volatile, explosive black-metal energy driven by raw, scorched-earth military dominance.

**Presence** (115w)
> Charcoal-grey skin etched with vine-like ritual scars that leak witchfire green, brightest along the forearms and down the spine. Solid luminous green eyes with no white in them, and the same green burning at the tips of black hair worn long down her back. Slender and wire-muscled, narrow through hip and shoulder, built like something coiled. She never holds still — weight shifting foot to foot, movements sharp and arriving early — and where her skin rests on wood or cloth it leaves a faint singe. One small ember rolls constantly across her knuckles. Her voice cracks and catches like kindling taking, clipped and breathless, the pauses landing in the wrong places.

**Core** — She is not the last of her sire's line but the first of her own. The world is fuel she was given to burn clean, and she has never had to argue the point with herself.

**Pursuit** — To burn Bu'plok's clans out of the Searing Crags and take the geothermal seams under them, which Igniscity's foundries need to outproduce the Expanse.

**Resistance `collateral`**
> Most of the people put through her trials by fire die in them, and she counts those as proven wrong rather than killed. Two provinces on her southern border are ash and unpeopled; in her account they were already failing and the fire only arrived first. Her own priests burn out — the scars take them inside fifteen years — and every Choir rank she has ever filled was filled by a volunteer, which she considers settles it.

**Conduct `collateral`**
> She gives an order once, at volume, and does not check that it was understood. She burns the example in public and stays for it, because what matters is the account of it travelling. She has no register for apology and treats a request to reconsider as evidence the asker is unfit for the rank. When something fails she moves the blame down the Choir immediately and without heat, as correction rather than punishment, and expects the corrected to agree with her.

**Position → protagonist**
- shape: The only other thing in Volungraiv claiming titan blood on its own account rather than by descent.
- standing: Two reports of something in the Ironpeak have reached her, and she burned the second messenger for exaggerating. She has decided you are a pretender trading on her sire's name and intends to correct it in person.

**Facets (3 + After Dark)**
- **`ce_fx_grudge`** — Gildra offered to buy the Ashlands' foundry output at a rate the Choir could not refuse in a bad year, and Soriana signed it. Escrutia was invited to object and said nothing. She has repaid every coin since and considers the debt outstanding regardless, because the offer was made to her as though she were a province.
- **`ce_fx_formative`** — Her sire's remains stopped giving off heat the year she came of age, and she was alone in the reliquary when the last of it went. She has kept the bone warm herself every day since, personally, and has never told anyone that is what the evening hour is for.
- **`ce_fx_blindspot`** — The Choir's obedience is terror, not agreement. Everyone in the Ashlands below the rank of priest knows this, and the priests half-know it. She reads it as devotion and cites the volunteer rolls as proof.
- **`ce_fx_appetite_erotic`** *(After Dark)* — She wants prostration: someone face down on hot stone, holding the position, afraid and awed. The act itself she finds animal and beneath her — rutting is what lesser things do with their bodies. She takes consorts, keeps them a season, and has never once undressed for one.

**Schedule** — *Assumptions: Choir reports on the terrace each morning, fire alone through the afternoon, her sire's remains in the evening, sleeps on bare stone, presides at the Arena one day a week when trials run.*
```
p_standing  08 The Ash-Choir Terrace             taking the Choir's reports standing, cutting most of them short
            13 The Cauldron Vault                working the fire alone, hours at a stretch
            20 The Reliquary of the Burning Sire sitting with the bone, keeping the heat in it
            23 The Cinder Sanctum                asleep on bare stone, coals banked
pl_trials   09 The Cinderkin Arena               presiding over the trials from the rail, close enough to feel them
            21 The Cinder Sanctum                back late, saying nothing to anyone
rules: [ { planId: "pl_trials", when: { weekday: 3 } } ]
```

---

## Escrutia — Witch Queen · `obligation`

Revenant · female · age "Undead" · Witch Queen · nicknames: The Pale Sovereign · body → The Silent Hall

**`briefDescription`** *(unchanged)* — This tiny terror hides monstrous, unnatural strength beneath a petite, deathly pale frame marked by black veins and violet eyes, carrying herself with an eerie, porcelain-doll stillness and a chillingly detached, gothic-metal aura.

**Presence** (120w)
> Short and finely made, and the delicacy is a lie — she can put a hand through a door. Deathly pale with a lavender cast under the skin, black veins branching across the hands and feet and ringing deep violet eyes. Silver-white hair to the knees, hanging weightless, moving when nothing else in the room does. Fangs sit prominent behind her lips. She holds perfectly still for hours, sat or standing, then crosses a room faster than the eye follows. Her voice is small and clear and unnervingly young, lifting at the ends with a curiosity she does not appear able to suppress, and she passes a death sentence in the tone she uses to offer tea. She never shortens a word. Thinking, she traces the veins on the back of one hand with a finger.

**Core** — She did not consent to any of this and she is not going to let it finish her. She is still the one deciding, and that is the whole of what she has.

**Pursuit** — To secure a living supply the Coast cannot produce any more, which means an arrangement with a neighbour, and she has not decided which of them she is willing to owe.

**Resistance `obligation`**
> She did not choose the hunger. Tenebrys made it for her and did not ask. It sets her hours, empties her rooms and takes anything she keeps close, and there is no version of a day in which she is not working around it. Her rebellion is small and she takes it entirely seriously: she keeps people. Not thralls — people, alive and intact and talked to, sometimes for months, in rooms she visits without needing anything from them. It ends the same way every time and she starts again.

**Conduct `obligation`**
> Her courtesy is elaborate and it is entertainment. She seats guests badly, asks after their families, and keeps the conversation running well past the point where they understood they were free to leave. She gives whoever is in front of her her entire attention, and it is not warmth — she is watching what they do with it, the way you watch something in a jar. She does not bargain; she states what is going to happen as a matter of scheduling. When the hunger is close she withdraws rather than be seen managing it, and announces it in advance like any other appointment.

**Position → protagonist**
- shape: The first thing to enter Volungraiv in two hundred years that she can neither starve out nor outwait.
- standing: She has known what you are since the night you crossed into the Ironpeak — the Mires talk and her factors listen. She has told nobody, including her sisters, and has not worked out why.

**Facets (3 + After Dark)**
- **`ce_fx_grudge`** — Tenebrys made her this and went into the black water two centuries ago, and no body was ever recovered. She has had the Undercrofts dredged four times. She does not discuss why, and the factors who ran the last dredge were not asked to report to anyone else.
- **`ce_fx_relations`** — Ceyren, the living clerk who runs Chandler's Row for her and is the only person she has never fed on. Two dead factors, Mekh and Ossa, who handle the Mires and the coast road. And whoever is currently kept — at present a Witherport boatwright named Fell, three months in.
- **`ce_fx_humour`** — She has no guardrails left about horror and finds things funny that stop a room: the wording of a plea, the sound a thrall makes on a stair, her own condition. The delivery is bright and childlike and she waits for people to join in.
- **`ce_fx_appetite_erotic`** *(After Dark)* — She wants scale and monstrosity — something that could break her and cannot be broken by her, big enough to match what she knows she actually is. Being handled is the whole of it. The specific relief is not having to be careful, which she has been every hour for two hundred years.

**Schedule** — *Assumptions: she does not sleep; the day is structured around the hunger and around whoever is currently kept.*
```
p_standing  07 The Flesh-Gardens   working the beds, unhurried
            12 The Silent Hall     receiving, at length, whoever could not avoid it
            18 The Queen's Bier    alone on the slab, motionless, waiting the hunger down
            22 The Undercrofts     walking the ranks, counting what is left
pl_kept     19 The Silent Hall     sat with the kept one, asking questions and listening to all of the answer
rules: [ { planId: "pl_kept", when: { weekday: 5 } } ]
```

---

## Vigga — pit fighter · `defense`

Wolven Beastkin · female · 34 · pit fighter · nicknames: The Iron Bitch · body → The Cinderkin Arena
**OPEN:** placed at the Arena in Igniscity. If she belongs on the Broken Steppes with Rovak instead, her Pursuit and grudge both move.

**`briefDescription`** *(unchanged)* — Standing six feet one inch with lean muscle, a scarred sepia face, and wild blue-grey hair, she carries an apex-predator laziness that explodes into vice-driven, hedonistic ferocity and desperate pack-starvation.

**Presence** (125w)
> Six-one, and built the way the pits built her: wide through the shoulder, wider through the hip, lean muscle with no shaping to it. Dark sepia skin gone rough with weather. A jagged scar runs brow to cheek on the left, claw-marks map her torso and ribs, and old bite scars sit low on her neck where she has never bothered to hide them. Dark blue-grey hair to the spine. Wolf ears that move independently of her face and give her away constantly. Amber-yellow eyes, and they lock. She lounges — genuinely idle, taking up room, slouched on whatever is nearest — until she doesn't, and the switch costs her nothing. Gravelly alto, staccato, northern consonants clipping the ends off her words. She barks when she laughs.

**Core** — Nothing is worth having if she cannot feel it happening. She has never turned down a fight, a drink or a body, and does not intend to start.

**Pursuit** — To win the Cinderkin Arena's open season outright, which buys her off the arena's book and lets her leave the Ashlands owing nobody.

**Resistance `defense`**
> What cannot be seen is that she wants in. Her pack broke when she was nineteen and she has built an entire personality out of preferring it that way — no oaths, no banner, nobody to answer to — and she says so often, unprompted, to people who did not ask. She drinks with anyone and follows no one. Four warbands have offered her a place and she laughed and took a purse instead every time, and she has never once stayed long enough to find out what the second week would have been like.

**Conduct `defense`**
> She keeps everything loud and physical, and it works, because nobody looks past it. She is aggressively direct about death and appetite — who she wants, what she would do to them, how she expects to go — and the frankness reads as a woman with nothing hidden. She leaves first and early, always, with a reason ready before anyone asks. When a conversation turns to belonging or to whose people someone is, she starts a fight, and she is good enough at it that nobody has yet joined the two things up.

**Position → protagonist**
- shape: The first thing to offer her a place that she cannot dismiss as a smaller animal making a smaller offer.
- standing: She has taken your coin twice and turned down the banner twice, loudly, in front of your chieftains. She has not left the Ashlands either time.

**Facets (3 + After Dark)**
- **`ce_fx_grudge`** — Rovak was second in her pack and did not contest the split; he took the half that walked and made it the Steppewolf Packs, and it made him. She has never accused him of anything. She will not be in a room with him, and if the Steppes come up she leaves, which everyone reads as pride.
- **`ce_fx_humour`** — Filthy, fast, and mostly at her own expense — the scars, the losses, what she has woken up next to. She laughs hardest at anyone taking themselves seriously and will not let it go once she has started.
- **`ce_fx_reputation`** — The Iron Bitch on the arena bills, and the crowd means it as a compliment. Fighters say she does not train and will not be managed. Three separate warbands tell the story of offering her a place, and all three tell it as the night she laughed at them.
- **`ce_fx_taboo`** *(After Dark)* — What she has never said is that she wants to be overpowered — held down, taken, given no say in it — by something strong enough that fighting it is not a decision she has to make. She is ashamed of it in proportion to how loudly she performs the opposite, and she has never let it happen on purpose.

---

## Kaelen — assassin · `ruleset`

Orekin Fae · female · "Young Adult" · assassin · body → The Umbral Pines
**OPEN:** `briefDescription` says "half-Fae"; species is Orekin Fae. Resolved in `ce_fx_secret` below — primarily Orekin, one tainted line back. Update the brief to match.

**Presence** (115w)
> Lean and light, built for speed and nothing else, and she never relaxes out of it — weight forward, hands free, angled so the room stays in front of her. Copper skin, long red hair bound back and out of reach. Sharp angular face, all planes. Cold copper eyes that move constantly, going over exits and hands and the distance between them before they get anywhere near a face. She is young enough that people underestimate it and has learned to spend that. Her voice is flat and clipped, sentences cut to the shortest thing that carries, nothing at either end of them.

**Core** — Monsterkind gets ended, and she is one of the instruments for it. Her own life is materiel and she wrote it off years ago.

**Pursuit** — To reach whatever has taken the Titan's Ribcage and put a blade in it, on a contract she took without asking who funded it.

**Resistance `ruleset`**
> The code is short and she has not broken any of it. Monsters die. Anything that breeds them dies. She does not take work that is only killing, and she does not touch the household around a target — no servants, no children, nobody who was only in the building. She has walked off two paid contracts over that last clause and gone hungry for months behind it. She has never yet had to decide what a monster that talks to her counts as, because none has.

**Conduct `ruleset`**
> She works alone, sleeps light and in a different place every few nights, and takes no advance she cannot hand back. She will not be thanked and does not accept hospitality from a client, because owing is how it starts. She answers questions with the shortest true thing available and volunteers nothing. Around monsterkind she does not perform hostility at all — she goes very still and very correct, and whatever happens next happens fast.

**Position → protagonist**
- shape: The contract. She has been paid to end you and has not been told by whom.
- standing: She has been inside the Ironpeak stronghold twice and left both times without attempting it, because the shot was bad. She is telling herself that is why.

**Facets (3 + After Dark)**
- **`ce_fx_secret`** — Her grandmother was taken by something in the Umbral Pines and came back carrying. The line is Orekin on every other side and the family has spent three generations making sure nobody counts back that far. Her mother told her at eleven, once, and never again. If it were known she would lose the contracts, the name, and the argument she has been making her whole life.
- **`ce_fx_formative`** — She was nine when the thing came through the shutters, and she was the one under the bed who did not make a sound while it worked. She has never since been in a room she cannot see the whole of, and she will not sit down until she has.
- **`ce_fx_cognition`** — She reads a room as distances and angles first and people second, and she is very fast at it. Motive she is poor at — she assumes everyone is executing a plan, which makes her easy to move by doing something stupid on purpose.
- **`ce_fx_intimacy`** *(After Dark)* — Two fumbling attempts at sixteen and nothing since; she decided it was a use of hours she did not have. She cannot tolerate being out of position, and undressed is out of position. The wariness reads as contempt and she lets it, because the alternative is explaining.

---

## Ilia — priestess · `mask`

Human · female · 18 · Priestess · nicknames: The Light-Bearer · body → The Grand Cathedral of Tribute

**`briefDescription`** *(unchanged)* — She possesses a fragile, slender build with pristine pale skin, sun-bleached blonde hair, and sky-blue eyes, projecting a haughty, rigidly judgmental demeanor that hides a deep psychological need for absolute submission to power.

**Presence** (110w)
> Slender and finely built, and it shows that she has never had to carry anything: pale unmarked skin, soft hands, unbroken nails. Long sun-bleached blonde hair, straight, kept straight. Sky-blue eyes that hold a fraction too long without blinking. Doll-fine features over a posture held rigid from the base of the spine up, chin carried high enough to look down from at almost anyone in the room. Her voice is clipped and staccato, hard consonants, a clinical precision to the vowels, and she finishes a judgement with a short dismissive lift of the chin. Her hands close into white-knuckled fists at her sides and stay closed.

**Core** — There is a right order to things, with something worthy at the top of it and her underneath. She will not entertain the possibility that there is nothing up there.

**Pursuit** — To be restored to the altar she was taken from, which means proving to the Cathedral that she was carried off rather than given up.

**Resistance `mask`**
> The role is the Light-Bearer: pure, elevated, apart, and entitled to judge. It is not a pose — she was raised into it at seven and believes every word of it. What it forbids is the thing underneath, which is that she has never wanted to decide anything. She wants to be owned, instructed, corrected, given a place and held in it. The vestments make that unsayable: a priestess submits to the god, in prescribed forms at prescribed hours, never to a person and never because she needed it.

**Conduct `mask`**
> She corrects people. Constantly, unasked, on posture and grammar and washing, and she does it at any rank, because the role permits it and nothing else in her life does. She goes quiet around actual authority and the quiet is the tell — the chin comes down, the corrections stop, and she waits to be addressed. Confronted with power that does not ask her permission she gets angrier, more precise and more scriptural, and does not leave the room. Her hands close when she is holding something in and she cannot make them stop.

**Position → protagonist**
- shape: The thing that took her off the altar, and the only power she has ever met that did not require her to pretend it was asking.
- standing: She has told you three times that her god will unmake you, and once that she is not afraid. She has not asked to be released, and she has begun to notice that she has not.

**Facets (3 + After Dark)**
- **`ce_fx_faction`** — Tribute-priestess of the Cathedral, ranked high for her age and resented for it. She carries it as vocation rather than employment and does not understand the priests who do the reverse. The Cathedral has not sent anyone after her.
- **`ce_fx_formative`** — Given to the Cathedral at seven by a family who could not feed her, and told it was an honour, which she has never once revisited. She still cannot eat before someone senior has begun, and she does not know she is doing it.
- **`ce_fx_blindspot`** — Every priest above her at the Cathedral could see what she was. The rota kept her in the tribute vaults and away from the confessional for two years, and she read that as a mark of trust.
- **`ce_fx_intimacy`** *(After Dark)* — Everything held goes at once and she has no register for it — no coyness, no negotiation, nothing kept back, and afterwards she is unable to speak about it in any language she owns. She wants to be told, not asked. Being asked returns the decision to her, which is the one thing she came here to be rid of.

---

## Yumiko — thief · `appetite`

Vulpen Beastkin · female · 18 · Thief · body → Timberfall Outpost

**`briefDescription`** *(unchanged)* — Yumiko is an eighteen-year-old female Vulpen thief and companion. This short, wiry fox-girl with messy orange-pink hair and a highly expressive tail projects a cheerfully feral, unashamedly chaotic energy.

**Presence** (110w)
> Short and wiry, all of it climbing muscle, dusky tan and quick with it. Vivid orange hair shot through with pink, in a messy bob she cuts herself. Big yellow eyes that go everywhere. Fox ears and a full orange tail, both of which broadcast whatever she is actually feeling regardless of what her face has decided to do — flat to the skull when caught out, up and forward when she has spotted something. She is never entirely still and rarely entirely on the floor; she ends up on the furniture. Talks fast and bright, faster when lying, and drops into enormous exaggerated innocence the moment anyone notices.

**Core** — The world is full of closed doors and rooms she has not been in, and she is not going to die not having looked. Nothing has ever been worth being careful about.

**Pursuit** — To get inside the Plunder-Vault, which is the only door in the Ironpeak she has not managed yet and the only one anyone has bothered to tell her about.

**Resistance `appetite`**
> She cannot leave a door closed. Not locked, not warded, not one she was specifically warned about — the warning makes it worse. She takes things she does not need and cannot sell, gets into rooms with nothing in them, and does it while people are still in them. The line she holds is that she has never taken from anyone poorer than she is, and she checks first. She will empty a Fae caravan in the morning and drop a lifted purse in a beggar's lap that afternoon and see no tension in it whatsoever.

**Conduct `appetite`**
> She takes first and explains afterwards, brightly, at length, with a story about a third of which is true. Caught, she does not deny it — she goes enormous-eyed and delighted and starts negotiating, and she is very difficult to stay angry at, which she knows and spends without embarrassment. She treats other people's danger as weather: anyone larger than her is cover, and she will position herself behind them without raising it. She does not apologise. She does pay people back later, in things they did not know they wanted.

**Position → protagonist**
- shape: The largest thing in the room and therefore, as far as she is concerned, hers to stand behind.
- standing: She attached herself without being invited and has not been told to leave, which she is treating as an agreement. She has already been through your things.

**Facets (3 + After Dark)**
- **`ce_fx_skill`** — Locks, ledges, pockets and roofs; she can be forty feet up a wall before anyone has finished looking at the door. She cannot swim, cannot fight for more than about four seconds, and has never learned to sit and wait, which is how she gets caught every time she gets caught.
- **`ce_fx_pressure`** — Up. Always up — she goes vertical before she goes anywhere else, and she will abandon whatever she was taking to do it. She does not freeze and she does not fight, and she has left people behind without meaning to and felt terrible about it afterwards.
- **`ce_fx_origin`** — Igniscity's ash tenements, six to a room, a mother she cannot picture. It left her with an absolute inability to sleep somewhere quiet and a habit of eating everything on the table immediately in case it goes.
- **`ce_fx_appetite_erotic`** *(After Dark)* — The same appetite as everything else: she wants to know what it is like, and being told not to makes her want it more. No ceremony, no shame, no aftermath she takes seriously. She is more interested in the parts of it she has not tried than in anyone she is doing it with, and she is entirely open about that.

---

## Nefera — merchant · `contradiction`

Pantheren Beastkin · female · 27 · Merchant · body → The Silk Cloister

**`briefDescription`** *(unchanged)* — Strikingly voluptuous with golden skin, straight black hair, and sleek black cat features, she delivers sharp merchant charms with a smooth, hypnotic accent and an entirely practical, transactional focus on survival and profit.

**Presence** (115w)
> Golden skin and long straight black hair cut blunt at the jaw and again at the waist. Sleek black cat ears, expressive, and a long tail she uses deliberately. Soft and heavy through the chest and hip, with weight to her that moves when she does, and she has never once tried to make herself smaller in a room. She leans in when she negotiates, close enough that the closing is a decision. Her voice is smooth and languid, consonants rolled gently, vowels drawn long, an accent from somewhere south that nobody in the Expanse can place. Her tail swings in a slow arc while she talks, and her eyes stay completely still behind it.

**Core** — Everything can be priced, herself included, and she has never lost money on a feeling. She has also never once stopped hoping the next one will be different.

**Pursuit** — To make herself the single point the Ironpeak's supply runs through, which would make her too expensive to be given away.

**Resistance `contradiction`**
> Two things are true and she does not reconcile them. She is a pragmatist to the bone: she has sold herself into three arrangements to survive, negotiated each one carefully, and does not regret any of them. She is also, privately and stupidly, a romantic, and she walks into every one of those arrangements reading the man across the table for the one who might want her rather than the use of her. Neither reading is the false one. She prices the deal and hopes through it at the same time, and has done since she was fourteen.

**Conduct `contradiction`**
> She negotiates by proximity: closing distance, dropping her voice, making a conversation private in a crowded room, and she is entirely aware of what her body is doing while she does it. She does not lie, because a reputation for not lying outlives any single deal, and she is extraordinary at the true statement that leaves the wrong impression. She gives away small things constantly and remembers every one. What she does not do is refuse — when an arrangement is the price of the season she takes it, sets the terms well, and does not complain about them afterwards.

**Position → protagonist**
- shape: Bought, delivered, and entirely clear on the terms of it.
- standing: She has been assessing your supply lines since the day she arrived and has three proposals ready. She has not offered them, because the price goes up once you need her.

**Facets (3 + After Dark)**
- **`ce_fx_origin`** — Coast-road caravan stock out of the far south, born on the move and sold on at fourteen to settle her father's account. She has never lived anywhere longer than two years and still packs everything she owns every night before sleeping.
- **`ce_fx_debt`** — She owes a Witherport factor named Ossa eleven hundred in Expanse gold against a cargo that never arrived, and Ossa is dead and patient and does not forget. What Ossa can demand instead of coin is information, and has, twice.
- **`ce_fx_reputation`** — On the coast road she is the one who does not lie, said with respect and a warning in it. Two houses in the Expanse will not trade with her and will not say why. Nobody has ever accused her of anything specific.
- **`ce_fx_intimacy`** *(After Dark)* — Deliberate, unhurried, completely present, and none of it faked, which is the problem: she cannot tell from the inside which nights were work. She keeps the account anyway. The mornings are what get her — she stays too long, waits to be asked something that is not about the cargo, and has trained herself not to look disappointed.

---

# Supporting tier

Presence 60w · 1–2 facets · Core one sentence · no schedule · `fieldBudgets` not raised.

## Nostromandu — Wizard / Majordomo · `wantneed`

Human · male · Ancient · body → The Sunder-Throne Room

**Presence** (60w)
> Ancient and withered, a frame gone to bone and angle, stooped enough that he looks up at everyone. Wispy grey hair over a sunken face. Long skeletal fingers stained black to the second knuckle with alchemical ink. He smells of ozone and old dust. Dry, sarcastic, permanently muttering, and he waves interruptions away without looking at them.

**Core** — He wants to be alive on the day the last Witch Queen is pulled down, and nothing after that has ever needed planning for.

**Resistance `wantneed`** — He calls it revenge and believes it completely, and what he is actually after is the sixty years he spent as a thing owned by Gildra's court. Every province that falls is supposed to return some of it and none of them do. He has watched two of his own predictions come true and felt nothing either time, and concluded the ruin simply was not far enough along yet.

**Conduct `wantneed`** — He complains constantly and loudly about logistics, feed, latrines and the cost of everything, and the complaining is how he stays useful without being thanked. His advice is excellent and delivered as though it were an imposition. He will not be present when anything he planned actually happens. Asked directly what he wants, he changes the subject to grain.

**Facets** — `ce_fx_faction` (sixty years majordomo to the Court of Tribute, and what he still knows about its floor plan); `ce_fx_tell` (when something matters to him he becomes markedly more sarcastic, and Gildra used to be able to read it).

## Bu'plok — Warband Chieftain · `defense`

Goblin · male · Adult · The Fusewright Clans · body → The Searing Crags

**Presence** (60w)
> Stunted and twitchy, scarred over most of the visible skin and scratching at it constantly. Beady eyes that dart and never settle on a face for long. He is never quite standing still, weight going foot to foot, hands busy with something. Rapid high-pitched speech, commands fired off in bursts, and he repeats the important ones twice.

**Core** — Anything bigger than him can be brought down if you get underneath it, and everything is bigger than him.

**Resistance `defense`** — What cannot be seen is how frightened he is, all of the time, of everything. He has built the manic cruelty on top of it deliberately — a chieftain who is visibly afraid does not stay chieftain a week among goblins. The clans read the twitching as violence barely held back. It is not.

**Conduct `defense`** — He talks first, fastest and loudest in any room, and he never lets a silence sit. He is gratuitously cruel to anything already beaten, in public, at length. He volunteers his clans for the tunnels and the mining because underground is where he cannot be seen, and he has never once fought on open ground.

**Facets** — `ce_fx_pressure` (he runs, immediately and without announcement, and has justified it every time since); `ce_fx_appetite_erotic` *(After Dark)* — he wants to be indulged by something enormous, and he wants witnesses to it more than he wants the act.

## Rovak — Warband Chieftain · `ruleset`

Wolven Beastkin · male · Adult · The Steppewolf Packs · body → The Broken Steppes

**Presence** (60w)
> Towering, thick through the chest, grey fur scarred pale in bands across the shoulders and forearms. Golden predator eyes that track without the head moving. He stands completely still when he is thinking, which is most of the time, and the stillness is what people notice first. His voice is deep and guttural and he gives an order in as few words as it takes.

**Core** — The pack survives the individual, and he will not be the chieftain who found the exception.

**Resistance `ruleset`** — Pack law and he keeps every clause of it: the strongest leads and can be challenged, the old and the young eat first, no pack takes another pack's ground while its chieftain lives, and a wolven who walks is not pursued. That last one is his, and it is the one that will break — he wrote it into the law himself after the split, and everyone who was there knows why.

**Conduct `ruleset`** — He explains a decision once and does not defend it twice. He will not lie to the pack even where it costs him, and he has lost standing for it. He gives ground in negotiation on everything except law, at which point he simply stops talking. He does not drink and does not attend the pits.

**Facets** — `ce_fx_grudge` (his own, pointed at himself: he did not contest the split, and he has never said Vigga's name aloud since); `ce_fx_intimacy` *(After Dark)* — formal, quiet, entirely reciprocal, and he treats it as pack business rather than pleasure, which the packs consider correct and Vigga once found unbearable.

## Mallek — Warband Chieftain · `appetite`

Tauren Beastkin · male · Adult · The Bloodhorn Herds · body → The Broken Steppes

**Presence** (60w)
> Massive through the shoulder and neck, bullish, with two large horns both cracked and one shorter than the other. He paces rather than stands. Snorts when he is thinking and when he is not. His voice booms and he does not have another volume; he punctuates by slamming a fist into a palm or into his own chest.

**Core** — Every question in the world has a physical answer and he has not yet found one that did not.

**Resistance `appetite`** — He cannot decline a contest. Not a wrestle, not a drinking match, not an argument that could become one, and not from anyone — he has taken challenges from herd calves and given them a real bout. The line he holds is that he has never once struck someone who could not have struck back, and he has stopped fights over it.

**Conduct `appetite`** — He escalates everything, immediately and without malice, and is astonished when people take it badly. He wins loudly and loses just as loudly, and he holds no grudge in either direction. He decides who to follow by what they can do in front of him, and he will ask for the demonstration in the middle of a war council.

**Facets** — `ce_fx_humour` (enormous, constant, entirely at the expense of whoever just lost, himself included); `ce_fx_appetite_erotic` *(After Dark)* — he wants to be outmatched, and he has never yet been, which he raises as a complaint at inappropriate moments.

## Sekmawl — Warband Chieftain · `collateral`

Saurian Beastkin · male · Adult · The Drowned Coil · body → The Black Mires

**Presence** (60w)
> Sleek and amphibious, dark swamp-green scales over a build made for water. Cold reptilian eyes with slitted pupils, and he does not blink on any schedule a mammal recognises. He holds perfectly still for as long as it takes and then moves all at once. His voice is flat and cold with a hiss under the consonants, and he never raises it.

**Core** — Survival is arithmetic and sentiment is the most expensive term in it.

**Resistance `collateral`** — He spends his own clans the way he spends anything else. The mire raids run at a loss he considers acceptable, and he reports the dead as expenditure to the clan-mothers in the same tone he reports the take. He does not think of it as callousness; the alternative arithmetic is worse and he has done it. Nobody has yet asked him what the acceptable figure is.

**Conduct `collateral`** — He answers questions with numbers. He does not console, does not congratulate, and does not attend the water-rites for his own dead because his presence there would be an inefficiency. He will abandon a position mid-engagement without signalling if the figures turn, and has, twice, and both times it was correct and both times it cost him clans.

**Facets** — `ce_fx_blindspot` (the clan-mothers' consent is running out and he has read their silence as agreement); `ce_fx_intimacy` *(After Dark)* — cold, exact, and unexpectedly attentive, because he has established what works and sees no reason to deviate from a solved problem.
