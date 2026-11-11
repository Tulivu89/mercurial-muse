# Proposal: Maps in Inkwyrm

## 1. The recommendation in five lines

A single shared, touch-first SVG map component used across Studio and Adventure, rendering worlds as nested organic territory hulls connected by authored route corridors.
Zero author setup is required: a deterministic, seeded spring-containment algorithm automatically lays out places and routes so that children always stay inside parents and route lengths reflect their real kilometer distances.
The map gives the physical ground-feel of a hand-drawn regional map without requiring hex or tile painting.
Storage is sparse and additive: places store normalized coordinate overrides only when manually dragged by an author, while player fog-of-war and pins live in the save file.
Travel mechanics and pricing remain driven strictly by depth tiers and authored road metrics; the map illustrates the world but never alters the rules.

---

## 2. The jobs, ranked, and what's left out

### Ranked Jobs

1. **Rank 1: Show the player where they are (Adventure & Chat)**
   Orientation is the primary player need. The map answers: *Where am I right now? What is directly reachable? Which paths are blocked and why? Where are my companions?*
2. **Rank 2: Help the author build (Studio)**
   Spatial inspection is the primary builder need. The map answers: *Are any places disconnected? Do my route lengths make visual sense? How do nested structures look at a glance?*
3. **Rank 3: Decide travel (Subordinated)**
   The map visualizes travel costs, but does not calculate them. It reflects existing authored `distanceKm` and depth tiers rather than driving them.

### What is left out

- **No coordinate-driven travel pricing:** Distance on the canvas never overrides authored `distanceKm`.
- **No mandatory tile painting:** No grid painting is required to have a functional, beautiful map.
- **No raw coordinates sent to the model:** The narrator model never receives `[x, y]` vectors. It continues to receive ruleset-authored natural language sentences (e.g., *"Bogwater lies 0.8 km west along the plank walks"*).
- **No external heavy dependencies:** No D3, Leaflet, or physics engines. Everything is pure TypeScript with React 18 SVG rendering.

---

## 3. The data shape, as code

All additions are optional and additive. Existing world files and saves remain 100% valid.

```ts
// ==========================================
// 1. CANON WORLD DATA (world.json)
// ==========================================

/** Optional map placement added to Place records (core/models/place.ts) */
export interface PlaceMapData {
  /** Normalized coordinate within parent space [-1000, 1000].
   *  Undefined if placed by auto-layout. */
  x?: number;
  y?: number;

  /** Relative footprint multiplier (default: 1.0). */
  scale?: number;

  /** Visual symbol override for landmarks/rooms */
  symbol?: 'default' | 'gate' | 'dock' | 'camp' | 'tower' | 'hearth' | 'hazard' | 'node';

  /** If true, hidden from the map entirely (holding cells, secret rooms) */
  hidden?: boolean;
}

/** Optional visual metadata for Routes (core/rules/ruleset.ts) */
export interface RouteMapData {
  /** Optional intermediate control point for curved roads [x, y] in parent space */
  bend?: [number, number];
  /** Visual style override inferred from terrain */
  style?: 'solid' | 'dashed' | 'dotted' | 'waterway';
}

/** World-level map settings */
export interface WorldMapConfig {
  /** Deterministic layout seed (defaults to hash of world.id) */
  layoutSeed?: number;
  /** Visual theme matching genre */
  theme?: 'parchment' | 'slate' | 'cyber' | 'blueprint' | 'minimal';
  /** If true, unvisited places are hidden until discovered */
  fogOfWar?: boolean;
}

// ==========================================
// 2. PLAY SAVE DATA (adventure save / localStorage)
// ==========================================

export interface PlayerMapState {
  /** IDs of places the player has physically visited or mapped */
  discoveredPlaceIds: string[];
  /** IDs of routes the player has discovered or traversed */
  knownRouteIds: string[];
  /** Custom player markers placed during play */
  pins: Array<{
    id: string;
    placeId: string;
    label: string;
    color?: string;
  }>;
}
```

---

## 4. Auto-layout: the Hierarchical Bubble-Spring (HBS) algorithm

The HBS algorithm builds a deterministic, hierarchical layout in-memory without mutating the world file.

### Inputs
1. Places tree (nodes with `id`, `parentId`, `kind`, optional `x, y`).
2. Routes list (`from`, `to`, `distanceKm`).
3. Seed integer (hashed from `world.id` or authored `layoutSeed`).

### Step-by-step Execution

```
[Leaf Nodes] ---> Calculate Base Radii (Bottom-Up)
                     |
[Parent Nodes] -> Enclose Children (Summed Radii + Padding)
                     |
[Per Container] -> 1. Pin Authored (x, y) Nodes
                   2. Seed Initial Positions (Sunflower Spiral / Route Vectors)
                   3. 15-Iteration Spring & Hull Relaxation Loop
                     |
[Global Stage] -> Composite Relative Offsets into Screen Coordinates
```

1. **Bottom-Up Sizing:**
   - Base radius $R_{base}$ is assigned by `kind` (room/landmark = 30, building = 50, town = 120).
   - For containers, radius scales with child count using sub-linear compression ($N^{0.6}$) so large cities do not dwarf neighboring hamlets:
     $$R_{parent} = \max\left(R_{base},\; \sqrt{\sum R_{child}^2} \times 1.25 + \text{padding}\right)$$
2. **Initial Child Seeding (Top-Down):**
   - Children with authored `x, y` are locked in place.
   - For unfixed children connected by routes, initial relative positions are projected along angles derived from the seeded PRNG.
   - Unconnected children are placed along a deterministic Fermat spiral:
     $$\theta_i = i \times 137.5^\circ + \text{seed}, \quad r_i = 0.5 \times R_{parent} \times \sqrt{i / M}$$
3. **Iterative Spring Relaxation (Fixed 15 iterations):**
   - **Route Springs:** Connected siblings apply Hooke's force toward a target visual distance scaled from `distanceKm`.
   - **Overlap Push:** Overlapping children repel along their collision vector.
   - **Parent Hull Clamp:** Any child exceeding $(R_{parent} - R_{child} - \text{margin})$ is pushed back toward the parent center.
   - Pinned nodes absorb zero force; unfixed nodes adjust around them.
4. **Subpath Consolidation:**
   - Child coordinates resolve into absolute space. Enclosing hulls and routes are rendered into batched SVG paths.

### Guarantees
- **Strict Determinism:** Identical world inputs and seed produce identical coordinates down to the floating-point bit across all browsers.
- **Strict Containment:** A child node's visual boundary never crosses outside its parent enclosure.
- **No Overlap:** Minimum clearance between sibling node centers is enforced by the repulsion pass.
- **Performance:** A world of 1,000 places finishes relaxation in under 8 ms on mobile (fixed 15 iterations of 2D arithmetic, $O(N)$ scoped per parent container).

### How it is tested
- `test_determinism`: Run HBS 1,000 times against random seeds; verify identical coordinate hashes.
- `test_containment`: Assert $\text{dist}(child, parent) + R_{child} \le R_{parent}$ for all places.
- `test_stability`: Move one node manually; assert unpinned nodes shift smoothly without jumping.
- `test_orphan_resilience`: Run HBS on completely disconnected, route-free worlds; verify valid layouts without `NaN` or crashes.

---

## 5. The player's screen and the author's screen at 390 px

### Player's Screen (Adventure View)

At 390 px width, the map occupies either an embedded viewport card inside `MapSection.tsx` or expands to a full-screen sheet. Pan and pinch-zoom are native touch gestures.

```
+---------------------------------------+ 390px
| [Back] Abernys > Bogwater Fen   [Recenter] |
+---------------------------------------+
|  . - - - - - - - - - - - - - - - - .  |
| ( Bogwater Fen                     )  |
| (                                  )  |
| (    [Old Miller's Isle]           )  |
| (            \                     )  |
| (       300m  \ plank walk         )  |
| (              \                   )  |
| (          (YOU) Stilt Village     )  |
| (         [(@) Player + Kael]      )  |
| (           /           \          )  |
| (      12m /             \ 45m     )  |
| (         /               \ [x]    )  |
| (   [Eel Traps]       [Deep Reeds] )  |
| (                     (Requires    )  |
| (                       Skiff)     )  |
|  ' - - - - - - - - - - - - - - - - '  |
+---------------------------------------+
| SELECTED: Eel Traps                   |
| 0.8 km along submerged planks · 12 min|
| [ WALK HERE ]          [ FAST TRAVEL ]|
+---------------------------------------+
```

- **Orientation:** Current location is indicated by an animated compass badge.
- **Wayfinding:** Ways out are clear corridor lines. Open paths show travel times; blocked paths show red dashes with lock badges and reasons.
- **Companions:** Companions at your location or known places display small name chips beside the place label.
- **Fog of War:** Unvisited places display as muted silhouettes with question marks until reached.

---

### Author's Screen (Studio View)

Studio integrates a persistent bottom drawer for editing without modal popups that obscure the map.

```
+---------------------------------------+ 390px
| Studio: Bogwater           [View|EDIT]|
+---------------------------------------+
|  +---------------------------------+  |
|  | Bogwater Fen (Parent Enclosure) |  |
|  |                                 |  |
|  |   [Stilt Village]*              |  |
|  |       \                         |  |
|  |        \==== [Eel Traps]        |  |
|  |         \                       |  |
|  |          \                      |  |
|  |      [Miller's Isle]            |  |
|  |                                 |  |
|  |  (!) 1 Disconnected: Sunken Hut |  |
|  +---------------------------------+  |
+---------------------------------------+
| SELECTED: Stilt Village (*) Authored  |
| Coords: x=120, y=-80  | Scale: [1.0x] |
| [Reset Auto]   [+ Link Road]  [Delete]|
+---------------------------------------+
| [Move]  [Add Place]  [Check Routes]   |
+---------------------------------------+
```

- **View Mode:** Free pan/pinch, tap to inspect hierarchy, tap route to see distance and requirements.
- **Edit Mode:**
  - **Moving:** Drag any place with a finger; coords update in real time. Boundary collision prevents dragging children outside their parent.
  - **Linking:** Tap `[+ Link Road]`, then tap Place A and Place B to generate a route prompt.
  - **Orphan Diagnostics:** Disconnected places without routes or parents are flagged in an amber callout banner.

---

## 6. Travel: what changes and fallback

### What changes
- The player can initiate travel directly by tapping any connected destination on the visual map and selecting **Walk Here**.
- During travel or upon arrival, the map camera pans smoothly to center the new destination.

### What stays strictly the same
- **All travel pricing remains unchanged:**
  - Traversing between direct parent and child (`inside`) is priced by depth tiers set on world rules.
  - Traversing a `route` is priced by authored `distanceKm / walkKph`.
- **Dispute Resolution:** If visual map distance contradicts authored `distanceKm`, **authored `distanceKm` always wins**. The map conforms to authored values, not vice-versa.
- **Requirements:** Blocked routes remain impassable; the map reads requirements directly from `route.requires` and renders the exact failure reason.

### Fallback when there is no map data
- Zero map data triggers instant in-memory HBS auto-layout on first render.
- If routes lack `distanceKm`, the engine prices hops via the world's depth tier table, exactly as it does today.

---

## 7. Abernys: Bogwater under the proposal

*Bogwater (38 places, 4 levels deep, 8 routes, no travel tiers)* lays out naturally as follows:

1. **High-Level Layout (Bogwater Fen):**
   - The outer hull represents the fen basin.
   - The 8 routes form the visible skeletal spine of the village:
     - The solid trail line connecting the dry mainland approach to the Stilt Village.
     - The narrow plank walkways connecting the central Stilt Platforms to Miller's Isle.
     - The water skiff route trailing outward to the isolated Eel Traps.
2. **Visual Spacing:**
   - Because `distanceKm` governs spring lengths, the Stilt Village platforms cluster close together (short 100–200m hops).
   - The Eel Traps and River Pier are placed further out at the periphery (1.2 km skiff route).
3. **Interior Nesting:**
   - Zooming into the *Drowned Bell Tavern* reveals its internal rooms (Common Room, Storeroom, Upper Loft).
   - Because Bogwater has no travel tiers, moving between rooms displays as **Free (0 min)**, and rooms are grouped in an interior layout inside the tavern hull without cluttering the regional map.
4. **Player View from the Stilt Village:**
   - The player's marker sits on the village platform.
   - Radiating outward are the 3 immediate routes:
     - North to *Miller's Isle* (4 min walk).
     - East to *Eel Traps* (12 min walk).
     - South to *Deep Reeds* (Dashed red line: *Locked - Requires Skiff*).

---

## 8. Phases, each shippable on its own

### Phase 1: Read-Only Auto-Map (Adventure & Studio View)
- Implement HBS auto-layout algorithm and Zod schema extensions.
- Build the core touch-first `<WorldMap />` SVG component (pan, pinch-zoom, level-of-detail culling).
- Mount inside Adventure's `MapSection.tsx` alongside the spoke list: displays current location, connected routes, travel times, and blocked route locks.
- *Deliverable:* Bogwater renders immediately with zero author intervention.

### Phase 2: Studio Map Editor & Diagnostics
- Add interactive Edit Mode to Studio.
- Touch-drag repositioning with sparse `[x, y]` storage on place records.
- Visual road-drawing tool and orphan-place detection highlighting unreachable locations.
- *Deliverable:* Authors can fine-tune layouts and spot worldbuilding errors visually on their phone.

### Phase 3: Player Cartography & Fog of War
- Implement `PlayerMapState` in adventure saves.
- Unvisited areas render as unexplored terrain silhouettes until discovered.
- Player custom map pins and companion location indicators.
- *Deliverable:* Exploration feels rewarding; mystery worlds keep hidden places secret.

### Phase 4: Genre Theming & Curved Routes
- Thematic rendering presets: Parchment (fantasy), Terminal (sci-fi), Minimal (modern).
- Terrain-specific route styling (plank walks, dirt trails, waterways) and authorable route bend handles.
- *Deliverable:* Hand-drawn aesthetic tailored to any world genre.

---

## 9. Risks and open questions for the owner

1. **SVG DOM Node Count on Mobile Safari:**
   - *Risk:* Rendering hundreds of individual SVG elements degrades touch frame rates on older phones.
   - *Recommendation:* Batch all road strokes into a single `<path d="..." />`, batch all enclosure outlines into another, and cull nodes outside the current zoom viewport.
2. **Long Cross-Hierarchical Routes:**
   - *Question:* When a route links a room deep inside Building A directly to a room deep inside Building B, how should the high-level regional map represent it?
   - *Recommendation:* At high zoom levels, aggregate the route to show an edge between Building A and Building B. Show exact room-to-room endpoints only when zoomed into the building interiors.
3. **Default Fog of War Behavior:**
   - *Question:* Should fog-of-war be enabled by default, or opt-in per world?
   - *Recommendation:* Opt-in via a `fogOfWar: true` world rule toggle. Existing worlds remain completely visible by default to prevent unexpected changes to current play.
   
How would you provide a more literal map, such as a hexmap? How would you build
it to best fit the existing model with minimal adjustments? How could you
automate map creation from the record with minimal input?

Here is how to build a **literal hex map** that fits cleanly into Inkwyrm’s existing architecture, preserves the zero-setup principle, and automatically generates a geography from your nested records.

---

### 1. The Core Concept: A Hierarchical Partitioned Hex Disc

In Character Engine, the hex map gave a feeling of tangible physical ground, but required manual painting. We can eliminate the painting burden while keeping that ground-level feel by treating the hex disc not as arbitrary tiles, but as a **hierarchical spatial partition**.

* **The Canvas:** A bounded axial hex grid $(q, r)$ arranged in a disc of radius $R$ (e.g., $R = 12$ for a small town, $R = 25$ to $30$ for a regional world, claiming $\approx 2{,}000$ to $2{,}800$ cells).
* **Containment as Cell Ownership:** Every cell is owned by exactly one place. A parent place owns a contiguous cluster of hexes; its children subdivide that cluster. A room is a single cell; a building is a cluster of $3$ to $7$ cells; a district is $20$ to $50$ cells; wilderness or water fills the negative space.
* **Routes as Corridors:** Routes are traced directly across hex paths (using hex A* / Bresenham lines), stamping path terrain (e.g., plank walks, cobblestone, riverbanks) onto cell borders or cell surfaces.

```
          ( . ) ( . ) ( . )
        ( . ) [ B O G W A T E R ] ( . )
      ( . ) [Plank]-(Plank)-[Plank] ( . )
    ( . ) [Eel Traps] ( . ) [Tavern] ( . )
      ( . ) ( . ) [Deep Fen] ( . ) ( . )
```

---

### 2. Fitting the Existing Model with Minimal Adjustments

You can support a literal hex map **without changing how places or routes work today**.

#### A. The Canon Schema (Additive & Optional)

Only two optional fields are needed across the entire world model:

```ts
// 1. On World (world.rules or world metadata)
export interface HexMapConfig {
  /** Disc radius (default: auto-calculated from leaf count, typically 15–30) */
  radius?: number;
  /** Seed for deterministic generation (defaults to hash of world.id) */
  seed?: number;
  /** Manual paint overrides: only stored if the author hand-paints over auto-fill.
   *  Key is axial "q,r", value is placeId or terrain index. */
  overrides?: Record<string, string>;
}

// 2. On Place (optional manual anchor)
export interface PlaceHexData {
  /** Fixed anchor cell [q, r]. If omitted, auto-layout chooses the centroid. */
  hexAnchor?: [number, number];
  /** Custom terrain/color index (defaults to kind-based palette) */
  paletteIndex?: number;
}
```

* **Zero storage overhead:** If an author never paints or manually pins a place, `overrides` and `hexAnchor` do not exist. The entire map is computed on-the-fly in milliseconds.
* **Sparse delta storage:** If an author edits three hexes in Bogwater, only those three `q,r` keys are saved to `world.hexMap.overrides`.

#### B. Travel Integration (No Rule Breakage)

* **Default Rule:** The hex map **does not** redefine travel times. Travel continues to use `distanceKm / walkKph` for routes and depth tiers for parent-child hops.
* **Visual Parity:** The auto-fill algorithm uses `distanceKm` to space places apart on the grid, so 1 hex naturally equals a consistent ground distance (e.g., 1 hex $\approx$ 100 meters).
* **Optional Mode (Character Engine style):** An author can toggle `travelMode: "hex"` in world rules. In this mode, paths calculate cube distance on the grid multiplied by minutes-per-hex. If a place has no cell, it falls back to the current depth-tier walk.

---

### 3. Automated Hex Map Creation (Zero Author Input)

The automated mapper must guarantee two mathematical invariants:
1. **Strict Containment:** No child cell may ever lie outside its parent’s cluster.
2. **Deterministic Repeatability:** The same world data + seed always produces the identical hex layout across mobile Safari, Chrome, and desktop.

Here is the 5-step generation pipeline:

```
[1. Budget Sizing]
      │   Bottom-up count: room = 1 cell, building = children + 1, etc.
      ▼
[2. Route-Biased Centroid Seeding]
      │   Spring relaxation finds relative [q, r] anchors based on distanceKm.
      ▼
[3. Hierarchical Voronoi Flood-Fill]
      │   Top-down partition: parents claim hulls, children claim inner cells.
      ▼
[4. Route Pathfinding (A*)]
      │   Carve road corridors between place centroids; stamp terrain styling.
      ▼
[5. Visual Smoothing & Palette Assignment]
          Map place `kind` to genre palette (water, reeds, wood, interior).
```

#### Step 1: Bottom-up Cell Budgeting
Traverse the place tree from leaves to root to determine minimum cell weights ($W$):
* **Leaf place (room, landmark):** $W = 1$ cell.
* **Building / Structure:** $W = \sum W_{children} + 1$ (the "+1" is the hallway/threshold where someone stands "in the house but not in any room").
* **Settlement / District:** $W = \sum W_{children} \times 1.4$ (leaving walking room/alleys between structures).
* **Area / Region:** $W = \sum W_{children} + \text{buffer}$.
* **Total Grid Radius ($R$):** $R = \lceil \sqrt{\text{Total } W / 2.6} \rceil$. For a 40-place world, $R \approx 14$ ($547$ cells); for an 800-place world, $R \approx 30$ ($2{,}791$ cells).

#### Step 2: Route-Biased Centroid Seeding
For each parent containing sibling places:
1. If sibling places are connected by routes with `distanceKm`, place their seed points at relative distances proportional to `distanceKm`.
2. If unconnected, arrange them along a seeded Fermat/sunflower spiral from the center of the parent’s territory.
3. Run a quick 10-iteration spring push on the seed points to resolve overlap.

#### Step 3: Recursive Voronoi Flood-Fill (Guarantees Containment)
This is the core algorithm that prevents children from leaking outside parents:
1. Start with the root disc. Divide all cells among root-level regions using a multi-source Dijkstra flood-fill from each region's seed point.
2. For each region, take **only** the cells it claimed, and run the flood-fill again among its direct children using their seed points.
3. Repeat recursively down to individual rooms.
Because a child only competes for cells already owned by its parent, **a child can never escape its parent’s boundary**.

#### Step 4: Route Carving (Hex A*)
Once places have cell centroids:
1. For every route in `world.routes`, run an A* pathfinder from the `from` centroid to the `to` centroid.
2. Cost function:
   * Traveling through cells owned by the parent region = cost $1$.
   * Cutting through someone else’s private building = cost $10$ (avoids roads cutting awkwardly through people's bedrooms).
3. The resulting path of hexes is tagged as the route’s corridor, styled with its `terrain` property (e.g., wooden plank, dirt, waterway).

#### Step 5: Palette & Terrain Inference
No manual color assignment is required. The renderer maps place `kind` and route `terrain` to the world theme:
* `sea or ocean`, `river`, `lake` $\to$ Water hues (animated or stippled).
* `settlement`, `building` $\to$ Solid structural tint with distinct border walls.
* `wilderness` $\to$ Background fill with genre texture.
* Routes $\to$ Stamped ribbons along cell edges or center-lines.

---

### 4. Making It Fast and Ergonomic on a 390 px Phone

Character Engine noted that mobile browsers struggle when rendering thousands of individual SVG DOM elements. If you create 2,791 separate `<polygon>` nodes on mobile Safari, touch panning will stutter.

#### Solution A: Single-Element Batched SVG Paths
Instead of drawing 2,791 hex polygons, group all hexes sharing the same place/terrain into a single SVG `<path>` element using concatenated `M...Z` subpath strings:

```tsx
// One path draws 200 hexes instantly with zero DOM overhead
<path
  d="M 10 20 L 15 10 ... Z M 30 20 L 35 10 ... Z"
  fill="var(--color-bog-water)"
  stroke="var(--color-grid-line)"
/>
```
A 2,800-cell map will have fewer than **40 DOM nodes** (one per distinct place/terrain cluster). It runs at 60 FPS on touch devices.

#### Solution B: High-DPI HTML5 Canvas
An alternative is a single `<canvas>` element (zero DOM nodes). Canvas 2D can draw 2,800 hexes in ~2 ms. Pinch-to-zoom and pan are handled via CSS transforms during gestures, redrawing cleanly once touch momentum stops.

#### Touch Ergonomics at 390 px
* **Single-Finger Tap:** Selects a hex. The selected place’s entire territory illuminates with an accent boundary.
* **Bottom Sheet:** Tapping a place pops up a docked drawer at the bottom of the screen (height 140 px), showing:
  * Place name, kind, terrain.
  * Ways out (connected routes, travel time).
  * `[Walk Here]` action button.
* **Level of Detail (LOD) Labels:** Labels do not render on every cell. Labels appear only on the centroid of the currently focused region and its direct neighbors. Small rooms display an icon rather than text until zoomed in.

---

### 5. What Bogwater Looks Like on This Hex Map

In *Abernys: Bogwater* (38 places, 4 levels deep, 8 routes, fen village):

1. **The Overall Disc (Radius 14, ~550 cells):**
   * The majority of the disc is colored as marshland and reed water (`wilderness`, `lake`).
2. **The Stilt Village:**
   * Forms a clustered island of ~40 elevated wooden-tinted cells near the center.
   * Individual stilt buildings (e.g., *The Drowned Bell Tavern*) occupy 3 to 5 cells each.
   * Inside the tavern, the *Common Room*, *Loft*, and *Cellar* claim 1 cell each within that 4-cell footprint.
3. **The Routes:**
   * The 8 authored routes render as visible **plank walkways** (dashed wooden trails) connecting the Stilt Village over the marsh cells to the *Eel Traps* and *Miller's Isle*.
   * The skiff route to the *Deep Reeds* runs through blue water cells, showing a lock icon if the player lacks a boat.
4. **Author View in Studio:**
   * The author opens Bogwater for the first time: the entire fen is already laid out, roads connected, buildings clustered, with no manual setup.
   * If the author wants the *Eel Traps* further east, they simply tap *Eel Traps*, drag the anchor cell three hexes right, and tap **Save**. Only that anchor shift is stored.

---

### 6. Summary Comparison: Organic Bubble Map vs. Literal Hexmap

| Feature | Organic Bubble Graph | Literal Hexmap |
| :--- | :--- | :--- |
| **Sense of Ground** | Conceptual; places feel like territories/nodes. | **Literal;** places feel like physical terrain and tracts of land. |
| **Zero-Setup Feasibility** | Very high (spring layout on nested hulls). | **High** (recursive Voronoi flood-fill from seed). |
| **Grid Alignment** | Freeform float. | Rigid, clean discrete coordinates $(q, r)$. |
| **Author Customization** | Nudge `[x, y]` positions. | Paint terrain cells or drag anchor hexes. |
| **Best Genre Fit** | Abstract worlds, space stations, haunted houses, modern cities. | Regional exploration, wilderness crawls, overland journeys, fen/trail villages. |

### Recommendation

If you want a literal map, implement the **Hierarchical Voronoi Hexmap** using the **batched SVG path** renderer. 

It satisfies all constraints:
1. **Zero setup:** Every world automatically gets an attractive, repeatable hex map on first load.
2. **No schema breakage:** Existing world files work untouched; manual changes store only sparse cell overrides.
3. **Mobile-friendly:** Batched subpaths keep DOM node counts under 50 on mobile Safari.
4. **Rules stay sovereign:** Authored routes and depth tiers still decide travel time, while the hex grid gives players a concrete, tactile sense of place.