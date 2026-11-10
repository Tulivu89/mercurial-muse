import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { carriedWords, isModule, moduleToWorld, readLaunches, withLaunch, withoutLaunch, worldToModule } from '../convert/index.js';
import { parseWorld } from '../records/index.js';
import { rulesFor, rulesetOf, standardRuleset } from '../rules/index.js';

const bogwater: unknown = JSON.parse(readFileSync(new URL('../../adventure/modules/abernys-bogwater.json', import.meta.url), 'utf8'));
type Loose = Record<string, any>;

// The adventure's own tests hold the round trip to the same parsed module, and run its whole
// suite on the result. These say what the world looks like in between.
describe('an adventure module as a Studio world', () => {
  const imported = moduleToWorld(bogwater, 5);
  if (!imported.ok) throw new Error(imported.errors.join('\n'));
  const { world } = imported;
  const raw = bogwater as Loose;

  it('gives every record a home', () => {
    expect(isModule(bogwater)).toBe(true);
    expect(world.name).toBe('Abernys: Bogwater');
    expect(world.premise).toBe(raw.world.identity.description);
    const count = (kind: string) => world.records.filter((record) => record.kind === kind).length;
    expect([count('place'), count('character'), count('persona'), count('item'), count('lore'), count('scenario')]).toEqual([38, 16, 1, 4, 4, 1]);
    expect(count('group')).toBe(raw.world.species.length + raw.world.factions.length + raw.world.societies.length + raw.world.families.length);
    expect(world.records.find((record) => record.kind === 'persona')?.id).toBe(raw.scenario.playerCharacterId);
  });

  it('turns a dossier into a line and sections, and numbers into rules', () => {
    const source = (raw.characters as Loose[]).find((person) => person.tier && person.role && person.schedule && person.speciesId)!;
    const record = world.records.find((entry) => entry.id === source.id)!;
    expect(record.line).toBe(source.role);
    expect(record.sections.map((section) => [section.title, section.reach, section.text])).toEqual([
      ['Appearance', 'here', source.appearance], ['Personality', 'here', source.personality], ['Speech', 'here', source.speech], ['Background', 'named', source.description],
    ]);
    expect(record.groupIds[0]).toBe(source.speciesId);
    expect(record.rules?.tier).toBe(source.tier);
    expect(rulesFor(world, record)?.tier).toEqual({ value: source.tier, source: { from: 'record' } });
    // What has no place yet is carried, and the Studio can say what it is.
    expect(record.carried).toMatchObject({ schedule: source.schedule, homeLocationId: source.homeLocationId });
    expect(carriedWords(world, record).join(' ')).toMatch(/^Lives at .+\. .*Keeps a day of \d+ stops/);
  });

  it('keeps the module\'s rules as the world\'s own, over the standard', () => {
    expect(world.rules?.states.map((state) => state.id)).toEqual((raw.ruleset.states as Loose[]).map((state) => state.id));
    expect(world.rules?.actions).toHaveLength(raw.ruleset.actions.length);
    expect(rulesetOf(world).states.length).toBe(standardRuleset().states.length + raw.ruleset.states.length);
    // A module's good with a standard good's id replaces it.
    const goodIds = new Set([...standardRuleset().goods.map((good) => good.id), ...(raw.ruleset.goods as Loose[]).map((good) => good.id)]);
    expect(rulesetOf(world).goods.map((good) => good.id).sort()).toEqual([...goodIds].sort());
  });

  it('carries what an author changes back out', () => {
    const person = world.records.find((record) => record.kind === 'character')!;
    const edited = { ...world, records: world.records.map((record) => (record.id === person.id ? { ...record, name: 'Someone else', rules: { ...record.rules, tier: 'nemesis' as const } } : record)) };
    const out = (worldToModule(edited).module.characters as Loose[]).find((entry) => entry.id === person.id)!;
    expect(out).toMatchObject({ name: 'Someone else', tier: 'nemesis' });
  });

  it('refuses what is not a module, or one with a ruleset all its own', () => {
    expect(moduleToWorld({ format: 'studio-world/1' }, 1)).toEqual({ ok: false, errors: ['This is not an adventure module.'] });
    const alone = moduleToWorld({ ...raw, ruleset: { ...raw.ruleset, extends: undefined } }, 1);
    expect(alone.ok).toBe(false);
  });
});

describe('a Studio world as a module', () => {
  it('writes a group\'s defaults onto each member, and an item with a worth into the goods', () => {
    const made = parseWorld({
      format: 'studio-world/1', id: 'w', name: 'Low Tide', premise: 'A harbour town.',
      records: [
        { id: 'dock', kind: 'place', name: 'The dock', sections: [{ id: 'a', title: 'Entry', reach: 'here', text: 'Where the boats tie up.' }] },
        { id: 'reds', kind: 'group', name: 'Salamanders', groupKind: 'species', rules: { members: { tier: 'rival', maxima: { health: 7 } } } },
        { id: 'vess', kind: 'character', name: 'Vess', line: 'A dock guard.', groupIds: ['reds'], rules: { maxima: { strain: 2 }, sells: ['gaff'] } },
        { id: 'gaff', kind: 'item', name: 'A boat hook', rules: { good: { kind: 'weapon', worth: 1, harm: 1 } } },
        { id: 'sam', kind: 'persona', name: 'Sam' },
      ],
    });
    if (!made.ok) throw new Error(made.errors.join('\n'));
    const { module, notes } = worldToModule(made.world) as { module: Loose; notes: string[] };
    expect(module.characters[0]).toMatchObject({ id: 'vess', role: 'A dock guard.', speciesId: 'reds', tier: 'rival', maxima: { health: 7, strain: 2 }, sells: ['gaff'] });
    expect(module.world.places[0]).toMatchObject({ id: 'dock', description: 'Where the boats tie up.', kind: 'other', parentLocationId: null });
    expect(module.ruleset.goods).toEqual([expect.objectContaining({ id: 'gaff', name: 'a boat hook', kind: 'weapon', worth: 1, harm: 1 })]);
    expect(module.scenario).toMatchObject({ startPlaceId: 'dock', playerCharacterId: 'sam', startAt: 480 });
    expect(module.world.identity.description).toBe('A harbour town.');
    expect(notes).toEqual(['Play starts at The dock, the first place in the world.']);
  });
});

describe('the hand-off to the adventure', () => {
  it('keeps the newest few, one for each world', () => {
    const entry = (id: string, at: number) => ({ id, name: id, at, module: {} });
    let list = readLaunches(null);
    for (const [index, id] of ['a', 'b', 'a', 'c'].entries()) list = withLaunch(list, entry(id, index), 2);
    expect(list.map((launch) => [launch.id, launch.at])).toEqual([['c', 3], ['a', 2]]);
    expect(readLaunches(JSON.stringify(list))).toEqual(list);
    expect(readLaunches('{"not":"a list"}')).toEqual([]);
    expect(readLaunches('nonsense')).toEqual([]);
    expect(withoutLaunch(list, 'c').map((launch) => launch.id)).toEqual(['a']);
  });
});
