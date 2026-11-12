// Places, and how long it takes to get between them (docs/bids/maps/decision.md, 0.27.0).
//
// Every place that holds others has a sheet of the map, laid out from the place tree with no
// setup (core/map). A journey climbs out of each place to the one that holds both ends, crosses
// that sheet by the cheapest walk over its cells (quicker along a road), and steps in again.
// Stepping costs the holding place's level step; crossing costs cells times what a cell is
// worth. Areas are stepped through for nothing, and never arrived at.
//
// A place can say what crossing to or from it asks (a boat for an island, a signature at the
// port). A journey that comes in or goes out of such a place needs it; a walk across a sheet goes
// around a place the traveller couldn't cross.
//
// A journey resolves in one step. The time is the sum of its legs; the places between are never
// visited, so nothing happens in rooms nobody was watching.

import { DEFAULT_CALENDAR, type Calendar } from './clock';
import { AREA_KINDS, stateDefFor, type Place, type PraxisModule, type Requirement } from './module';
import { read, type StateDef, type StateValues } from './state';
import { atlasOf as layoutOf, chainOf, childrenOf, placeMapFrom, travelOf, type Leg, type PlaceMap, type Travel } from '../../../core/map/index';

export type { Leg };

// A way one leg long: into a place, out to the place that holds it, or across to a neighbour.
export interface Edge {
  from: string;
  to: string;
  minutes: number;
  kind: 'inside' | 'across';
}

export interface Atlas {
  places: ReadonlyMap<string, Place>;
  depth: ReadonlyMap<string, number>;
  map: PlaceMap;
  travel: Travel;
}

const atlases = new WeakMap<PraxisModule, Atlas>();

export function calendarOf(module: PraxisModule): Calendar {
  return module.ruleset.calendar ?? DEFAULT_CALENDAR;
}

export function isArea(place: Place | undefined): boolean {
  return Boolean(place && AREA_KINDS.includes(place.kind));
}

// Built once per module and reused; a module never changes after loading.
export function atlasOf(module: PraxisModule): Atlas {
  const cached = atlases.get(module);
  if (cached) return cached;
  const places = new Map(module.world.places.map((place) => [place.id, place]));
  const map = placeMapFrom(module.world.name, module.world.places.map((place) => ({ id: place.id, name: place.name, kind: place.kind, parentId: place.parentLocationId, icon: place.icon })));
  const depth = new Map([...places.keys()].map((id) => [id, chainOf(map, id).filter((at) => places.has(at)).length - 1]));
  const travel = travelOf(layoutOf(map, module.map?.sheets ?? {}), module.ruleset.levels);
  const atlas: Atlas = { places, depth, map, travel };
  atlases.set(module, atlas);
  return atlas;
}

function fails(module: PraxisModule, values: StateValues, playerId: string, requirement: Requirement): boolean {
  const def: StateDef | undefined = stateDefFor(module, requirement.stateId, playerId);
  return !def || read(values, def, playerId) < requirement.atLeast;
}

// Why a journey from one place to another is closed to the player, or null if it is open: the
// first place it comes in to or goes out of whose crossing the player can't meet.
export function blockedOn(module: PraxisModule, values: StateValues, playerId: string, from: string, to: string): string | null {
  const { map, places } = atlasOf(module);
  const fromChain = new Set(chainOf(map, from)), toChain = new Set(chainOf(map, to));
  for (const place of places.values()) {
    if (!place.crossing.length) continue;
    const inFrom = fromChain.has(place.id), inTo = toChain.has(place.id);
    if (inFrom === inTo) continue;
    for (const requirement of place.crossing) {
      if (requirement.toward !== undefined && !inTo) continue;
      if (fails(module, values, playerId, requirement)) return requirement.reason;
    }
  }
  return null;
}

// The places a walk across a sheet has to go around: those the player couldn't cross either way.
function avoiding(module: PraxisModule, values: StateValues, playerId: string): (placeId: string) => boolean {
  const { places } = atlasOf(module);
  return (placeId) => places.get(placeId)?.crossing.some((requirement) => fails(module, values, playerId, requirement)) ?? false;
}

export type PathResult =
  | { ok: true; minutes: number; legs: Leg[] }
  | { ok: false; reason: string };

// The way from one place to another, how long it takes and its legs, or why the player can't go.
export function findPath(module: PraxisModule, values: StateValues, playerId: string, from: string, to: string): PathResult {
  const atlas = atlasOf(module);
  const target = atlas.places.get(to);
  if (!target) return { ok: false, reason: 'That place is not in this world.' };
  if (isArea(target)) return { ok: false, reason: `${target.name} is an area, not somewhere to go. Choose a place inside it.` };
  if (from === to) return { ok: false, reason: `You are already at ${target.name}.` };
  if (!atlas.places.has(from)) return { ok: false, reason: 'You are not anywhere in this world.' };
  const blocked = blockedOn(module, values, playerId, from, to);
  if (blocked) return { ok: false, reason: blocked };
  const trip = atlas.travel.journey(from, to, avoiding(module, values, playerId));
  if (!Number.isFinite(trip.minutes)) return { ok: false, reason: `There is no way from here to ${target.name} that you can take.` };
  return { ok: true, minutes: trip.minutes, legs: trip.legs };
}

export interface Exit {
  edge: Edge;
  place: Place;
  blocked: string | null;
}

// The ways out from here, quickest first: the place that holds this one, the places inside it,
// and its neighbours on the same sheet. Areas are never somewhere to go.
export function exitsFrom(module: PraxisModule, values: StateValues, playerId: string, placeId: string): Exit[] {
  const atlas = atlasOf(module);
  const { map, places } = atlas;
  if (!places.has(placeId)) return [];
  const parent = places.get(placeId)!.parentLocationId;
  const near: { id: string; kind: Edge['kind'] }[] = [
    ...(parent && places.has(parent) ? [{ id: parent, kind: 'inside' as const }] : []),
    ...childrenOf(map, placeId).map((child) => ({ id: child.id, kind: 'inside' as const })),
    ...childrenOf(map, map.places.get(placeId)?.parentId ?? '').filter((sibling) => sibling.id !== placeId).map((sibling) => ({ id: sibling.id, kind: 'across' as const })),
  ];
  const avoid = avoiding(module, values, playerId);
  return near
    .filter((entry) => places.has(entry.id) && !isArea(places.get(entry.id)))
    .map((entry) => {
      const blocked = blockedOn(module, values, playerId, placeId, entry.id);
      const minutes = atlas.travel.journey(placeId, entry.id, blocked ? undefined : avoid).minutes;
      return {
        edge: { from: placeId, to: entry.id, minutes, kind: entry.kind },
        place: places.get(entry.id)!,
        blocked: blocked ?? (Number.isFinite(minutes) ? null : 'There is no way there that you can take.'),
      };
    })
    .sort((a, b) => a.edge.minutes - b.edge.minutes || a.place.name.localeCompare(b.place.name));
}

// Every place a journey could end, with how long it takes from here.
export function destinationsFrom(module: PraxisModule, values: StateValues, playerId: string, from: string): { place: Place; result: PathResult }[] {
  return module.world.places
    .filter((place) => place.id !== from && !isArea(place))
    .map((place) => ({ place, result: findPath(module, values, playerId, from, place.id) }))
    .sort((a, b) => a.place.name.localeCompare(b.place.name));
}
