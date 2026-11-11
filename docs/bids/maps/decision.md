# Maps: the plan

Nov 11, 2026 · @AmbiProp · Claude's informed proposal, after reading the four bids. For the owner to approve or veto.

The brief is `brief.md` in this folder; the bids are `chatgpt.md`, `deepseek.md`, `gemini-3-8-flash.md` and `grok.md`. This is not a fifth bid. It takes the parts the four agree on, settles where they differ, and says where each part came from. The bids arrived before this was written, so there is no uninformed proposal from Claude for maps.

## The plan in five lines

1. **A map is a stack of sheets.** Each place that holds other places has a sheet showing what is directly inside it. You tap into a child to open its sheet, and a trail of names takes you back out. Positions are worked out per sheet, as fractions of that sheet, so a continent and a cupboard use the same maths.
2. **No setup.** A sheet with nothing stored is laid out from the place tree and the routes, the same way every time for the same world. An author's drag is stored as a pin. Nothing else is stored.
3. **One layout, two ways to draw it.** First as shapes with roads between them. Later, for any sheet the author chooses, as hexes painted out from the same centres. The hex map does not need a second layout of its own.
4. **The map never prices a journey.** Travel stays with `distanceKm`, the walking pace and the tiers. A world with no map plays exactly as it does now.
5. **The Studio and the adventure share one map.** The Studio gets it first, read-only, so the author can see the world's shape and spot a place nobody can reach. Then it replaces the spokes in the adventure's Map section. The list under the map stays.

## Where the four agree, so this takes it as settled

All four:
- rank *show the player where they are* first, *help the author* second, and leave *decide travel* out;
- use one shared component, React and SVG, no libraries;
- lay out automatically, seeded, so the same world gives the same map;
- store a position only when an author places something by hand;
- keep play (visited places, the player's own marks) in the save and canon in the world;
- send the model nothing new;
- keep the list under the map.

That agreement is worth more than any one bid's cleverness. The plan builds on it.

## Where they differ, and the call

| Question | The bids | The call |
| --- | --- | --- |
| How to handle scale | DeepSeek: one zoomable circle pack. Gemini: one canvas of nested hulls. ChatGPT and Grok: one sheet per containing place. | **Sheets** (ChatGPT, Grok). One global zoom from continent to room needs a coordinate system nobody wants to maintain, and 800 places on one canvas is the SVG budget Character Engine already hit. A sheet has a few dozen shapes at most. |
| What the shapes are | DeepSeek: circles. Gemini: organic hulls. ChatGPT: weighted nodes. Grok: packed blobs, then hexes. | **Circles first**, sized by contents (Character Engine's circle map, which the owner liked). Hulls are paint and can come later; they never change geometry. |
| Routes | DeepSeek: arcs whose length follows `distanceKm`. Gemini: corridors. ChatGPT: springs, with routes from deeper places projected onto the visible child, and portals at the sheet's edge. Grok: springs for spacing only. | **ChatGPT's projection and portals**, with springs whose rest length comes from `distanceKm` on a log scale, normalised per sheet. A road to somewhere off the sheet ends in a labelled tick at the edge. |
| Pins | ChatGPT: parent-local, with a pin going stale when its place is moved to another parent. DeepSeek: a local offset. Grok: per-sheet centres that also *settle* a sheet. | **ChatGPT's rule plus Grok's settling.** A pin records the parent it was made in; if the place moves, the pin is ignored and Checks says so. Once a sheet has any pin, a new place is added around the pins rather than reshuffling everything. |
| A literal map | ChatGPT and Grok: hex per sheet, generated from the record. Gemini: a hierarchical hex disc with route carving. DeepSeek: later, optional. | **Hex ground per sheet, as a later phase**, seeded from the same centres the shapes use (this answers Grok's warning that two generators will disagree). Kind picks the fill: an area is islands on its parent's ground, and a building or anything smaller is bordered, with rooms sharing walls (Grok). The cells partition the sheet, with only the deepest place on each cell written (Character Engine's auto-fill). |
| Fog | DeepSeek: explored by default. Grok: `reached` by default. Gemini: fog in the save. | **`reached` by default** (Grok): the map shows what today's list would show. `visited` (only where you have been, plus the ways out of it) is a world setting. |
| Writing distances from the map | Grok: a later, confirmed write-back. | **Later, confirmed, never automatic**, as Grok says: the old and new number are shown, and only routes that lie on one sheet qualify. |

## The data

All of it is optional and additive. A world file or a save from today opens unchanged.

```ts
// On the world (core/records/schema.ts). Absent: nobody has touched the map.
map?: {
  seed?: number;                       // set only by Reroll; otherwise hash(world id)
  reveal?: 'reached' | 'visited' | 'all';  // default 'reached'
  pins?: Record<PlaceId, {
    in: PlaceId | null;                // the parent it was placed in; a mismatch makes it stale
    x: number; y: number;              // 0..1 of that parent's sheet
    size?: number;                     // 0.6..2, a look, never a rule
  }>;
  sheets?: Record<PlaceId | 'top', {
    ground?: 'shapes' | 'hex';         // default 'shapes'
    radius?: number;                   // hex sheets: the disc's size
    claims?: Record<string, PlaceId>;  // hex sheets: "q,r" -> place, only cells painted by hand
  }>;
};

// In the adventure's save. Absent: nothing visited yet beyond what the rules show.
map?: { visited?: PlaceId[]; marks?: { id: string; placeId: string; text: string }[] };
```

While the converter lives, a module carries the world's `map` unchanged (`module.map`), the way it carries routes.

## Laying out a sheet

`layoutSheet(world, sheetId, seed)`, pure, in `core/map/`, tested like the census:

1. **Who is on it:** the sheet place's direct children, minus hidden ones; plus a small *here* anchor for the sheet place itself when someone can stand in it (ChatGPT, after Character Engine's "a parent is packed among its own children").
2. **Weight:** `(1 + descendants) ^ 0.3`, clamped, times a pin's `size` (ChatGPT and DeepSeek both compress, as Character Engine did).
3. **Roads:** every route with an end inside the sheet, each end projected onto the visible child that holds it. Two children joined by several roads get one line with a count. An end outside the sheet becomes a portal on the rim, toward where it goes.
4. **Start:** pinned places where their pins say; the rest on a seeded spiral, sorted by id so record order can't change the result.
5. **Relax:** a bounded number of steps (Grok's eighty is a fair start). Roads pull toward their rest length; shapes push apart to their radius plus a margin; everything stays inside the sheet; pins don't move.
6. **Same input, same output.** The seed is the world's, the sheet's id and the algorithm's version. Positions are rounded so two browsers draw the same map.

Tests: every child on the sheet and inside it; no two shapes overlapping; pins unmoved; byte-identical output from the same seed; Bogwater and a made-up world of 800 places laid out in under 50 ms per sheet.

## What the player sees (the adventure's Map section)

- The sheet of the innermost area around you, with you marked; the trail above it (*Abernys › Fenmire › Bogwater*).
- The ways out from where you stand drawn heavier, with the time each takes; a blocked one dashed in the seal colour, its reason on tap. These are the numbers the spokes show today, from the same rules.
- People whose whereabouts you know, as initials on their place, only where the rules already tell you.
- Tap a place: its name, how far, and **Go** if it's reachable. The list below stays, and stays in step.
- At 390 px the sheet is the width of the screen and about as tall; pinch and drag, with a button to recentre on you.

## What the author sees (the Studio)

- A **Map** page beside Rules and Checks, opening on the top sheet.
- **View:** tap to go in, the trail to come out, and places nobody can reach outlined, with the same finding on Checks.
- **Edit:** drag to pin, long-press to unpin; **Reroll** a sheet; tap two places to open the route form that already exists. Painting cells comes with the hex phase.

## Bogwater

The top sheet holds Abernys alone, so it opens on Abernys: Fenmire, the Woed, Port Covenant, Caerwyn and Cairn Maw. Fenmire's sheet shows Bogwater, Nest's island, Morwen's island, the eel traps, the fen, Grey Water, the Woed's edge and the far islands, sized by what each holds, with six of the eight routes as lines labelled in walking time. The other two leave the sheet: the traps to Caerwyn and Grey Water to Port Covenant end as portals on the rim. Tap Bogwater: the landing, the Myrtle and the Crones' house, with Bogwater's own *here* anchor among them. The runaway starts in the net at the long fence, so play opens on the eel traps' sheet: the long fence marked as here, the bend fence and the channel beside it, and the route back to Bogwater as a portal.

## Phases

| Phase | What | Shippable alone because |
| --- | --- | --- |
| M1 | `core/map/` layout with its tests; the shared drawing in `kit/`; the Studio's Map page, read-only, with unreachable places; Checks gains the same finding. | The author sees the world's shape the day it ships. |
| M2 | The adventure's Map section draws the sheet in place of the spokes; `save.map.visited`; the `reached` and `visited` reveals. | The player sees where they are. Travel is untouched. |
| M3 | Studio Edit: pins, unpin, Reroll, a road by tapping two places, stale pins on Checks. | Authors who care can arrange; nobody has to. |
| M4 | Hex ground for a sheet: generated from the same centres, islands or bordered by kind, painting and flood fill, claims stored only when painted. | A literal map where the author wants one, on the same data. |
| M5 | The player's own marks; the confirmed write-back of `distanceKm`; hull paint. | Polish, each on its own. |

## Credit

- **ChatGPT:** focus sheets, parent-local positions, stale pins, deeper routes projected onto the visible child, rim portals, the "here" anchor, the camera not being the character.
- **Grok:** sheets per container, settled sheets, the `reached` default, the confirmed write-back, hexes seeded from the same centres, islands or bordered by kind, the warning against two generators.
- **DeepSeek:** the four-phase order (Studio view, adventure view, edit, overlays), the phone node budget as the first risk to measure, the fog question with self-teleport.
- **Gemini:** route lengths that reflect real kilometres, genre theming as paint only, the hierarchical hex partition for the literal map.
- **Character Engine:** the circle map's sizes and the parent among its children; the hex auto-fill that partitions and writes only the deepest claimant.

## For the owner

1. Approve sheets as the shape of it, or say if you want one zoomable map instead.
2. The `reached` default: the map shows what the list shows today. Or should a world start in fog?
3. Should M1 wait until after the helper, or go first? It's small, and nothing else waits on it.
