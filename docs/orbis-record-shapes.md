# Orbis — Worldbuilding Record Shapes

Oct 6, 2026 · @AmbiProp

Read from HW-Orbis at commit `ec38c66` (5 October 2026). Fields come from the type definitions, the world editor and the Bitterroot import; check the live repo before relying on anything here, since it changes.

## How Orbis stores worldbuilding

A world is one record that embeds six collections, and each collection entry is also its own library record linked back to the world. Characters, items and personas are separate records that point at world entries by ID.

| Collection in the world | Library record type |
| --- | --- |
| `locations` | place |
| `species` | species |
| `factions` | faction |
| `societies` | society |
| `families` | family |
| `memories` | memory (titled with `title`, not `name`) |

Record documents are free-form JSON: the editors only read certain fields, and any extra field you add is kept. The world document is capped at 128,000 characters. The import format is `orbis-authoring`, schema version 1, and imported worlds are forced private until reviewed.

### Fields every record shares

| Field | Type | Notes |
| --- | --- | --- |
| `name` | text | Up to 120 characters |
| `summary` | text | Up to 2,000 characters; the library card text |
| `contentRating` | `sfw` or `adult` | Adult access is enforced on the server |
| `tags` | list of text | Up to 20 tags, 40 characters each |
| `visualTone` | `moon`, `forest`, `ember`, `mist`, `violet` or `river` | Card colour |
| `document` | object | The type-specific fields below |

## World

The world document holds the setting's identity, lore and rules, plus the six collections. The editor tabs are Identity, Lore, Places, Species & Factions, Peoples & Societies, Family Trees, Memory & Timeline, Rules, Time & Weather, World Brain and World Settings.

| Field | Contents |
| --- | --- |
| `identity` | `name`, `description`, `genre`, `tone` |
| `lore` | `history`, `cultures`, `customs`, `importantFacts` (a list). Bitterroot also stores free-form blocks here, such as `lore.institutions.slaveMarket` |
| `rules` | `magicPhysics`, `technology`, `constraints` |
| `species`, `locations`, `factions`, `societies`, `families`, `memories` | Lists of entries, shaped as below |
| `timeWeather` | Seasons and related time settings |
| `worldSettings` | `visibility`, `showInLibrary`, `allowForking` |

## Places, societies, species and factions

### Place

Places nest through `parentLocationId`, so a settlement can sit inside a region inside an island.

| Field | Contents |
| --- | --- |
| `id` | Stable authoring ID, also used as `worldEntryId` |
| `name`, `description` | Text |
| `kind` | continent, major region, region, subregion, territory, settlement, town, village, district, wilderness, building, landmark, road or trail, river, lake, sea or ocean, other |
| `parentLocationId` | The containing place |
| Extras Bitterroot uses | `canonStatus`; travel fields such as `terrain`, `routeClass`, `distanceKm` and travel times `onFoot`, `mounted`, `cart`; generation rules for places with procedural populations |

### Society

The society form is the most detailed in the editor.

| Group | Fields |
| --- | --- |
| Identity | `name`, `type`, `parentSocietyId`, `description`, `origin` |
| Type options | clan, tribe, band, nation, confederacy, chiefdom, village community, nomadic people, pack, pride, herd, flock, colony, house, lineage, other |
| Territory and membership | `lifestyle` (nomadic, settled, mixed), `kinshipBasis`, `membershipRules`, `territoryLocationIds`, `settlementLocationIds`, `speciesIds`, `familyIds`, `territoryNotes`, `seasonalMovement` |
| Governance and life | `leadershipStructure`, `decisionMaking`, `customs`, `beliefs`, `languageDialect`, `livelihood` |
| Relations and canon | `allySocietyIds`, `rivalSocietyIds`, `factionIds`, `currentStatus`, `canonStatus` (canon, draft, disputed, historical) |

### Species and faction

The editor only asks for `name` and `description`; everything else is free-form. Bitterroot's records add fields such as `doctrine`, `leadershipStructure`, `livelihood`, `customs`, `territoryLocationIds`, `familyIds` and `factionIds`.

## Families, memories, characters, personas and items

### Family

| Field | Contents |
| --- | --- |
| `name`, `description` | Text |
| `people` | A list of members: `characterId`, `name`, `description`, and in Bitterroot `role`, `age`, `homeLocationId` |
| `relationships` | A list of links: `fromPersonId`, `toPersonId`, `kind` (parent, partner, sibling, guardian), `notes` |

### Memory

Memories record events and lasting changes to the world.

| Field | Contents |
| --- | --- |
| `title`, `description` | Text |
| `kind` | event, discovery, death, conflict, persistent change |
| `occurredAt` | World date |
| `locationIds`, `factionIds`, `familyIds`, `affectedCharacterIds` | What it touched |
| `persistentEffects` | What stays changed |
| `visibility` | Who knows about it |

### Character

Characters are standalone records. The Bitterroot import gives them `name`, `description`, `role`, `speciesSourceId`, `factionSourceIds`, `homeLocationSourceId`, `workplaceLocationSourceIds`, `familySourceId`, `canonNote` and a free-form `profile`. Characters use the generic structured editor, so personality, background and similar fields can be added as needed.

### Persona

The player-identity record has a fixed editor: `identity` (`displayName`, `species`, `age`, `pronouns`, `description`), `appearance`, `personality`, `background`, `speech`, `preferences` (a list), `skills` (a list) and `notes`.

### Item

Items are a library type with no fixed fields yet; they use the generic structured editor.

## Where the Abernys entries map

Everything drafted so far fits the existing record types without new fields. *(Suggestion)*

| Abernys material | Orbis record | Notes |
| --- | --- | --- |
| Abernys as a setting | world | `identity` for name, genre and tone; the agreed decisions go in `lore.importantFacts`; the old magic and the human ships go in `rules` |
| The island | place, major region | Parent of every other place on it |
| The Drift | place, sea or ocean | Parent of the Crowns |
| Caerwyn | place, settlement | Districts (the Drown, Hen Gei, Wolfwharf, the Tally, Low Ebb) as district places inside it |
| The Afon | place, river |  |
| The Woed, Fenmire | place, wilderness | Fenmire villages as village places inside Fenmire |
| Cairn Maw, Moorfell, the Dyffryn | place, region |  |
| Jarnmark, Suthmark, Thrallstrand | place, territory | Jarl halls and the camps as settlements inside them |
| Port Covenant | place, town |  |
| The Crowns | place, region |  |
| The Rookery | place, settlement inside the Crowns | Likely rated adult, given the brothels and slave pens |
| Peoples by migration wave | species | Ferrets, rats, otters, stoats, weasels and humans need records alongside the Bitterroot peoples |
| First peoples, the Hushed, fen villages, barrow-keeper clans | society: nation with child clans and village communities | Nested through `parentSocietyId` |
| Jarnmark and Suthmark folk | society: chiefdom | Each linked to its territory; rivals of each other |
| Port Covenant colonists | society: colony |  |
| The Brethren of the Crowns | society: confederacy | Crew articles and the Rookery peace go in `customs` and `leadershipStructure` |
| The Chain, Wharf Kin, Ebb Company, Low Road, Host of Cairn Maw, Lanterns, Charter Council | faction |  |
| House Saltcote, the jarls' houses | family |  |
| The Landtaking, the Black Tide, the Charter Fleet, the Broken Fleet, the fall of House Saltcote | memory | Historical events with `persistentEffects` |
| The Pirate Queen and the other key people | character | Linked to species, factions, home places and families by ID |
| Law by jurisdiction, predation law | world `lore` | A free-form block such as `lore.institutions`, as Bitterroot does for its slave market |
