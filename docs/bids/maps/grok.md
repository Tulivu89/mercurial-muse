One map, called a sheet. The full proposal is below and in [inkwyrm-maps-proposal.md](/workspace/inkwyrm-maps-proposal.md).

## 1. The recommendation in five lines

A map is a stack of sheets. Every place that contains other places has one local sheet, and play opens on the innermost area the player is standing in.

With nothing stored, that sheet is packed from the place tree. Routes that already exist are drawn across it and labeled with the time the adventure already charges.

The file stores a position only when the author drags a place, or asks that sheet to arrange itself by its routes. Anything never touched is worked out again.

Studio and the adventure share one SVG component. It is built for a thumb, and the list under the map today stays. Chat does not get a map yet.

The map does not price a journey. `distanceKm` and the travel tiers stay the rules, so a world with no map plays exactly as it does now.

## 2. The jobs

**First: show the player where they are.** Where I am, what sits around me, which ways out exist, which are blocked, and how long each takes. This replaces the spoke diagram.

**Second: help the author build.** The same drawing. See the shape, drag a place, draw a road by tapping its two ends, and see a place no path can reach.

**Third, left out: decide travel.** Never automatically. A later button can write `distanceKm` from an arrangement the author confirms. Until then, cost is unchanged.

Also left out: hexes or squares (they assume uniform ground), a picture as the map, fog of war as the default, vehicles that move the map, Chat, and any coordinate in what the model reads.

What is kept from the circle map: add a place inside another and it appears, with no setup. What is borrowed from the hex map: within one sheet, the author can make distance look like distance. That borrowing is a command, not the default.

## 3. The data shape

Nothing is added to a place. Pins live on the world. Play lives on the save.

```ts
// On the world. Absent means no author has touched the map.
map?: {
  // Present only after Reroll. Otherwise the seed is hash(worldId).
  seed?: number

  // 'reached' (default): places today's Map list would already show.
  // 'sheet': every place on the sheet.
  // 'charted': places the save has marked seen, plus exits from those.
  reveal?: 'reached' | 'sheet' | 'charted'

  // Keyed by the sheet's place id.
  // 'world' is a synthetic sheet of the roots, only when a world has
  // more than one place with no parent. It is not a place.
  sheets?: {
    [sheetId: string]: {
      // Direct children the author has dragged. Top-left origin, y down.
      pins?: { [placeId: string]: { x: number, y: number } }  // both 0..1
      kmPerUnit?: number   // phase 3. Layout never reads it.
    }
  }
}

// On the save. Never written into the world file.
map?: {
  seen?: string[]          // phase 3, for reveal: 'charted'
  marks?: Array<{
    id: string
    sheetId: string
    x: number
    y: number
    placeId?: string       // set when stuck to a place, not the ground
    note?: string
  }>
}
```

The camera is neither canon nor play. Pan and zoom stay in screen state and must not dirty the world file.

A pin counts only when that place is a direct child of that sheet. Any other pin is ignored by layout and reported by Checks. It is not deleted on its own.

`Arrange by the roads` writes a pin for every direct child of that one sheet. Children added later have no pin and pack into what room remains.

## 4. Auto-layout

`layout(world, sheetId)` returns `{ x, y, r }` in fractions of a unit square. Pure function, integer grid 0..10000, no library, no `Math.random`. It does not write.

**Weight.** `weight(place) = 1 + sum(weight(child)) ^ 0.65`. Radius is `sqrt(weight)`. Areas (the five area kinds) multiply by 1.35. Then scale so the largest radius is at most 0.22 of the sheet and the smallest at least 0.045.

**Default pack**, for every untouched sheet:

1. Sort direct children by id.
2. Angle of each is `hash(seed, sheetId, placeId)`, a full turn. The angle depends on the id, not the index, so a new sibling does not rotate the others.
3. Place largest first. The first sits at the centre. Each later one steps outward along its ray until it clears circles already placed, plus 4% padding.
4. A pinned child is skipped, then set to its pin, clamped to 0.06..0.94.
5. A last pass pushes only unpinned circles off pins. If the sheet is too full, overlap remains and nothing throws.

**Routes on a sheet.** A line is drawn only when both ends resolve to direct children (an end inside a child resolves to that child, and the label names the deeper place). A route whose end is outside the sheet is not given a point. Putting it on the rim would invent a direction. It stays in the list. An inside-edge is not a line; opening the sheet is that step.

**Arrange by the roads** is explicit, phase 3, and its result is stored as pins. Start from the pack. One hundred and twenty iterations: grid repulsion, and each in-sheet route a spring with rest length `0.12 + 0.62 * (distanceKm / maxOnThisSheet)`. A distance of 0 uses 0.18. Then save every position as a pin. One undo.

**Guarantees.** Same world, seed and pins give the same numbers to 0.0001. Every direct child gets a point. Dangling route ids are skipped. Pins stay put. The pack never writes. Adding a place does not change another place's angle; it can still shove an unpinned neighbour. Arrange does not promise a perfect scale once circles collide. Three free places with distances 1, 10 and 100, and nothing else, must come back with gaps in that order.

**Tests.** Determinism. Pin stays, others inside the square. Missing ids do not throw. The three-distance case. A new id does not change an older angle. A Bogwater snapshot of every sheet. Eighty children and forty routes under 50 ms, and the SVG of one sheet under 200 elements. A world file with no `map` key still layouts.

## 5. The two screens

One component, `WorldMap`. Layout and types in `core/map`. The adventure cannot write pins. The Studio can.

One path for fills, one for open routes, one for blocked routes. Only direct children are hit targets. A child that has children is a disc; if that disc is at least 72 px, its own layout is drawn inside as dots, two levels deep or until a dot would be under 8 px, and those dots are not tappable.

Labels follow pixels, not a zoom step. A mark at least 48 px across is named. The selection and the place you are in are always named. Cap 24 labels. Kind changes paint only: areas large and soft, settlements a stronger disc, buildings a rounded square, water a flat ellipse, a river or road a short pill unless the route line already is that place.

Blocked routes are dashed. You-are-here is a ring. If you are in the sheet place and in none of its children, the ground is tinted. That is "in the house but not in a room", without a fake circle.

Hit targets are at least 44 px. One finger pans, two pinch about the midpoint. `touch-action: none` on the SVG only. Pinching never enters a child. Entering is a button.

### The player

Play opens on the innermost area that contains the player. Areas are what you look across: siblings under an area are not connected just by both being inside it. If no area contains the player, the sheet is the parent of where they stand. A house with no areas works. A fen that is a region works.

```
┌─────────────────────────────┐
│ Fen                         │
│ Abernys › The fen           │
├─────────────────────────────┤
│        (island)             │
│   ● village──────── town    │  ● you, in a room of it
│         \                   │
│          traps              │
├─────────────────────────────┤
│ Village                     │
│ You are in the back room    │
│ Open                        │
├─────────────────────────────┤
│ Ways out                    │  today's list, kept
│ Eel traps          20 min   │
│ River town    3 h   blocked │
│ Further                     │
│ I'm somewhere else          │  a list, not a drag
└─────────────────────────────┘
```

The map is about 42% of the screen. The spokes go away. The list stays, because a way out that leaves the sheet has no honest point on this ground, and the time has to be readable without a gesture.

Tap selects and scrolls the list. The card shows the time from the existing journey, Open if it has children, and Go if the resolver will take you. Go calls that resolver. Dragging moves neither the player nor a pin.

Under the default `reveal: 'reached'`, a mark is drawn only if that place, or something inside it, is where you are or is already on the Map list. Layout still places the hidden children, so a secret room leaves a gap instead of shoving the village. `sheet` fills the gaps. `charted` uses `save.map.seen` plus exits from seen places.

### The author

A Map page beside the nested list. The place page still edits distance, terrain and requirements.

```
┌─────────────────────────────┐
│ Map                    Done │
│ Fen › Village               │
├─────────────────────────────┤
│     buildings as marks      │
│     rooms as dots           │
├─────────────────────────────┤
│  Look     Move     Route    │
├─────────────────────────────┤
│ Village              pinned │
│ Release    Open      Reroll │
│ Can't be reached            │
│   the old jetty             │
└─────────────────────────────┘
```

Look opens the page, so a stray drag writes nothing. Move writes a pin on finger-up. Release clears that pin. Reroll changes the seed, asks first, and repacks only unpinned places. Route taps two marks and opens the existing route form; dismissing writes nothing. The line is not a second copy of the route.

Checks gains a pin whose place is gone or reparented, and a place no walk can reach even if every requirement is met. That mark is drawn hollow. A place that only needs a boat is not hollow; the dashed line already says why.

## 6. Travel

The pricer does not change. A label is the duration the journey resolver already returns. If the drawn length and `distanceKm` disagree, `distanceKm` wins. A plank walk dragged long is not a longer walk.

Inside-edges are not roads. If a tier makes entering cost time, that time sits on the mark.

There is no map cost, so a world with no `map` key needs no fallback branch.

Phase 3, only if the author asks: "Write distances from this arrangement." It requires `kmPerUnit` ("how wide is this sheet, in km?"). It proposes a new `distanceKm` for routes whose two ends both lie on this sheet, shows the old number and the new one, and writes only on confirm. Routes that leave the sheet are untouched. The narrator never writes a number.

## 7. Bogwater

Thirty-eight places, four levels, eight routes, no travel tiers. The routes are the whole of travel. Treat the fen as a region. If the root is in fact a settlement you can stand in, the drawing is the same and play simply opens one sheet lower.

The first open stores nothing. The fen sheet packs the village, the river town, the islands, the traps and the other places of that level, larger where they contain more. The eight routes are the only lines, labeled with their times. A route that ends deeper is drawn to the child that contains it. Buildings and rooms are dots inside a disc, unnamed at this level.

Open the village: buildings. Open a building: rooms, almost no lines, because indoors is an inside-edge and those are free. The ground of that sheet is the building itself.

Standing in a back room, play opens on the fen. The village carries the ring, and the card says "You are in the back room." The boat route is dashed. The room is two Opens down, each a button. Places the list would not show are not drawn.

The first time the world file gains a `sheets` entry is the first drag, and it holds only the places that were dragged. Arrange, if you want the fen to read as ground, pulls on the eight distances and pins that sheet only. Rooms stay a pack.

## 8. Phases

**Phase 1.** Layout, the SVG, play and Studio. Spokes removed, list kept, you-are-here, blocked lines, times from the current resolver, Look and Move, Release, Reroll. No travel change, no marks, no Arrange. Yesterday's worlds still load.

**Phase 2.** Route mode. Hollow unreachable marks. Checks for dead pins. A note when a pinned line is far out of scale with its `distanceKm`. The note changes nothing.

**Phase 3.** Arrange, writing pins. `kmPerUnit` and the confirmed write-back. `reveal`, `seen`, player marks. Character dots only where a place is already known.

Not scheduled: a backdrop image (as a blob beside the JSON, not inside it), a map in Chat, a grid.

## 9. Risks and open questions

The first fen looks packed, not surveyed. That is the zero-setup bargain. Pull Arrange into phase 1 if Bogwater has to feel like ground on day one. It writes pins.

An unpinned neighbour can still be shoved outward when a new circle lands on it. Angles do not change. Say that on the Map page in one line.

A secret room leaves a gap, because layout includes places play does not draw. Laying out from the visible set only would move the village when the secret appears. The gap is the smaller defect.

`reached` must call the same function as the list. A second traversal will drift.

Open questions:

1. Is "only what today's list shows" the right cut for play, or should the player see the whole sheet?
2. Do you want Arrange in the first version?
3. Can a world have more than one root?
4. Does the adventure already store a place on anyone but the player?
5. Should the spokes go in the same change as the sheet, or stay behind a toggle for one release?

<render_file file_path="/workspace/inkwyrm-maps-proposal.md" />

How would you provide a more literal map, such as a hexmap? How would you build
it to best fit the existing model with minimal adjustments? How could you automate map creation from the record with minimal input?

Hexes replace the pack as the drawing of a sheet. They do not become a second world. The full note is in [inkwyrm-hex-map.md](/workspace/inkwyrm-hex-map.md).

## What the literal map is

One hex disc per place that contains other places. Play still opens on the innermost area. A cell's only job is to say which place owns it. The fen is one disc: settlements as blobs, the cells between them the fen itself. A building is a different disc, opened on purpose, with rooms as cells. One disc for the whole world is the cut that looks simpler and does not work. A room and a fen cannot share a cell size, and the tree already says where the scale changes.

Roads stay routes. The line from one blob to another is drawn, not stored, and it means the road exists. It does not mean the journey stops on each hex.

## What is added, and what is not

Places, routes, the tier table, `distanceKm`, and the text the model sees stay as they are. A world with no `map` key still plays. Opening the map does not write.

```ts
map?: {
  seed?: number
  sheets?: {
    [sheetId: string]: {
      centers?: { [placeId: string]: { q: number, r: number } } // only if dragged
      claims?:  { [key: string]: string }  // "q,r" -> place id, only painted cells
      paint?:   { [key: string]: number }  // cosmetic
      kmPerCell?: number                    // unused unless a later confirm
    }
  }
}
```

The generator's cells never enter the file. A center is stored when a blob is dragged. A claim is stored when a cell is painted. That is the whole adjustment to the model. The spokes are the thing the disc replaces. The list under the map stays.

## How the disc is made from the record

`hexLayout(world, sheetId)` is a pure function. Integer axial math, no library. It reads `parentId`, kind, descendant count, and routes. It does not read the terrain sentence.

Blob size comes from kind. An area is 7 cells so it reads as ground. A building, a landmark, or a childless place is 1. Anything else is `clamp(1 + log2(descendants + 1), 3, 19)`.

Kind picks the fill, so there is no author setting.

- An **area** is islands. The disc is about 1.8 times the blobs, and the spare cells stay the parent. That spare ground is the fen.
- **Anything else** is bordered. Rooms and compartments tile the disc and share walls.

Routes are the only "where" already on the record, and they are used for spacing only. Rest length is 2 to 8 cells from `distanceKm` on this sheet. Eighty iterations place the centers. Blobs then grow round-robin from those centers so each stays connected. Children with no route still appear, in the largest gap. An end that lies outside the sheet does not pull and does not sit on the rim.

Every cell ends with one owner. The same seed gives the same disc. Look does not write, so an untouched sheet can shift when a child is added. The moment any center or claim is stored, that sheet is settled: those centers stay, and a new place only appends.

On screen, each place is one filled path, not one polygon per cell. A few hundred hexes cost about as many nodes as there are places on the sheet.

The author does nothing and still has a map. After that, drag a blob, or reroll one sheet, or later paint. Painting must not create a route. Tap two blobs for the route form that already exists.

## Bogwater

The fen disc is islands. The village, the river town, the islands and the traps sit on fen-coloured ground, spaced by the eight distances. A short walk is a short path across the parent's cells. Buildings are a cell or a small blob. Open one and the mode flips: a bordered floor, one cell a room, one leftover cell for standing in the house but not in a room. No tier, so those cells have no time. The eight routes carry every label. Nothing is stored until a drag writes a single `{ q, r }`.

## Travel

Unchanged. If the map ever prices a route, it should be a confirmed write-back of `cubeDistance * kmPerCell` into `distanceKm` for routes that lie entirely on that sheet, old number and new number shown first. A regenerated disc must not change how long the plank walk takes. Inside-edges stay on the tier table.

Ship hexes or the pack, not both. Two generators will disagree, and play needs one of them.

Four things worth deciding: whether kind may choose islands versus bordered, whether a settled sheet may write a new child's center on open, whether a building keeps one hallway cell, and whether `kmPerCell` waits.

<render_file file_path="/workspace/inkwyrm-hex-map.md" />