// Maps (docs/bids/maps/decision.md). Every place that holds other places has a sheet: what is
// directly inside it, as blobs on a disc of hexes, laid out from the place tree with no setup.
// The circles draw every sheet at once, nested, at the same centres. Nothing generated is
// stored; an author's changes to a sheet (SheetEdits) are, and the generator reads them back.
// Pure: no DOM, no network, no storage. The same world and edits give the same map anywhere.

import type { World } from '../records/index.js';
import { AREA_KINDS, PLACE_KINDS, type PlaceKind } from '../rules/index.js';

// The generator's version. A world keeps the version its layout was made with, so a later
// generator can't quietly move a place and change a journey.
export const MAP_VERSION = 1;
// The sheet that holds a world's top places when there is more than one.
export const TOP = '#top';

export interface MapPlace { id: string; name: string; kind: PlaceKind; parentId: string | null }
export interface PlaceMap {
  name: string;
  places: ReadonlyMap<string, MapPlace>;
  children: ReadonlyMap<string, readonly MapPlace[]>;
  root: string | null;
  // How many places each place holds, at any depth.
  holds: ReadonlyMap<string, number>;
}

export const isArea = (kind: PlaceKind) => AREA_KINDS.includes(kind);
const WATERY: readonly string[] = ['wilderness', 'lake', 'river', 'sea or ocean'];

// The places of a world as the map reads them: a kind for each, a parent that is a real place,
// and no loops. A place inside one that is gone, or inside itself, counts as a top place.
export function placeMap(world: Pick<World, 'name' | 'records'>): PlaceMap {
  const raw = world.records.filter((record) => record.kind === 'place');
  const ids = new Set(raw.map((place) => place.id));
  const parentOf = new Map(raw.map((place) => [place.id, place.parentId && ids.has(place.parentId) && place.parentId !== place.id ? place.parentId : null]));
  for (const place of raw) {
    const seen = new Set<string>([place.id]);
    for (let at = parentOf.get(place.id); at; at = parentOf.get(at)) {
      if (seen.has(at)) { parentOf.set(place.id, null); break; }
      seen.add(at);
    }
  }
  const kindOf = (value: unknown): PlaceKind => ((PLACE_KINDS as readonly string[]).includes(value as string) ? (value as PlaceKind) : 'other');
  const places = new Map<string, MapPlace>(raw.map((place) => [place.id, { id: place.id, name: place.name, kind: kindOf(place.rules?.placeKind), parentId: parentOf.get(place.id) ?? null }]));
  const roots = [...places.values()].filter((place) => !place.parentId);
  let root: string | null = roots.length === 1 ? roots[0]!.id : null;
  if (roots.length > 1) {
    places.set(TOP, { id: TOP, name: world.name, kind: 'continent', parentId: null });
    for (const place of roots) places.set(place.id, { ...place, parentId: TOP });
    root = TOP;
  }
  const children = new Map<string, MapPlace[]>();
  for (const place of places.values()) if (place.parentId) children.set(place.parentId, [...(children.get(place.parentId) ?? []), place]);
  for (const list of children.values()) list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const holds = new Map<string, number>();
  const count = (id: string): number => {
    const known = holds.get(id);
    if (known !== undefined) return known;
    const n = (children.get(id) ?? []).reduce((sum, child) => sum + 1 + count(child.id), 0);
    holds.set(id, n);
    return n;
  };
  for (const id of places.keys()) count(id);
  return { name: world.name, places, children, root, holds };
}

export const childrenOf = (map: PlaceMap, id: string) => map.children.get(id) ?? [];
export function chainOf(map: PlaceMap, id: string): string[] {
  const out: string[] = [];
  for (let at: string | null = id; at && map.places.has(at); at = map.places.get(at)!.parentId) out.push(at);
  return out;
}

// ---- Hex arithmetic: pointy-top axial cells of circumradius 1 ----
export type Cell = readonly [number, number];
export const SQ3 = Math.sqrt(3);
export const DIRS: readonly Cell[] = [[0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1], [1, 0]];
export const cellKey = (q: number, r: number) => `${q},${r}`;
export const unKey = (key: string): Cell => { const [q, r] = key.split(',').map(Number); return [q!, r!]; };
export const toPixel = (q: number, r: number): [number, number] => [SQ3 * (q + r / 2), 1.5 * r];
export function toCell(x: number, y: number): Cell {
  const qf = SQ3 / 3 * x - y / 3, rf = 2 / 3 * y, sf = -qf - rf;
  let q = Math.round(qf), r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
  return [q + 0, r + 0];
}
export const cellDistance = (a: Cell, b: Cell) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[0] + a[1] - b[0] - b[1])) / 2;
export const inDisc = (q: number, r: number, radius: number) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2 <= radius;

function fnv(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const unit = (seed: string, text: string) => fnv(`${seed}|${text}`) / 4294967296;

// What an author changed on one sheet. Every field is optional; an untouched sheet has none.
export interface SheetEdits {
  seed?: number;
  cellMinutes?: number;
  radius?: number;
  centres?: Record<string, { q: number; r: number }>;
  sizes?: Record<string, number>;
  claims?: Record<string, string>;
  roads?: string[];
}

export interface Blob {
  id: string;
  kind: PlaceKind;
  // The building's own cell, for being inside but in no room.
  own: boolean;
  size: number;
  centre: Cell;
  cells: Cell[];
  // The middle of its cells, in sheet units.
  cx: number;
  cy: number;
}
export interface Sheet {
  id: string;
  radius: number;
  bordered: boolean;
  // Areas: the ground is land nobody stops on. Anywhere else the ground is the place itself.
  area: boolean;
  blobs: Blob[];
  byId: ReadonlyMap<string, Blob>;
  owner: ReadonlyMap<string, Blob>;
  cells: Cell[];
  roads: ReadonlySet<string>;
}

// How many cells a place takes before anyone changes it: one for a place that holds nothing,
// more for more, compressed so one big place doesn't crush its neighbours (Grok's sizes,
// Character Engine's floor).
export function sizeOf(map: PlaceMap, place: MapPlace): number {
  const held = map.holds.get(place.id) ?? 0;
  let size = held === 0 ? 1 : Math.max(3, Math.min(19, Math.round(1 + 2 * Math.log2(1 + held))));
  if (WATERY.includes(place.kind)) size = Math.max(size, 3);
  if (isArea(place.kind)) size = Math.max(size, 7);
  return size;
}

interface Placing { blob: Blob; x: number; y: number; fixed: boolean }

// One sheet: what is directly inside a place, as blobs on a disc of hexes.
export function sheetOf(map: PlaceMap, id: string, edits: SheetEdits = {}): Sheet {
  const place = map.places.get(id);
  if (!place) throw new Error(`No place "${id}".`);
  const kids = childrenOf(map, id);
  const area = isArea(place.kind);
  const bordered = (area && kids.length > 0 && kids.every((kid) => isArea(kid.kind))) || place.kind === 'building';
  const sizes = edits.sizes ?? {};
  const blobs: Blob[] = kids.map((kid) => ({ id: kid.id, kind: kid.kind, own: false, size: Math.max(1, Math.round(sizes[kid.id] ?? sizeOf(map, kid))), centre: [0, 0], cells: [], cx: 0, cy: 0 }));
  if (bordered && !area) blobs.push({ id, kind: place.kind, own: true, size: 1, centre: [0, 0], cells: [], cx: 0, cy: 0 });
  const seed = `v${MAP_VERSION}|${id}|${edits.seed ?? 0}`;
  const pad = bordered ? 0.2 : 1.1;
  const reach = (blob: Blob) => 0.95 * Math.sqrt(blob.size);
  const stored = edits.centres ?? {};

  // Centres: stored ones first; each other place on a ray at an angle hashed from its own id, so
  // a new sibling turns no one, stepping out until it is clear of the rest (Grok).
  const placed: Placing[] = [];
  for (const blob of blobs) {
    const at = stored[blob.id];
    if (at) { const [x, y] = toPixel(at.q, at.r); placed.push({ blob, x, y, fixed: true }); }
  }
  const free = blobs.filter((blob) => !stored[blob.id]).sort((a, b) => b.size - a.size || (a.id < b.id ? -1 : 1));
  for (const blob of free) {
    const angle = unit(seed, blob.id) * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle);
    for (let d = 0; ; d += 0.2) {
      const x = d * c, y = d * s;
      if (placed.every((other) => Math.hypot(other.x - x, other.y - y) >= reach(other.blob) + reach(blob) + pad)) { placed.push({ blob, x, y, fixed: false }); break; }
    }
  }
  if (placed.length && !placed.some((entry) => entry.fixed)) {
    let sx = 0, sy = 0, w = 0;
    for (const entry of placed) { sx += entry.x * entry.blob.size; sy += entry.y * entry.blob.size; w += entry.blob.size; }
    for (const entry of placed) { entry.x -= sx / w; entry.y -= sy / w; }
  }

  // The disc: the smallest with room, never smaller than an arranged sheet kept it.
  const total = blobs.reduce((sum, blob) => sum + blob.size, 0);
  const target = bordered ? total : Math.ceil(total * 1.9) + 3;
  let radius = 1;
  while (3 * radius * radius + 3 * radius + 1 < target) radius++;
  const extent = Math.max(0, ...placed.map((entry) => Math.hypot(entry.x, entry.y) + (bordered ? 0 : reach(entry.blob))));
  while (SQ3 * radius < extent + 0.5) radius++;
  if (edits.radius) radius = Math.max(radius, Math.min(60, Math.round(edits.radius)));

  const cells: Cell[] = [];
  for (let q = -radius; q <= radius; q++) for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) cells.push([q, r]);
  const owner = new Map<string, Blob>();
  const nearestFree = (from: Cell): Cell => {
    let pick: Cell | null = null, best = Infinity;
    for (const cell of cells) {
      if (owner.has(cellKey(cell[0], cell[1]))) continue;
      const d = cellDistance(cell, from);
      if (d < best) { best = d; pick = cell; }
    }
    return pick ?? from;
  };
  const order = [...placed].sort((a, b) => Number(b.fixed) - Number(a.fixed) || b.blob.size - a.blob.size || (a.blob.id < b.blob.id ? -1 : 1));
  for (const entry of order) {
    let cell: Cell = entry.fixed ? [stored[entry.blob.id]!.q, stored[entry.blob.id]!.r] : toCell(entry.x, entry.y);
    if (!inDisc(cell[0], cell[1], radius) || owner.has(cellKey(cell[0], cell[1]))) cell = nearestFree(cell);
    entry.blob.centre = cell;
    entry.blob.cells = [cell];
    owner.set(cellKey(cell[0], cell[1]), entry.blob);
  }

  // Cells: each blob grows from its centre a cell at a time in turn, in one piece; islands keep a
  // one-cell gap where they can (Character Engine's partition).
  const grow = (blob: Blob, moat: boolean): Cell | null => {
    let pick: Cell | null = null, score = Infinity;
    for (const [q, r] of blob.cells) {
      for (const [dq, dr] of DIRS) {
        const nq = q + dq, nr = r + dr, key = cellKey(nq, nr);
        if (!inDisc(nq, nr, radius) || owner.has(key)) continue;
        if (moat && DIRS.some(([eq, er]) => { const other = owner.get(cellKey(nq + eq, nr + er)); return Boolean(other && other !== blob); })) continue;
        const value = cellDistance([nq, nr], blob.centre) + unit(seed, `${blob.id}@${key}`) * 0.9;
        if (value < score) { score = value; pick = [nq, nr]; }
      }
    }
    return pick;
  };
  const growing = order.map((entry) => entry.blob);
  const claim = (blob: Blob, cell: Cell) => { blob.cells.push(cell); owner.set(cellKey(cell[0], cell[1]), blob); };
  for (let grew = true; grew;) {
    grew = false;
    for (const blob of growing) {
      if (blob.cells.length >= blob.size) continue;
      const cell = grow(blob, !bordered) ?? grow(blob, false);
      if (cell) { claim(blob, cell); grew = true; }
    }
  }
  if (bordered) {
    for (let grew = true; grew;) {
      grew = false;
      for (const blob of growing) { const cell = grow(blob, false); if (cell) { claim(blob, cell); grew = true; } }
    }
  }

  // Painted cells win, except a place's own centre, which nothing paints over.
  const byId = new Map(blobs.map((blob) => [blob.id, blob]));
  const centres = new Set(blobs.map((blob) => cellKey(blob.centre[0], blob.centre[1])));
  for (const [key, to] of Object.entries(edits.claims ?? {})) {
    const [q, r] = unKey(key);
    if (!inDisc(q, r, radius) || centres.has(key)) continue;
    if (to === '') owner.delete(key);
    else { const blob = byId.get(to); if (blob) owner.set(key, blob); }
  }
  for (const blob of blobs) blob.cells = [];
  for (const cell of cells) owner.get(cellKey(cell[0], cell[1]))?.cells.push(cell);
  for (const blob of blobs) {
    let sx = 0, sy = 0;
    for (const [q, r] of blob.cells) { const [x, y] = toPixel(q, r); sx += x; sy += y; }
    blob.cx = round(sx / blob.cells.length);
    blob.cy = round(sy / blob.cells.length);
  }
  const roads = new Set((edits.roads ?? []).filter((key) => { const [q, r] = unKey(key); return Number.isFinite(q) && Number.isFinite(r) && inDisc(q, r, radius); }));
  return { id, radius, bordered, area, blobs, byId, owner, cells, roads };
}
const round = (value: number) => Math.round(value * 10000) / 10000;

// Every sheet of a world, laid out once and kept until the world changes.
export interface Atlas {
  map: PlaceMap;
  sheet: (id: string) => Sheet;
}
export function atlasOf(map: PlaceMap, edits: Record<string, SheetEdits> = {}): Atlas {
  const sheets = new Map<string, Sheet>();
  return {
    map,
    sheet: (id) => {
      let found = sheets.get(id);
      if (!found) { found = sheetOf(map, id, edits[id]); sheets.set(id, found); }
      return found;
    },
  };
}

// The circles: each sheet rounded off and nested. A blob becomes a circle of the same area at
// its cells' middle, scaled into its parent's circle, so a child is always inside its parent.
export interface Circle { x: number; y: number; r: number }
export function circlesOf(atlas: Atlas, size = 1000): Map<string, Circle> {
  const out = new Map<string, Circle>();
  const { map } = atlas;
  if (!map.root) return out;
  const put = (id: string, x: number, y: number, r: number) => {
    out.set(id, { x, y, r });
    if (!childrenOf(map, id).length) return;
    const sheet = atlas.sheet(id), s = (r * 0.9) / ((sheet.radius + 0.75) * SQ3);
    for (const blob of sheet.blobs) {
      if (blob.own || !blob.cells.length) continue;
      put(blob.id, x + blob.cx * s, y + blob.cy * s, Math.sqrt((blob.cells.length * 2.598) / Math.PI) * s * (sheet.bordered ? 0.92 : 1.05));
    }
  };
  put(map.root, 0, 0, size);
  return out;
}
