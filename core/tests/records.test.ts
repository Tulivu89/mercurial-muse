import { describe, expect, it } from 'vitest';
import {
  WORLD_FORMAT, ancestors, contextFor, contextText, importCharacterCard, mentions, newRecord, newWorld, parseWorld, placeTree,
  putRecord, removeRecord, wouldLoop, type StoryRecord, type World,
} from '../records/index.js';

function counter() {
  let n = 0;
  return () => `id-${++n}`;
}

function sample() {
  const ids = counter();
  let world = newWorld('w', 'Low Tide', 1);
  world = { ...world, premise: 'A harbour town after midnight.', conditions: [{ id: 'close', label: 'Close friends' }] };
  const town: StoryRecord = { ...newRecord('place', 'town', 'Low Tide', ids), line: 'A harbour town.' };
  const street: StoryRecord = { ...newRecord('place', 'street', 'Harbour Street', ids), parentId: 'town', line: 'The road along the water.' };
  const studio: StoryRecord = { ...newRecord('place', 'studio', 'KXRT studio', ids), parentId: 'street', line: 'A radio station over a bait shop.' };
  const booth: StoryRecord = { ...newRecord('place', 'booth', 'Booth B', ids), parentId: 'studio', line: 'The night booth.' };
  booth.sections = booth.sections.map((section) => ({ ...section, text: section.title === 'Entry' ? 'One desk, two mics, a red ON AIR light.' : 'Rain on the glass.' }));
  studio.sections = studio.sections.map((section) => ({ ...section, text: section.title === 'Entry' ? 'KXRT runs all night on one engineer.' : '' }));
  const radio: StoryRecord = { ...newRecord('group', 'radio', 'Night radio', ids), line: 'The people who keep KXRT on air.' };
  const ada: StoryRecord = { ...newRecord('character', 'ada', 'Ada Moss', ids), keys: ['Ada'], line: 'The voice of KXRT after midnight.', groupIds: ['radio'] };
  ada.sections = [
    { id: 's1', title: 'Appearance', reach: 'here', keys: [], when: null, text: 'Forty, broad in the shoulders.' },
    { id: 's2', title: 'The ferry song', reach: 'named', keys: ['ferry'], when: null, text: 'She plays it for the truckers.' },
    { id: 's3', title: 'Why she left the city', reach: 'when', keys: [], when: 'close', text: 'She walked out of a morning show.' },
    { id: 's4', title: 'Notes', reach: 'never', keys: [], when: null, text: 'Make her older?' },
  ];
  ada.sets = [{ id: 'outfits', title: 'Outfits', reach: 'here', active: 'm2', members: [{ id: 'm1', name: 'Day', text: 'A cardigan.', lock: null }, { id: 'm2', name: 'On air', text: 'Headphones round her neck.', lock: null }] }];
  const sol: StoryRecord = { ...newRecord('character', 'sol', 'Sol Brannigan', ids), keys: ['Sol'], line: 'The station engineer.' };
  sol.sections = sol.sections.map((section) => ({ ...section, text: section.title === 'Appearance' ? 'Tall, always on a ladder.' : '' }));
  for (const record of [town, street, studio, booth, radio, ada, sol]) world = putRecord(world, record, 2);
  return world;
}

const names = (world: World, situation: Parameters<typeof contextFor>[1]) =>
  Object.fromEntries(contextFor(world, situation).blocks.map((block) => [block.name, block.parts.map((part) => part.title)]));

describe('a world file', () => {
  it('round-trips and refuses what is not one', () => {
    const world = sample();
    const read = parseWorld(JSON.parse(JSON.stringify(world)));
    expect(read.ok).toBe(true);
    if (read.ok) expect(read.world).toEqual(world);
    expect(parseWorld({ format: 'nope' })).toEqual({ ok: false, errors: ['This is not a world file from the Studio.'] });
    expect(world.format).toBe(WORLD_FORMAT);
  });

  it('catches a parent or condition that is not in the world', () => {
    const world = sample();
    const broken = { ...world, records: world.records.map((record) => (record.id === 'booth' ? { ...record, parentId: 'mars' } : record)) };
    const read = parseWorld(JSON.parse(JSON.stringify(broken)));
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.errors.join(' ')).toContain('"mars" is not in this world');
  });
});

describe('places', () => {
  it('nest, list in reading order, and refuse a loop', () => {
    const world = sample();
    expect(ancestors(world, 'booth').map((place) => place.id)).toEqual(['studio', 'street', 'town']);
    expect(placeTree(world).map(({ record, depth }) => `${depth}:${record.id}`)).toEqual(['0:town', '1:street', '2:studio', '3:booth']);
    expect(wouldLoop(world, 'street', 'booth')).toBe(true);
    expect(wouldLoop(world, 'booth', 'town')).toBe(false);
  });

  it('move up a level when the place they are in goes', () => {
    const world = removeRecord(sample(), 'studio', 3);
    expect(world.records.find((record) => record.id === 'booth')?.parentId).toBe('street');
  });
});

describe('context by reach', () => {
  it('sends Here sections for who is present, the place and its parent, and lines further out', () => {
    const got = names(sample(), { hereIds: ['booth', 'ada'], recentText: '', conditionIds: [] });
    expect(got['Booth B']).toEqual(['Line', 'Entry', 'Atmosphere']);
    expect(got['KXRT studio']).toEqual(['Line', 'Entry']);
    expect(got['Harbour Street']).toEqual(['Line']);
    expect(got['Low Tide']).toEqual(['Line']);
    expect(got['Ada Moss']).toEqual(['Line', 'Appearance', 'Outfits: On air']);
    expect(got['Night radio']).toEqual(['Line']);
    expect(got['Sol Brannigan']).toBeUndefined();
  });

  it('brings Named sections in by their own keys, and an absent character as a line', () => {
    const got = names(sample(), { hereIds: ['ada'], recentText: 'Play the ferry song. Is Sol in?', conditionIds: [] });
    expect(got['Ada Moss']).toContain('The ferry song');
    expect(got['Sol Brannigan']).toEqual(['Line']);
  });

  it('holds When sections until their condition does, and never sends Never', () => {
    const world = sample();
    expect(names(world, { hereIds: ['ada'], recentText: '', conditionIds: [] })['Ada Moss']).not.toContain('Why she left the city');
    const close = names(world, { hereIds: ['ada'], recentText: '', conditionIds: ['close'] })['Ada Moss'];
    expect(close).toContain('Why she left the city');
    expect(close).not.toContain('Notes');
  });

  it('starts with the premise and reads as text', () => {
    const answer = contextFor(sample(), { hereIds: ['ada'], recentText: '', conditionIds: [] });
    expect(answer.blocks[0]).toMatchObject({ kind: 'world', why: 'always' });
    expect(contextText(answer)).toContain('[Ada Moss]\nThe voice of KXRT after midnight.\nAppearance: Forty, broad in the shoulders.');
    expect(answer.tokens).toBeGreaterThan(0);
  });

  it('knows a person by their first name alone', () => {
    const got = names(sample(), { hereIds: [], recentText: 'Has anyone seen Sol tonight? Brannigan owes me.', conditionIds: [] });
    expect(got['Sol Brannigan']).toEqual(['Line']);
    const world = sample();
    const ada = world.records.find((record) => record.id === 'ada')!;
    const plain = putRecord(world, { ...ada, keys: [], sections: [{ id: 'bg', title: 'Background', reach: 'named', keys: [], when: null, text: 'She left a morning show.' }] }, 3);
    expect(names(plain, { hereIds: ['ada'], recentText: 'So, Ada, why did you leave?', conditionIds: [] })['Ada Moss']).toContain('Background');
  });

  it('matches whole words in any case', () => {
    expect(mentions('ask ADA about it', ['Ada'])).toBe(true);
    expect(mentions('Adalind came by', ['Ada'])).toBe(false);
    expect(mentions('Zoë said so', ['Zoë'])).toBe(true);
  });
});

describe('CharacterRoom cards', () => {
  const card = {
    cardType: 'contact', format: 'AnotherRoom @ Triplis @ 1.0.2', name: 'Errata', alias: 'Err', description: 'An ink dragon who reads over your shoulder.',
    pronouns: 'she/her', species: 'Inkwyrm', tags: 'dragon, goth', persona: 'Deadpan and unhurried.', appearance: 'Tall and skinny.',
    greeting: '*I hold out a hand.* Give it here.', greetingEmotion: 'bored',
    exampleMessages: [{ name: 'Pretty', userName: 'wren', style: 'roleplay', messages: [{ isContact: false, text: 'hi', emotion: 'neutral' }, { isContact: true, text: 'Pretty. Heard it.', emotion: 'bored' }] }],
    brains: [{ name: 'Wardrobe', content: 'Active: a black tee.' }],
    brainsConditional: [
      { name: 'The hoard', content: 'First drafts.', keys: ['draft'], requiredIntimacy: 'none' },
      { name: 'Trust', content: 'Ink on you.', keys: [], requiredIntimacy: 'close' },
    ],
    schedule: { Daily: [{ id: 'x', startTime: 0, endTime: 60, text: 'Asleep', requiredIntimacy: 'none' }] },
  };

  it('become a character with sections by reach, a species group and a bond condition', () => {
    const imported = importCharacterCard(newWorld('w', 'Inkwyrm', 1), card, counter(), 5);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    const { world, recordId, notes } = imported.result;
    const errata = world.records.find((record) => record.id === recordId)!;
    expect(errata.line).toBe('An ink dragon who reads over your shoulder.');
    expect(errata.keys).toEqual(['Err']);
    expect(errata.sections.map((section) => `${section.title}:${section.reach}`)).toEqual(['Personality:here', 'Appearance:here', 'Wardrobe:here', 'The hoard:named', 'Trust:when']);
    expect(errata.sections[4]).toMatchObject({ when: 'bond-close' });
    expect(world.conditions).toEqual([{ id: 'bond-close', label: 'Close or closer' }]);
    expect(errata.greetings[0]).toMatchObject({ text: '*I hold out a hand.* Give it here.', emotion: 'bored' });
    expect(errata.examples[0].messages[1]).toEqual({ fromCharacter: true, text: 'Pretty. Heard it.', emotion: 'bored' });
    const species = world.records.find((record) => record.kind === 'group')!;
    expect(species).toMatchObject({ name: 'Inkwyrm', groupKind: 'species' });
    expect(errata.groupIds).toEqual([species.id]);
    expect(notes.join(' ')).toContain('schedule');
    expect(parseWorld(JSON.parse(JSON.stringify(world))).ok).toBe(true);
  });

  it('share a species group, and refuse what is not a card', () => {
    const first = importCharacterCard(newWorld('w', 'Inkwyrm', 1), card, counter(), 5);
    if (!first.ok) throw new Error('first import failed');
    const second = importCharacterCard(first.result.world, { ...card, name: 'Blot' }, () => `b-${Math.random()}`, 6);
    if (!second.ok) throw new Error('second import failed');
    expect(second.result.world.records.filter((record) => record.kind === 'group')).toHaveLength(1);
    expect(importCharacterCard(newWorld('w', 'x', 1), { name: 'x' }, counter(), 1)).toEqual({ ok: false, errors: ['This is not a CharacterRoom contact card.'] });
  });
});
