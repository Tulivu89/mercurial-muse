// Lorebooks in every dialect the standards review found, and a world out as World Info (X2).
import { describe, expect, it } from 'vitest';
import { contextFor, importLorebook, isLorebook, newRecord, newWorld, putRecord, worldInfoFrom, type World } from '../records/index.js';

function ids() { let n = 0; return () => `id-${++n}`; }
const empty = (): World => newWorld('w', 'Imported', 1);
const lore = (world: World) => world.records.filter((record) => record.kind === 'lore');
const sent = (world: World, recentText: string) => contextFor(world, { hereIds: [], recentText, conditionIds: [] }).blocks.flatMap((block) => block.parts.map((part) => part.text));

describe('lorebooks in', () => {
  it('reads NovelAI\'s, with forced entries always in and categories as tags', () => {
    const book = {
      lorebookVersion: 6,
      entries: [
        { text: 'The Imp\nType: Character\nSmall, quick, lavender.', displayName: 'The Imp', keys: ['Imp', 'imp'], enabled: true, forceActivation: false, category: 'c1', contextConfig: { budgetPriority: 400 }, searchRange: 1000 },
        { text: 'The tower leans east.', displayName: 'Tower', keys: ['tower'], enabled: true, forceActivation: true, category: '' },
        { text: 'Unused.', displayName: 'Off', keys: ['off'], enabled: false, forceActivation: false },
      ],
      settings: { orderByKeyLocations: false }, categories: [{ id: 'c1', name: 'People' }], order: [],
    };
    expect(isLorebook(book)).toBe(true);
    const read = importLorebook(empty(), book, ids(), 5);
    if (!read.ok) throw new Error(read.errors.join(' '));
    expect(read.dialect).toBe('novelai');
    expect(read.count).toBe(3);
    const [imp, tower, off] = lore(read.world);
    expect(imp).toMatchObject({ name: 'The Imp', keys: ['Imp', 'imp'], tags: ['People'] });
    expect(imp!.sections[0]).toMatchObject({ reach: 'named', text: 'The Imp\nType: Character\nSmall, quick, lavender.' });
    expect(tower!.sections[0]!.reach).toBe('always');
    expect(off!.sections[0]!.reach).toBe('never');
    expect(sent(read.world, 'The imp grins.')).toContain(imp!.sections[0]!.text);
    expect(sent(read.world, 'Hello.')).toContain('The tower leans east.');
  });

  it('reads SillyTavern\'s World Info, with second keys and its settings noted', () => {
    const book = { entries: {
      0: { uid: 0, key: ['Mara'], keysecondary: ['river'], selective: true, selectiveLogic: 0, comment: 'Mara and the river', content: 'Mara learned the river young.', constant: false, disable: false, order: 100, probability: 100, sticky: 3 },
      1: { uid: 1, key: ['harbour'], keysecondary: [], comment: 'Harbour', content: 'The harbour freezes.', constant: true, disable: false },
    } };
    const read = importLorebook(empty(), book, ids(), 5);
    if (!read.ok) throw new Error(read.errors.join(' '));
    expect(read.dialect).toBe('sillytavern');
    const [mara, harbour] = lore(read.world);
    expect(mara!.sections[0]!.also).toEqual(['river']);
    expect(harbour!.sections[0]!.reach).toBe('always');
    expect(read.notes.join(' ')).toContain('sticky');
  });

  it('reads a V3 lorebook, Agnai\'s and RisuAI\'s', () => {
    const v3 = importLorebook(empty(), { spec: 'lorebook_v3', data: { name: 'Docks', extensions: {}, entries: [{ keys: ['pier'], content: '@@depth 2\nThe pier is rotten.', enabled: true, insertion_order: 1, use_regex: false, extensions: {} }] } }, ids(), 5);
    if (!v3.ok) throw new Error('v3');
    expect(lore(v3.world)[0]).toMatchObject({ tags: ['Docks'], sections: [{ text: 'The pier is rotten.' }] });
    const agnai = importLorebook(empty(), { kind: 'memory', name: 'Notes', entries: [{ name: 'Gate', entry: 'The gate sticks.', keywords: ['gate'], priority: 100, weight: 100, enabled: true }] }, ids(), 5);
    expect(agnai.ok && lore(agnai.world)[0]!.keys).toEqual(['gate']);
    const risu = importLorebook(empty(), { type: 'risu', ver: 1, data: [{ key: 'bell, tower', secondkey: '', comment: 'Bell', content: 'The bell is cracked.', mode: 'normal', alwaysActive: false, selective: false }] }, ids(), 5);
    expect(risu.ok && lore(risu.world)[0]!.keys).toEqual(['bell', 'tower']);
  });

  it('says plainly when a file is not one', () => {
    expect(isLorebook({ hello: 'world' })).toBe(false);
    expect(importLorebook(empty(), { entries: [] }, ids(), 5)).toMatchObject({ ok: false });
  });
});

describe('a world out as World Info', () => {
  it('writes lore and people under their names, with what a scene would send and never what is kept back', () => {
    const next = ids();
    let w = newWorld('w', 'Low Tide', 1);
    w = putRecord(w, { ...newRecord('character', 'ada', 'Ada Moss', next), keys: ['Ada'], line: 'The voice of KXRT.', sections: [
      { id: 's1', title: 'Look', reach: 'here', keys: [], when: null, text: 'Broad shoulders.' },
      { id: 's2', title: 'Notes', reach: 'never', keys: [], when: null, text: 'Secret.' },
    ] }, 2);
    w = putRecord(w, { ...newRecord('lore', 'curfew', 'The curfew', next), sections: [{ id: 'l1', title: 'Entry', reach: 'always', keys: [], when: null, text: 'Nobody is out after two.' }] }, 2);
    const out = worldInfoFrom(w);
    const entries = Object.values(out.entries);
    expect(entries).toHaveLength(2);
    const ada = entries.find((entry) => entry.comment === 'Ada Moss')!;
    expect(ada.key).toEqual(['Ada Moss', 'Ada']);
    expect(ada.content).toBe('Ada Moss\nThe voice of KXRT.\nLook: Broad shoulders.');
    expect(ada.constant).toBe(false);
    const curfew = entries.find((entry) => entry.comment === 'The curfew')!;
    expect(curfew).toMatchObject({ constant: true, content: 'Nobody is out after two.' });
    // And back in: the file reads as SillyTavern's.
    const back = importLorebook(empty(), JSON.parse(JSON.stringify(out)), ids(), 5);
    expect(back.ok && back.dialect).toBe('sillytavern');
    expect(back.ok && back.count).toBe(2);
  });
});
