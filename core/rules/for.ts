// rulesFor(world, record): a record's rules as they stand, each part tagged with where it came
// from. Nothing here is stored. The rules come from the record's kind, its tier, its groups and
// the world's ruleset; the record's own block holds only what its author set.
//
// The order, weakest first: the standard, the world, a tier, a group, set here.
//
// Pure: no DOM, no network, no storage.

import type { StoryRecord, World } from '../records/schema.js';
import { setCount, type MemberRules, type RecordRules } from './record-rules.js';
import { DIFFICULTY_NAMES, type Approach, type GoodDef, type LadderStep, type Level, type PlaceKind, type Ruleset, type Tier } from './ruleset.js';
import { band, fact, forOwner, labelFor, shortLabel, speaks, type BandReading, type StateDef } from './state.js';
import { definite, pronounsOf } from './words.js';
import { rulesetOf, stateOrigin } from './world-rules.js';

export type Source =
  | { from: 'standard' }
  | { from: 'world' }
  | { from: 'tier'; tier: Tier }
  // A group this record belongs to. `via` says the value follows from another rule there.
  | { from: 'group'; groupId: string; name: string; via?: 'gang' | 'all' }
  // Set on this record. `via` says it follows from another rule set here: a gang's number is
  // its Health, "every approach" sets each one.
  | { from: 'record'; via?: 'gang' | 'all' };

export interface Sourced<T> { value: T; source: Source }

export const TIER_NAMES: Record<Tier, string> = { minion: 'Minion', rival: 'Rival', nemesis: 'Nemesis' };

// "Standard", "This world", "Rival tier", "From Salamanders", "Set here".
export function sourceWords(source: Source): string {
  switch (source.from) {
    case 'standard': return 'Standard';
    case 'world': return 'This world';
    case 'tier': return `${TIER_NAMES[source.tier]} tier`;
    case 'group': return `From ${source.name}`;
    case 'record': return 'Set here';
  }
}

export const levelWords = (level: Level) => (level === 'random' ? 'Random' : DIFFICULTY_NAMES[level] ?? String(level));

// What a record is to the rules. Lore, threads and scenarios have none of their own.
export type Subject = 'person' | 'place' | 'thing' | 'group';

export function subjectOf(record: Pick<StoryRecord, 'kind'>): Subject | null {
  switch (record.kind) {
    case 'character': case 'persona': return 'person';
    case 'place': return 'place';
    case 'item': return 'thing';
    case 'group': return 'group';
    default: return null;
  }
}

export interface StateReading {
  // The definition as it applies here, with this record's own most.
  def: StateDef;
  // Whether the definition is the standard's or this world's.
  origin: 'standard' | 'world';
  // Where it starts.
  value: Sourced<number>;
  max: Sourced<number>;
  band: BandReading;
  // How the narrator would read it right now, at rest or not. Empty for a state with no bands:
  // those never reach the model.
  sentence: string;
  // Off its resting band, so the sentence is sent.
  speaks: boolean;
}

export interface ActReading {
  // What the act is, in a few words: "Hurt or overpower".
  label: string;
  // The state it moves, or null for a deed that simply works or fails.
  stateId: string | null;
  stateName: string;
  // 'secondary': off the approach's home ground, with a setback die.
  claim: 'owner' | 'secondary';
  effect: 'wears' | 'builds' | 'deed';
}

export interface DeedReading {
  approach: Approach;
  difficulty: Sourced<Level>;
  acts: ActReading[];
}

export interface RulesReading {
  subject: Subject;
  // The player's own character: a persona.
  isPlayer: boolean;
  ruleset: Ruleset;
  // What a player can do here, by approach. Empty for groups and for the player's own card.
  deeds: DeedReading[];
  // Every state this record holds.
  states: StateReading[];
  // People.
  tier?: Sourced<Tier | null>;
  rank?: Sourced<number>;
  gang?: Sourced<number | null>;
  charges?: Record<string, Sourced<LadderStep | null>>;
  forSale?: Sourced<boolean>;
  price?: Sourced<number>;
  purse?: Sourced<number>;
  sells?: Sourced<string[]>;
  carries?: Sourced<string[]>;
  // Places.
  placeKind?: Sourced<PlaceKind>;
  // Items: the item as a good, and which of its fields were set here.
  good?: { value: GoodDef; set: string[] };
  // Groups: what members get, and how many there are.
  members?: { rules: MemberRules; count: number };
  // How many things were set on this record.
  setHere: number;
}

const STANDARD: Source = { from: 'standard' };
const HERE: Source = { from: 'record' };

function groupsOf(world: World, record: StoryRecord): StoryRecord[] {
  return record.groupIds.flatMap((groupId) => {
    const group = world.records.find((entry) => entry.id === groupId && entry.kind === 'group');
    return group ? [group] : [];
  });
}

// The first of: set here, a group's default for members, in the order the record lists its groups.
function layered<T>(own: T | undefined, groups: StoryRecord[], pick: (rules: MemberRules) => T | undefined): Sourced<T> | undefined {
  if (own !== undefined) return { value: own, source: HERE };
  for (const group of groups) {
    const value = group.rules?.members ? pick(group.rules.members) : undefined;
    if (value !== undefined) return { value, source: { from: 'group', groupId: group.id, name: group.name } };
  }
  return undefined;
}

const scopesFor = (subject: Subject, isPlayer: boolean): readonly string[] => {
  if (subject === 'person') return isPlayer ? ['char', 'protagonist'] : ['char', 'npc'];
  if (subject === 'place') return ['place'];
  if (subject === 'thing') return ['item'];
  return ['faction'];
};

const actable = (def: StateDef) => Boolean(def.approach) && def.bands.length > 0 && def.display !== 'hidden';

export function rulesFor(world: World, record: StoryRecord): RulesReading | null {
  const subject = subjectOf(record);
  if (!subject) return null;
  const ruleset = rulesetOf(world);
  const own: RecordRules = record.rules ?? {};
  const isPlayer = record.kind === 'persona';
  const isPerson = subject === 'person';
  // Only people take a group's defaults.
  const groups = isPerson ? groupsOf(world, record) : [];
  const defOrigin = (stateId: string): Source => ({ from: stateOrigin(world.rules, stateId) });

  const tier = isPerson ? layered(own.tier, groups, (rules) => rules.tier) ?? { value: null, source: STANDARD } : undefined;
  const gang = isPerson ? layered(own.gang, groups, (rules) => rules.gang) ?? { value: null, source: STANDARD } : undefined;
  const tierRules = tier?.value ? ruleset.tiers?.[tier.value] : undefined;
  const tierSource = (): Source => ({ from: 'tier', tier: tier!.value! });
  const viaGang = (): Source => ({ ...gang!.source, via: 'gang' } as Source);
  // A gang's number is its Health and Strain: the fight's harm and the states that yield.
  const gangStates = new Set(ruleset.fight ? [ruleset.fight.harm, ...ruleset.fight.yields.map((entry) => entry.stateId)] : []);

  const scopes = scopesFor(subject, isPlayer);
  const states: StateReading[] = ruleset.states.filter((def) => scopes.includes(def.scope)).map((base) => {
    const groupMax = layered<number>(undefined, groups, (rules) => rules.maxima?.[base.id]);
    const max: Sourced<number> = own.maxima?.[base.id] !== undefined ? { value: own.maxima[base.id]!, source: HERE }
      : gang?.value && gang.source.from === 'record' && gangStates.has(base.id) ? { value: gang.value, source: viaGang() }
      : groupMax ? groupMax
      : gang?.value && gangStates.has(base.id) ? { value: gang.value, source: viaGang() }
      : tierRules?.maxima[base.id] !== undefined ? { value: tierRules.maxima[base.id]!, source: tierSource() }
      : { value: base.max, source: defOrigin(base.id) };
    const def = forOwner(base, max.value);
    const lo = Math.min(def.min, def.max);
    const hi = Math.max(def.min, def.max);
    const start = layered(own.states?.[base.id], groups, (rules) => rules.states?.[base.id]) ?? { value: base.start, source: defOrigin(base.id) };
    const value = { value: Math.max(lo, Math.min(hi, start.value)), source: start.source };
    const reading = band(def, value.value);
    return {
      def, origin: stateOrigin(world.rules, base.id), value, max, band: reading,
      sentence: reading.banded ? fact(def, definite(record.name), value.value, isPlayer, true, pronounsOf(record.pronouns)) : '',
      speaks: speaks(def, value.value),
    };
  });

  const sells = isPerson ? layered(own.sells, groups, (rules) => rules.sells) ?? { value: [], source: STANDARD } : undefined;

  const difficultyFor = (approachId: string): Sourced<Level> => {
    if (own.difficulty?.[approachId] !== undefined) return { value: own.difficulty[approachId]!, source: HERE };
    if (own.difficulty?.all !== undefined) return { value: own.difficulty.all, source: { from: 'record', via: 'all' } };
    for (const group of groups) {
      const set = group.rules?.members?.difficulty;
      if (set?.[approachId] !== undefined) return { value: set[approachId]!, source: { from: 'group', groupId: group.id, name: group.name } };
      if (set?.all !== undefined) return { value: set.all, source: { from: 'group', groupId: group.id, name: group.name, via: 'all' } };
    }
    // A gang brings one difficulty die for each of them, up to four.
    if (gang?.value) return { value: Math.min(4, gang.value), source: viaGang() };
    if (tierRules) return { value: tierRules.difficulty, source: tierSource() };
    return { value: ruleset.dice?.difficulty ?? 2, source: world.rules?.dice?.difficulty !== undefined ? { from: 'world' } : STANDARD };
  };

  const kind = subject === 'group' ? null : subject;
  const deeds: DeedReading[] = !kind || isPlayer ? [] : ruleset.approaches.map((approach) => {
    const acts: ActReading[] = [];
    for (const reading of states) {
      const def = reading.def;
      if (!actable(def)) continue;
      // A bargain is only struck with someone who sells.
      if (def.id === ruleset.trade?.bargain && !sells?.value.length) continue;
      const claim = def.approach!.owner === approach.id ? 'owner' : def.approach!.secondary.includes(approach.id) ? 'secondary' : null;
      if (!claim) continue;
      acts.push({ label: def.verb || def.name, stateId: def.id, stateName: def.name, claim, effect: def.grows ? 'builds' : 'wears' });
    }
    acts.sort((a, b) => (a.claim === b.claim ? 0 : a.claim === 'owner' ? -1 : 1));
    for (const deed of ruleset.deeds) {
      if (deed.kind === kind && deed.approach === approach.id) acts.push({ label: deed.label, stateId: null, stateName: '', claim: 'owner', effect: 'deed' });
    }
    return { approach, difficulty: difficultyFor(approach.id), acts };
  });

  const reading: RulesReading = { subject, isPlayer, ruleset, deeds, states, setHere: 0 };

  if (isPerson && tier && gang) {
    const trade = ruleset.trade;
    const scale = (gang.value ?? 1);
    const tradeSource = (field: 'price' | 'purse'): Source => (tier.value ? tierSource() : world.rules?.trade?.[field] !== undefined ? { from: 'world' } : STANDARD);
    reading.tier = tier;
    reading.gang = gang;
    reading.rank = layered(own.rank, groups, (rules) => rules.rank) ?? { value: 0, source: STANDARD };
    reading.charges = Object.fromEntries(ruleset.approaches.map((approach) => [
      approach.id,
      layered<LadderStep | null>(own.charges?.[approach.id], groups, (rules) => rules.charges?.[approach.id]) ?? { value: null, source: STANDARD },
    ]));
    reading.sells = sells;
    reading.carries = layered(own.carries, groups, (rules) => rules.carries) ?? { value: [], source: STANDARD };
    if (!isPlayer) {
      reading.forSale = layered(own.forSale, groups, (rules) => rules.forSale) ?? { value: true, source: STANDARD };
      // Someone with no tier is priced as a minion.
      reading.price = layered(own.price, groups, (rules) => rules.price) ?? { value: (trade?.price[tier.value ?? 'minion'] ?? 0) * scale, source: tradeSource('price') };
      reading.purse = layered(own.purse, groups, (rules) => rules.purse) ?? { value: (trade?.purse[tier.value ?? 'minion'] ?? 0) * scale, source: tradeSource('purse') };
    }
  }
  if (subject === 'place') reading.placeKind = own.placeKind !== undefined ? { value: own.placeKind, source: HERE } : { value: 'other', source: STANDARD };
  if (subject === 'thing') {
    const set = own.good ?? {};
    reading.good = {
      value: {
        id: record.id, name: record.name, description: '', worth: set.worth ?? 1, kind: set.kind ?? 'goods', hidden: set.hidden ?? false,
        hinders: set.hinders ?? [], makeable: set.makeable ?? true, fine: set.fine ?? false, restores: set.restores ?? [],
        ...(set.plural !== undefined ? { plural: set.plural } : {}),
        ...(set.helps !== undefined ? { helps: set.helps } : {}),
        ...(set.harm !== undefined ? { harm: set.harm } : {}),
        ...(set.armour !== undefined ? { armour: set.armour } : {}),
      },
      set: Object.entries(set).filter(([, value]) => value !== undefined).map(([key]) => key),
    };
  }
  if (subject === 'group') {
    reading.members = { rules: own.members ?? {}, count: world.records.filter((entry) => subjectOf(entry) === 'person' && entry.groupIds.includes(record.id)).length };
  }
  reading.setHere = setCount(own);
  return reading;
}

// The goods a world's people can sell and carry: the ruleset's catalog, then every item record
// as the good it is.
export function goodsOf(world: World): GoodDef[] {
  const items = world.records.flatMap((record) => (record.kind === 'item' ? [rulesFor(world, record)?.good?.value].filter((good): good is GoodDef => Boolean(good)) : []));
  return [...rulesetOf(world).goods, ...items];
}

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

// What the price buys, in the words of the purse's bands: "food, drink, a bed and small things".
export function worthWords(ruleset: Ruleset, worth: number): string {
  const coin = ruleset.states.find((state) => state.id === ruleset.trade?.coin);
  if (!coin?.bands.length) return String(worth);
  let label = coin.bands[0]!.label;
  for (const entry of coin.bands) if (worth >= entry.at) label = entry.label;
  return label.replace(/^(can pay for|could buy|have|can afford|could afford) /, '');
}

// One plain line for the folded Rules panel: what this is to the rules, in words.
export function summaryOf(reading: RulesReading): string {
  const parts: string[] = [];
  const set = reading.setHere ? `${reading.setHere} set here` : 'nothing set here';
  if (reading.subject === 'group') {
    const given = Object.values(reading.members?.rules ?? {}).filter((value) => value !== undefined).length;
    parts.push(given ? `Gives its ${reading.members?.count ?? 0} ${reading.members?.count === 1 ? 'member' : 'members'} ${given} ${given === 1 ? 'default' : 'defaults'}` : 'Gives its members nothing of its own');
    for (const state of reading.states) if (state.sentence) parts.push(lower(state.sentence.replace(/\.$/, '')));
    return `${parts.join(' · ')}.`;
  }
  if (reading.isPlayer) {
    const ratings = reading.ruleset.approaches.map((approach) => `${approach.name} ${reading.states.find((state) => state.def.id === approach.id)?.value.value ?? 1}`);
    return `The player's own card · ${ratings.join(', ')} · ${set}.`;
  }
  if (reading.subject === 'person') {
    parts.push(reading.gang?.value ? `A gang of ${reading.gang.value}` : reading.tier?.value ? `A ${reading.tier.value}` : 'No tier');
  }
  if (reading.subject === 'thing' && reading.good) {
    const good = reading.good.value;
    const what = { goods: 'Goods', weapon: 'A weapon', armour: 'Armour', help: 'A help', use: 'Used up when used' }[good.kind];
    parts.push(`${what}, worth ${good.worth}`);
  }
  if (reading.subject === 'place' && reading.placeKind && reading.placeKind.value !== 'other') parts.push(`A ${reading.placeKind.value}`);
  const levels = reading.deeds.map((deed) => deed.difficulty.value);
  if (levels.length) {
    const first = levels[0]!;
    if (levels.every((level) => level === first)) parts.push(`${levelWords(first)} to act on`);
    else parts.push(reading.deeds.map((deed) => `${levelWords(deed.difficulty.value)} by ${deed.approach.name}`).join(', '));
  }
  const speaking = reading.states.filter((state) => state.speaks && state.sentence);
  for (const state of speaking) parts.push(lower(shortLabel(state.def, labelFor(state.def, state.value.value, reading.isPlayer))));
  parts.push(set);
  return `${parts.join(' · ')}.`;
}
