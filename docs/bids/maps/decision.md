# Maps: the plan

Nov 11, 2026, revised Nov 12 · @AmbiProp · Claude's informed proposal from the four bids, revised at the owner's word. For the owner to approve or veto.

The brief is `brief.md` in this folder; the bids are `chatgpt.md`, `deepseek.md`, `gemini-3-8-flash.md` and `grok.md`. Each bid has two parts: the proposal the brief asked for, and an answer to the owner's follow-up question: how would you make a literal map, such as hexes, fit the existing model with the least change, and make it from the record with the least input? The Nov 11 plan leaned on the first parts and put hexes last. This revision weighs both parts, and takes three changes from the owner:

- **A literal map that makes itself from the record.** No setup, unless the author loves drawing maps.
- **Travel measured in time, not distance.** A route says how many minutes, hours or days it takes. Later, the way you travel and the weather can change that base.
- **Later, a picture under the map.** The author uploads an image and the map lies over it.

The bids arrived before any plan was written, so there is no uninformed proposal from Claude for maps.

## What changed from Nov 11

| Nov 11 | Now | Why |
| --- | --- | --- |
| Circles first; hexes in M4, seeded from the circles' centres. | **Hexes from the first phase.** No circle stage. | The owner wants real ground with no setup. Grok's warning was that two generators will disagree; the old plan chained them, and this plan drops one. |
| Routes priced by `distanceKm` at the walking pace. | **Routes store minutes.** Old files are read at the walking pace, so nothing plays differently. | Time is what a journey costs. Kilometres at walking pace misprice a boat, a horse or a shuttle. |
| No picture. | **A picture under a sheet,** M5. | The owner's ask; ChatGPT's phase 4. |
| Pins that remember their parent. | **A sheet settles on its first edit** (Grok), with the stale rule kept. | A settled sheet never shoves a blob the author placed. |
| Portals on the rim, direction unstated. | **Portals point where the far end lies on the sheet above.** | Grok objected that a rim point invents a direction. Read from a drawing one level up, it doesn't. |

## The plan in five lines

1. **A map is a stack of sheets.** Each place that holds other places has a sheet showing what is directly inside it. You open a child to see its sheet, and a trail of names takes you back out. It is the same one-level walk the Studio's list already uses.
2. **Every sheet is ground: a disc of hexes made from the record.** Places are blobs of cells, spaced by the routes between them, laid out the same way every time for the same world. Nothing generated is stored.
3. **The author does as much as they like, starting from nothing.** Nothing at all; a few taps (drag a blob, reroll a sheet); painting cells; or, later, a picture underneath. Each stores only what it changed.
4. **Travel is time.** A route stores how long it takes. Later, rules for ways of travel and for weather change that base. The narrator never does.
5. **The map never prices a journey.** It lays out by time and labels with the time the rules return. A sheet given a time per cell can *propose* route times from its drawing, and the author confirms each one.

## Where the bids agree, taken as settled

All four, in both parts:
- rank *show the player where they are* first and *help the author* second, and leave *decide travel* out;
- one shared component, React with SVG or canvas, no libraries;
- a seeded layout from the record, so the same world gives the same map, with nothing generated stored;
- a cell holds a place id and nothing else, so the places stay the source of truth, and only the cells and anchors an author changed are saved;
- one drawn path per place, never one shape per cell;
- play (visited places, the player's marks) in the save, canon in the world;
- nothing new sent to the model;
- the list under the map stays.

Three of four (ChatGPT, DeepSeek, Grok) give each containing place its own disc. Three of four (ChatGPT, Gemini, Grok) let the routes space the places. The plan builds on all of that.

## Where they differ, and the call

| Question | The bids | The call |
| --- | --- | --- |
| When the literal map comes | ChatGPT, first part: a picture before any hexes; its second part: hexes "may be the better fit". DeepSeek: circles by default, hexes behind a Ground toggle. Gemini: hexes, if a literal map is wanted. Grok: hexes replace the pack; ship one, not both. | **Hexes from M1, and nothing else** (Grok). Character Engine's auto-fill already proved the partition (2,791 of 2,791 cells, an 824-place world, byte-identical by seed). One generator can't disagree with itself. |
| One disc or many | Gemini: one disc for the whole world, split down to rooms. The other three: one per containing place. | **One per containing place.** A room and a fen can't share a cell size (Grok), and depth says nothing about scale. A sheet stays a few dozen blobs. |
| What a sheet shows | DeepSeek: expands through areas down to the deepest place. ChatGPT, Grok: direct children. | **Direct children.** A blob that holds places is opened, not drawn into. The scale changes where the tree says it does. |
| How blobs fill | Grok: kind decides, no setting. DeepSeek: kind by default, a toggle. ChatGPT: an optional islands or bordered. Character Engine: spread, shape and density options. | **Kind decides, with one flip per sheet.** No shape or density knobs until someone asks (ChatGPT: options grow bigger than the editor). |
| What spaces the blobs | DeepSeek: spread seeds; routes only drawn on top. ChatGPT, Gemini, Grok: routes pull. | **Routes pull, by their time,** on a log scale within the sheet, 2 to 8 cells (Grok). Gemini's "proportional to distance" breaks when one road is a hundred times another. |
| Roads | Gemini: a path found across cells, stamped with terrain. ChatGPT: a path or a line; hand-drawn courses later. DeepSeek: lines between centres. Grok: drawn, never stored. | **A path across ground that avoids other blobs** (Gemini's costs), drawn as a line, never stored, never stamped onto cells. Hand-drawn courses wait (ChatGPT). |
| Roads that leave the sheet | ChatGPT, DeepSeek: a mark on the rim. Grok: no point at all; it would invent a direction. | **A portal on the rim, facing where the far end lies on the lowest sheet that holds both ends.** The direction comes from a drawing the player can open. |
| Hexes and travel | DeepSeek, Gemini: optional pricing by cell distance, falling back to the graph. ChatGPT, Grok: never; a confirmed write-back instead. | **Never, with a confirmed write-back in time** (ChatGPT, Grok). Cell pricing would join places the rules keep apart (nobody walks across an area) and make a second source of truth. |
| Keeping an edited sheet still | Grok: the first edit settles the sheet. ChatGPT: pins remember their parent and go stale. DeepSeek: offsets within the parent. | **Grok's settling, ChatGPT's stale rule.** The first edit stores every centre on that sheet, so a later place joins in the biggest gap and shoves nobody. A centre for a place that has since moved elsewhere is ignored, and Checks says so. |
| Colour | Gemini: kind maps to water, reeds or wood under a genre theme. ChatGPT, DeepSeek: a colour index that never means terrain. | **Kind picks a Wet Ink tint; the author's paint is colour only** (ChatGPT, DeepSeek). Water reads as water. A colour never closes a road. Genre themes wait. |
| A picture | ChatGPT: phase 4, likely cheaper than hexes. Grok: unscheduled, stored beside the JSON. DeepSeek, Gemini: out. | **M5, under a hex sheet,** stored beside the JSON (Grok), the way Chat keeps portraits. |
| Drawing on a phone | ChatGPT: canvas for cells, SVG on top. DeepSeek: SVG up to about 800 cells, canvas above. Gemini, Grok: merged SVG paths. | **SVG with merged paths:** one per owner and colour, one for the borders, one per road style. A tap finds its cell by arithmetic. Canvas only if the M1 phone measurement says so. |
| Fog | DeepSeek: on. ChatGPT, Gemini: everything shown. Grok: what the list shows. | **What the list shows** (`reached`, Grok), as on Nov 11. `visited` and `all` are world settings. |

## Travel in time

**What a route stores.** `minutes`: how long the way takes when travelled the usual way (on foot along a causeway, by boat across open water). The Studio's route form asks for a number and a unit: minutes, hours or days. A day is 24 hours on the clock, nights on the road included, because a journey moves the clock in one step. Times read the way the adventure already writes them (`durationWords`: *20 min*, *5 h 30 min*, *2 days 4 h*). The tiers for stepping into a place are already minutes and don't change.

**Old files.** `distanceKm` stays readable. A route with no `minutes` takes its distance at the world's walking pace, exactly as now, so every world and save plays the same to the minute. Editing a route's time writes `minutes` and drops `distanceKm`. Under walking pace, World › Rules offers to write every route still in kilometres as a time, in one confirmed tap, saying how many. Walking pace stays for those routes only; once none are left, the Rules page stops showing it. The modules (Bogwater, Port Covenant) keep their kilometres until the owner gives times, and the converter carries whichever a route has.

**Later: what changes the base.** Not built now, but the shape leaves room for it. Rules can change a route's time; the narrator can't.
- **A way of travel** the traveller has (a horse, a flatboat, a car, a shuttle) multiplies the base on the kinds of route it suits.
- **A condition** read from a world state (fog, flood, a storm, a curfew) multiplies it, or closes the route as `requires` already does. Like a requirement, it can apply in one direction only (`toward`), so upriver can be slower than down.

The player sees the base times every factor that holds, rounded to the minute, with each reason beside it (*9 h · fog*). It is the charter's "weather that shuts routes" grown into weather that slows them. It belongs in the rules, with a brief of its own, not in the map.

```ts
// Later, on the world's travel rules. Not now; shown so today's shape leaves room.
ways?: { id: string; name: string; times: number; onClasses?: string[]; requires?: Requirement }[];
slowing?: { stateId: string; atLeast: number; times: number; onClasses?: string[]; toward?: PlaceId; reason: string }[];
```

**What the map does with time.** It lays out by time: a 20-minute walk sits closer than a 4-hour one. It labels each road with the time the rules return, and it never shows kilometres. With a time per cell set on a sheet, the author can ask for route times from the drawing (M4).

## The data

All of it is optional and additive. A world file or a save from today opens unchanged.

```ts
// core/rules/ruleset.ts: a route. It must have one of the two.
route = {
  id, from, to,
  minutes?: number,       // whole minutes, the usual way; entered as minutes, hours or days
  distanceKm?: number,    // old files: read at walking pace; dropped when the time is edited
  terrain, routeClass, requires,   // unchanged
}

// On the world (core/records/schema.ts). Absent: nobody has touched the map.
map?: {
  v?: number;                                // the generator version stored edits were made against
  reveal?: 'reached' | 'visited' | 'all';    // default 'reached'
  sheets?: Record<PlaceId | 'top', {         // 'top' only for a world with more than one root
    seed?: number;                           // set only by Reroll; otherwise hash(world id, sheet id)
    fill?: 'islands' | 'bordered';           // set only when flipped; otherwise from kind
    radius?: number;                         // set only when changed; otherwise from what the sheet holds
    centres?: Record<PlaceId, { q: number; r: number }>;  // every child's, written at the sheet's first edit
    claims?: Record<string, PlaceId | ''>;   // "q,r" -> a direct child, or '' for the sheet's own ground; painted cells only
    paint?: Record<string, number>;          // "q,r" -> a colour; a look, never a rule
    minutesPerCell?: number;                 // M4: lets the drawing propose route times; travel never reads it
    backdrop?: { id: string; x: number; y: number; scale: number; turn?: number; fade?: number };  // M5
  }>;
};

// In the adventure's save. Absent: nothing visited yet beyond what the rules show.
map?: { visited?: PlaceId[]; marks?: { id: string; placeId: string; text: string }[] };
```

While the converter lives, a module carries the world's `map` unchanged (`module.map`), the way it carries routes. `v` is written with the first stored edit, so a later generator can't reinterpret an author's work (ChatGPT).

## Making a sheet

`sheet(world, sheetId)`, pure, in `core/map/`, in whole-number hex coordinates with no library. It reads the place tree, kinds, descendant counts and routes, never the terrain sentence or any description.

1. **Who is on it.** The sheet place's direct children (or the world's roots), sorted by id so record order can't change the result.
2. **How big.** A place that holds nothing takes one cell. Anything else takes `1 + 2 × log2(1 + descendants)` cells, rounded, from 3 to 19. Water and wilderness kinds take at least 3, so a lake reads as a lake; an area takes at least 7. These are Grok's sizes with Character Engine's floor, tuned against Bogwater.
3. **How it fills,** from the sheet place's kind unless the author flipped it:
   - an area whose children are all areas: bordered, regions dividing the land;
   - any other area: islands on its ground, and the ground is drawn but is nowhere to stand;
   - a building: bordered, rooms sharing walls, with one cell left for the building itself, for being in the house but in no room;
   - anything else you can stand in (a village, a landmark, a stretch of wilderness): islands, and the spare ground *is* that place.

   The disc is the smallest with room: about 1.8 times the blobs for islands, the blobs plus one for bordered, and at most radius 30 (2,791 cells).
4. **Roads.** Every route with an end inside the sheet. Each end moves up to the direct child that holds it (ChatGPT); two children joined by several routes get one road with a count. An end outside the sheet becomes a portal.
5. **Centres.** Stored centres first. Each of the rest starts on a ray at an angle hashed from the seed and its own id, so a new sibling never turns the others (Grok), and steps outward until it is clear. Then 80 steps: roads pull toward a rest length set by their time; blobs push apart by size; everything stays inside the disc; stored centres don't move. Then round to cells.
6. **Cells.** Blobs grow from their centres a cell at a time in turn, ties broken by the seed, each in one piece, until it has its size (Character Engine's partition). Bordered sheets grow until the disc is full; islands leave the rest as ground.
7. **Lines.** Each road is a path across ground between the nearest cells of its two blobs; going through another blob costs ten times as much (Gemini). A portal sits on the rim cell that faces where its far end lies on the lowest sheet holding both ends.
8. **Edits last.** Painted claims overwrite cells, `''` gives a cell back to the ground, and paint colours.

It returns an owner for every cell, the centres, the road paths and the portals, all in whole numbers, so every browser draws the same map.

**Guarantees.** The same world, seed and edits give the same sheet. On an unedited sheet every child gets its cells in one piece. Every cell lies inside the disc. Stored centres and claims are kept. Nothing is written to the world, and travel never reads the sheet.

**Tests.** Byte-identical output twice over. Every child in one piece on an unedited sheet. Stored centres unmoved, claims win. A new sibling turns no older angle, and on a settled sheet moves no centre. Three places joined by roads of 10 minutes, 1 hour and 10 hours come back with gaps in that order (Grok's case, in time). A snapshot of every Bogwater sheet. A made-up world of 800 places in under 50 ms a sheet, and under 60 SVG elements a sheet. A world with no `map` key draws, and every journey takes what it took before, minute for minute.

## How much the author does

| Level | What it is | What is stored |
| --- | --- | --- |
| Nothing | Every sheet is drawn the first time it's opened. | Nothing. |
| A few taps | Drag a blob; Reroll a sheet; flip islands and bordered; change the radius. | The sheet's centres, seed, fill or radius. |
| Drawing | Paint cells to a place or back to ground; a brush of size 0 floods a connected patch (Character Engine); colour cells. | The painted cells. |
| A picture | Lay a sheet over an uploaded image, line it up, drag blobs onto its towns. | The picture, kept apart, and how it lines up. |

Every level is optional. No model draws the map: it is a layout problem with one answer per seed, and the model never moves a number.

## A picture under a sheet (M5)

- **One picture per sheet.** The browser shrinks it to at most 2,048 px a side as WebP (`kit`'s `imageDataUrl`, which Chat's portraits use) and keeps it in its own store, keyed by world and sheet, outside the world JSON (Grok). The world's export and **Back up everything** carry it. A world file opened without it draws plain ground. The Studio shows how much the world's pictures weigh and stops at a stated cap.
- **The map lies on top.** The ground cells go clear and the grid goes faint; blobs keep their borders and half their tint. The author lines the disc up: drag to move, pinch to scale, and a turn if the picture is crooked. Then they drag blobs onto the picture's towns, paint, or leave it.
- **A look, never a rule.** Cells still say who owns what, and a tap still finds a place by its cell. The picture opens, closes and prices nothing. A floor plan, a deck plan, a street map or a scanned page of the owner's own all work the same way.

## What the player sees (the adventure's Map section)

- **The sheet that holds where you stand,** with you ringed. If where you stand holds places itself, its own sheet, with its ground tinted. The trail above it (*Abernys › Fenmire › The eel traps*).
- **The ways out drawn heavier,** labelled in time; a blocked one dashed in the seal colour, its reason on tap. These are the numbers the spokes show today, from the same rules.
- **Portals on the rim** for roads that leave the sheet, each with its time.
- **People whose whereabouts you know,** as initials on their place, only where the rules already tell you.
- **Tap a blob:** its name, how long, **Go** if it's reachable, **Open** if it holds places. The list below stays, and stays in step: `reached` calls the same function as the list (Grok).
- **At 390 px** the disc is the width of the screen. One finger pans, two pinch; a button recentres on you; tap targets are at least 44 px. A blob is named once it is 48 px across, you and the selection always; at most 24 labels, largest first, and a name that won't fit is dropped rather than drawn over another (Character Engine).

## What the author sees (the Studio)

- **A Map page** on the world, beside About, Rules and Checks, with its own address (the sheet in it), so Back works. Inside a place, the list has a **Map** button that opens that place's sheet.
- **View:** tap to select, **Open** to go in, the trail to come out. Places no walk can reach are drawn hollow; a place behind a requirement isn't hollow, since its dashed road already says why (Grok). Checks gains the same finding.
- **Edit,** with a tool chosen first so a pan never moves a blob (ChatGPT): **Move** (drag a blob; the first move settles the sheet), **Route** (tap two blobs for the route form that exists, now in time), and in M4 **Paint** and **Colour**. On the sheet: **Reroll** (asks first, and clears that sheet's stored edits), **Fill** and **Radius**.

## Bogwater

The routes, as times at today's walking pace (4 km/h): Bogwater to the fen 11 min, to the eel traps 20 min, to Nest's island 20 min (by water only), to Morwen's island 45 min, to the Woed's edge 4 h; the fen to Grey Water 1 h 30 min; Grey Water to Port Covenant 5 h 30 min; the eel traps to Caerwyn 12 h, down the channel and the river. The last is the case for time over distance: twelve hours is a walk, and the route is water.

- **Abernys,** the one root, so the map opens on it. Islands on Abernys's ground: Fenmire the biggest blob, Cairn Maw the next, then the Woed, with Port Covenant and Caerwyn small. Two roads leave Fenmire: to Port Covenant (5 h 30 min) and to Caerwyn (12 h), so Port Covenant sits closer. Cairn Maw and the Woed are hollow: nothing in Bogwater reaches them.
- **Fenmire.** Islands on fen-coloured ground, about sixty cells. Bogwater is the biggest blob; the fen, the eel traps, Nest's island and Morwen's island are middling; Grey Water and the Woed's edge take three cells each; the far islands, one cell and no road, sit hollow in the biggest gap. Six roads are lines labelled in time: the fen hugs Bogwater, the traps and Nest's island sit close (the island's road dashed for the boat), Morwen's island a little further, Grey Water beyond the fen, the Woed's edge far out. The other two roads leave the sheet: portals on the rim toward Caerwyn and Port Covenant, facing the way they lie on Abernys.
- **Bogwater.** Islands on Bogwater's own ground, the plank walks: the landing, the Myrtle and the Crones' house as small blobs. Standing in Bogwater and in none of them tints the ground.
- **The Myrtle.** Bordered, seven cells: the taproom, the loft, and a cell for the Myrtle itself.
- **Where play opens.** The runaway starts in the net at the long fence, which holds nothing, so play opens on the eel traps' sheet: the long fence ringed, the bend fence beside it, the channel as three water cells, and portals on the rim to Bogwater (20 min) and to Caerwyn (12 h). One tap on the trail shows Fenmire.

Nothing is stored for any of this.

## Phases

| Phase | What | Shippable alone because |
| --- | --- | --- |
| T1 | Travel in time: `minutes` on routes, read through one helper in `core/rules/` with kilometres as the fallback; the Studio's route form in minutes, hours or days; World › Rules writes the old routes as times on a confirmed tap; the converter carries both. | Every world plays the same, and new routes say how long they take. The map's spacing and labels read it. |
| M1 | `core/map/` with its tests; the hex sheet in `kit/`; the Studio's Map page, read-only, with places no walk reaches; Checks gains the same finding. | The author sees the world as ground the day it ships. |
| M2 | The adventure's Map section draws the sheet in place of the spokes; `save.map.visited`; the `reached` and `visited` reveals. | The player sees where they are. Travel is untouched. |
| M3 | Studio Edit: Move (settling), Route by two taps, Reroll, Fill, Radius; stale centres on Checks. | Authors who care can arrange; nobody has to. |
| M4 | Paint and Colour, with flood; claims stored only when painted. Minutes per cell, with *Set route times from this sheet* (old and new time shown, written on confirm, only for routes with both ends on the sheet) and a quiet note where a road's drawn length is far out of step with its time. | A literal map for those who love drawing, tied to travel only by the author's confirm. |
| M5 | A picture under a sheet. | Floor plans, deck plans and the owner's own maps. |

M4 and M5 can go in either order; M5 needs only M3's Move. Later, each on its own: the player's marks; hand-drawn road courses; genre paints; ways of travel and conditions, which belong to the rules and get their own brief.

## Credit

- **The owner:** travel in time, a literal map made from the record with no setup, and the picture underneath.
- **ChatGPT:** sheets of direct children; the parent's own ground for "here"; routes from deeper places moved up to the visible child; portals; the stale rule; tools chosen before editing; generated layouts kept apart from authored ones, with the generator's version stored; colour that never means terrain; the picture with places aligned over it.
- **Grok:** a disc per containing place, and one generator, not two; kind choosing the fill; the sizes; angles hashed from ids; settling; the `reached` default and the list's own function behind it; the confirmed write-back; the picture kept beside the JSON; hollow against dashed; the three-distance test.
- **DeepSeek:** areas as ground, never somewhere to stand; erasing a cell back to the ground; the phase order of Studio view, adventure view, then edit; the phone's node budget as the first thing to measure; marking a place visited when the player puts themselves there by hand.
- **Gemini:** a child's cells inside its parent by construction; road paths that cost more through another blob; water kinds read as water; the merged-path counts on a phone.
- **Character Engine:** the seeded partition that keeps each blob in one piece; the parent among its own children; brush size 0 that floods; labels placed largest first and dropped rather than overlapped; a map that travels whole with the world file.

## For the owner

1. **Hexes from M1, with no circle stage.** Approve, or say if you'd rather see circles first while the hex generator is built.
2. **Where play opens:** the sheet that holds where you stand (the eel traps, for the runaway), not the area above it (Fenmire). Grok argued for the area.
3. **Bogwater's water routes.** At walking pace, the traps to Caerwyn is 12 hours and Bogwater to Nest's island 20 minutes. What should they take by flatboat? They are the first routes to write as times.
4. **T1 first?** It is small, every world plays the same after it, and the map reads it. It can go now, ahead of the helper.
5. **The `reached` default** still stands from Nov 11: the map shows what the list shows today. Or should a world start in fog?
