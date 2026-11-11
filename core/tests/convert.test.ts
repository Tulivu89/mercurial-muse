import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { carriedWords, checkWorld, eventsFromPlans, isModule, moduleToWorld, plansFromEvents, readLaunches, sameDays, withLaunch, withoutLaunch, worldToModule } from '../convert/index.js';
import { parseWorld } from '../records/index.js';
import { DEFAULT_CALENDAR, rulesFor, rulesetOf, standardRuleset } from '../rules/index.js';

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

  it('turns threads into thread records: the five questions as sections for the author, the kind and milestones as rules', () => {
    const source = (raw.threads as Loose[])[2]!;
    const record = world.records.find((entry) => entry.id === source.id)!;
    expect(record.kind).toBe('thread');
    expect(record.sections.map((section) => [section.title, section.reach, section.text])).toEqual(
      ['pressure', 'objective', 'opposition', 'cost', 'consequence'].map((question) => [question.charAt(0).toUpperCase() + question.slice(1), 'never', source[question]]),
    );
    // A milestone with no condition gets an empty list of them.
    expect(record.rules?.thread).toEqual({ kind: source.kind, milestones: (source.milestones as Loose[]).map((milestone) => ({ when: [], ...milestone })) });
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

describe('threads made in the Studio', () => {
  it('go out with their milestones, or with their next beat as the one milestone, or not at all', () => {
    const beat = (text: string) => [{ id: 'b', title: 'Next beat', reach: 'always', text }, { id: 'p', title: 'Pressure', reach: 'never', text: 'The tide is turning.' }];
    const made = parseWorld({
      format: 'studio-world/1', id: 'w', name: 'Low Tide',
      records: [
        { id: 'dock', kind: 'place', name: 'The dock' },
        { id: 'debt', kind: 'thread', name: 'The debt', sections: beat('Pay the harbourmaster before the tide.') },
        { id: 'feud', kind: 'thread', name: 'The feud', sections: beat(''), rules: { thread: { kind: 'reckoning', milestones: [{ id: 'm', text: 'Name who cut the nets.', when: [{ stateId: 'coin', atLeast: 3 }], experience: 10 }] } } },
        { id: 'idle', kind: 'thread', name: 'Nothing yet', sections: beat('') },
      ],
    });
    if (!made.ok) throw new Error(made.errors.join('\n'));
    const { module, notes } = worldToModule(made.world) as { module: Loose; notes: string[] };
    expect(module.threads.map((thread: Loose) => thread.id)).toEqual(['debt', 'feud']);
    expect(module.threads[0]).toMatchObject({ kind: 'custom', pressure: 'The tide is turning.', milestones: [{ id: 'next-beat', text: 'Pay the harbourmaster before the tide.', when: [], experience: 0 }] });
    expect(module.threads[1]).toMatchObject({ kind: 'reckoning', milestones: [{ id: 'm', text: 'Name who cut the nets.', experience: 10 }] });
    expect(notes).toContain('Nothing yet has no milestones or next beat, so it stays in the Studio.');
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

describe('one schedule model', () => {
  const imported = moduleToWorld(bogwater, 5);
  if (!imported.ok) throw new Error(imported.errors.join('\n'));
  const { world } = imported;
  const raw = bogwater as Loose;

  it('turns every day plan into events with a place and a condition, and back', () => {
    for (const person of raw.characters as Loose[]) {
      if (!person.schedule) continue;
      const events = eventsFromPlans(person.schedule);
      const back = plansFromEvents(events, DEFAULT_CALENDAR.dayNames)!;
      expect(sameDays(back, person.schedule), person.id).toBe(true);
      expect(world.records.find((record) => record.id === person.id)!.schedule).toEqual(events);
    }
    const cadfan = world.records.find((record) => record.id === 'cadfan')!.schedule!.Daily!;
    expect(cadfan.filter((event) => !event.when).map((event) => [event.startTime, event.endTime])).toEqual([[360, 720], [720, 1080], [1080, 1320], [1320, 360]]);
    expect(cadfan.find((event) => event.when?.weekday === 3)).toMatchObject({ startTime: 360, place: expect.any(String) });
  });

  it('sends a changed day out in place of the one the module came with', () => {
    const gethin = world.records.find((record) => record.id === 'gethin')!;
    const moved = { ...gethin, schedule: { Daily: gethin.schedule!.Daily!.map((event, index) => (index === 0 ? { ...event, place: 'landing-dock', text: 'Mending a net.' } : event)) } };
    const out = (worldToModule({ ...world, records: world.records.map((record) => (record.id === 'gethin' ? moved : record)) }).module.characters as Loose[]).find((person) => person.id === 'gethin')!;
    expect(out.schedule.plans[0]).toMatchObject({ id: 'day', rows: expect.arrayContaining([{ fromHour: 6, locationId: 'landing-dock', doing: 'Mending a net.' }]) });
    expect(out.schedule.rules).toEqual([{ planId: 'when-1', when: { weekday: 1 } }]);
  });

  it('lays a weekday\'s own events over the ordinary day', () => {
    const event = (id: string, startTime: number, place: string | undefined, text: string) => ({ id, startTime, endTime: startTime + 60, text, requiredIntimacy: 'none', sets: {}, rooms: {}, spots: {}, needs: {}, ...(place ? { place } : {}) });
    const plans = plansFromEvents({ Daily: [event('a', 360, 'bar', 'Opens up.'), event('b', 1320, 'room', 'Asleep.'), event('c', 600, undefined, 'Thinks of home.')], Monday: [event('d', 360, 'market', 'Buys fish.')] }, DEFAULT_CALENDAR.dayNames)!;
    expect(plans.plans.map((plan) => [plan.id, plan.rows.map((row) => `${row.fromHour} ${row.locationId}`)])).toEqual([['day', ['6 bar', '22 room']], ['monday', ['6 market', '22 room']]]);
    expect(plans.rules).toEqual([{ planId: 'monday', when: { weekday: 1 } }]);
    expect(plansFromEvents({ Daily: [event('c', 600, undefined, 'No place.')] }, DEFAULT_CALENDAR.dayNames)).toBeNull();
  });
});

describe('checks', () => {
  it('finds nothing wrong with Bogwater over forty days', () => {
    const imported = moduleToWorld(bogwater, 5);
    if (!imported.ok) throw new Error(imported.errors.join('\n'));
    expect(checkWorld(imported.world)).toEqual([]);
  });

  it('finds a crowd, a stop nowhere, a When with no condition, a route to nowhere and a rule pointing at nothing', () => {
    const event = (id: string, place: string) => ({ id, startTime: 360, endTime: 360, text: '', place });
    const made = parseWorld({
      format: 'studio-world/1', id: 'w', name: 'Low Tide',
      routes: [{ id: 'r1', from: 'bar', to: 'nowhere', distanceKm: 1 }],
      records: [
        { id: 'bar', kind: 'place', name: 'The Anchor' },
        { id: 'coast', kind: 'place', name: 'The coast', rules: { placeKind: 'region' } },
        ...['Ada', 'Bo', 'Cy', 'Di', 'Ed'].map((name) => ({ id: name.toLowerCase(), kind: 'character', name, schedule: { Daily: [event('e', 'bar')] } })),
        { id: 'fy', kind: 'character', name: 'Fy', schedule: { Daily: [event('e', 'gone'), event('f', 'coast')] }, rules: { states: { luck: 2 }, sells: ['ghost'] },
          sections: [{ id: 's', title: 'Secret', reach: 'when', text: 'She knows.' }] },
        { id: 'feud', kind: 'thread', name: 'The feud', rules: { thread: { milestones: [{ id: 'm', text: 'Settle it.', targetId: 'gone', fromDay: 5, byDay: 2, when: [{ stateId: 'nothing' }, { stateId: 'health', characterId: 'world' }] }] } } },
      ],
    });
    if (!made.ok) throw new Error(made.errors.join('\n'));
    const found = checkWorld(made.world).map((problem) => `${problem.where}: ${problem.text}`);
    expect(found).toEqual([
      'Fy: The section "Secret" is When, with no condition to wait on.',
      'Fy: Sets "luck", which it doesn\'t hold.',
      'Fy: Sells or carries something that is gone: "ghost".',
      'The feud: The milestone "Settle it." turns on something that is gone: "gone".',
      'The feud: The milestone "Settle it." would be missed before it could be reached.',
      'The feud: The milestone "Settle it." waits on a state that is gone: "nothing".',
      'The feud: The milestone "Settle it." waits on Health, which is not a world state.',
      'Low Tide: A route ends at a place that is gone: "nowhere".',
      'Fy: A stop on Daily is at a place that is gone: "gone".',
      'Fy: A stop on Daily is at The coast, a region, not somewhere to be.',
      'The Anchor: Holds 5 people at once on Sunday 06:00, day 1: Ada, Bo, Cy, Di, Ed. More than 4 is a crowd the narrator loses track of.',
    ]);
  });
});
