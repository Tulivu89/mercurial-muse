# Maps: the plan

Nov 11, 2026, revised twice on Nov 12 · @AmbiProp · Claude's informed proposal from the four bids, revised at the owner's word. For the owner to approve or veto once they have tried the prototype.

The brief is `brief.md` in this folder; the bids are `chatgpt.md`, `deepseek.md`, `gemini-3-8-flash.md` and `grok.md`. Each bid has two parts: the proposal the brief asked for, and an answer to the owner's follow-up about a literal map, such as hexes, made from the record with the least input. The bids arrived before any plan was written, so there is no uninformed proposal from Claude for maps.

**The prototype** is `prototype.html` in this folder (published for the owner as *Inkwyrm Map Prototype*). It runs Bogwater's 38 places through the plan below: circles and hex ground from one layout, and travel from levels and the map, with no routes. This plan should be judged against it, not on paper.

## What changed, and why

| When | What | Why |
| --- | --- | --- |
| Nov 11 | Sheets per containing place; circles first, hexes in M4; travel by `distanceKm`; the map never prices a journey. | The four bids' first parts. |
| Nov 12, first revision | Hexes from M1 with no circle stage; routes store time; a picture under a sheet later. | The owner asked for a literal map made from the record, travel in time, and a picture. |
| Nov 12, second revision | **Circles are back, drawn from the ground.** **Travel comes from the levels and the map; routes are optional.** No fog for now. Bogwater is only a test world. | The owner's answers, below. |

The owner's answers to the first revision:
1. Circles cost nothing, because they follow the place tree. They should follow the distances the hexes set. Few authors will know distances ahead of time; at best they will say a trip between cities or regions takes about so long. Levels of travel can carry adjustable defaults until a sheet is mapped, and an early, easy hex map helps: placing things shows the distance, and the author moves them or changes what a hex is worth. It may take seeing a version in action. Most people don't want to define routes for every place.
2. Play can open close in, but the map has to scale. This is narrative first: the map gives visual feedback and immersion, not a game board.
3. Bogwater will be dropped once it can be replaced.
4. Routes are a lot of setup that a map or the place tree, with a set cost between levels and between siblings, could do instead.
5. Maps are a resource for the player. Fog can wait until maps work.

## The plan in five lines

1. **One layout per sheet, two ways to see it.** Each place that holds others has a sheet: its direct children as blobs on a disc of hexes, made from the place tree with no setup. **Circles** draw every sheet at once, rounded and nested, at the hexes' centres, so you can zoom from a room out to the whole world. **Ground** shows one sheet's hexes, where an author places things.
2. **Travel comes from levels, then the map.** Every kind of place belongs to a level (a land, a region, open country, a settlement, a building). A level has a typical trip across it and a cost to step inside one of its places. A journey goes up to where both ends sit side by side, across that sheet, and down. Across a sheet costs its cells times what a cell is worth: a quarter of the level's typical trip, until the author sets the sheet's own.
3. **Routes are optional.** A route is an exception the author adds when the tree can't say it: a shortcut, a ferry, a tunnel from a cellar to the harbour. It has a time and can ask something of a traveller. The quickest way wins.
4. **The author does as much as they like.** Nothing at all, and every trip already has a time. Set a level's typical trip. Drag a place on the ground, or change what a cell is worth on one sheet. Later, paint cells or lay a picture underneath. Only what they change is stored.
5. **Narrative first.** Play opens close in, on where you stand, and pinches out to any scale. A journey still resolves in one step, the model never moves a number, and the map shows everything: no fog yet.

## Where the bids agree, taken as settled

All four, in both parts: *show the player where they are* first and *help the author* second; one shared component, React with SVG or canvas, no libraries; a seeded layout from the record, the same every time, with nothing generated stored; a cell holds a place id and nothing else; only what an author changed is saved; one drawn path per place, never a shape per cell; play in the save and canon in the world; nothing new sent to the model; the list under the map stays.

Three of four give each containing place its own disc (ChatGPT, DeepSeek, Grok). All four kept travel off the map by default. The owner's answers overturn that last point, and the calls below follow.

## Where they differ, and the call

| Question | The bids | The call |
| --- | --- | --- |
| Circles or hexes | ChatGPT, first part: an atlas, hexes later; second part: hexes may fit better. DeepSeek: circles by default, hexes behind a toggle. Gemini: hexes for a literal map. Grok: one or the other, never two generators. | **Both, from one layout** (owner). The hexes place each sheet; the circles round them off and nest them. One generator, two drawings, so Grok's warning holds and nothing drifts. |
| Does the map price travel | DeepSeek and Gemini: optional, by cell distance, falling back to the graph where a place isn't painted. ChatGPT and Grok: never; a confirmed write-back of distances. Character Engine: one setting chose the circle tiers or the hex cells. | **Yes, across a sheet,** by cells times what a cell is worth (DeepSeek, Gemini, Character Engine, at the owner's word). Each sheet prices only its own crossing. A journey climbs the tree to the right sheet, so a room is never measured in a continent's cells. |
| Before a sheet is arranged | Character Engine fell through to the tier walk where a place wasn't painted. DeepSeek's and Gemini's fallback did the same. | **Open; the prototype has both.** Either the generated map prices from the start (what you see is what it costs), or every trip across an unarranged sheet takes the level's typical time until the author moves something or presses *Keep this layout* (the owner's "defaults until mapped"). Claude leans to the first. |
| One disc or many | Gemini: one disc for the whole world. The other three: one per containing place. | **One per containing place.** A room and a fen can't share a cell size (Grok). The circles give the one zoomable picture Gemini wanted. |
| What a sheet shows | DeepSeek: down to the deepest place. ChatGPT, Grok: direct children. | **Direct children.** The circles show the deeper levels nested inside. |
| How blobs fill | Grok: kind decides. DeepSeek, ChatGPT: a default with a toggle. Character Engine: spread, shape and density options. | **Kind decides,** with one flip per sheet later. No shape or density knobs until someone asks. |
| Keeping an arranged sheet still | Grok: the first edit settles the sheet. ChatGPT: pins remember their parent and go stale. | **Grok's settling, ChatGPT's stale rule.** Settling matters more now that positions price travel: a new place joins in a gap and moves nobody. |
| Roads | Gemini: paths across cells. ChatGPT: lines, hand-drawn later. Grok: drawn, never stored. | **A route, where there is one, is a line between its blobs,** never stored. With routes optional, there are few. |
| Colour | Gemini: kind as terrain under a genre theme. ChatGPT, DeepSeek: colour never means terrain. | **Kind picks a Wet Ink tint; author paint is colour only.** |
| A picture | ChatGPT: phase 4. Grok: kept beside the JSON. DeepSeek, Gemini: out. | **Last phase, under a sheet,** kept beside the JSON the way Chat keeps portraits. |
| Fog | DeepSeek: on. Grok: what the list shows. ChatGPT, Gemini: everything. | **Everything, for now** (owner). The map is the player's resource. |

## Travel from the levels and the map

**Levels.** A place's kind puts it in a level. These are the prototype's starting numbers, to be set from trying it:

| Level | Kinds | Typical trip across | Stepping inside |
| --- | --- | --- | --- |
| A land | continent, major region | 2 days | none |
| A region | region, subregion, territory, sea or ocean | 4 h | none |
| Open country | wilderness, lake, river, road or trail | 1 h | 5 min |
| A settlement or a site | settlement, town, village, district, landmark, other | 10 min | 2 min |
| A building | building | 2 min | none |

A world changes any of these on World › Rules. Level by kind, not by depth, because depth says nothing about scale: a town sits one level down in one world and three in the next. Today's travel tiers price by depth; they stay for worlds that use them (see *Old worlds*).

**A journey.** From A to B: step out of each place up to the child of the place that holds both; cross that sheet; step in down to B.
- *Stepping* between a place and a place inside it costs the holding place's level step time. An area costs nothing, since nobody stops in an area.
- *Crossing* a sheet costs the cells between the two blobs' centres times the sheet's time per cell: a quarter of the level's typical trip, unless the author set this sheet's own.
- *Routes,* where they exist, are extra ways with their own time. The quickest way wins, and the engine already finds it.
- *A place that asks something* of whoever crosses to it (an island and a boat) carries its own requirement, in today's requirement shape, so an island doesn't need a route to be hard to reach.

The journey still resolves in one step, and the time is the sum of the legs. The player sees each leg on tap (*Across Fenmire: the eel traps to Bogwater, 3 cells at 1 h a cell*), as the prototype shows.

**What it can't do.** Crossing measures centre to centre on the sheet where the two ends meet, so a village at the near edge of a region counts as its middle. That is good enough for a story. An author who needs better adds a route.

**Later: what changes the base.** As in the first revision, and still not built now: a way of travel (a horse, a flatboat, a shuttle) and a condition from a world state (fog, flood, a curfew) multiply a leg's time or close it, by rules, never by the narrator. Each shows its reason (*9 h · fog*). It gets its own brief.

**Old worlds.** A world file with routes and no levels keeps today's travel: routes priced by distance or time, tiers by depth, and siblings in an area not joined. New worlds in the Studio travel by levels. One setting on World › Rules switches an old world over, and Checks says what changes, such as an island that becomes reachable on foot until it carries a requirement. A world saved yesterday opens and plays the same tomorrow.

## The data

All optional and additive.

```ts
// On the world's rules (core/rules/). Absent: today's travel.
travel?: {
  by?: 'levels' | 'routes';            // absent: 'routes' for an old world; the Studio writes 'levels' on a new one
  levels?: Partial<Record<'land' | 'region' | 'open' | 'settlement' | 'building',
    { across?: number; step?: number }>>;  // minutes; only what the world changed
  walkKph?: number; tiers?: TravelTier[];  // unchanged, for 'routes' worlds and old routes
};

// A route: unchanged from the first revision. Optional now, and in time.
route = { id, from, to, minutes?: number, distanceKm?: number, terrain, routeClass, requires };

// A place's rules: what crossing to or from it asks. The requirement shape that routes use.
crossing?: Requirement[];

// On the world. Absent: nobody has touched the map.
map?: {
  v?: number;                                // the generator version the stored edits were made with
  sheets?: Record<PlaceId | 'top', {         // 'top' only for a world with more than one root
    seed?: number;                           // only after Reroll
    cellMinutes?: number;                    // only when the author sets what a cell is worth here
    centres?: Record<PlaceId, { q: number; r: number }>;  // every child's, written when the sheet is first arranged
    fill?: 'islands' | 'bordered';           // later: only when flipped
    claims?: Record<string, PlaceId | ''>;   // later: painted cells only
    paint?: Record<string, number>;          // later: a colour, never a rule
    backdrop?: { id: string; x: number; y: number; scale: number; turn?: number; fade?: number };  // last
  }>;
};

// In the adventure's save: nothing for now. Marks and fog come later.
```

`v` matters more now that a layout prices travel: a new generator must not change an arranged sheet (its centres are stored), and a world records the version its unarranged sheets were laid out with, so an update can't quietly change a journey mid-story.

## Making a sheet

`sheet(world, sheetId)`, pure, in `core/map/`, whole-number hex coordinates, no library. It reads the tree, kinds and descendant counts, and routes only to draw them. The prototype's code is the first draft of it.

1. **Who is on it:** the direct children, sorted by id.
2. **How big:** a place that holds nothing takes one cell; anything else `1 + 2 × log2(1 + descendants)` cells, from 3 to 19; water and wilderness at least 3; an area at least 7 (Grok's sizes, Character Engine's floor).
3. **How it fills,** by kind: an area whose children are all areas is bordered; any other area is islands on ground nobody stops on; a building is bordered rooms with one cell for the building itself; anything else is islands whose spare ground *is* that place. The disc is the smallest with room.
4. **Centres:** stored centres first; each other blob on a ray at an angle hashed from its own id (so a new sibling turns no one), stepping out until clear (Grok).
5. **Cells:** blobs grow from their centres a cell at a time in turn, each in one piece; islands keep a one-cell gap where they can (Character Engine's partition).
6. **Circles:** each blob becomes a circle of the same area at its cells' centre, scaled into its parent's circle. Children are always inside their parent.

**Tests:** byte-identical output twice over; every child in one piece; stored centres unmoved; a new sibling moves nothing on an arranged sheet; every circle inside its parent; an 800-place world under 50 ms a sheet; and travel: a trip's legs sum to its time, crossing scales with what a cell is worth, an area costs nothing to step through, and an old world's every journey takes what it took before, minute for minute.

## What the player sees

- **Circles, opening on where you stand,** with the places beside you named and their times. Pinch out and the village, the fen and the land come into view; names show as there is room for them, largest first, never drawn over each other (Character Engine).
- **Tap a place:** its name, how long, and each leg; **Go** if you can stand there. **Ground** shows the sheet it sits on.
- **The list under the map stays,** nearest first, from the same function.
- No fog and no tokens. Nothing moves cell by cell; the map is where you are and how far things are.

## What the author sees

- **A Map page** on the world, beside About, Rules and Checks, with its own address. Circles and Ground, as in the prototype.
- **Ground:** Look and Move; what a cell is worth on this sheet; *Keep this layout*, *Reroll*, *Reset this sheet*. Each trip's time updates as a place is dragged.
- **World › Rules › Travel:** the levels and their two numbers, and, for an old world, the switch to travel by levels.
- **Routes** stay on a place's page for the exceptions, in time. Tap two places on the ground to add one.

## Phases

| Phase | What | Shippable alone because |
| --- | --- | --- |
| P0 | The prototype. Done Nov 12. | The owner can try the idea before anything is built. |
| M1 | `core/map/` with its tests; circles and ground in `kit/`; the Studio's Map page, read-only, showing each trip's time as the levels would price it. The levels on World › Rules. | The author sees the world's shape and its distances the day it ships. Play is untouched. |
| M2 | Travel by levels in the adventure: the journey up, across and down; routes as optional shortcuts; a place's own crossing requirement; the old-world switch with its Checks finding. The adventure's Map section draws circles in place of the spokes. | New worlds play with no routes; old ones play as before. |
| M3 | Studio editing on the ground: Move, Keep, Reroll, Reset, what a cell is worth; settling; stale centres on Checks; a route by tapping two places. | Authors shape distances by placing things. |
| M4 | Paint and colour on the ground, with flood. | For authors who love drawing maps. |
| M5 | A picture under a sheet. | Floor plans, deck plans, the owner's own maps. |

Later, each on its own: ways of travel and conditions (their own brief, in the rules); the player's marks; fog, when maps work and a world wants it.

## Credit

- **The owner:** circles that follow the ground; travel from levels with adjustable defaults; a map that sets distances by placing things; routes as optional; narrative first; no fog yet; travel in time; the picture underneath.
- **Character Engine:** the circle map and its nesting; travel tiers; the hex map's travel by cells, with a fall-through for unmapped places; the seeded partition; labels placed largest first.
- **ChatGPT:** sheets of direct children; the parent's own ground; settling's stale rule; tools chosen before editing; generated and authored layouts kept apart, with the generator's version stored; colour that never means terrain; the picture.
- **Grok:** a disc per containing place and one generator; kind choosing the fill; the sizes; angles hashed from ids; settling; the picture kept beside the JSON.
- **DeepSeek:** hex pricing by cells times a time per cell, falling back where a place isn't on the map; areas as ground nobody stands on; erasing a cell back to ground; the phase order.
- **Gemini:** hex travel as an optional mode; a child's cells inside its parent by construction; water kinds read as water.

## For the owner, after trying the prototype

1. **Map times from the start, or level times until a sheet is arranged?** The prototype's first box under *Try the other ways* switches between them.
2. **Levels by kind,** as in the prototype, or by depth, as today's tiers are?
3. **The starting numbers** for the five levels, and a cell as a quarter of a typical trip.
4. **Old worlds keep today's travel** until switched by hand. Or should every world move to levels at once?
