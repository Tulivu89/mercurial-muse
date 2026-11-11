# Maps: brief for proposals

Nov 11, 2026 · @AmbiProp · A hand-off for any model asked to propose how Inkwyrm does maps

Inkwyrm is a roleplay site with three parts on one core: a text adventure played by rules, a character chat, and a Studio where worlds and characters are made. Worlds already have places nested inside places and roads between them. They have no map yet. This page says what a map has to do, what already exists, what the owner's earlier tool did, and what a proposal should hand back.

You don't need the repository to answer, but it's public to anyone the owner shares it with: `Tulivu89/mercurial-muse`. The files named here are real.

## What's being asked

A proposal for maps in Inkwyrm: what a map is for, where it lives, how it's made, how it's stored, how it draws on a phone, and how it changes travel, if it does. The owner will collect proposals from several models and pick or combine. Be concrete. A proposal that can be built beats one that covers everything.

## The three jobs a map could do

Rank these. A proposal can do one well and leave the others for later.

1. **Show the player where they are.** In the adventure: where am I, what's around me, where can I go from here, and how long it takes.
2. **Help the author build.** In the Studio: see the world's shape at a glance, place things inside things, draw roads, spot a place nobody can reach.
3. **Decide travel.** Distance on the map sets how long a journey takes and what it costs. Today that comes from the nesting and the authored roads, not from any drawing.

## Hard constraints

- **Any genre, any scale.** A world might be a continent, a city, a space station, an apartment block or one haunted house. Nothing may assume swords, terrain types or a medieval scale. Depth in the place tree says nothing about scale: depth 0 is a continent in one world and a house in the next.
- **A world with no map must work.** Most authors will never draw one. Everything the adventure does today must keep working with no map data at all, and a world part-way through being laid out must stay playable.
- **Phone first.** The owner works from a phone. Every surface must work at 390 px wide, by touch: pan, pinch, tap. No hover-only controls, no sideways page scroll.
- **Browser only.** Worlds and saves live in the player's browser (IndexedDB and localStorage), with export to a file. No server storage, no map tiles from a service.
- **Lean.** React 18 and SVG or canvas. Assume no new npm dependencies unless the proposal argues for one by name and size. Character Engine found SVG node count was the limit on a phone: merge cells into path subpaths rather than drawing thousands of elements.
- **Canon and play stay apart.** The world is read-only in play. The map an author draws is canon. What a player has found, where they stand and anything they mark is in their save.
- **The model never moves a number,** and never moves anyone. The map can't be changed by the narrator. Where a map matters to the story, it reaches the model only as sentences the rules write (where you are, the ways out, how far), never as coordinates.
- **Only what the author changed is stored.** A place that was never placed by hand has no position saved; its position is worked out. This is how records already treat rules.
- **Additive.** New fields are optional with defaults. A world file saved yesterday must open tomorrow.

## What exists in Inkwyrm now

### Places

A place is a record with `kind: 'place'` and `parentId`, the place it's inside. Nesting goes to any depth: region, town, building, room. A place's kind (on its rules) is one of:

```
continent, major region, region, subregion, territory,      <- areas
settlement, town, village, district, wilderness, building,
landmark, road or trail, river, lake, sea or ocean, other
```

The first five are **areas**: they hold places but are never somewhere to stand, and nobody walks through one to reach a sibling.

### Routes

A world has a list of routes, roads between two places (`core/rules/ruleset.ts`):

```ts
route = {
  id, from, to,                 // place ids; walkable both ways
  distanceKm: number,           // 0 to 10,000
  terrain: string,              // "plank walks off the back of Bogwater into the reeds"
  routeClass: string,           // "local", "road", ...
  requires: [{ stateId, atLeast, toward?, reason }],  // e.g. a boat, a pass, a state over 2
}
```

### Travel in the adventure

`adventure/src/engine/world.ts` builds a graph with two kinds of edge, both walkable either way:

- **inside:** a place and a place directly inside it. Priced by the inner place's depth through a table of travel tiers (minutes per tier, set on the world's rules; empty means free). Areas take no part.
- **route:** an authored road, priced by `distanceKm` at the world's walking pace (`walkKph`, 4 by default).

A journey resolves to its destination in one step. The time is the sum of the hops, and the places between are never visited, so nothing happens in rooms nobody was watching. A route whose requirement fails is shown blocked, with its reason.

### What the player sees now

The adventure's menu has a **Map** section (`adventure/src/ui/MapSection.tsx`):
- a schematic of the ways out from where you stand, drawn as spokes around you, longer for longer trips, dashed and red when blocked;
- a list of places further afield, nearest first, with how long each takes;
- putting yourself anywhere by hand, to correct drift.

### What the author sees now

The Studio shows places as a nested list. Each place's page has its routes, with distance, terrain and what each asks of a traveller. A **Checks** page finds routes that end nowhere, schedule stops at places that don't exist, and any place holding more than four people at once.

### The test world

*Abernys: Bogwater* has 38 places, 4 levels deep, and 8 routes: a fen village on plank walks, eel traps, islands, a river town. It has no travel tiers, so moving between a place and its rooms costs nothing and the routes carry all the time. A proposal should say what Bogwater's map would look like.

## What Character Engine did

Character Engine is the owner's earlier tool, a NovelAI script. It had two maps, and the owner liked both. Learn from them; don't copy them whole.

### The circle map

The world drawn as **nested circles**: a region containing towns, a town containing buildings, a building containing rooms, each circle inside its parent, packed.

- **No setup.** The nesting is the map. Add a place inside another and it appears. It scales to any size of world.
- **Conceptual, not literal.** It shows what's inside what, not where anything is. Two towns' circles touching says nothing about a road between them.
- **Free pan and pinch zoom,** anchored on the centre of the view. Tap a circle to zoom to it.
- **Labels by level of detail.** It names the level in focus and its neighbours, not everything at once. Zoom into a building and its rooms name themselves; zoom out and they get out of the way. People's names show inside a circle when there's room.
- **Sizes.** A parent's size is the sum of its children's. Sibling sizes are compressed by a power under 1 before packing, so one huge city doesn't shrink its neighbours to dots. A parent is packed among its own children as one more circle, so "in the house but not in any room" has a place to be.
- **Map kinds** change paint, never shape. One shape (circles), one set of maths:
  - *region*, the default: a ring, always drawn;
  - *structure*: a building, drawn as its icon until focused, then its rooms appear;
  - *interior*: a room, hidden until you look inside what holds it, and free to walk into, since moving between rooms isn't travel;
  - *hidden*: not drawn and not counted in any parent's size (a graveyard, a holding room), reached from a list;
  - *vehicle*: a structure that moves. While you're aboard, the map moves the hull and everything inside it, not you.
- **The camera is a location.** Setting it is how the story moves; followers come along.
- **Travel tiers.** A table priced each level of the world in minutes and in a resource. A place could carry its own tier, overriding its depth, because a city mapped down to rooms sits four levels deep while the moor beside it sits at one. The table started empty: travel free until the author said otherwise. Inkwyrm's adventure took this rule.

### The hex map

A literal map: a disc of hexes, a few to thousands, painted with places.

- **The data.** A radius, and a dictionary from cell key (axial `q,r`) to a cell holding a place id, a paint colour index, and optionally a vehicle on its own layer. Plus the cell the camera is on. That's all; a cell stores an id and nothing else, so the places stay the source of truth.
- **Painting.** In Edit mode: Select, Paint places, Paint colour. A brush with a size, and size 0 floods: it fills every connected cell of the same place at the level being painted. A level is a flat cut across the world, so the brush's list shows places grouped by their parent.
- **Auto-fill,** the rudimentary auto-mapper. Seeded, so the same seed gives the same map and a reroll gives another. It partitions: every cell is claimed, and only the deepest place claiming a cell is written. Sizes: a room is one cell plus whatever's nested in it; a building is its contents plus one; a region is at least its contents and takes more if it can. Options: spread as islands (padding packed, balanced or sparse) or bordered (regions divide everything); shape blobby, natural or sprawling. Hidden places and vehicles are skipped. Tested outside the script: every cell of a radius-30 disc claimed (2,791 of 2,791), no child cell outside its parent across an 824-place world, and byte-identical maps from the same seed.
- **Travel.** One world setting chose which map priced travel. On the hex map: cells between two places, by cube distance, times minutes and cost per cell. No path search, since no cell was impassable; terrain would make it Dijkstra on the same grid. If either end wasn't painted, it fell through to the tier walk instead of refusing.
- **Drawing.** Detail follows cell size on screen, not zoom number. Labels are placed largest region first against boxes already taken; a name that can't fit is dropped, not drawn over another. Label and icon counts are capped.
- **Export.** The map travels with the world file, and an import replaces the map whole rather than merging cell by cell, because two maps merged make a third nobody drew.

### The trade-off the owner named

The circle map needed no setup and scaled forever, but placed things only by idea. The hex map was a real map, but needed setup, and auto-fill only went part way. Whatever Inkwyrm does should keep the first's zero-setup and get closer to the second's sense of real ground.

## Questions a proposal must answer

1. **What it's for,** ranked from the three jobs above, and what it won't do.
2. **Where it lives:** the Studio, the adventure, Chat, or more than one, and whether they share one drawing component.
3. **What the map is drawn from.** Some options, not a closed list:
   - the nesting alone (circles, or something else);
   - the nesting plus the routes (a graph laid out by force or by layers, with roads as lines and their lengths meaning something);
   - painted cells (hexes or squares);
   - a picture the author uploads, with places pinned on it;
   - more than one, as Character Engine had.
4. **How a world with no map data gets one.** What does the author see the first time they open it, with zero setup? How does auto-layout use the nesting, the kinds and the routes? Is it seeded and repeatable?
5. **Scale and levels.** One map for the whole world, a map per area, or a map you zoom through from continent to room? How does it stay readable with 800 places?
6. **Travel.** Does the map change what a journey costs? If distance on the map and an authored `distanceKm` disagree, which wins? Must stay free of breakage for worlds with no map.
7. **The data shape.** Exact fields, as a zod-like sketch, all optional and additive. Where it sits: on the world, on each place, or both. What's canon (the world) and what's play (the save): discovered places, the player's own marks.
8. **The player's side.** What the adventure shows at 390 px: where you are, the ways out, blocked roads, people you know the whereabouts of. Does the player see places they haven't been? Does the map stay in sync with the Map section that's there now, or replace it?
9. **The author's side.** How places get put on the map, moved, sized; how a road gets drawn; what's in View and what's in Edit.
10. **What reaches the model.** Probably nothing new, or sentences only. Say which.
11. **Phases.** The smallest first version that's worth having, then what follows.

## What to hand back

One document, plain words, in this order:

1. **The recommendation in five lines.**
2. **The jobs,** ranked, and what's left out.
3. **The data shape,** as code.
4. **Auto-layout:** the algorithm in steps, with its inputs, what it guarantees, and how it's tested.
5. **The player's screen and the author's screen,** described or sketched (an SVG or ASCII mock is welcome) at 390 px.
6. **Travel:** what changes, if anything, and the fallback when there's no map.
7. **Bogwater:** what its map looks like under the proposal.
8. **Phases,** each one shippable on its own.
9. **Risks and open questions** for the owner.

Skip anything that only repeats this page.

## Where this sits

On the plan: `docs/roadmap.md` step 4 and `docs/studio-brief.md` (*Asked for, not planned*). When the owner picks a direction, it becomes a phase of its own in the Studio brief and, for the player's side, a line on the adventure's list in `docs/praxis/charter.md`.
