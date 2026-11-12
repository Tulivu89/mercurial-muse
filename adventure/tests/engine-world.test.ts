import { describe, expect, it } from 'vitest';
import { atlasOf, destinationsFrom, exitsFrom, findPath, loadModule, type StateValues } from '../src/engine';
import { abernys, abernysRaw } from './abernys';

const module = abernys();
const player = 'traveller';
const unsigned: StateValues = {};
const signed: StateValues = { traveller: { 'signed-covenant': 1 } };
const kinds = (result: ReturnType<typeof findPath>) => (result.ok ? result.legs.map((leg) => leg.kind) : []);

describe('the Abernys module', () => {
  it('loads without errors', () => {
    const result = loadModule(abernysRaw);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it('reads a module from before maps, and drops its routes', () => {
    const old = structuredClone(abernysRaw) as Record<string, any>;
    old.world.routes = [{ id: 'r', from: 'pc-landward-gate', to: 'caerwyn', distanceKm: 64 }];
    old.ruleset.travel = { walkKph: 4, tiers: [] };
    const result = loadModule(old);
    expect(result.ok).toBe(true);
    expect(result.ok && 'routes' in result.module.world).toBe(false);
  });
});

describe('the atlas', () => {
  it('measures depth from the top place', () => {
    const { depth } = atlasOf(module);
    expect(depth.get('abernys')).toBe(0);
    expect(depth.get('port-covenant')).toBe(2);
    expect(depth.get('pc-harbour')).toBe(3);
  });

  it("prices a step inside by the holding place's level, and a crossing by the map", () => {
    // Port Covenant is a settlement, and this module makes stepping inside one take ten minutes.
    const fromTown = exitsFrom(module, signed, player, 'port-covenant');
    expect(fromTown.find((exit) => exit.place.id === 'pc-harbour')?.edge.minutes).toBe(10);
    const toCaerwyn = findPath(module, signed, player, 'pc-landward-gate', 'caerwyn');
    expect(kinds(toCaerwyn)).toEqual(['out', 'across']);
    const across = toCaerwyn.ok ? toCaerwyn.legs[1]! : null;
    expect(across?.kind === 'across' && across.sheet).toBe('abernys');
    expect(toCaerwyn.ok && toCaerwyn.minutes).toBe(Math.round(toCaerwyn.ok ? toCaerwyn.legs.reduce((sum, leg) => sum + leg.minutes, 0) : 0));
  });

  it('never stops in an area', () => {
    const fromGate = exitsFrom(module, signed, player, 'pc-landward-gate').map((exit) => exit.place.id);
    expect(fromGate).not.toContain('nospier-point');
    expect(fromGate).toContain('port-covenant');
    const result = findPath(module, signed, player, 'pc-landward-gate', 'fenmire');
    expect(result.ok).toBe(false);
  });
});

describe('crossing rules', () => {
  it("keep an unsigned player out of the port, with the place's own reason", () => {
    expect(findPath(module, unsigned, player, 'pc-landward-gate', 'pc-harbour')).toEqual({ ok: false, reason: 'No one enters the port without signing the Covenant.' });
  });

  it('let a signed player in: across to the town, then in', () => {
    const result = findPath(module, signed, player, 'pc-landward-gate', 'pc-harbour');
    expect(kinds(result)).toEqual(['across', 'in']);
  });

  it('apply only on the way in', () => {
    expect(findPath(module, unsigned, player, 'pc-harbour', 'pc-landward-gate').ok).toBe(true);
    expect(findPath(module, unsigned, player, 'pc-harbour', 'pc-registry').ok).toBe(true);
  });

  it('show up on the list of ways out', () => {
    const gate = exitsFrom(module, unsigned, player, 'pc-landward-gate').find((exit) => exit.place.id === 'port-covenant');
    expect(gate?.blocked).toBe('No one enters the port without signing the Covenant.');
  });
});

describe('journeys', () => {
  it('climb, cross and come down, along the old roads', () => {
    const result = findPath(module, signed, player, 'pc-harbour', 'bogwater');
    expect(kinds(result)).toEqual(['out', 'out', 'across', 'in']);
    const across = result.ok ? result.legs[2]! : null;
    expect(across?.kind === 'across' && across.onRoad).toBeGreaterThan(0);
  });

  it('list every destination except areas and the current place', () => {
    const ids = destinationsFrom(module, signed, player, 'pc-landward-gate').map((entry) => entry.place.id);
    expect(ids).toContain('caerwyn');
    expect(ids).not.toContain('pc-landward-gate');
    expect(ids).not.toContain('abernys');
  });

  it("join a world's top places through the world's own sheet", () => {
    const island = loadModule({
      format: 'praxis-module/1', id: 'x', name: 'x', version: '1', source: { kind: 'local' },
      world: { id: 'w', name: 'w', places: [{ id: 'a', name: 'A', kind: 'town' }, { id: 'b', name: 'B', kind: 'town' }] },
      characters: [{ id: 'p', name: 'P' }],
      scenario: { title: 't', startPlaceId: 'a', playerCharacterId: 'p' },
    });
    if (!island.ok) throw new Error(island.errors.join('\n'));
    const result = findPath(island.module, {}, 'p', 'a', 'b');
    expect(kinds(result)).toEqual(['across']);
  });
});
