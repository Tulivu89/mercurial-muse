# Maps: the plan

Nov 11, 2026, revised three times on Nov 12 · @AmbiProp · Claude's informed proposal from the four bids, revised at the owner's word. **Approved by the owner on Nov 12, with the suggestions under Open items. M1 built the same day (Studio 0.9.0).**

The brief is `brief.md` in this folder; the bids are `chatgpt.md`, `deepseek.md`, `gemini-3-8-flash.md` and `grok.md`. Each bid has two parts: the proposal the brief asked for, and an answer to the owner's follow-up about a literal map made from the record with the least input. The bids arrived before any plan was written, so there is no uninformed proposal from Claude for maps.

**The prototype** is `prototype.html` in this folder, published for the owner as *Inkwyrm Map Prototype*. Its second version runs Bogwater's 38 places through everything below: circles and hex ground from one layout, travel from levels and the map, roads on cells, the refining tools, the icon set and Character Engine's circle rules. Bogwater is only the test world; it goes when something replaces it.

## How the plan got here

| When | What | Why |
| --- | --- | --- |
| Nov 11 | Sheets per containing place; circles first, hexes later; travel by `distanceKm`; the map never prices a journey. | The four bids' first parts. |
| Nov 12, first | Hexes from the first phase; routes in time; a picture under a sheet. | The owner: a literal map made from the record, travel in time. |
| Nov 12, second | Circles drawn from the ground; travel from levels and the map; routes optional; no fog. The first prototype. | The owner: circles are free, authors won't know distances, routes are too much setup. |
| Nov 12, third | **Settled:** map times from the start, levels by kind, the starting numbers, no old worlds to keep. **Roads on cells replace routes.** How the ground is refined, the icons, and Character Engine's circle rules. The second prototype. | The owner's answers below. |

The owner's answers to the second revision:
1. Map times from the start: agreed.
2. Levels by kind of place.
3. The current numbers are fine for now.
4. There are no old worlds, only old test settings that don't matter.

And the owner's open points: routes ignore cells unless they follow a cell path, or they can be dropped; Character Engine had many rules to keep the circle map legible; the plan needs to say how a hex map is drawn and refined after it lays itself out; and Character Engine drew places with SVG icons so the map read like a map, but their size was expensive.

## The plan in six lines

1. **One layout per sheet, two ways to see it.** Each place that holds others has a sheet: its direct children as blobs on a disc of hexes, made from the place tree with no setup. **Circles** draw every sheet at once, nested, at the hexes' centres, under Character Engine's legibility rules. **Ground** shows one sheet's hexes.
2. **Travel comes from levels and the map, from the start.** Each kind of place has a level. A level has a typical trip across it and a cost to step inside one of its places. A journey goes up to where both ends sit side by side, takes the cheapest walk across that sheet's cells, and comes down. A cell is worth a quarter of the level's typical trip unless the sheet sets its own.
3. **Roads replace routes.** A road is a line of cells painted on a sheet. A step along it costs less, so the cheapest walk finds it. A road joins nothing by itself and needs no place at either end.
4. **The ground is refined, never drawn from nothing.** The author can move a place, make it bigger or smaller, paint cells to a place or back to ground, fill a patch, lay a road, or change what a cell is worth. Keep, Reroll and Reset work one sheet at a time. Only what changed is stored.
5. **Icons make it read like a map.** One small line drawing per kind, kept in one shared sprite and used by reference. The set is about 1.4 KB, against Character Engine's 346 KB of imported, shaded icons.
6. **Narrative first.** Play opens close in and pinches out to any scale. A journey resolves in one step, the model never moves a number, and the map shows everything.

## Where the bids agree, taken as settled

All four, in both parts: *show the player where they are* first and *help the author* second; one shared component, React with SVG, no libraries; a seeded layout from the record, the same every time, with nothing generated stored; a cell holds a place id and nothing else; only what an author changed is saved; one drawn path per place, never a shape per cell; nothing new sent to the model; the list under the map stays. The owner has overruled the bids on travel: the map prices it.

## Where they differ, and the call

| Question | The bids | The call |
| --- | --- | --- |
| Circles or hexes | ChatGPT: an atlas, then maybe hexes. DeepSeek: circles, hexes behind a toggle. Gemini: hexes. Grok: one or the other, never two generators. | **Both, from one layout** (owner). One generator, two drawings. |
| Does the map price travel | DeepSeek, Gemini, Character Engine: cells times a time per cell. ChatGPT, Grok: never. | **Yes, across each sheet,** from the start (owner). A journey climbs the tree to the right sheet, so a room is never measured in a continent's cells. |
| Routes | ChatGPT, Grok: lines, never stored. Gemini: paths carved across cells. DeepSeek: arcs. | **Routes go; roads are painted cells** (Gemini's paths, made the author's own). A route ignored the ground, as the owner said. A road is part of it. |
| One disc or many | Gemini: one for the world. The rest: one per containing place. | **One per containing place.** The circles give the single zoomable picture. |
| Keeping a refined sheet still | Grok: the first edit settles the sheet. ChatGPT: stale pins. | **Grok's settling, ChatGPT's stale rule.** Any edit stores the sheet's centres, so later changes move nobody. |
| Colour and icons | Gemini: kind as terrain under a genre theme. ChatGPT, DeepSeek: colour never means terrain. Character Engine: a picked icon per place, from a large library. | **Kind picks a tint and an icon; colour never makes a rule.** Lean line icons, a world's set chosen by genre later, and any place can pick its own. |
| A picture | ChatGPT: phase 4. Grok: beside the JSON. | **Last, under a sheet,** beside the JSON. |
| Fog | Split. | **None for now** (owner). |

## Travel from the levels and the map

**Levels.** A place's kind puts it in a level. These numbers stand for now:

| Level | Kinds | Typical trip across | Stepping inside |
| --- | --- | --- | --- |
| A land | continent, major region | 2 days | none |
| A region | region, subregion, territory, sea or ocean | 4 h | none |
| Open country | wilderness, lake, river, road or trail | 1 h | 5 min |
| A settlement or a site | settlement, town, village, district, landmark, other | 10 min | 2 min |
| A building | building | 2 min | none |

A world changes any of them on World › Rules.

**A journey.** From A to B, step out of each place up to the child of the place that holds both, cross that sheet, then step in down to B.
- *Stepping* between a place and a place inside it costs the holding place's step time. Stepping into or out of an area costs nothing; nobody stops in an area.
- *Crossing* a sheet is the cheapest walk between the two blobs' centres. A step costs one cell, or 40% of a cell along a road. The total is multiplied by what a cell is worth on that sheet.
- *A place that asks something* of whoever crosses to it, such as an island and a boat, carries its own requirement in the shape routes use today.
- The journey resolves in one step, and its time is the sum of the legs. The player sees each leg on tap, including how much of a crossing was by road.

**Its limit.** A crossing is measured on the sheet where the two ends meet, from centre to centre. A road on Fenmire's sheet can't know which edge of Bogwater it leaves from. For a story that is close enough.

**Later:** ways of travel (a horse, a flatboat, a shuttle) and conditions from a world state (fog, flood) multiply a leg or close it, by rules, never by the narrator. Road kinds (a track, a highway, a rail line) are ways of travel on road cells. Each gets its own brief.

## Drawing and refining the ground

A sheet lays itself out the first time it is opened. From there, every tool works on one sheet, and the first change stores that sheet's centres, so nothing shifts under the author's hand again.

| Tool | What it does | What is stored |
| --- | --- | --- |
| Move | Drag a place; its cells regrow around the new centre. | The sheet's centres. |
| Bigger, Smaller | A place on the sheet grows or shrinks by about a third. | Its size. |
| Paint | Give cells to a chosen place, or back to the sheet's own ground. Brush of one cell, seven, or Fill, which takes a whole patch of the same owner (Character Engine's size-0 flood). A place's own centre can't be painted over, so no place is painted away. | The painted cells. |
| Road | Drag to lay road cells; start on a road to take it up. | The road cells. |
| One cell | What a cell is worth on this sheet. | That number. |
| Keep this layout | Store the generated layout as it stands, so additions move nothing. | The centres. |
| Reroll | A fresh layout for this sheet, keeping what a cell is worth. | A seed. |
| Reset this sheet | Throw away every change on it. | Nothing. |
| Add a place here | A new place inside this sheet's place; it finds a gap. | The place, as a record. |

On a phone the tool is chosen first, so a pan never paints (ChatGPT). An author who never opens a tool still has a full map with every time worked out.

## The circles, by Character Engine's rules

Taken from Character Engine's map (its `MAP-*` and `HEX-*` rules), built in the prototype:
- **Bands decide the names.** The place in focus, what is directly in it, the chain above it (dimmed), and the land's top places, which are always named. Everything else is unnamed until you look at it. Tapping a place twice, or *Look at it*, moves the focus.
- **Rooms appear once you look inside.** A building's contents are drawn only while the building is on the focus chain.
- **A building at rest is its icon.** It gets its ring back when it is focused, selected or where you stand.
- **Sizes are compressed** so a big place doesn't crush its neighbours, and small siblings keep their distance.
- **Labels are placed, not printed.** Largest first, against what is already down, in screen pixels. A name that can't fit is dropped, never drawn over another. Words wrap, never break (to build).
- **Kind changes paint, never shape.** Circles stay circles.
- **The parent's own space.** On islands it is the spare ground; in a building, one cell for being inside but in no room.

## Icons

- **One sprite, many references.** Each icon is a `<symbol>` on a 24-unit grid, one line drawing in the map's ink, defined once in `kit/`. Each mark on a map is one `<use>`, so a hundred marks cost a hundred short lines. The prototype's nine come to about 1.4 KB.
- **By kind, then by choice.** A place shows its kind's icon. Later, a place can pick any icon, and a world can pick a set to suit its genre: old (keeps, cottages), modern (tower blocks, shopfronts) and far (domes, stations). These are the same groups Character Engine used: built, city, wild, space and mark. A set is about thirty drawings, around 5 KB.
- **Drawn, not imported.** Character Engine's library was 346 KB because its icons were imported with shading layers. Ours are drawn plain for the map, and stay legible down to about 14 px.
- **Capped.** At most 60 icons on screen, largest places first.

## The data

All optional, and all on the world.

```ts
// On the world's rules (core/rules/).
travel?: {
  levels?: Partial<Record<'land' | 'region' | 'open' | 'settlement' | 'building',
    { across?: number; step?: number }>>;   // minutes; only what the world changed
  road?: number;                             // the share of a cell a road step costs; default 0.4
};

// A place's rules: what crossing to or from it asks. The requirement shape routes use today.
crossing?: Requirement[];
// A place's own icon, when it isn't its kind's.
icon?: string;

// On the world. Absent: nobody has touched the map.
map?: {
  v?: number;                                // the generator version its layout was made with
  icons?: 'old' | 'modern' | 'far';          // later: the world's icon set
  sheets?: Record<PlaceId | 'top', {
    seed?: number;                           // after Reroll
    cellMinutes?: number;                    // what a cell is worth here
    radius?: number;                         // kept once arranged, so the disc doesn't shrink under a move
    centres?: Record<PlaceId, { q: number; r: number }>;  // every child's, written at the first edit
    sizes?: Record<PlaceId, number>;         // Bigger and Smaller
    claims?: Record<string, PlaceId | ''>;   // painted cells: "q,r" -> a child, or '' for ground
    roads?: string[];                        // road cells, "q,r"
    backdrop?: { id: string; x: number; y: number; scale: number; turn?: number; fade?: number };  // last
  }>;
};
```

Routes (`world.routes`, `distanceKm`, walking pace and depth tiers) leave the record model in M2. `v` matters because layouts price travel: a new generator must not quietly change a journey, so a world keeps the version it was laid out with.

## Phases

| Phase | What | Shippable alone because |
| --- | --- | --- |
| P0 | The prototype, two versions. Done Nov 12. | The owner can try it before anything is built. |
| M1 | `core/map/`: the sheet generator, crossing and journey times, with tests. Circles and ground in `kit/`, with the icon sprite and the circle rules. The Studio's Map page, read-only, showing each trip's time. The levels on World › Rules. | Built Nov 12, Studio 0.9.0. |
| M2 | The adventure travels by levels and the map: journeys up, across and down; a place's crossing requirement; routes and their fields retire. The test modules' routes are traced into roads, as the prototype's button does, and their tests check the new times. The Map section draws circles in place of the spokes. | Built Nov 12, adventure 0.27.0 and Studio 0.10.0. |
| M3 | Refining the ground in the Studio: Move, Bigger, Smaller, Paint, Road, One cell, Keep, Reroll, Reset, Add a place. Stale centres and claims on Checks. | Authors shape distances by placing and painting. |
| M4 | Icons by choice and by genre set; colour paint, which never makes a rule; words that wrap on circles. | The map reads like the world's own. |
| M5 | A picture under a sheet. | Floor plans, deck plans, the owner's own maps. |

## Open items, with suggestions

1. **How fast a road is.** *Suggest:* one number per world, 40% of a cell for now. Kinds of road (track, highway, rail) come with ways of travel, as factors on road cells.
2. **Water and hard ground.** A lake's cells cost the same as dry land today. *Suggest:* a place's crossing requirement also applies to walking across its cells. Without a boat, the walk goes around Grey Water; with one, straight across. It's one rule, and it reuses requirements. Build it in M2 with crossing.
3. **Links no map can show** (a portal, a secret tunnel, a lift between decks on different sheets). *Suggest:* drop routes now. If a world needs one, a *passage* (two places and a time) comes back as the one exception, and nothing else.
4. **Hidden places** (Character Engine's hidden kind: secret rooms, holding cells). *Suggest:* wait for fog. Until then a secret place is a place, drawn like any other.
5. **Vehicles** (Character Engine's vehicle kind: a ship whose cabins travel with it). *Suggest:* with ways of travel, since a vehicle is a place that is also a way.
6. **Icon sets.** *Suggest:* draw the old set first (about thirty icons), then modern, then far. A place's own pick and a world's set come in M4.
7. **Bogwater.** *Suggest:* keep it as the test world until a replacement exists, with its routes traced into roads in M2. Nothing in the plan depends on it.
