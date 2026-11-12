// Refining the ground (docs/bids/maps/decision.md, phase M3). A sheet lays itself out the first
// time it is opened; from there an author can move a place, make it bigger or smaller, paint cells
// to a place or back to the ground, lay roads, and say what a cell is worth. The first change
// stores every centre on that sheet, so nothing shifts under the author's hand again. Each
// function takes a world's map and returns a new one, keeping only what was changed. Pure.

import { cellKey, childrenOf, inDisc, DIRS, MAP_VERSION, type Cell, type PlaceMap, type Sheet } from './sheet.js';
import type { SheetEdits, WorldMap } from './schema.js';

export type Brush = 1 | 7 | 0;

const clean = (edits: SheetEdits): SheetEdits | undefined => {
  const kept = Object.fromEntries(Object.entries(edits).filter(([, value]) => value !== undefined && !(Array.isArray(value) && !value.length) && !(typeof value === 'object' && !Array.isArray(value) && value !== null && !Object.keys(value).length)));
  return Object.keys(kept).length ? (kept as SheetEdits) : undefined;
};

// The map with one sheet's edits replaced, or dropped when nothing is left of them.
export function withSheet(map: WorldMap | undefined, sheetId: string, edits: SheetEdits | undefined): WorldMap | undefined {
  const sheets = { ...(map?.sheets ?? {}) };
  const kept = edits && clean(edits);
  if (kept) sheets[sheetId] = kept; else delete sheets[sheetId];
  return Object.keys(sheets).length ? { v: map?.v ?? MAP_VERSION, sheets } : undefined;
}

const editsOf = (map: WorldMap | undefined, sheetId: string): SheetEdits => map?.sheets?.[sheetId] ?? {};

// Every centre on the sheet as it stands, and its size of disc, so later changes move nobody.
export function settle(map: WorldMap | undefined, sheet: Sheet): WorldMap | undefined {
  const edits = editsOf(map, sheet.id);
  if (edits.centres) return map;
  return withSheet(map, sheet.id, {
    ...edits,
    centres: Object.fromEntries(sheet.blobs.map((blob) => [blob.id, { q: blob.centre[0], r: blob.centre[1] }])),
    radius: Math.max(edits.radius ?? 0, sheet.radius),
  });
}

// A place's centre moved to another cell; its cells regrow around it.
export function moveTo(map: WorldMap | undefined, sheet: Sheet, placeId: string, [q, r]: Cell): WorldMap | undefined {
  if (!sheet.byId.has(placeId)) return map;
  const settled = settle(map, sheet);
  const edits = editsOf(settled, sheet.id);
  const radius = Math.min(60, Math.max(edits.radius ?? sheet.radius, (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2));
  // A cell painted to someone else would sit under the new centre; it goes back to being worked out.
  const claims = { ...(edits.claims ?? {}) };
  delete claims[cellKey(q, r)];
  return withSheet(settled, sheet.id, { ...edits, centres: { ...edits.centres, [placeId]: { q, r } }, radius, claims });
}

// A place made bigger or smaller by about a third. Cells painted to it are let go, so its new
// size is what it grows to.
export function resize(map: WorldMap | undefined, sheet: Sheet, placeId: string, bigger: boolean): WorldMap | undefined {
  const blob = sheet.byId.get(placeId);
  if (!blob || blob.own) return map;
  const settled = settle(map, sheet);
  const edits = editsOf(settled, sheet.id);
  const now = edits.sizes?.[placeId] ?? blob.size;
  const size = Math.max(1, Math.min(400, bigger ? Math.max(now + 1, Math.round(now * 1.35)) : Math.min(now - 1, Math.round(now / 1.35))));
  const claims = Object.fromEntries(Object.entries(edits.claims ?? {}).filter(([, to]) => to !== placeId));
  const extra = Math.ceil(Math.sqrt(Math.max(0, size - now)));
  return withSheet(settled, sheet.id, { ...edits, sizes: { ...edits.sizes, [placeId]: size }, claims, radius: Math.min(60, (edits.radius ?? sheet.radius) + (bigger ? extra : 0)) });
}

// Cells given to a place on the sheet, or to the sheet's own ground (''). A brush of one cell,
// of seven, or Fill, which takes the whole patch of the same owner (Character Engine's size 0).
export function paint(map: WorldMap | undefined, sheet: Sheet, [q, r]: Cell, to: string, brush: Brush): WorldMap | undefined {
  if (!inDisc(q, r, sheet.radius) || (to !== '' && !sheet.byId.has(to))) return map;
  const settled = settle(map, sheet);
  const edits = editsOf(settled, sheet.id);
  const claims = { ...(edits.claims ?? {}) };
  if (brush === 0) {
    const start = cellKey(q, r), from = sheet.owner.get(start)?.id ?? '';
    const seen = new Set([start]), todo: Cell[] = [[q, r]];
    while (todo.length) {
      const [cq, cr] = todo.pop()!;
      claims[cellKey(cq, cr)] = to;
      for (const [dq, dr] of DIRS) {
        const nq = cq + dq, nr = cr + dr, key = cellKey(nq, nr);
        if (seen.has(key) || !inDisc(nq, nr, sheet.radius) || (sheet.owner.get(key)?.id ?? '') !== from) continue;
        seen.add(key); todo.push([nq, nr]);
      }
    }
  } else {
    const reach: Cell[] = brush === 1 ? [[q, r]] : [[q, r], ...DIRS.map(([dq, dr]) => [q + dq, r + dr] as Cell)];
    for (const [cq, cr] of reach) if (inDisc(cq, cr, sheet.radius)) claims[cellKey(cq, cr)] = to;
  }
  return withSheet(settled, sheet.id, { ...edits, claims });
}

// A road cell laid or taken up.
export function road(map: WorldMap | undefined, sheet: Sheet, [q, r]: Cell, lay: boolean): WorldMap | undefined {
  if (!inDisc(q, r, sheet.radius)) return map;
  const settled = settle(map, sheet);
  const edits = editsOf(settled, sheet.id);
  const roads = new Set(edits.roads ?? []);
  if (lay) roads.add(cellKey(q, r)); else roads.delete(cellKey(q, r));
  return withSheet(settled, sheet.id, { ...edits, roads: [...roads].sort() });
}

// What a cell is worth on this sheet, in minutes; undefined puts the level's back.
export const cellWorth = (map: WorldMap | undefined, sheetId: string, minutes: number | undefined) => withSheet(map, sheetId, { ...editsOf(map, sheetId), cellMinutes: minutes });
// A fresh layout for this sheet, keeping what a cell is worth.
export const reroll = (map: WorldMap | undefined, sheetId: string) => { const edits = editsOf(map, sheetId); return withSheet(map, sheetId, { seed: (edits.seed ?? 0) + 1, cellMinutes: edits.cellMinutes }); };
// Every change on the sheet thrown away.
export const resetSheet = (map: WorldMap | undefined, sheetId: string) => withSheet(map, sheetId, undefined);
// The sheet as it stands, kept, so additions move nothing.
export const keepLayout = settle;
export const isArranged = (map: WorldMap | undefined, sheetId: string) => Boolean(map?.sheets?.[sheetId]?.centres);

// Map data that points at nothing: a sheet for a place that is gone or holds nothing, or a
// centre, size or painted cell for a place that is no longer directly inside that sheet's place.
export function staleMapData(places: PlaceMap, map: WorldMap | undefined): { sheet: string; text: string }[] {
  const out: { sheet: string; text: string }[] = [];
  for (const [sheetId, edits] of Object.entries(map?.sheets ?? {})) {
    if (!places.places.has(sheetId)) { out.push({ sheet: sheetId, text: `The map keeps changes for a place that is gone: "${sheetId}".` }); continue; }
    const inside = new Set(childrenOf(places, sheetId).map((place) => place.id));
    if (!inside.size) { out.push({ sheet: sheetId, text: 'The map keeps changes for this place, but it holds nothing now.' }); continue; }
    const named = new Set([...Object.keys(edits.centres ?? {}), ...Object.keys(edits.sizes ?? {}), ...Object.values(edits.claims ?? {}).filter(Boolean)]);
    const lost = [...named].filter((id) => id !== sheetId && !inside.has(id));
    if (lost.length) out.push({ sheet: sheetId, text: `Its map still places ${lost.length === 1 ? 'something' : `${lost.length} things`} no longer inside it: ${lost.map((id) => places.places.get(id)?.name ?? `"${id}"`).join(', ')}. Reset the sheet, or leave it: they are ignored.` });
  }
  return out;
}

