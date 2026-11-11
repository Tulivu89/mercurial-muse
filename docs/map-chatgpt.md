# Inkwyrm Maps — Proposal: The Living Atlas

## 1. The recommendation in five lines

1. Build one **Living Atlas**: a navigable, nested map generated from the place tree, with authored routes influencing its layout.
2. Use the same map renderer in Studio and Adventure, with editing controls in Studio and player-specific information in Adventure.
3. Give authors the ability to move and size places, but never require them to lay anything out manually.
4. Keep the existing travel graph authoritative. Map positions never determine travel time, distance, eligibility, or cost.
5. Ship the generated atlas first, then editing. Defer hex painting, geographic pathfinding, and background images until there's evidence they're needed.

## 2. The jobs, ranked

### First: Show the player where they are

The player's question is not primarily "What does this continent look like?" It is "Where am I in relation to the places I can reach?"

The map should answer four things without requiring a narrator to explain them:

- My current location and its containing places.
- Nearby places and their relationships.
- Available and blocked ways out, with travel time.
- The locations of people whose whereabouts I know.

A place can be inside another place without having a road connecting it to a sibling. The atlas must distinguish containment from travel.

### Second: Help authors build

Studio should turn the existing place tree and routes into a manipulable spatial overview.

Authors should be able to recognize disconnected regions, excessive clustering, missing roads, and odd relationships without opening each place separately.

But the atlas is not the primary place editor. The existing place pages remain the authority for names, parents, rules, and route properties.

### Third: Decide travel — explicitly excluded

I would not make drawn geography determine travel in any initial phase.

The existing rules graph has authored distances, requirements, and time calculations. Those represent deliberate world-building decisions.

Replacing those decisions with screen-coordinate distances would make a world less dependable, especially at radically different scales.

**The Living Atlas represents the rules. It does not become another set of rules.**

This also avoids recreating Character Engine's choice between circle-priced and hex-priced travel.

## 3. The data shape

My recommendation is a single optional `map` field on the world, with sparse overrides indexed by existing place IDs.

No generated position is ever saved.

```ts
type MapPin = {
  // Parent when this position was authored.
  // null means the world's root.
  parentId: string | null;

  // Normalized coordinates in that parent.
  x: number;  // 0..1
  y: number;  // 0..1

  // Visual prominence, not real-world size.
  size?: number; // 0.6..2, default 1
};

type WorldMap = {
  // Absent: derive deterministically from world ID.
  // Saved only when the author rerolls.
  layoutSeed?: number;

  // Entries exist only after manual placement.
  pins?: Record<string, MapPin>;

  // Later phase; absent means "all".
  visibility?: "all" | "known";
};

type World = {
  // Everything already present remains unchanged.
  map?: WorldMap;
};
```

The existing routes do not receive new map-specific distances or endpoint positions. They already have endpoint IDs.

The player's save gets separate optional data:

```ts
type PlayerMapMark = {
  id: string;
  placeId: string;
  text: string;

  // Optional position within that place.
  x?: number;
  y?: number;
};

type SaveMap = {
  visitedPlaceIds?: string[];
  revealedPlaceIds?: string[];

  marks?: PlayerMapMark[];

  // UI camera state, not character location.
  view?: {
    focusId?: string | null;
    zoom?: number;
    offsetX?: number;
    offsetY?: number;
  };
};

type AdventureSave = {
  // Existing save fields stay unchanged.
  map?: SaveMap;
};
```

### Important data rules

**Coordinates are parent-local.** A building's `x: 0.7` means 70% across its immediate parent's drawing, not 70% across the planet. This lets the same machinery handle continents, buildings, and rooms.

**Unplaced is not a special state.** If no pin exists, the layout engine generates its position.

**Manual pins are fixed.** Auto-layout moves unpinned places around them. It never silently moves an authored pin.

**Reparenting is explicit.** If the place's actual parent differs from the parent recorded in its pin, the renderer ignores that pin and Studio reports it as stale. The author can place it again or discard the override.

**The camera is not the character.** Unlike Character Engine, focusing or panning the map cannot change where the character stands.

**No duplicate world facts.** Names, kinds, containment, roads, and distances come from their existing records.

An old world with no `map` field renders with generated positions. An old save with no `map` field operates normally.

## 4. Auto-layout

I propose a **route-aware nested layout** rather than a single global force-directed graph or a literal hex map.

The map is organized into focus levels. At any one level, it shows the immediate children of a selected place, plus the selected place itself when it can be occupied.

The author or player drills into a child to see its contents.

### Step 1: Construct the focus map

Given a focus parent `P`:

1. Fetch the immediate children of `P`.
2. Add a small "Here" anchor for `P` if `P` is standable.
3. Collect existing authored routes relevant to those children.
4. Project endpoints deeper in the tree onto the immediate child that contains them.
5. Represent connections leaving `P` as edge portals rather than pretending the destination is inside `P`.

A route between two rooms of the same building becomes visible when focusing that building. At a higher level, it does not need its own line.

Multiple underlying routes between two visible groups can be combined into one line with a count badge. Drilling in exposes the individual connections.

Containment edges and actual roads remain distinct.

### Step 2: Assign visual weights

A place's footprint is determined by its contents, but compressed so large parents do not swallow everything.

For example:

```ts
weight = Math.pow(
  1 + descendantCount,
  0.3
);
```

Clamp the result to a reasonable visual range, then apply an authored size override if one exists.

Kinds influence icons and styling, not geometric rules. A district, room, spacecraft compartment, and wilderness can all use this layout.

Areas are drawn as containing regions, not reachable destinations.

A standable parent receives its own small occupied-space anchor, so "in the house, but not in a particular room" remains representable.

### Step 3: Generate a deterministic initial layout

Use a small seeded pseudo-random generator.

The seed derives from the world identifier, focus parent identifier, layout algorithm version, and optional author seed override.

Place IDs are sorted before processing, so array ordering cannot alter the result.

Initialize strongly connected route groups near one another. Use deterministic hashed positions for disconnected groups.

Do not use place names, descriptive text, or AI interpretation to guess geography.

A road described as passing east does not automatically put its destination east. The author makes that geographic assertion by positioning it.

### Step 4: Relax the layout

Use a bounded spring-and-collision simulation:

- Road-linked places attract one another.
- Longer authored routes receive longer preferred visual lengths.
- Unconnected places repel to avoid piling up.
- Large visual footprints get more space.
- The parent boundary constrains all children.
- Authored pins are immovable obstacles.

Use `log(1 + distanceKm)` with clamping to keep one enormous route from dominating the layout.

Run a fixed iteration count, such as 64, with deterministic ordering and numerical rounding.

The distances affect visual arrangement, but not the rules graph.

This produces a map where shorter connected journeys *tend* to look shorter while admitting that an arbitrary network cannot always be embedded without distortion.

### Step 5: Resolve density

For normal groups, collision resolution separates visible footprints.

For an extremely crowded parent, switch to clustering rather than shrinking labels indefinitely.

A cluster is a visual summary, not a new world place. Tapping it offers its contents, and zooming can split it.

This matters when a world has 800 places, particularly if hundreds are siblings rather than evenly distributed through the hierarchy.

### Step 6: Render only what's useful

Use React 18 and SVG, without a new dependency.

Recommended rendering limits at phone size:

- Approximately 60 visible place shapes.
- Approximately 20 visible place labels.
- Roads grouped into a small number of SVG paths by style.
- Labels allocated to the highest-priority places first.
- Hidden details revealed by focus or zoom, not drawn as invisible DOM nodes.

The current location, selected place, and immediate exits override ordinary label priorities.

A single route path can contain multiple subpaths. The same approach can draw clustered region outlines without thousands of separate SVG elements.

### Guarantees

The layout guarantees deterministic results, correct containment, respect for valid manual pins, no stored generated coordinates, and no invented travel edges.

It does **not** guarantee accurate compass directions, geographic scale, non-crossing roads, or proportional physical area.

That distinction should be visible in the interface: this is a schematic atlas unless the author has deliberately positioned it.

### Tests

The first implementation should include:

1. Byte-identical layouts for identical worlds and seeds.
2. No valid authored pin moves during regeneration.
3. No generated child escapes its parent.
4. Reparented and deleted places do not break rendering.
5. All existing valid routes retain their IDs and endpoints.
6. A world with no map data retains exactly the same travel outcomes.
7. Large generated worlds with 800+ places remain usable at 390 px.
8. Different seeds generate different layouts without changing any world rules.

A useful additional test is deliberately contradictory route geometry: a triangle whose authored distances cannot fit the apparent layout. The renderer must handle it without modifying distances or crashing.

## 5. The player's screen and the author's screen

### Adventure: one atlas, existing travel list

I would expand `MapSection.tsx`, not replace its existing navigation functionality.

The atlas belongs above the list of travel options. The current spoke schematic can remain available as a compact "Exits" view, since it communicates immediate movement particularly well.

A phone at 390 px might look like:

```text
┌──────────────────────────────────┐
│ MAP                              │
│ World › Fen › Bogwater           │
│                                  │
│ You are: Village Square          │
│                                  │
│ [Atlas] [Exits]      [−] [+] [⌖] │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │    ○ Building                │ │
│ │       ⋮                      │ │
│ │  ● YOU ───── ○ Plank Walks   │ │
│ │       ╲                      │ │
│ │        ○ Other location      │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│ Selected: Plank Walks            │
│ [Open details]                   │
│                                  │
│ WAYS OUT                         │
│ ○ Plank Walks     [time] [Go]    │
│ ⛔ Blocked route   [Requirement] │
└──────────────────────────────────┘
```

This is an interface sketch, not an assertion about Bogwater's actual edges.

The Atlas view supports touch pan, pinch zoom, and tap selection. A second tap or a clear "Open" action focuses a container.

The zoom controls and recenter action are also available to people who cannot conveniently pinch.

A selected location opens a sheet giving its name, relationship to the player, known occupants, and actual rules-computed travel time. Only valid reachable destinations get a Travel action.

The existing ways-out list stays available beneath the map and uses the same graph data.

**Blocked routes must be distinguishable without colour.** Use a dashed line, a lock symbol, and a readable reason.

### Discovery and knowledge

Initially, all places continue to be visible by default, consistent with existing world behavior. No existing world suddenly acquires fog of war.

The save can record visits from the first phase, even though they do not hide anything yet.

In a later opt-in visibility mode, the atlas displays visited and explicitly revealed places. An unknown destination may appear as an unnamed exit if the rules allow the player to perceive the route.

Known character whereabouts can appear as small markers at their known places. The map never reveals a character's actual location merely because the engine knows it. Unknown whereabouts remain unknown.

Player marks and notes overlay the canon map. They never modify it.

### Studio: View and Edit

The same map appears in Studio, without the player's discovery restrictions.

```text
┌──────────────────────────────────┐
│ STUDIO                           │
│ Places › Map › Checks            │
│                                  │
│ World › Fen › Bogwater           │
│                                  │
│ [View] [Edit]                    │
│                                  │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │   ○ Village Square           │ │
│ │        ╲                     │ │
│ │         ○ Plank Walks        │ │
│ │            ╲                 │ │
│ │             ○ Building       │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│ Edit tool: [Pan] [Place] [Route] │
│                                  │
│ Selected: Plank Walks            │
│ [Pin position] [Size −] [Size +] │
│ [Reset position]                 │
│                                  │
│ [Reroll unpinned places]         │
└──────────────────────────────────┘
```

**View mode** supports browsing and inspection, with no edits possible.

**Edit mode** has three explicit tools:

- **Pan:** One-finger drag moves the view, pinch zooms.
- **Place:** Select a place and drag its anchor. Releasing creates or changes its sparse pin. Resizing changes visual emphasis.
- **Route:** Tap the starting place, then the destination. Open the existing route editor to supply distance and requirements.

The explicit tools prevent a touch gesture from accidentally moving a place when the author meant to pan.

When a route endpoint is outside the visible focus, the destination can be selected from the existing place tree or search.

The map must not create a route just because two place shapes touch or overlap.

Drawing a route never calculates `distanceKm` from pixels. The author provides the distance, and the existing route record stores it.

**Reset position** deletes the selected pin and returns that place to automatic layout. **Reroll** changes only the seed; existing pins stay fixed.

Studio's Checks page should gain warnings for stale pins and invalid references. Disconnected groups should also be visually identifiable, but not automatically classified as errors: an unreachable place can be intentional.

## 6. Travel

### No changes to the rules engine

The existing graph remains the sole travel authority.

Inside edges use the configured travel tiers. Authored routes use `distanceKm`, `walkKph`, and requirements. Costs and blocked reasons remain computed by existing rules.

The atlas asks for the results of those calculations, rather than implementing its own calculator.

This has several desirable consequences.

Moving a village across the map cannot suddenly make a journey take three days.

A map with no pins travels exactly like a fully arranged map.

A route with no visually plausible geometry remains a legitimate authored route.

Rooms retain their existing movement behavior even when rendered on a close-up map.

### Disagreements between drawing and distance

**The authored `distanceKm` always wins.**

Studio may show a non-blocking warning if mapped route lengths are radically inconsistent with each other, but it must never silently repair a distance or infer one from the drawing.

In the player interface, present rules-computed time prominently. Do not display a map scale bar or estimated geographic distance that implies stronger accuracy than the atlas provides.

### Narrator interface

The map adds no new coordinate information to the model.

The engine may continue expressing relevant facts as sentences:

"You are in the village square."

"The plank walk leads to the traps."

"The route requires a boat."

"Travel takes the time calculated by the rules."

Any such sentences must come from the existing world and rules data, not the SVG.

The model does not receive the layout seed, position, camera, pin coordinates, or map geometry.

It does not decide travel or move characters.

## 7. Bogwater

Abernys: Bogwater is a good first acceptance test because it has meaningful nesting, routes, and relatively little travel configuration.

On the first opening, the atlas would generate a complete schematic from its 38 places and 8 routes. No author setup is required.

At a broad focus, the surrounding fen areas would contain their settlements and landmarks. The road-connected village, traps, islands, and river-town locations would be positioned in relation to their route graph.

The eight authored routes would appear at the appropriate focus levels. Internal connections would become visible as the author drills into the containers holding their endpoints.

Focusing Bogwater would reveal its own children, including appropriate village locations and pathways. Focusing a building would show its rooms, with an anchor for being in the building itself where applicable.

Nothing in the description alone should cause the renderer to place the river north, the islands east, or the eel traps downstream. Those decisions belong to the author.

The author could then perform a few simple refinements:

- Put river-related locations along a visually coherent edge.
- Position islands together if that matches the intended geography.
- Place the village's plank-walk connections in their desired orientation.
- Pin the key places, leaving minor locations automatically arranged.

Only those edited placements would be saved.

Because Bogwater has no configured travel tiers, entering or leaving its nested rooms would retain its existing free movement behavior. The authored routes would continue to supply the time-bearing journeys.

A route requiring equipment or a state threshold would be shown blocked when the player's actual state fails its requirements.

This is the desired outcome: **a recognizable Bogwater map after a handful of author adjustments, a usable map without any, and no change to how Bogwater plays.**

## 8. Phases

### Phase 1 — Generated Atlas

*Shippable on its own.*

Implement the pure layout engine, shared SVG viewport, focus navigation, touch controls, current-location marker, authored-route lines, and integration with the existing Adventure Map section.

Expose a read-only Atlas view in Studio so authors can inspect the same result.

No world schema change is required to display an unedited world.

Acceptance test: Bogwater opens with no map data, shows its places and roads, works on a 390 px phone, and all travel results match the current engine.

**This is the smallest version worth shipping.**

### Phase 2 — Author positioning and route editing

Add Edit mode to Studio, sparse pin overrides, visual sizing, reroll, reset, and explicit route creation using the existing route editor.

Add the necessary validation to Checks.

Export the world map overrides with the world file. Imported map data replaces the corresponding map data, rather than merging unrelated layouts cell by cell.

Acceptance test: rearrange Bogwater's important locations, export, import, and recover the same layout. Removing a pin returns that place to its generated position.

No travel changes.

### Phase 3 — Player knowledge and marks

Record visited places in saves, permit explicit player marks, and offer opt-in restricted visibility for worlds that need exploration.

Support known character locations as overlays.

Keep visibility rules deterministic and independent of the narrator's claims.

Acceptance test: two saves of the same world may have different discoveries and marks while sharing identical canon geometry.

### Phase 4 — Optional geographic artwork

Only after authors have used positioning.

Allow a locally stored background image for a chosen focus level, with existing pins aligned over it.

This enables floor plans, starship decks, city diagrams, or actual terrain without introducing a second navigation or travel system.

The image would be embedded in the browser-stored world assets and included in export. No external tiles or network service.

This phase would require image-size limits, compression policy, and careful handling of world file growth.

I would assess demand for this before building hex painting. A background plus pins may solve the majority of authors' literal-map needs at much lower implementation cost.

Hexes remain a possible separate tool, not a hidden dependency of the atlas.

## 9. Risks and open questions

### Risk: A schematic gets mistaken for geography

This is the largest conceptual issue.

Even a route-aware atlas can imply spatial relationships the author never established.

The interface should explicitly avoid claims of compass direction, scale, and physical area unless they have been authored. The map is a representation of known relationships, not guaranteed geography.

### Risk: Automatically generated places shift after editing the world

Adding a place or route can change the relaxed arrangement of unpinned siblings.

This is acceptable for an unedited map, but potentially irritating for an author who has become familiar with a generated layout.

ID-based initialization helps preserve local stability; pinned locations remain fixed. We should test how disruptive normal author edits feel before adding more sophisticated stability mechanisms.

### Risk: Large sibling groups

A world with 800 places spread over many parents is easier than a world with 800 children of one parent.

Clustering, detail thresholds, and batched SVG paths must be included in the initial renderer rather than postponed as emergency optimizations.

### Risk: Cross-level roads become confusing

A route connecting a deeply nested place to something outside its containing region needs a clear portal or drill-down indication.

The renderer must not misleadingly draw that road as if its endpoint were at the higher-level container's centre.

I recommend implementing and testing endpoint projection independently of rendering.

### Risk: Editing on a narrow screen

Dragging a place, panning, selecting a route endpoint, and scrolling the page all compete for touch gestures.

Explicit edit tools, large touch targets, and a selected-place sheet are more important than desktop-style direct manipulation.

### Open question A: How much geographic fidelity does the owner actually want?

There are two plausible expectations:

- An atlas that makes the world's relationships legible.
- A literal ground plan where relative positions are meaningful.

My proposal strongly favors the first, with a path toward the second through manual placement and optional images.

If the requirement is literal navigable ground from the start, the proposal should change substantially.

### Open question B: Should a standable parent have a selectable physical footprint?

I recommend yes.

It preserves the distinction between "inside the building" and "inside a room," and avoids assuming every location has to be one of its children.

But the rendering should be tested against the current travel graph, particularly when an area is non-standable.

### Open question C: Should Studio show a world-wide map with every level visible?

I recommend no for the initial version.

Use focus levels with breadcrumb navigation. A global view with every nested element visible is appealing but can become unreadable on a phone.

The world root remains a legitimate focus, so the author can still get an overview of the largest containers.

### Open question D: How much map styling should authors control?

Initially: position and relative visual size, with kind-driven defaults.

I would not add arbitrary fills, borders, icons, and palettes to Phase 2. Those features tend to expand the data model and editing interface before the fundamental map is proven useful.

### Final position

The difficult part of maps in Inkwyrm is not drawing shapes. It is preventing a new visual representation from becoming a competing source of truth.

The Living Atlas has one authority for containment, one authority for routes and travel, one sparse layer of authored spatial choices, and a separate layer of player knowledge.

That separation is the main architectural recommendation.

I would build **Phase 1 and Phase 2 before considering a second map system**. Together, they should deliver what Character Engine's circle map did best—instant usefulness from the place tree—while adding something it lacked: an editable, route-aware sense of physical arrangement.

The map starts useful. The author can make it personal. The adventure never depends on that effort.

How would you provide a more literal map, such as a hexmap? How would you build
it to best fit the existing model with minimal adjustments? How could you automate map creation from the record with minimal input?

# Inkwyrm: A literal hexmap built from the existing world

My recommendation is to build a hierarchical hexmap that generates itself from the existing records, then lets the author correct the geography by painting directly on it.

This is closer to Character Engine's hexmap than to my earlier Living Atlas proposal. I think it may actually be the better fit for Inkwyrm, provided the implementation observes one central rule:

The hexmap describes where places are. The existing place tree describes what contains what, and the existing route graph describes how travel works.

The key decisions would be:

- No changes to place or route records. Hexes reference existing place IDs. They don't create places, duplicate their properties, or invent roads.
- No required setup. Opening a world generates a deterministic map using its nesting, place kinds, and authored routes.
- One map system at multiple scales. A continent, spaceship, town, and house can each have hex geography, without assuming that a place's depth determines its physical scale.
- Sparse authoring. The author can paint locations, redraw boundaries, and reroll generated terrain. Only intentional changes are stored.
- No automatic change to travel. Existing `distanceKm`, travel tiers, and route requirements remain authoritative.

The limitation is worth establishing immediately: the records contain relationships, not enough information to recover actual geography. An algorithm can produce a coherent, connected, plausible map. It cannot know that a river runs north to south, or that the inn is west of the square, unless the author supplied that information.

I would therefore design the generator to make useful guesses, expose those guesses for correction, and keep correction extremely inexpensive.

## 1. The architecture: one hex system, many local maps

I would not build one enormous grid covering the entire world at a single resolution.

Instead, I would give every place that contains other places an automatically available local hexmap, generated on demand. No author has to create these maps individually.

How the hierarchy becomes geography

Illustrative

Regional map

Settlements, regions, landmarks

Selected settlement

Buildings, paths, local places

Opening a place reveals its own hexmap. Each sheet gets a suitable scale instead of forcing the whole world onto one resolution.

Suppose the place tree is:

```
Abernys
└── Fen
    ├── Bogwater
    │   ├── Village Square
    │   ├── Inn
    │   │   ├── Common Room
    │   │   └── Upstairs Room
    │   └── Plank Walks
    ├── Eel Traps
    └── River Town
```

These names illustrate the structure rather than assert the exact Bogwater tree.

When viewing Fen, its direct children claim hexes. Opening Bogwater changes the focus to its own hexmap, where Village Square, Inn, and Plank Walks claim hexes. Opening Inn gives a small interior map.

A place can occupy one hex or many. The map always knows which place owns a hex, because it references the existing place ID.

This preserves nested containment without giving individual rooms the same geographic scale as towns.

There is one deliberate compromise: the maps are geographically literal within each focus level, but changing focus opens a new local scale. It is not a seamless, globally measurable zoom from continent to bedroom. Achieving that would require a substantially more complicated coordinate system.

For Inkwyrm, I think this compromise is worthwhile.

## 2. The entire persistent data addition

I would use the optional `map` field proposed earlier, but replace point coordinates with hexmap overrides.

```
type Axial = {
  q: number;
  r: number;
};

type HexSheet = {
  // Only present when changed from automatic.
  radius?: number;
  seed?: number;

  // Optional generation preference.
  layout?: "bordered" | "islands";

  // Manually fixed place seeds.
  anchors?: Record<string, Axial>;

  // Only manually edited cells.
  cells?: Record<
    string, // "q,r"
    {
      placeId?: string;
      paint?: number;
    }
  >;

  // Optional hand-drawn road geometry.
  // Keys are existing route IDs.
  routePaths?: Record<string, Axial[]>;
};

type WorldMap = {
  hex?: {
    version?: number;

    // Key = parent place ID.
    // A reserved key represents world root.
    sheets?: Record<string, HexSheet>;
  };
};

type World = {
  map?: WorldMap;
};
```

That's the complete proposed world data change.

For a world where nobody touches the map, the entire field can be absent.

The renderer derives the seed, radius, positions, shapes, and visual treatment from existing records.

When someone paints three hexes, the saved world contains three cell overrides, not a serialized copy of the whole generated map.

The generator version needs to be fixed when an author first saves map edits, so later algorithm changes cannot reinterpret their work unexpectedly.

One more point: `routePaths` are visual paths only. A route's endpoints, distance, requirements, and terrain remain in the existing route record.

## 3. Automatic creation: the six-stage generator

I would adapt Character Engine's seeded hex partitioner, adding route-aware placement and stronger preservation of manual edits.

Stage 1 — Read the existing place tree

Select a focus place and obtain its direct children. For each child, calculate descendant count, kind, and the routes connecting its subtree to other visible subtrees.

Don't create any new world records. These are temporary layout inputs.

Stage 2 — Choose the grid automatically

Choose a hex radius large enough to accommodate the children, their estimated footprints, and some remaining parent territory.

A radius-30 hex disc contains 2,791 cells. Smaller scenes generate smaller discs.

The radius follows the number and visual weights of places, not the depth of the place tree.

Stage 3 — Place seeds using the route graph

Give every child an initial seed hex. Places connected by routes should tend to start near one another; unconnected groups get more separation.

Use a fixed seeded layout process with sorted IDs. Existing manual anchors override generated seeds.

Authored route distances can influence relative spacing, but use compressed weights rather than treating kilometre values as exact hex counts.

Stage 4 — Grow the territories

Starting from the seeds, expand places through neighbouring hexes with a deterministic, quota-aware flood fill.

Every generated child footprint should be contiguous. Descendant count contributes to its target size, compressed so complex settlements don't swallow their neighbours.

Space not claimed by children remains part of the containing parent. For non-standable areas, this is visual background, not a travel destination.

Stage 5 — Add roads as a separate overlay

Project existing route endpoints onto their visible containing places.

Draw a route between their footprints, using a hex-grid path search or a simplified line. Roads crossing the map are permitted without reallocating territory.

Routes leaving the current sheet receive an edge marker or destination indicator. No route is invented because two territories touch.

Stage 6 — Apply authored constraints

Treat saved anchors and cell paints as fixed constraints, then regenerate everything else around them.

Never silently overwrite a manually painted cell. If constraints conflict or are impossible to satisfy, report them in Studio instead of pretending the map is valid.

### Why routes should guide the seeds

This is the biggest improvement I would make over a purely territory-based auto-filler.

Consider three locations, A, B, and C. A has a short route to B and a much longer route to C. The generator should usually place B closer to A than C.

It cannot guarantee exact proportions, because roads may curve and the place graph may have contradictory distances. Nevertheless, it can produce a useful first draft with considerably less manual correction.

The algorithm should distinguish route connectivity from adjacency. Two regions may share a hex border without a usable route between them.

## 4. How much can be inferred from the existing records?

Some information is highly reliable. Other information is only a visual heuristic.

| Existing data         | Safe map inference                               |
| --------------------- | ------------------------------------------------ |
| `parentId`            | Geographic containment                           |
| Descendant places     | Relative footprint budget                        |
| `place.kind`          | Icon, default styling, possible shape preference |
| Route endpoints       | Road connectivity                                |
| `distanceKm`          | Relative layout preference                       |
| `routeClass`          | Road style                                       |
| `requires`            | Blocked route presentation                       |
| `terrain` description | Display text, not automatically trusted geometry |

I would not have an LLM create the map. This is a deterministic layout problem, and the results should be reproducible.

Likewise, I would avoid silently interpreting prose such as "the road heads east past the marshes." The existing structured data doesn't establish that direction.

An optional future tool could extract directional suggestions from descriptions for the author to approve, but it should never manufacture geographic canon.

### One optional input that would help considerably

Let the author select a generation style.

Try a map-generation style

BorderedIslands

Bordered: territories partition the space. Best for neighbouring regions, districts, and similar layouts.

Illustration of the two generated patterns, not a live generation from world records.

Both modes use the same grid and generator. Only target coverage and growth behaviour change.

The author can pick neither and use the default.

I would not start with dozens of generation settings. The earlier Character Engine options—density, shape, borders, spread—are useful, but they can grow into a configuration surface larger than the actual editor.

## 5. Editing should be painting, not coordinate management

This is where I think the hexmap has an advantage over the Living Atlas.

The author sees the world, selects a place, and paints its footprint. They do not have to enter coordinates, manipulate polygons, or hand-create spatial boundaries.

For a 390 px phone:

Studio / Hexmap

Edit

Abernys / Fen / Bogwater

Tool

Pan

Place

Color

Road

Selected place

Village Square

Brush size

3 hexes

Reroll unpainted

Reset selected

Interface concept. The same canvas can be used read-only in Adventure, without editing controls.

In Place mode, dragging paints the selected place ID onto cells. A size-zero brush can flood-fill a connected area of the same existing owner, restricted to the current sheet.

In Color mode, painting changes appearance without changing ownership. A colour swatch should never implicitly mean water, rock, road, or any other rules-level property.

In Road mode, the author selects an existing route and may draw its visual course. Creating a new route should invoke the existing route editor.

The author can also move a place's generated seed, reroll everything unpainted, or reset individual edits to generated defaults.

I'd retain the current nested place list alongside this. Authors should not have to navigate a map to find a record.

## 6. How this integrates with travel

I would make zero changes to `adventure/src/engine/world.ts`'s travel calculation for the first version.

Clicking a hex determines a place ID. From there, the current engine determines whether the player can reach that place, the route taken, the cost, and whether requirements are satisfied.

A hex has no inherent passability. Adjacent hexes do not automatically create inside edges or roads. The map doesn't add steps or travel encounters.

This means the current one-step journey resolution remains unchanged.

There is one valuable future enhancement: if an author explicitly assigns a scale to a sheet, Studio can calculate a suggested `distanceKm` for a hand-drawn road. Accepting the suggestion updates the existing route record through its normal editor. Nothing is automatically overwritten.

That gives geographic drawing a useful relationship to travel without creating a second authoritative distance system.

## 7. Rendering it efficiently

For the existing browser-only, phone-first stack, I would use Canvas 2D for hex cells, SVG for overlays, and React 18 for the interface.

The significant performance choice is to avoid one React component or SVG element per cell.

The generator returns an array of cell ownership indices, which the canvas paints in batches. Contiguous cells of the same appearance can be combined into cached `Path2D` objects. SVG draws a capped number of labels, route overlays, and markers.

Touch hit-testing converts screen coordinates to an axial hex coordinate and looks up the owning place ID directly.

Pan and pinch are transformations of the viewport, not thousands of individual cells.

No new npm dependency should be necessary.

Generated sheets are cached in memory and invalidated when relevant places, routes, seeds, or map edits change. Unopened sheets don't need generation.

An 800-place world should not require computing 800 rooms' hexmaps when the player is looking at the continent. Only the current focus and its immediate layout inputs matter.

## 8. Bogwater: what happens with zero author input?

For the 38-place, four-level, eight-route Bogwater test world, I would expect this sequence:

Open the existing world. The first requested sheet is generated from the place tree and routes, with a seed derived from stable identifiers. No map field is written.

View Bogwater's surrounding geography. The generator groups route-connected places, apportions footprints, and draws the eight roads at the relevant focus levels.

Correct the geography. The author adjusts the river's course, the island positions, and a few main paths, to the extent those are represented on the selected sheets. These are explicit choices, not information the generator already knew.

Save only corrections. Reopening reconstructs the generated cells and applies the saved edits. Travel works exactly as before.

I would not require the author to paint the entire fen. Getting a coherent first layout automatically, then fixing a few significant features, is the workflow worth optimizing.

The test should also include a reroll of every generated sheet, checking that the 38 place records and eight routes remain completely unchanged.

## 9. The implementation order I'd choose

| Phase                    | Shippable feature                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1. Hex generator         | Seeded local sheets from the existing place tree; region partitioning, route overlays, canvas renderer               |
| 2. Studio paint tools    | Sparse cell overrides, anchor moves, flood fill, reroll, validation, export/import                                   |
| 3. Adventure integration | Current-position marker, known locations, blocked-road styling, selecting destinations through existing travel rules |
| 4. Geographic refinement | Hand-drawn route courses, optional sheet scale, suggested route distances, more generation styles                    |

I would deliberately omit terrain simulation, hex-by-hex character movement, impassable cells, and pathfinding-based travel costs from all four phases. They add a second movement system, which the brief does not require.

## 10. The three difficult decisions

First: should generated maps be considered canon immediately?

I recommend a distinction between generated defaults and authored geography. The generated map is a stable, usable view, but does not assert that its compass directions or proportions were established by the author. Explicit edits represent geographic decisions.

Second: what happens when manual painting breaks containment?

The UI should only offer the focus parent's direct children as paint targets. A cell may be assigned to one of those children or left as parent territory. This prevents most invalid hierarchy assignments by construction.

Manually disconnected footprints may be intentional, such as islands. The validator should detect them, not forbid them outright.

Third: should the map resemble terrain or administrative boundaries?

The current records do not contain enough geographic information to make this distinction consistently. I'd start with contiguous place ownership and kind-driven appearance, keeping detailed terrain painting as a later cosmetic layer.

## My final recommendation

I would lean toward reusing the Character Engine hexmap's basic ideas—seeded generation, axial cells, place-ID ownership, connected-region flood fill, layered roads, and sparse edits—rather than building a completely different spatial model.

The important Inkwyrm adaptations are hierarchical local sheets, using authored routes to guide initial placement, and keeping all hex geography separate from the existing travel rules.

The result has a straightforward relationship with the records:

Existing world records

Places · Parent IDs · Kinds · Routes

Deterministic hex generator

Containment · Seeds · Flood fill · Road overlay

Generated hexmap + sparse author edits

Shared by Studio and Adventure

I see no need to add coordinates, physical sizes, map IDs, or terrain fields to every place record. The only new persistent structure is the optional map override layer.

The single architectural choice I'd want settled before implementation is whether a hexmap must be geographically continuous across parent levels. My proposed local sheets are considerably simpler, support every scale in the brief, and require no changes to travel. If seamless geographic continuity is essential, I would instead design a multiresolution global hex grid from the outset, because retrofitting that later would change how the map stores ownership and coordinates.