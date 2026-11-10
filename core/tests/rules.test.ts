import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newRecord, newWorld, parseWorld, putRecord, type StoryRecord, type World } from '../records/index.js';
import {
  EXTRA_STATES, STANDARD_RULESET_ID, changeRules, changedCount, clearRule, contextWithRules, goodsOf, readRuleset, ruledText, rulesFor, rulesetOf,
  setRule, sourceWords, standardRuleset, stateOrigin, stateSentences, summaryOf, worthWords, type RulesReading, type WorldRules,
} from '../rules/index.js';

function counter() {
  let n = 0;
  return () => `id-${++n}`;
}

function sample(): World {
  const ids = counter();
  let world = newWorld('w', 'Low Tide', 1);
  const dock: StoryRecord = { ...newRecord('place', 'dock', 'The dock', ids), line: 'Where the boats tie up.' };
  const reds: StoryRecord = { ...newRecord('group', 'reds', 'Salamanders', ids), groupKind: 'species', line: 'Red-skinned fen folk.' };
  const pact: StoryRecord = { ...newRecord('group', 'pact', 'The Pact', ids), groupKind: 'faction', line: 'The port\'s lenders.' };
  const vess: StoryRecord = { ...newRecord('character', 'vess', 'Vess', ids), pronouns: 'she/her', line: 'A dock guard.' };
  const lock: StoryRecord = { ...newRecord('item', 'lock', 'The strongbox', ids), line: 'An iron box under the counter.' };
  const you: StoryRecord = { ...newRecord('persona', 'you', 'Sam', ids), line: 'A runaway.' };
  const tale: StoryRecord = { ...newRecord('lore', 'tale', 'The eel run', ids), line: 'Every autumn.' };
  for (const record of [dock, reds, pact, vess, lock, you, tale]) world = putRecord(world, record, 2);
  return world;
}

const put = (world: World, id: string, patch: Partial<StoryRecord>): World => putRecord(world, { ...world.records.find((record) => record.id === id)!, ...patch }, 3);
const read = (world: World, id: string): RulesReading => rulesFor(world, world.records.find((record) => record.id === id)!)!;
const state = (reading: RulesReading, id: string) => reading.states.find((entry) => entry.def.id === id)!;
const deed = (reading: RulesReading, approach: string) => reading.deeds.find((entry) => entry.approach.id === approach)!;

describe('rulesFor on defaults', () => {
  it('makes a person playable with nothing authored', () => {
    const vess = read(sample(), 'vess');
    expect(vess.subject).toBe('person');
    expect(vess.tier).toEqual({ value: null, source: { from: 'standard' } });
    expect(vess.deeds.map((entry) => [entry.approach.name, entry.difficulty.value, entry.acts.map((act) => act.label)])).toEqual([
      ['Force', 2, ['Hurt or overpower', 'Persuade, charm, bluff or intimidate']],
      ['Finesse', 2, ['Hurt or overpower', 'Lift, slip past or plant something']],
      ['Focus', 2, ['Read them, find the pressure point']],
      ['Flair', 2, ['Persuade, charm, bluff or intimidate']],
    ]);
    expect(deed(vess, 'force').difficulty.source).toEqual({ from: 'standard' });
    expect(deed(vess, 'force').acts.map((act) => act.claim)).toEqual(['owner', 'secondary']);
    expect(deed(vess, 'finesse').acts.at(-1)).toMatchObject({ effect: 'deed', stateId: null });
    expect(deed(vess, 'focus').acts[0]).toMatchObject({ effect: 'builds', stateId: 'leverage' });
    // Health reads in other people's words, with her pronouns, and is silent at rest.
    expect(state(vess, 'health')).toMatchObject({ value: { value: 8, source: { from: 'standard' } }, max: { value: 8 }, sentence: 'Vess is unhurt.', speaks: false });
    expect(vess.price).toEqual({ value: 1, source: { from: 'standard' } });
    expect(vess.setHere).toBe(0);
    expect(stateSentences(sample(), sample().records.find((record) => record.id === 'vess')!)).toEqual([]);
  });

  it('gives a place, a thing and a group their own states, and the player theirs', () => {
    const world = sample();
    const dock = read(world, 'dock');
    expect(dock.states.map((entry) => entry.def.id)).toEqual(['alert', 'prepared-place']);
    expect(deed(dock, 'finesse').acts.map((act) => act.label)).toEqual(['Lie low, cover your tracks']);
    expect(dock.placeKind).toEqual({ value: 'other', source: { from: 'standard' } });
    const lock = read(world, 'lock');
    expect(deed(lock, 'force').acts.map((act) => act.label)).toEqual(['Break it or force it']);
    expect(deed(lock, 'finesse').acts.map((act) => act.label)).toEqual(['Pick it, work it loose, take it']);
    expect(lock.good).toMatchObject({ value: { id: 'lock', name: 'The strongbox', kind: 'goods', worth: 1 }, set: [] });
    const you = read(world, 'you');
    expect(you.isPlayer).toBe(true);
    expect(you.deeds).toEqual([]);
    expect(you.states.map((entry) => entry.def.id)).toContain('coin');
    expect(state(you, 'health').sentence).toBe('You are unhurt.');
    expect(read(world, 'pact').states).toEqual([]);
    expect(rulesFor(world, world.records.find((record) => record.id === 'tale')!)).toBeNull();
  });
});

describe('rulesFor on a tier, a group and an override', () => {
  it('takes difficulty and maxima from the tier', () => {
    const vess = read(put(sample(), 'vess', { rules: { tier: 'nemesis' } }), 'vess');
    expect(deed(vess, 'flair').difficulty).toEqual({ value: 3, source: { from: 'tier', tier: 'nemesis' } });
    expect(state(vess, 'strain').max).toEqual({ value: 6, source: { from: 'tier', tier: 'nemesis' } });
    expect(sourceWords(state(vess, 'strain').max.source)).toBe('Nemesis tier');
    expect(vess.price).toEqual({ value: 100, source: { from: 'tier', tier: 'nemesis' } });
    expect(vess.tier?.source).toEqual({ from: 'record' });
    expect(summaryOf(vess)).toBe('A nemesis · Hard to act on · 1 set here.');
  });

  it('takes a group\'s defaults for its members, above the tier and below what is set here', () => {
    let world = put(sample(), 'reds', { rules: { members: { tier: 'rival', maxima: { health: 7 }, difficulty: { flair: 4 } } } });
    world = put(world, 'vess', { groupIds: ['reds'] });
    const fromGroup = { from: 'group', groupId: 'reds', name: 'Salamanders' };
    let vess = read(world, 'vess');
    expect(vess.tier).toEqual({ value: 'rival', source: fromGroup });
    expect(state(vess, 'health').max).toEqual({ value: 7, source: fromGroup });
    expect(state(vess, 'health').value.value).toBe(7);
    expect(state(vess, 'strain').max).toEqual({ value: 4, source: { from: 'tier', tier: 'rival' } });
    expect(deed(vess, 'flair').difficulty).toEqual({ value: 4, source: fromGroup });
    expect(deed(vess, 'force').difficulty).toEqual({ value: 2, source: { from: 'tier', tier: 'rival' } });
    expect(sourceWords(vess.tier!.source)).toBe('From Salamanders');
    expect(read(world, 'reds').members).toMatchObject({ count: 1 });

    // Set here wins, and putting it back returns the group's.
    const set = setRule(setRule(world.records.find((record) => record.id === 'vess')!.rules, ['maxima', 'health'], 3), ['tier'], null);
    world = put(world, 'vess', { rules: set });
    vess = read(world, 'vess');
    expect(state(vess, 'health').max).toEqual({ value: 3, source: { from: 'record' } });
    expect(vess.tier).toEqual({ value: null, source: { from: 'record' } });
    expect(vess.setHere).toBe(2);
    world = put(world, 'vess', { rules: clearRule(clearRule(set, ['maxima', 'health']), ['tier']) });
    expect(world.records.find((record) => record.id === 'vess')!.rules).toBeUndefined();
    expect(state(read(world, 'vess'), 'health').max.source).toEqual(fromGroup);
    // A group's defaults are for people: a place in the group is untouched.
    expect(deed(read(put(world, 'dock', { groupIds: ['reds'] }), 'dock'), 'flair').difficulty.value).toBe(2);
  });

  it('reads an override, and says what the narrator would be told', () => {
    let world = put(sample(), 'vess', { rules: { tier: 'rival', states: { health: 2 }, difficulty: { all: 3, finesse: 'random' }, gang: null, sells: ['knife'] } });
    const vess = read(world, 'vess');
    expect(deed(vess, 'force').difficulty).toEqual({ value: 3, source: { from: 'record', via: 'all' } });
    expect(deed(vess, 'finesse').difficulty).toEqual({ value: 'random', source: { from: 'record' } });
    expect(state(vess, 'health')).toMatchObject({ value: { value: 2, source: { from: 'record' } }, speaks: true, sentence: 'Vess is hurt, bleeding and slowed, but still fighting.' });
    // She sells, so she can be haggled with.
    expect(deed(vess, 'flair').acts.map((act) => act.label)).toContain('Haggle');
    expect(stateSentences(world, world.records.find((record) => record.id === 'vess')!)).toEqual([{ stateId: 'health', name: 'Health', text: 'Vess is hurt, bleeding and slowed, but still fighting.' }]);

    // A gang's number is its Health, Strain and difficulty.
    world = put(world, 'vess', { rules: { gang: 3 } });
    const gang = read(world, 'vess');
    expect(state(gang, 'health').max).toEqual({ value: 3, source: { from: 'record', via: 'gang' } });
    expect(deed(gang, 'force').difficulty).toEqual({ value: 3, source: { from: 'record', via: 'gang' } });
    expect(gang.purse?.value).toBe(3);

    // A start above the most is held under it.
    expect(state(read(put(world, 'vess', { rules: { maxima: { health: 2 }, states: { health: 9 } } }), 'vess'), 'health').value.value).toBe(2);
  });

  it('reads an item as a good, and lists it with the catalog', () => {
    const world = put(sample(), 'lock', { rules: { good: { kind: 'weapon', worth: 10, harm: 2 }, difficulty: { finesse: 4 } } });
    const lock = read(world, 'lock');
    expect(lock.good).toMatchObject({ value: { kind: 'weapon', worth: 10, harm: 2 }, set: ['kind', 'worth', 'harm'] });
    expect(lock.setHere).toBe(4);
    expect(summaryOf(lock)).toBe('A weapon, worth 10 · Average by Force, Daunting by Finesse, Average by Focus, Average by Flair · 4 set here.');
    expect(goodsOf(world).map((good) => good.id)).toEqual([...standardRuleset().goods.map((good) => good.id), 'lock']);
    expect(worthWords(rulesetOf(world), 10)).toBe('a sword or hire a blade for a month');
  });
});

describe('a world\'s ruleset', () => {
  it('is the standard until the world changes a part, and every record that set nothing follows', () => {
    let world = sample();
    expect(rulesetOf(world)).toBe(standardRuleset());
    expect(changedCount(world.rules)).toBe(0);
    const rival = standardRuleset().tiers!.rival!;
    world = { ...world, rules: changeRules.tier(world.rules, 'rival', { ...rival, maxima: { ...rival.maxima, health: 6 } }) };
    world = { ...world, rules: changeRules.field(world.rules, 'dice', 'difficulty', 3) };
    expect(changedCount(world.rules)).toBe(2);
    expect(readRuleset(world.rules).problems).toEqual([]);
    // No tier: the dice's own difficulty, now this world's.
    expect(deed(read(world, 'vess'), 'force').difficulty).toEqual({ value: 3, source: { from: 'world' } });
    const vess = read(put(world, 'vess', { rules: { tier: 'rival' } }), 'vess');
    expect(state(vess, 'health').max).toEqual({ value: 6, source: { from: 'tier', tier: 'rival' } });
    // What the standard still says is not stored.
    expect(world.rules!.dice).toEqual({ difficulty: 3 });
    expect(rulesetOf(world).dice!.push).toEqual({ stateId: 'strain', add: -2 });

    // Putting both back leaves nothing stored at all.
    world = { ...world, rules: changeRules.withoutTier(world.rules, 'rival') };
    world = { ...world, rules: changeRules.withoutField(world.rules, 'dice', 'difficulty') };
    expect(world.rules).toBeUndefined();
  });

  it('replaces a state by id, keeps its own states, and drops a change that says what the standard says', () => {
    let world = sample();
    const coin = standardRuleset().states.find((entry) => entry.id === 'coin')!;
    // A modern world: the same purse in other words.
    const modern = { ...coin, name: 'Cash', bands: coin.bands.map((entry) => (entry.at === 100 ? { ...entry, label: 'could buy a car' } : entry)) };
    world = { ...world, rules: changeRules.state(world.rules, modern) };
    expect(stateOrigin(world.rules, 'coin')).toBe('world');
    expect(stateOrigin(world.rules, 'health')).toBe('standard');
    expect(worthWords(rulesetOf(world), 100)).toBe('a car');
    expect(state(read(world, 'you'), 'coin').origin).toBe('world');
    // The standard's order is kept, and nothing else moved.
    expect(rulesetOf(world).states.map((entry) => entry.id)).toEqual(standardRuleset().states.map((entry) => entry.id));

    world = { ...world, rules: changeRules.state(world.rules, EXTRA_STATES[0]!) };
    expect(read(world, 'pact').states.map((entry) => [entry.def.id, entry.sentence, entry.speaks])).toEqual([['standing', "The Pact doesn't know you.", false]]);
    world = put(world, 'pact', { rules: { states: { standing: 0 } } });
    expect(state(read(world, 'pact'), 'standing')).toMatchObject({ speaks: true, sentence: 'The Pact wants you gone, and will act on it.' });

    world = { ...world, rules: changeRules.state(world.rules, coin) };
    expect(world.rules!.states.map((entry) => entry.id)).toEqual(['standing']);
    expect(changeRules.withoutState(world.rules, 'standing')).toBeUndefined();
  });

  it('falls back to the standard, with the reason, when its own rules do not hold together', () => {
    const health = standardRuleset().states.find((entry) => entry.id === 'health')!;
    const broken = changeRules.state(undefined, { ...health, approach: { owner: 'muscle', secondary: [] } })!;
    const reading = readRuleset(broken);
    expect(reading.ruleset).toBe(standardRuleset());
    expect(reading.problems).toEqual(['Health is owned by an approach that isn\'t there: "muscle".']);
  });

  it('round-trips through a world file', () => {
    let world = sample();
    const flair = standardRuleset().approaches.find((entry) => entry.id === 'flair')!;
    let rules: WorldRules | undefined = changeRules.approach(world.rules, { ...flair, name: 'Charm' });
    rules = changeRules.deed(rules, { kind: 'place', approach: 'finesse', label: 'Slip through unseen' });
    rules = changeRules.field(rules, 'growth', 'ratingCost', 8);
    rules = changeRules.state(rules, EXTRA_STATES[1]!);
    world = put({ ...world, rules }, 'vess', { rules: { tier: 'rival', rank: 1, charges: { force: 'trained' }, maxima: { health: 6 }, carries: ['knife'], forSale: false } });
    world = put(world, 'reds', { rules: { members: { maxima: { strain: 5 } } } });
    world = put(world, 'dock', { rules: { placeKind: 'landmark', difficulty: { all: 3 }, states: { alert: 1 } } });
    world = put(world, 'lock', { rules: { good: { kind: 'use', worth: 1, restores: [{ stateId: 'health', who: 'player', add: 2 }] } } });

    const file = parseWorld(JSON.parse(JSON.stringify(world)));
    expect(file.ok).toBe(true);
    if (!file.ok) return;
    expect(file.world).toEqual(world);
    expect(file.world.rules).toMatchObject({ version: 1, extends: STANDARD_RULESET_ID });
    expect(rulesetOf(file.world)).toEqual(rulesetOf(world));
    expect(rulesetOf(file.world).approaches.map((entry) => entry.name)).toEqual(['Force', 'Finesse', 'Focus', 'Charm']);
    expect(deed(read(file.world, 'dock'), 'finesse').acts.map((act) => act.label)).toEqual(['Lie low, cover your tracks', 'Slip through unseen']);
    for (const record of world.records) expect(rulesFor(file.world, file.world.records.find((entry) => entry.id === record.id)!)).toEqual(rulesFor(world, record));
  });

  it('refuses a rules block that is not one', () => {
    const world = JSON.parse(JSON.stringify(put(sample(), 'vess', { rules: { tier: 'rival' } })));
    world.records.find((record: { id: string }) => record.id === 'vess').rules.tier = 'boss';
    expect(parseWorld(world).ok).toBe(false);
  });
});

describe('a world saved before rules existed', () => {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/world-before-rules.json', import.meta.url), 'utf8'));

  it('still opens, and every record in it plays by the standard', () => {
    const file = parseWorld(raw);
    expect(file.ok).toBe(true);
    if (!file.ok) return;
    expect(file.world.rules).toBeUndefined();
    expect(file.world.records.every((record) => record.rules === undefined)).toBe(true);
    expect(rulesetOf(file.world)).toBe(standardRuleset());
    const ada = read(file.world, 'ada');
    expect(deed(ada, 'flair')).toMatchObject({ difficulty: { value: 2, source: { from: 'standard' } } });
    expect(state(ada, 'strain').sentence).toBe('Ada Moss is steady.');
    expect(summaryOf(ada)).toBe('No tier · Average to act on · nothing set here.');
    expect(read(file.world, 'safe').deeds).toHaveLength(4);
    expect(read(file.world, 'bar').deeds).toHaveLength(4);
    // Saving it again writes no rules into it.
    expect(JSON.parse(JSON.stringify(file.world))).toEqual(raw);
  });
});

describe('in context now', () => {
  it('adds the sentences of states off their resting band, under the record they belong to', () => {
    let world = sample();
    world = put(world, 'vess', { rules: { states: { health: 2 } } });
    world = put(world, 'dock', { rules: { states: { alert: 2 } } });
    const vessRecord = world.records.find((record) => record.id === 'vess')!;
    world = putRecord(world, { ...vessRecord, sections: vessRecord.sections.map((section) => (section.title === 'Appearance' ? { ...section, text: 'Grey coat, a club on her belt.' } : section)) }, 4);

    const answer = contextWithRules(world, { hereIds: ['vess', 'dock', 'lock'], recentText: '', conditionIds: [] });
    const parts = Object.fromEntries(answer.blocks.map((block) => [block.name, block.parts.map((part) => [part.reach, part.text])]));
    expect(parts.Vess).toEqual([
      ['line', 'A dock guard.'],
      ['here', 'Grey coat, a club on her belt.'],
      ['state', 'Vess is near death. One more good blow could drop her.'],
    ]);
    expect(parts['The dock']).toEqual([
      ['line', 'Where the boats tie up.'],
      ['state', 'Everyone at the dock is watching closely, and one more slip will bring them down on you.'],
    ]);
    // At rest, nothing is added.
    expect(parts['The strongbox']).toEqual([['line', 'An iron box under the counter.']]);
    expect(ruledText(answer)).toContain('Appearance: Grey coat, a club on her belt.\nVess is near death. One more good blow could drop her.');
    // Off stage, her state stays out.
    const away = contextWithRules(world, { hereIds: ['dock'], recentText: 'Where is Vess?', conditionIds: [] });
    expect(away.blocks.find((block) => block.name === 'Vess')?.parts.map((part) => part.reach)).toEqual(['line']);
    expect(answer.tokens).toBeGreaterThan(away.tokens);
  });
});
