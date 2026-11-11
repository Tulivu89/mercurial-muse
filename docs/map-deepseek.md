Deepseek
A proposal for maps in Inkwyrm

Here is mine, in the order the brief asks for.

---

1. The recommendation in five lines

1. One shared SVG component draws the nesting as packed circles; the Studio and the Adventure both use it, and it works at 390 px by touch.
2. Routes are the only real ground data that already exists — so draw them as arcs whose length/curvature encode the authored distanceKm, and label each with the travel time the existing graph already computes. Zero setup, closer to real ground.
3. Auto-layout is deterministic and total: every place gets a position from the tree alone; an author pin is an optional, per-place local offset. A world with no map data is drawn immediately and stays fully playable.
4. The map never decides travel. It visualizes the existing tier + route graph; drawing a road opens the route editor rather than inventing a distance. The fallback to today's behaviour is exact.
5. Four shippable phases: read-only Studio map → read-only Adventure map with fog → edit (pins, draw-a-road) → overlays (people, player marks, reveal policy).

---

2. The jobs, ranked, and what is left out

1. Show the player where they are (first). The Adventure's current Map section is a spoke schematic plus a list. It tells you what is reachable but not how the world sits. The circle map makes containment and the roads between places legible at a glance, and it re-homes the spoke information (ways out, blocked reasons, travel time) onto a spatial view without changing any number.
2. Help the author build (second). The Studio's nested list is correct but shapeless. Seeing the tree at a glance — and spotting a place nobody can reach — is the author's highest-value gain. Edit mode is deliberately small: move a circle, reset it, draw a road.
3. Decide travel (not done, on purpose). Today travel comes from the nesting tiers and authored roads, and it is correct and safe. Deriving travel from pixels would (a) break the "no map must work" constraint's spirit, (b) put screen geometry between the author and canonical distanceKm, and (c) risk the map silently changing a number the model must never move. The map is a view over the travel graph, not a second source of truth.

Left out of v1: painted cells / hexes, uploaded background images, per-area "ground" modes, terrain on the map, and any path-finding on the drawing. These are named as later phases or open questions, not smuggled in.

---

3. The data shape

All fields optional and additive. Canon lives on the world and on place records; play lives in the save. Nothing here is required to read an older world.

```ts
// ---- CANON: on the world record (all optional) ----
const WorldMap = z.object({
  version:    z.literal(1).default(1),
  layoutSeed: z.number().int().optional(),          // omitted = 0 at read time
  reveal:     z.enum(['explored', 'survey']).optional(), // default 'explored'
  showRoutes: z.boolean().optional(),               // default true
}).optional();

// ---- CANON: on a place record (all optional) ----
// Present only when the author changed it. Absent = position is worked out.
const PlaceMap = z.object({
  pos:    z.object({ x: z.number(), y: z.number() }).optional(),
          // LOCAL offset within the parent's child-frame, both in [-1, 1],
          // clamped to |r| <= 0.85 so a pinned child stays inside its parent.
  hidden: z.boolean().optional(),   // not drawn and not counted in parent's size
  paint:  z.number().int().optional(), // colour index; never changes shape
}).optional();

// ---- PLAY: in the save (per player) ----
const SaveMap = z.object({
  visited: z.array(z.string()).default([]),         // place ids discovered
  marks:   z.array(z.object({
             x: z.number(), y: z.number(),
             label: z.string(), color: z.number().int(),
           })).default([]),                          // player's own pins
  view:    z.object({ focusId: z.string().optional(),
                      zoom: z.number() }).optional(), // last camera, this player
});
```

Why these and not others. pos is local rather than world-absolute so the containment invariant can never be violated by an author's pin: a child is always inside its parent's circle, because its coordinate is defined relative to it. Normalized [-1,1] makes a pin scale-free, so the same place works whether the world is a continent or a haunted house. hidden mirrors Character Engine's hidden kind — it excludes the place from the parent's size, so hiding is deterministic and visible. reveal and showRoutes are author-level policy, not per-place noise. The camera is per-player UI state, not canon. The seed is optional so "only what the author changed is stored" holds: a world that was never tuned writes no map fields at all and still draws.

distanceKm stays exactly where it is — on the route. Nothing in this shape duplicates it.

---

4. Auto-layout: algorithm, inputs, guarantees, tests

Inputs: the place tree (id, parentId, kind, hidden, pos), the routes list, and layoutSeed. Nothing else.

Steps.

1. Collect. Walk the tree; drop hidden places from sizing and drawing. The root is the frame.
2. Size, bottom-up. size(leaf) = 1. For an inner node: size(v) = (Σ size(child))^p + 1, with p ≈ 0.6. The +1 is a small self-node representing "in this place but not in any child" — the spot Character Engine gave the parent among its own children. Areas count here too: they are rings, but they still occupy and size a circle. Compression under 1 keeps a city from shrinking its neighbours to dots. This is unitless, so depth carries no scale.
3. Place, within each parent. If the parent has no pinned child, arrange children plus the self-node by seeded sunflower (phyllotaxis) packing inside radius R. If it has pinned children, seat each at pos · 0.85R, then pack the unpinned siblings around them into the remaining free arc. Seeded PRNG = hash(layoutSeed, parentId), so the arrangement is stable across sessions and devices.
4. Routes as arcs. For each visible route, draw an arc between the two endpoint circle centres, bowed away from the nearest common parent's centre. Arc weight ∝ log(1 + distanceKm), normalized against the world's route distances, so short plank-walks look short and a long river-road looks long. When an endpoint lies outside the current focus, the route is represented by a small exit tick on the boundary ring with its count and time — this is what keeps the top level readable.
5. Render, with culling and merging. Draw only: the focused subtree, one ring of ancestors, and the focused siblings. Merge adjacent leaf circles of the same paint into a single <path> of subpaths. Cap total drawn paths (~400); the smallest unmerged leaves become dots. This is the phone budget the brief flags, applied at draw time rather than by reducing detail in the data.

Guarantees.

· Total: every non-hidden place has a position, always. There is no "partially mapped" render failure.
· Deterministic: same (seed, tree, routes, pins) → same positions, independent of device.
· Containment: a child's centre is always inside its parent (pins are clamped locally).
· No overlap within a parent: the packer reserves radius, so siblings don't collide.
· No invented numbers: the algorithm reads distanceKm; it never writes or infers it.
· Empty-safe: zero places → empty state; zero routes → circles only; zero map fields → still drawn.

Tests.

· Golden determinism: serialize positions for Bogwater twice, assert equality.
· Invariant sweep: 100 random trees (width 1–50, depth 1–8), assert every child centre inside its parent and no sibling overlap.
· Pin clamp: a pin at (5, 5) is clamped and the child still lands inside its parent.
· Scale: synthetic 800-place tree — assert drawn path count under the cap and measure render time on a throttled phone profile.
· Fallback: a world with no map field renders and its Adventure graph is byte-identical to today's.
· Render snapshot: Bogwater, at 390 px, against a checked-in SVG.

---

5. The player's screen and the author's screen at 390 px

Player (Adventure → Map). The circle map replaces the spoke schematic; the ways-out list stays below it. Both are driven by one selector over the existing travel graph, so they cannot disagree. Fog is on by default: a place is drawn if visited, or is the endpoint of a route from a visited place (so you can see the road out but not what's past it); ancestor areas appear as faint rings. Names show only for visited and adjacent places. Tapping a circle focuses it; travelling is done from the list, so a stray tap can't move you.

```
┌──────────────────────────────┐
│ ‹ Abernys ▸ Bogwater ▸ Inn    │  breadcrumb (tap = focus)
├──────────────────────────────┤
│                              │
│      (  ╭───────╮  )         │  focus: Inn (visited)
│     (  ( rooms  )  )         │  rooms named; parent ring faint
│      (  ╰───────╯  )         │
│            ▲ you             │
│  ╌╌╌ 2m ╌╌╌┐    ┌╌╌ 25m ╌╌╌   │  arcs ≈ distanceKm;
│            └────┘  River Town│  dashed red = blocked
├──────────────────────────────┤
│ Rooms (3)              free  │
│ Plank walk             2 min │
│ River Town  25 min  ⛔ boat  │  list = existing section
└──────────────────────────────┘
```

Author (Studio → Map). A View | Edit toggle. View is the same component as the player's, no fog. Edit: drag a circle to set its local pin; long-press → reset to auto; tap two circles → "draw road" opens the existing route editor prefilled with from/to, where the author still writes distanceKm, terrain, and requirements. A reset all returns the world to pure auto-layout. Unreachable places (no inside path, no route) get a small warning badge, feeding the existing Checks page.

```
┌──────────────────────────────┐
│ Bogwater         [View|Edit] │
├──────────────────────────────┤
│   (   ╭─────────╮  )         │
│  (   (  ╭────╮   ) )         │  drag = pin; long-press = reset
│   (  (  rooms )  )           │
│    (   ╰────╯   )            │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌     │  roads as arcs
├──────────────────────────────┤
│  [+] road   [pin]   [reset]  │  + road = tap two circles
│  Inn · pinned · [reset]      │
│  38 places · 8 roads · ⚠ 1   │
└──────────────────────────────┘
```

---

6. Travel: what changes, and the fallback

Nothing in the travel rules changes in v1. The map is a consumer of the existing graph (adventure/src/engine/world.ts): inside-edges priced by tier, route-edges priced by distanceKm at walkKph. The map labels arcs with the time that graph produces, and shows a blocked route's reason on tap. When a drawn arc and an authored distanceKm "disagree," distanceKm wins, always — the arc is only log(1 + distanceKm) scaled for legibility, never a measurement, and nothing reads screen pixels back.

Fallback is exact. A world with no map data draws from its nesting automatically (nesting always exists), so there is no "no map" state — only "no pins." And the Adventure's cost, reachability, blocking, and the existing self-teleport are untouched: the Map section's data still comes from the same graph, so a world part-way through being laid out is exactly as playable as before.

Later phases may let an author opt into a painted-ground mode that prices travel by cell distance (as Character Engine's hex map did), but that is a separate, opt-in source of truth and is not in this proposal.

---

7. Bogwater under the proposal

Abernys: Bogwater: 38 places, 4 levels, 8 routes, no travel tiers — so inside-moves are free and the eight routes carry all the time. The map would be:

· The world root as a large ring, containing the Abernys region ring, containing Bogwater village as a circle.
· Inside Bogwater: its buildings and rooms as packed circles; the plank walks and eel traps as small places beside the village. Because there are no tiers, moving between a place and its rooms is labelled free, and this shows up as zero-length inside hops inside a single circle — the eye reads the village as one "here."
· The islands as sibling circles near the village, each with a short arc: a few minutes across the reeds.
· The river town as a noticeably larger sibling with a long arc — its length proportional to the river-road's distanceKm, labelled with the time the existing graph computes (e.g., 25 min).
· Every one of the eight arcs carries the route's authored terrain in the tap sheet, and any with a requires entry is drawn dashed red with "needs a boat" (or the authored reason) in the list.
· At the top level, only three or four circles and the arcs between areas are drawn; zooming into Bogwater reveals the rooms, which are exactly the level where names appear (LOD).

No hexes are needed to make this legible, and no author action is needed to produce it — it is drawn the first time the world opens.

---

8. Phases, each shippable

1. Map engine + Studio View (read-only). The shared component, deterministic auto-layout, route arcs, LOD, path merging and cap. Author sees the world's shape and can spot unreachable places. No writes.
2. Adventure map (read-only). The same component in the Map section with explored fog, list kept in sync via one selector, tap-to-focus. Travel untouched.
3. Edit mode. Drag-to-pin (pos), long-press reset, reset all; draw-a-road opens the route editor. hidden and paint become editable here.
4. Overlays and policy. reveal: 'survey', people whose whereabouts the player knows, the player's own marks (SaveMap.marks), and export/import of the map with the world file (whole-map replace, not merge).

Each phase leaves a working Adventure. Phase 1 alone is worth having for the author; Phase 2 alone is worth having for the player.

---

9. Risks and open questions for the owner

· SVG budget on a phone. Character Engine found node count was the wall. The plan merges paths, culls to the focused subtree, and caps drawn paths, but this must be measured on a throttled 390 px device in Phase 1, before it is trusted. If the cap has to drop below ~300 paths, the circle map may need a "clusters as single circles" mode.
· Packing aesthetics. A deep, wide tree can read as a swarm. The compression power p and sunflower spacing need a small tuning pass against Bogwater and one synthetic 800-place world.
· Routes crossing containers. Arcs between distant siblings can clutter. The exit-tick rule hides them behind boundary circles, but the exact cut-off is a tuning question.
· Local pins vs. authors' expectations. Some authors will want to drag a building to "over there" in absolute terms. Local offsets guarantee containment but forbid that. The open question: is a future "ground mode" inside one area worth building, or is containment-only enough for roleplay?
· Fog default vs. self-teleport. The existing "put yourself anywhere by hand" action lets a player move to an unvisited place; that should also mark it visited. Confirm the interaction the owner wants.
· Determinism across devices. Seeded PRNG plus a stable hash gives reproducible layout, but floating-point packing could drift by a fraction between engines. Either accept sub-pixel drift or quantize stored/compared positions.
· Chat. Not covered here. If Chat ever embeds play, it should use the same component and the same fog, but that is a separate decision.
· Nothing reaches the model. Confirmed by design: the map sends no coordinates. The rules already write where-you-are / ways-out / how-far sentences; the map reads those same numbers, never the reverse.

How would you provide a more literal map, such as a hexmap? How would you build
it to best fit the existing model with minimal adjustments? How could you
automate map creation from the record with minimal input?

A literal (hex) map for Inkwyrm

Here is how I would build one so it fits what already exists, and how it fills itself in with little or no author input.

---

The idea in five lines

1. A hex map is not one disc for the world. It is a stack of frames, one per place — a frame is a level, and a level is "the children of this place." That is the single change that makes hexes survive "depth says nothing about scale."
2. Areas are never painted. Cells belong to standable places only; an area's footprint is the union of its descendants' cells, derived, never stored. That matches Inkwyrm's own rule that areas are never somewhere to stand.
3. Auto-fill is a pure function, recomputed on read. Only authored cells, erases, radius and seed are stored. A world nobody touched stores nothing and still draws.
4. The seed is derived from ids, so a zero-input world is stable without a single byte written; a reroll stores one integer.
5. Travel is untouched by default. Hex pricing is opt-in, falls through to the existing graph for any unpainted place, exactly as Character Engine fell back to tiers.

---

Why frames, and not one disc

Character Engine could afford one disc because its world had one implicit ground. Inkwyrm's tree is arbitrary: depth 0 is a continent in one world and a house in the next, and a continent's children are areas that nobody stands on. A single disc would have to decide a scale it cannot know. A frame at place P never has to: it draws P's descendants, expanding through areas to the standable places beneath, and stops where the cells run out. Zooming from a region frame into a village frame is the scale change, and it costs nothing because each frame is computed from the same records.

The rule for what a frame paints:

· Collect: recurse from P; skip hidden; pass through places whose kind is an area; collect every standable place reached. If P is itself standable and has no standable descendants, the frame is one cell.
· Deepest wins: a cell stores one place id. A room's cell is not also its building's cell.
· Areas: footprint = union of descendant cells. Never a cell of their own.

---

The data shape

All optional. Nothing here is required to open an old world.

```ts
const HexKey = z.string().regex(/^-?\d+,-?\d+$/);   // axial "q,r"

const HexCell = z.object({
  placeId: z.string(),
  paint:   z.number().int().optional(),   // colour index; never changes shape
});

const HexFrame = z.object({
  radius:  z.number().int().min(1).max(60).optional(),        // default from size, see §4
  seed:    z.number().int().optional(),                        // default hash(placeId)
  style:   z.enum(['islands', 'bordered']).optional(),         // default from kind
  cells:   z.record(HexKey, HexCell).optional(),               // AUTHORED cells only
  cleared: z.array(HexKey).optional(),                         // erased from auto-fill
});

const WorldMap = z.object({
  version: z.literal(1).default(1),
  frames:  z.record(z.string(), HexFrame).optional(),          // key = placeId
  ground:  z.string().optional(),                              // default frame to open
}).optional();

// PLAY, in the save
const SaveHex = z.object({
  visitedCells: z.array(HexKey).default([]),   // or derive from visited place ids
  view: z.object({ frameId: z.string().optional(),
                   center: HexKey.optional(), zoom: z.number() }).optional(),
});
```

What is canon vs derived. cells holds only cells the author painted or moved by hand. Everything else is recomputed: auto = fill(frame) → auto = auto − cleared → auto = auto ∪ cells. A frame with no stored seed uses hash(worldId, placeId, 0), so a fully automatic world writes no map fields at all and still renders identically on every device. That is the same discipline as "a place that was never placed by hand has no position saved."

What is deliberately absent. No terrain types, no biome enum, no water/road flags, no elevation. paint is a colour index only, so a space station and a fen village use the same field. Routes are not duplicated into cells; they are read from the existing list.

---

Auto-fill: the algorithm

Inputs: the frame place P, its subtree, kinds, hidden, routes (for overlay only), radius, seed, style, and the authored overlay.

Steps.

1. Collect standable places under P, expanding through areas, skipping hidden. Let n be their count.
2. Default the knobs if unset. radius = clamp(ceil(1.15 * sqrt(n) + 2), 2, 40) — enough cells for the places. style = 'bordered' when P is building or settlement-sized (rooms subdivide the whole), 'islands' otherwise. seed = hash(worldId, placeId, 0).
3. Group the collected places by their top-level descendant of P (passing through areas). Each group is a blob; each group's weight is (1 + descendants)^0.55, the same sub-linear compression as the circle proposal, so one huge city does not starve its neighbours.
4. Apportion the disc's 3R²+3R+1 cells among groups by largest remainder, guaranteeing every non-empty group at least one cell.
5. Grow each group's cells by seeded multi-source BFS on the axial grid, start points spread by farthest-point sampling and ties broken by seeded hash. bordered grows until the disc is partitioned; islands grows quotas and leaves unclaimed cells as unmapped ground, which renders as faint empty hexes.
6. Recurse inside each group: partition its cell set among its own sub-groups the same way, until each cell holds one place — the deepest. If a group has more children than cells, paint the parent itself in those cells and note the children as "inside" (the zoom target), rather than silently dropping them.
7. Overlay. Remove cleared, then write authored cells last, so a hand-painted cell always wins.
8. Draw. Group cells by (placeId, paint), emit one <path> per group with one subpath per hex — this is the brief's merge rule, and it means a 2,791-cell disc is a few dozen elements, not thousands.

Guarantees.

· Total and deterministic: every cell claimed or explicitly unmapped; same (seed, tree, radius, style) → identical cells on any device.
· Containment by construction: a child's cells are a subset of its group's cells, so no child escapes its parent's footprint, and areas' unions are therefore exact.
· Scale-free: the frame never reads depth as size.
· No invented numbers: routes and distanceKm are never written or inferred.
· Empty-safe: no frame, no places, or no map fields → the existing views are untouched.

Tests. Byte-identical cells across two runs and two devices; child⊆parent sweep over random trees; every cell of a radius-30 disc claimed under bordered (2,791 of 2,791); a building with 20 rooms and radius 3 degrades to "parent painted, rooms listed" rather than losing rooms; authored cell wins over auto; cleared survives a re-render; render budget at 390 px.

---

What changes in the existing model (the whole list)

Reused unchanged: place tree, kind list (areas excluded by rule, not by a new field), hidden, routes with distanceKm/terrain/requires, the travel graph in adventure/src/engine/world.ts, the Map section's list, self-teleport, Checks page.

Added: one optional WorldMap on the world; a Map tab on a place's Studio page showing that place's frame; two checks ("cell references a place that no longer exists", "standable place with no cell in its frame" — informational, not blocking).

Untouched: travel cost, requirements, blocking, the model's inputs, the world file format's required fields.

Rendering: SVG for frames up to ~800 cells (merged paths), canvas above that, behind one component interface. Same component serves Studio and Adventure.

---

The two screens at 390 px

Author (Studio → place → Map).

```
┌──────────────────────────────┐
│ Bogwater  [View|Edit]  ⌄frame│
├──────────────────────────────┤
│      ⬡ ⬡ ⬡ ⬡                 │  islands style:
│    ⬡ ⬡ ⬡ ⬡ ⬡                 │  faint ⬡ = unmapped
│  ⬡ ⬡ ⬢ ⬢ ⬡ ⬡                 │  ⬢ village, ⬣ rooms
│    ⬡ ⬣ ⬣ ⬡ ⬡                 │
│      ⬡ ⬡ ⬡                   │
├──────────────────────────────┤
│ [auto-fill] [reroll] [radius]│
│ brush ▸ place  size 0  colour│
│ seed 0 · r=6 · islands · 41⬡ │
└──────────────────────────────┘
```

Edit: Select / Paint place / Paint colour, a brush size where 0 floods the connected same-place region (Character Engine's rule, kept), tap a painted cell to zoom into the child frame, and frame ▾ to jump between levels.

Player (Adventure → Map → Ground).

```
┌──────────────────────────────┐
│ ‹ Abernys ▸ Bogwater   [◎|⬡]│  toggle: circles | ground
├──────────────────────────────┤
│    ⬡ ⬡ ⬡ ⬡                   │  fog: only visited +
│  ⬡ ⬢ ⬢ ⬢ ⬡                   │  neighbours shown; rest
│    ⬢ ▲ ⬢ ⬡                   │  faint or blank
│  ⬡ ⬡ ⬡ ⬡                     │  ▲ you
├──────────────────────────────┤
│ Plank walk           2 min   │  list unchanged, from
│ River Town  25 min  ⛔ boat  │  the same travel graph
└──────────────────────────────┘
```

Fog is per-player and lives in the save: a cell shows if its place is visited, or is adjacent to a visited cell. Tapping a cell opens the same tap sheet the list already produces. The circle view stays the default; Ground is opt-in when a frame exists.

---

Travel

Default: nothing changes. The map is a view over the graph. Routes are drawn as lines between painted cell centres purely for legibility; the time on the label is what the graph computes today.

Opt-in later (Phase 4): world.map.pricing: 'graph' | 'hex'. On 'hex', a journey between two painted places costs cube distance × a per-cell minutes setting. If either end is unpainted, it falls through to the graph rather than refusing — Character Engine's rule, and it keeps a half-laid-out world playable. distanceKm still wins wherever a route exists; hex cost only fills gaps where today there is no edge at all. That is the only place a hex map could touch a number, so it ships last and off by default.

---

Bogwater under this proposal

38 places, 4 levels, 8 routes, no tiers. Two frames are enough, and both fill themselves:

· Frame at the region (islands, radius ≈ 4): two blobs — Bogwater village and River Town — with the long river-road drawn between them and labelled with its distanceKm time. The fen around them is unmapped ground. This is the "where am I in the world" view.
· Frame at Bogwater (bordered, radius ≈ 5): buildings and rooms subdividing the village; the plank walks as thin blobs threading between buildings; the eel traps as single cells on the water's edge; the islands as small blobs just outside. Because there are no travel tiers, the room-to-room cells cost nothing, and the only times that appear are the eight routes.

Zoom out: two settlements and a long road. Zoom in: rooms, walks, traps. Zero author input.

---

Automation with minimal input

The zero-input path is the point:

1. First open of the Map tab runs auto-fill with a derived seed and derived radius. The author sees a finished map before deciding anything.
2. Three knobs, all optional: reroll (stores one integer), radius (a slider, stores one integer), style (a toggle). Nothing else is asked.
3. Paint only exceptions. Brush a cell, erase a cell, that is it. Everything unpainted stays derived, so adding a room to the world changes the map on next open without the author doing anything.
4. Frames appear where needed. The frame for a place is created on demand when its Map tab is opened; nothing pre-generates a stack of empty frames.
5. Defaults from the records, never from assumptions: radius from place count, style from kind, groups from the tree, seed from ids. No terrain, no biome, no scale guess.

---

Phases

1. Read-only ground view in the Studio. Auto-fill, render, LOD labels, path merging, two checks. Worth shipping alone.
2. Ground toggle in the Adventure with per-player fog, list kept in sync from the same graph.
3. Edit: paint, flood at size 0, erase (cleared), reroll, radius, style, frame navigation.
4. Opt-in hex pricing with graph fall-through, off by default, plus route lines drawn across painted frames.

---

Risks and open questions

· Deep frames with too few cells. A building with 20 rooms at radius 3 cannot give each a cell. My rule paints the parent and lists the rooms; the alternative is to auto-grow the radius, which surprises the author. Owner's call.
· Areas with no standable descendants (a sea, an empty region) have no footprint at all. Should they be paintable as ground anyway, breaking the "areas never stand" rule? I would say no, and let them be unmapped.
· A building's rooms vs. the village frame. Rooms sit four levels deep; the village frame is two. The frame stack handles it, but the author must understand that a frame is a level. Wording in the Studio matters more than code here.
· SVG vs canvas threshold (~800 cells) needs measuring at 390 px before it is trusted.
· Fog and self-teleport. If a player teleports into an unpainted or unvisited place, it should mark that place visited so the ground view agrees with the list.
· Nothing reaches the model, as before: no coordinates, no cells. The rules' existing sentences are the only channel.