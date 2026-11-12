// How long a journey takes, from the levels and the map (docs/bids/maps/decision.md). From A to
// B: step out of each place up to the child of the place that holds both, cross that sheet by
// the cheapest walk over its cells, then step in down to B. A step along a road costs less. The
// journey resolves in one step; its time is the sum of its legs. Pure.

import { CELLS_PER_TRIP, LEVEL_OF, levelsOf, type Levels, type WorldLevels } from '../rules/index.js';
import { DIRS, cellKey, chainOf, inDisc, isArea, unKey, type Atlas, type Sheet } from './sheet.js';

export type Leg =
  | { kind: 'out'; from: string; into: string; minutes: number }
  | { kind: 'in'; from: string; into: string; minutes: number }
  | { kind: 'across'; sheet: string; from: string; to: string; minutes: number; cells: number; steps: number; onRoad: number; cellMinutes: number };

export interface Journey { minutes: number; legs: Leg[] }

export interface Travel {
  atlas: Atlas;
  levels: Levels;
  // What a cell is worth on a sheet: its own, or a quarter of its level's typical trip.
  cellMinutes: (sheet: string) => number;
  journey: (from: string, to: string) => Journey;
}

export function travelOf(atlas: Atlas, own: WorldLevels | null | undefined, cellMinutes: Record<string, number | undefined> = {}): Travel {
  const levels = levelsOf(own);
  const { map } = atlas;
  const kindOf = (id: string) => map.places.get(id)!.kind;
  const perCell = (sheet: string) => cellMinutes[sheet] ?? levels.times[LEVEL_OF[kindOf(sheet)]].across / CELLS_PER_TRIP;
  const step = (holder: string) => (isArea(kindOf(holder)) ? 0 : levels.times[LEVEL_OF[kindOf(holder)]].step);
  const walks = new Map<string, ReturnType<typeof cheapest>>();
  const walkFrom = (sheet: Sheet, start: string) => {
    const key = `${sheet.id}\u0000${start}`;
    let found = walks.get(key);
    if (!found) { found = cheapest(sheet, start, levels.road); walks.set(key, found); }
    return found;
  };

  const journey = (from: string, to: string): Journey => {
    if (from === to || !map.places.has(from) || !map.places.has(to)) return { minutes: from === to ? 0 : Infinity, legs: [] };
    const up = chainOf(map, from), down = chainOf(map, to), inDown = new Set(down);
    const meet = up.find((id) => inDown.has(id));
    if (!meet) return { minutes: Infinity, legs: [] };
    const iu = up.indexOf(meet), id = down.indexOf(meet), legs: Leg[] = [];
    const climbTo = id === 0 ? iu : iu - 1;
    for (let j = 0; j < climbTo; j++) legs.push({ kind: 'out', from: up[j]!, into: up[j + 1]!, minutes: step(up[j + 1]!) });
    if (iu > 0 && id > 0) {
      const sheet = atlas.sheet(meet), a = sheet.byId.get(up[iu - 1]!)!, b = sheet.byId.get(down[id - 1]!)!;
      const start = cellKey(a.centre[0], a.centre[1]), end = cellKey(b.centre[0], b.centre[1]);
      const walk = walkFrom(sheet, start);
      let steps = 0, onRoad = 0;
      for (let at = end; at !== start && walk.prev.has(at); at = walk.prev.get(at)!) {
        steps++;
        if (sheet.roads.has(at) && sheet.roads.has(walk.prev.get(at)!)) onRoad++;
      }
      const cells = walk.dist.get(end) ?? Infinity, worth = perCell(meet);
      legs.push({ kind: 'across', sheet: meet, from: a.id, to: b.id, minutes: cells * worth, cells, steps, onRoad, cellMinutes: worth });
    }
    for (let j = (iu === 0 ? id : id - 1); j > 0; j--) legs.push({ kind: 'in', from: down[j]!, into: down[j - 1]!, minutes: step(down[j]!) });
    return { minutes: Math.round(legs.reduce((sum, leg) => sum + leg.minutes, 0)), legs };
  };
  return { atlas, levels, cellMinutes: perCell, journey };
}

// The cheapest walk from one cell to every other on a sheet: a step costs a cell, or the road's
// share of one between two road cells.
function cheapest(sheet: Sheet, start: string, road: number): { dist: Map<string, number>; prev: Map<string, string> } {
  const dist = new Map<string, number>([[start, 0]]), prev = new Map<string, string>(), done = new Set<string>();
  const heap: [number, string][] = [[0, start]];
  const push = (item: [number, string]) => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0;) { const p = (i - 1) >> 1; if (heap[p]![0] <= heap[i]![0]) break; [heap[p], heap[i]] = [heap[i]!, heap[p]!]; i = p; }
  };
  const pop = () => {
    const top = heap[0]!, last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l;
        if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i]!, heap[m]!]; i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, key] = pop();
    if (done.has(key)) continue;
    done.add(key);
    const [q, r] = unKey(key);
    for (const [dq, dr] of DIRS) {
      const nq = q + dq, nr = r + dr;
      if (!inDisc(nq, nr, sheet.radius)) continue;
      const next = cellKey(nq, nr), cost = d + (sheet.roads.has(key) && sheet.roads.has(next) ? road : 1);
      if (cost < (dist.get(next) ?? Infinity)) { dist.set(next, cost); prev.set(next, key); push([cost, next]); }
    }
  }
  return { dist, prev };
}
