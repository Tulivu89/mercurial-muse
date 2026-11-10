import { describe, expect, it } from 'vitest';
import bogwaterRaw from '../modules/abernys-bogwater.json';
import portCovenantRaw from '../modules/abernys-port-covenant.json';
import { moduleToWorld, worldToModule } from '../../core/convert';
import { parseWorld } from '../../core/records';
import { rulesFor, rulesetOf } from '../../core/rules';
import { loadModule } from '../src/engine';

// A module into a Studio world and back out. The whole suite also runs against the round-tripped
// modules (vitest.roundtrip.config.ts); this says exactly what comes back.
describe.each([['Bogwater', bogwaterRaw as unknown], ['Port Covenant', portCovenantRaw as unknown]])('%s through the Studio', (_name, raw) => {
  const original = loadModule(raw);
  const imported = moduleToWorld(raw, 1);

  it('opens as a world, and comes back as the same module', () => {
    expect(original.ok).toBe(true);
    expect(imported.ok).toBe(true);
    if (!imported.ok || !original.ok) return;
    const back = loadModule(worldToModule(imported.world).module);
    if (!back.ok) throw new Error(back.errors.join('\n'));
    expect(back.module).toEqual(original.module);
  });

  it('survives being saved as a world file between the two', () => {
    if (!imported.ok || !original.ok) return;
    const file = parseWorld(JSON.parse(JSON.stringify(imported.world)));
    if (!file.ok) throw new Error(file.errors.join('\n'));
    const back = loadModule(worldToModule(file.world).module);
    expect(back.ok && back.module).toEqual(original.module);
  });

  it('reads in the Studio as the engine plays it', () => {
    if (!imported.ok || !original.ok) return;
    const { world } = imported;
    const module = original.module;
    expect(rulesetOf(world).states.map((state) => state.id)).toEqual(module.ruleset.states.map((state) => state.id));
    for (const person of module.characters) {
      const record = world.records.find((entry) => entry.id === person.id)!;
      const reading = rulesFor(world, record)!;
      expect(record.kind).toBe(person.id === module.scenario.playerCharacterId ? 'persona' : 'character');
      expect(reading.tier?.value ?? undefined).toBe(person.tier);
      // The Studio's most for Health is the engine's.
      const health = reading.states.find((state) => state.def.id === 'health')!;
      const tierMax = person.tier ? module.ruleset.tiers?.[person.tier]?.maxima.health : undefined;
      expect(health.max.value).toBe(person.maxima.health ?? person.gang ?? tierMax ?? 8);
    }
  });
});

describe('a world made in the Studio', () => {
  it('plays with nothing but a place in it', () => {
    const made = parseWorld({ format: 'studio-world/1', id: 'w', name: 'Low Tide', records: [{ id: 'dock', kind: 'place', name: 'The dock' }, { id: 'vess', kind: 'character', name: 'Vess', rules: { tier: 'rival' } }] });
    if (!made.ok) throw new Error(made.errors.join('\n'));
    const { module, notes } = worldToModule(made.world);
    const loaded = loadModule(module);
    if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
    expect(loaded.module.scenario).toMatchObject({ startPlaceId: 'dock', playerCharacterId: 'the-player' });
    expect(loaded.module.characters.find((person) => person.id === 'vess')?.tier).toBe('rival');
    expect(notes.join(' ')).toContain('no persona');
  });
});
