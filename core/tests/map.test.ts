import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { moduleToWorld } from '../convert/index.js';
import { TOP, atlasOf, cellDistance, cellKey, cellWorth, colour, iconSet, childrenOf, circlesOf, inDisc, isArranged, keepLayout, moveTo, paint, placeMap, reroll, resetSheet, resize, road, sheetOf, staleMapData, travelOf, type PlaceMap, type SheetEdits, type WorldMap } from '../map/index.js';
import { STANDARD_LEVELS, changedCount, levelsOf, pruneLevels, pruneRules, EMPTY_RULES } from '../rules/index.js';
import type { World } from '../records/index.js';

const bogwaterModule: unknown = JSON.parse(readFileSync(new URL('../../adventure/modules/abernys-bogwater.json', import.meta.url), 'utf8'));
const imported = moduleToWorld(bogwaterModule, 5);
if (!imported.ok) throw new Error(imported.errors.join('\n'));
const bogwater: World = imported.world;

// A made-up world of about 800 places: lands, regions, towns, buildings and rooms.
function bigWorld(): Pick<World, 'name' | 'records'> {
  const records: { id: string; kind: 'place'; name: string; parentId: string | null; rules: { placeKind: string } }[] = [];
  const add = (id: string, kind: string, parentId: string | null) => records.push({ id, kind: 'place', name: id, parentId, rules: { placeKind: kind } });
  add('world', 'continent', null);
  for (let a = 0; a < 6; a++) {
    add(`r${a}`, 'region', 'world');
    for (let b = 0; b < 8; b++) {
      add(`r${a}t${b}`, 'town', `r${a}`);
      for (let c = 0; c < 5; c++) {
        add(`r${a}t${b}h${c}`, 'building', `r${a}t${b}`);
        for (let d = 0; d < 2; d++) add(`r${a}t${b}h${c}x${d}`, 'building', `r${a}t${b}h${c}`);
      }
    }
  }
  return { name: 'Big', records: records as unknown as World['records'] };
}

const sheetsOf = (map: PlaceMap) => [...map.places.keys()].filter((id) => childrenOf(map, id).length);
const connected = (cells: readonly (readonly [number, number])[]) => {
  const keys = new Set(cells.map(([q, r]) => cellKey(q, r))), seen = new Set<string>(), todo = [cellKey(...cells[0]!)];
  seen.add(todo[0]!);
  while (todo.length) {
    const [q, r] = todo.pop()!.split(',').map(Number) as [number, number];
    for (const [dq, dr] of [[0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1], [1, 0]] as const) {
      const key = cellKey(q + dq, r + dr);
      if (keys.has(key) && !seen.has(key)) { seen.add(key); todo.push(key); }
    }
  }
  return seen.size === keys.size;
};

describe('the place map', () => {
  it("reads Bogwater's places with their kinds and one root", () => {
    const map = placeMap(bogwater);
    expect(map.places.size).toBe(38);
    expect(map.root).toBe('abernys');
    expect(map.places.get('fenmire')!.kind).toBe('subregion');
    expect(map.holds.get('fenmire')).toBe(30);
  });

  it('gives a world of several top places one top sheet, and breaks a loop', () => {
    const records = [
      { id: 'a', kind: 'place', name: 'A', parentId: null, rules: { placeKind: 'town' } },
      { id: 'b', kind: 'place', name: 'B', parentId: 'c', rules: { placeKind: 'town' } },
      { id: 'c', kind: 'place', name: 'C', parentId: 'b', rules: { placeKind: 'town' } },
    ] as unknown as World['records'];
    const map = placeMap({ name: 'Two', records });
    expect(map.root).toBe(TOP);
    expect(childrenOf(map, TOP).length).toBeGreaterThan(0);
    for (const place of map.places.values()) expect(place.id === TOP || place.parentId !== null).toBe(true);
  });
});

describe('sheets', () => {
  const map = placeMap(bogwater);

  it('are the same every time', () => {
    for (const id of sheetsOf(map)) {
      const a = sheetOf(map, id), b = sheetOf(map, id);
      expect(JSON.stringify(a.blobs)).toBe(JSON.stringify(b.blobs));
    }
  });

  it('give every child its cells, in one piece, inside the disc', () => {
    for (const id of sheetsOf(map)) {
      const sheet = sheetOf(map, id);
      expect(sheet.blobs.filter((blob) => !blob.own).map((blob) => blob.id).sort()).toEqual(childrenOf(map, id).map((kid) => kid.id).sort());
      for (const blob of sheet.blobs) {
        expect(blob.cells.length).toBeGreaterThan(0);
        expect(connected(blob.cells)).toBe(true);
        for (const [q, r] of blob.cells) expect(inDisc(q, r, sheet.radius)).toBe(true);
      }
    }
  });

  it('borders a building, with a cell for the building itself, and lays islands elsewhere', () => {
    const myrtle = sheetOf(map, 'the-myrtle');
    expect(myrtle.bordered).toBe(true);
    expect(myrtle.blobs.some((blob) => blob.own && blob.id === 'the-myrtle')).toBe(true);
    expect(myrtle.owner.size).toBe(myrtle.cells.length);
    const fenmire = sheetOf(map, 'fenmire');
    expect(fenmire.bordered).toBe(false);
    expect(fenmire.area).toBe(true);
    expect(fenmire.owner.size).toBeLessThan(fenmire.cells.length);
  });

  it('keeps stored centres, and a new place on an arranged sheet moves nobody', () => {
    const before = sheetOf(map, 'fenmire');
    const centres = Object.fromEntries(before.blobs.map((blob) => [blob.id, { q: blob.centre[0], r: blob.centre[1] }]));
    const records = [...bogwater.records, { ...bogwater.records.find((record) => record.id === 'grey-water')!, id: 'new-place', name: 'New place' }];
    const after = sheetOf(placeMap({ name: bogwater.name, records }), 'fenmire', { centres, radius: before.radius });
    for (const blob of before.blobs) expect(after.byId.get(blob.id)!.centre).toEqual(blob.centre);
    expect(after.byId.get('new-place')!.cells.length).toBeGreaterThan(0);
  });

  it('lets painted cells win, except over a centre', () => {
    const sheet = sheetOf(map, 'fenmire');
    const bog = sheet.byId.get('bogwater')!, fen = sheet.byId.get('the-fen')!;
    const ground = sheet.cells.find(([q, r]) => !sheet.owner.has(cellKey(q, r)))!;
    const claims: SheetEdits['claims'] = { [cellKey(...ground)]: 'bogwater', [cellKey(...fen.centre)]: 'bogwater', [cellKey(...bog.cells[1]!)]: '' };
    const painted = sheetOf(map, 'fenmire', { claims });
    expect(painted.owner.get(cellKey(...ground))!.id).toBe('bogwater');
    expect(painted.owner.get(cellKey(...fen.centre))!.id).toBe('the-fen');
    expect(painted.owner.has(cellKey(...bog.cells[1]!))).toBe(false);
  });

  it('lays out an 800-place world quickly', () => {
    const map = placeMap(bigWorld());
    expect(map.places.size).toBe(775);
    const started = performance.now();
    const atlas = atlasOf(map);
    const circles = circlesOf(atlas);
    const took = performance.now() - started;
    expect(circles.size).toBe(map.places.size);
    expect(took / sheetsOf(map).length).toBeLessThan(50);
  });
});

describe('circles', () => {
  it('keep every place inside its parent', () => {
    for (const world of [bogwater, bigWorld()]) {
      const map = placeMap(world), circles = circlesOf(atlasOf(map));
      for (const place of map.places.values()) {
        if (!place.parentId) continue;
        const c = circles.get(place.id)!, p = circles.get(place.parentId)!;
        expect(Math.hypot(c.x - p.x, c.y - p.y) + c.r).toBeLessThanOrEqual(p.r + 1e-6);
      }
    }
  });
});

describe('journeys', () => {
  const map = placeMap(bogwater), atlas = atlasOf(map), travel = travelOf(atlas, undefined);

  it('climb, cross and come down, and the legs add up', () => {
    const trip = travel.journey('traps-long-fence', 'myrtle-taproom');
    expect(trip.legs.map((leg) => leg.kind)).toEqual(['out', 'across', 'in', 'in']);
    const across = trip.legs[1]!;
    expect(across.kind === 'across' && across.sheet).toBe('fenmire');
    expect(trip.minutes).toBe(Math.round(trip.legs.reduce((sum, leg) => sum + leg.minutes, 0)));
  });

  it('cross by cells times what a cell is worth, a quarter of the level by default', () => {
    const trip = travel.journey('eel-traps', 'bogwater');
    const across = trip.legs.find((leg) => leg.kind === 'across')!;
    const sheet = atlas.sheet('fenmire');
    expect(across.kind === 'across' && across.cells).toBe(cellDistance(sheet.byId.get('eel-traps')!.centre, sheet.byId.get('bogwater')!.centre));
    expect(across.kind === 'across' && across.cellMinutes).toBe(STANDARD_LEVELS.region.across / 4);
    const scaled = travelOf(atlasOf(map, { fenmire: { cellMinutes: 5 } }), undefined).journey('eel-traps', 'bogwater');
    expect(scaled.minutes * 12).toBe(trip.minutes);
  });

  it('charge nothing to step into or out of an area, and the level step elsewhere', () => {
    const up = travel.journey('bogwater', 'fenmire');
    expect(up.minutes).toBe(0);
    const into = travel.journey('bogwater', 'the-myrtle');
    expect(into.minutes).toBe(STANDARD_LEVELS.settlement.step);
  });

  it('are quicker along a road', () => {
    const plain = travel.journey('eel-traps', 'woeds-edge');
    const sheet = atlas.sheet('fenmire');
    const roads = sheet.cells.map(([q, r]) => cellKey(q, r));
    const paved = travelOf(atlasOf(map, { fenmire: { roads } }), undefined).journey('eel-traps', 'woeds-edge');
    expect(paved.minutes).toBeLessThan(plain.minutes);
    const across = paved.legs.find((leg) => leg.kind === 'across')!;
    expect(across.kind === 'across' && across.onRoad).toBe(across.kind === 'across' && across.steps);
  });

  it("follow a world's own levels", () => {
    const quick = travelOf(atlas, { region: { across: 40 } }).journey('eel-traps', 'bogwater');
    const slow = travel.journey('eel-traps', 'bogwater');
    expect(quick.minutes * 6).toBe(slow.minutes);
  });
});

describe("a world's levels", () => {
  it('keep only what differs from the standard', () => {
    expect(pruneLevels({ region: { across: 240, step: 0 } })).toBeUndefined();
    expect(pruneLevels({ region: { across: 30 }, road: 0.4 })).toEqual({ region: { across: 30 } });
    expect(levelsOf({ open: { step: 1 } }).times.open).toEqual({ across: 60, step: 1 });
    const rules = pruneRules({ ...EMPTY_RULES, levels: { building: { across: 1 } } });
    expect(rules?.levels).toEqual({ building: { across: 1 } });
    expect(changedCount(rules)).toBe(1);
    expect(pruneRules({ ...EMPTY_RULES, levels: { building: { across: 2 } } })).toBeUndefined();
  });
});

describe('a walk that must go around', () => {
  it('is never quicker for going around a place', () => {
    const map = placeMap(bogwater), atlas = atlasOf(map), travel = travelOf(atlas, undefined);
    const sheet = atlas.sheet('fenmire');
    for (const middle of sheet.blobs) {
      for (const [from, to] of [['eel-traps', 'woeds-edge'], ['the-fen', 'far-islands']] as const) {
        if (middle.id === from || middle.id === to) continue;
        const free = travel.journey(from, to), around = travel.journey(from, to, (id) => id === middle.id);
        expect(around.minutes).toBeGreaterThanOrEqual(free.minutes);
      }
    }
  });
});

describe('refining the ground', () => {
  const map = placeMap(bogwater);
  const fresh = () => sheetOf(map, 'fenmire');
  const after = (worldMap: WorldMap | undefined) => sheetOf(map, 'fenmire', worldMap?.sheets?.fenmire);

  it('stores every centre at the first change, and nothing else moves after', () => {
    const sheet = fresh();
    const spot = sheet.cells.find(([q, r]) => !sheet.owner.has(cellKey(q, r)))!;
    const moved = moveTo(undefined, sheet, 'grey-water', spot);
    expect(moved?.v).toBe(1);
    expect(Object.keys(moved!.sheets!.fenmire!.centres!).sort()).toEqual(sheet.blobs.map((blob) => blob.id).sort());
    const next = after(moved);
    expect(next.byId.get('grey-water')!.centre).toEqual(spot);
    for (const blob of sheet.blobs) if (blob.id !== 'grey-water') expect(next.byId.get(blob.id)!.centre).toEqual(blob.centre);
  });

  it('makes a place bigger and smaller', () => {
    const sheet = fresh(), before = sheet.byId.get('the-fen')!.cells.length;
    const bigger = resize(undefined, sheet, 'the-fen', true);
    expect(after(bigger).byId.get('the-fen')!.cells.length).toBeGreaterThan(before);
    const smaller = resize(bigger, after(bigger), 'the-fen', false);
    expect(smaller!.sheets!.fenmire!.sizes!['the-fen']).toBeLessThan(bigger!.sheets!.fenmire!.sizes!['the-fen']!);
  });

  it('paints a cell, seven, or a whole patch, and back to the ground', () => {
    const sheet = fresh();
    const ground = sheet.cells.find(([q, r]) => !sheet.owner.has(cellKey(q, r)))!;
    const one = paint(undefined, sheet, ground, 'bogwater', 1);
    expect(after(one).owner.get(cellKey(...ground))!.id).toBe('bogwater');
    const seven = paint(undefined, sheet, ground, 'bogwater', 7);
    expect(Object.keys(seven!.sheets!.fenmire!.claims!).length).toBeLessThanOrEqual(7);
    const fill = paint(undefined, sheet, sheet.byId.get('the-fen')!.cells[1]!, '', 0);
    const filled = after(fill).byId.get('the-fen')!;
    expect(filled.cells).toEqual([filled.centre]);
  });

  it('lays and lifts road, and a road is quicker', () => {
    const sheet = fresh();
    let worldMap: WorldMap | undefined;
    for (const [q, r] of sheet.cells) worldMap = road(worldMap, sheet, [q, r], true);
    const paved = travelOf(atlasOf(map, worldMap!.sheets), undefined).journey('eel-traps', 'woeds-edge');
    expect(paved.minutes).toBeLessThan(travelOf(atlasOf(map), undefined).journey('eel-traps', 'woeds-edge').minutes);
    const lifted = road(worldMap, sheet, sheet.cells[0]!, false);
    expect(lifted!.sheets!.fenmire!.roads!.length).toBe(sheet.cells.length - 1);
  });

  it('rerolls keeping what a cell is worth, resets to nothing, and drops an empty map', () => {
    const worth = cellWorth(undefined, 'fenmire', 15);
    expect(reroll(worth, 'fenmire')!.sheets!.fenmire).toEqual({ seed: 1, cellMinutes: 15 });
    expect(resetSheet(worth, 'fenmire')).toBeUndefined();
    expect(isArranged(keepLayout(undefined, fresh()), 'fenmire')).toBe(true);
  });

  it('finds map data that points at nothing', () => {
    const kept = keepLayout(undefined, fresh());
    expect(staleMapData(map, kept)).toEqual([]);
    const moved = { ...bogwater, records: bogwater.records.map((record) => (record.id === 'grey-water' ? { ...record, parentId: 'the-fen' } : record)) };
    expect(staleMapData(placeMap(moved), kept)[0]!.text).toMatch(/no longer inside it: Grey Water/);
    expect(staleMapData(map, { sheets: { gone: { seed: 1 } } })[0]!.text).toMatch(/a place that is gone/);
  });
});

describe('colour and icons', () => {
  const map = placeMap(bogwater);
  it('colours cells as a look, and takes colour off again', () => {
    const sheet = sheetOf(map, 'fenmire');
    const coloured = colour(undefined, sheet, sheet.cells[0]!, 2, 7);
    const painted = sheetOf(map, 'fenmire', coloured!.sheets!.fenmire);
    expect(painted.paint.get(cellKey(...sheet.cells[0]!))).toBe(2);
    // A look, never a rule: the same journey takes the same time.
    expect(travelOf(atlasOf(map, coloured!.sheets), undefined).journey('eel-traps', 'bogwater').minutes).toBe(travelOf(atlasOf(map), undefined).journey('eel-traps', 'bogwater').minutes);
    const cleared = colour(coloured, painted, sheet.cells[0]!, null, 0);
    expect(Object.keys(cleared?.sheets?.fenmire?.paint ?? {}).length).toBeLessThan(Object.keys(coloured!.sheets!.fenmire!.paint!).length);
  });

  it("keeps a world's icon set, and a place's own icon reaches the map", () => {
    expect(iconSet(undefined, 'far')).toEqual({ v: 1, icons: 'far' });
    expect(iconSet({ v: 1, icons: 'far' }, 'old')).toBeUndefined();
    const own = { ...bogwater, records: bogwater.records.map((record) => (record.id === 'bogwater' ? { ...record, rules: { ...record.rules, icon: 'keep' } } : record)) };
    expect(placeMap(own).places.get('bogwater')!.icon).toBe('keep');
  });
});
