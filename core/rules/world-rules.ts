// A world's own rules: only what it changes. Everything it leaves alone comes from the standard
// ruleset, so a world with no rules block plays by the Four Approaches as they stand, and a
// change to the standard reaches every world that didn't write its own.
//
// Lists (states, approaches, deeds, follow rules, goods) are replaced an entry at a time, by id.
// Tiers are replaced a tier at a time. The blocks (dice, rest, fight, growth, trade, craft) hold
// only the fields the world changed. Pure: no DOM, no network, no storage.

import { z } from 'zod';
import { calendarSchema } from './clock.js';
import { stateDefSchema, type StateDef } from './state.js';
import { levelsChanged, levelsSchema, pruneLevels } from './levels.js';
import { STANDARD_RULESET, STANDARD_RULESET_ID, mergeBy } from './standard.js';
import {
  TIERS, approachSchema, craftSchema, deedSchema, diceSchema, fightSchema, followRuleSchema, goodSchema, growthSchema, restSchema,
  rulesetSchema, sceneActionSchema, tierSchema, tradeSchema, travelSchema,
  type Approach, type Deed, type GoodDef, type Ruleset, type Tier, type TierRules,
} from './ruleset.js';

// The rules block's own version. A later shape gets a new number and a reading of this one, as
// the adventure's formats did in 0.22.0, so a world saved today opens then.
export const RULES_VERSION = 1;

// A block with every field optional and no defaults filled in, so only what was changed is kept.
function sparse<T extends z.ZodObject>(schema: T) {
  const shape = Object.fromEntries(Object.entries(schema.shape).map(([key, field]) => [key, ((field instanceof z.ZodDefault ? field.unwrap() : field) as z.ZodType).optional()]));
  return z.object(shape) as unknown as z.ZodType<Partial<z.input<T>>>;
}

export const BLOCKS = ['dice', 'rest', 'fight', 'growth', 'trade', 'craft'] as const;
export type Block = (typeof BLOCKS)[number];

export const worldRulesSchema = z.object({
  version: z.literal(RULES_VERSION).default(RULES_VERSION),
  // The ruleset beneath this one.
  extends: z.literal(STANDARD_RULESET_ID).default(STANDARD_RULESET_ID),
  states: z.array(stateDefSchema).max(500).default([]),
  approaches: z.array(approachSchema).max(12).default([]),
  deeds: z.array(deedSchema).max(40).default([]),
  follow: z.array(followRuleSchema).max(12).default([]),
  goods: z.array(goodSchema).max(2000).default([]),
  tiers: z.object({ minion: tierSchema.optional(), rival: tierSchema.optional(), nemesis: tierSchema.optional() }).default({}),
  dice: sparse(diceSchema).optional(),
  rest: sparse(restSchema).optional(),
  fight: sparse(fightSchema).optional(),
  growth: sparse(growthSchema).optional(),
  trade: sparse(tradeSchema).optional(),
  craft: sparse(craftSchema).optional(),
  // Absent means the real calendar.
  calendar: calendarSchema.optional(),
  travel: travelSchema.optional(),
  // Travel by level: only the numbers the world changed (levels.ts).
  levels: levelsSchema.optional(),
  actions: z.array(sceneActionSchema).max(1000).default([]),
});
export type WorldRules = z.infer<typeof worldRulesSchema>;

export const EMPTY_RULES: WorldRules = { version: RULES_VERSION, extends: STANDARD_RULESET_ID, states: [], approaches: [], deeds: [], follow: [], goods: [], tiers: {}, actions: [] };

export const deedKey = (deed: Pick<Deed, 'kind' | 'approach'>) => `${deed.kind}:${deed.approach}`;

type Loose = Record<string, unknown>;
const standard = STANDARD_RULESET as unknown as { [key: string]: unknown; states: { id: string }[]; approaches: { id: string }[]; deeds: Deed[]; follow: { id: string }[]; goods: { id: string }[]; tiers: Record<Tier, unknown> };

// The world's rules laid over the standard, not yet checked.
function merged(rules: WorldRules | null | undefined): Loose {
  const own = rules ?? EMPTY_RULES;
  const block = (key: Block) => ({ ...(standard[key] as Loose), ...((own[key] ?? {}) as Loose) });
  return {
    extends: STANDARD_RULESET_ID,
    states: mergeBy(standard.states, own.states, (entry) => entry.id ?? ''),
    approaches: mergeBy(standard.approaches, own.approaches, (entry) => entry.id ?? ''),
    deeds: mergeBy(standard.deeds as { kind?: string; approach?: string }[], own.deeds, (entry) => `${entry.kind}:${entry.approach}`),
    follow: mergeBy(standard.follow, own.follow, (entry) => entry.id ?? ''),
    goods: mergeBy(standard.goods, own.goods, (entry) => entry.id ?? ''),
    tiers: { ...standard.tiers, ...own.tiers },
    dice: block('dice'), rest: block('rest'), fight: block('fight'), growth: block('growth'), trade: block('trade'), craft: block('craft'),
    calendar: own.calendar,
    travel: own.travel ?? { walkKph: 4, tiers: [] },
    actions: own.actions,
  };
}

export interface RulesetReading {
  ruleset: Ruleset;
  // What is wrong with the world's own rules, in plain words. Empty when they hold together.
  problems: string[];
}

let standardReading: Ruleset | null = null;

// The standard ruleset on its own, as every reader sees it.
export function standardRuleset(): Ruleset {
  standardReading ??= rulesetSchema.parse(merged(null));
  return standardReading;
}

const readings = new WeakMap<object, RulesetReading>();

// The ruleset a world plays by. If its own rules don't hold together, the standard is used and
// the problems say why, so a bad edit never leaves a world with no rules at all.
export function readRuleset(rules: WorldRules | null | undefined): RulesetReading {
  if (!rules) return { ruleset: standardRuleset(), problems: [] };
  const known = readings.get(rules);
  if (known) return known;
  const parsed = rulesetSchema.safeParse(merged(rules));
  const problems = parsed.success ? rulesetProblems(parsed.data) : parsed.error.issues.slice(0, 12).map((issue) => `${issue.path.join(' › ') || 'rules'}: ${issue.message}`);
  const reading: RulesetReading = parsed.success && !problems.length ? { ruleset: parsed.data, problems } : { ruleset: standardRuleset(), problems };
  readings.set(rules, reading);
  return reading;
}

export function rulesetOf(world: { rules?: WorldRules | null }): Ruleset {
  return readRuleset(world.rules).ruleset;
}

// What doesn't hold together inside a ruleset: a rule pointing at a state or an approach that
// isn't there, bands that can't be read. Plain sentences for an author.
export function rulesetProblems(ruleset: Ruleset): string[] {
  const out: string[] = [];
  const states = new Map(ruleset.states.map((state) => [state.id, state]));
  const approaches = new Set(ruleset.approaches.map((approach) => approach.id));
  const twice = (ids: string[], what: string) => {
    const seen = new Set<string>();
    for (const value of ids) { if (seen.has(value)) out.push(`Two ${what} share the id "${value}".`); seen.add(value); }
  };
  twice(ruleset.states.map((state) => state.id), 'states');
  twice(ruleset.approaches.map((approach) => approach.id), 'approaches');
  twice(ruleset.goods.map((good) => good.id), 'goods');
  const forCharacters = (def: StateDef | undefined) => Boolean(def && ['char', 'protagonist', 'npc'].includes(def.scope));
  const forPlayer = (def: StateDef | undefined) => Boolean(def && ['char', 'protagonist'].includes(def.scope));
  const fits = (who: string, def: StateDef | undefined) => (who === 'place' ? def?.scope === 'place' : who === 'player' ? forPlayer(def) : forCharacters(def));
  const nameOf = (stateId: string) => states.get(stateId)?.name ?? `"${stateId}"`;

  for (const state of ruleset.states) {
    if (state.min === state.max) out.push(`${state.name} has no room between its lowest and highest.`);
    if (state.bands.length > 0 && state.restBand >= state.bands.length) out.push(`${state.name} rests on a band it doesn't have.`);
    if (state.npcLabels && state.npcLabels.length !== state.bands.length) out.push(`${state.name} has ${state.bands.length} bands but ${state.npcLabels.length} sets of words for other people.`);
    for (const approachId of state.approach ? [state.approach.owner, ...state.approach.secondary] : []) {
      if (!approaches.has(approachId)) out.push(`${state.name} is owned by an approach that isn't there: "${approachId}".`);
    }
  }
  for (const approach of ruleset.approaches) {
    if (!forCharacters(states.get(approach.id))) out.push(`${approach.name} needs a character state with the id "${approach.id}" for its rating.`);
    for (const cost of [...approach.failure, ...approach.threat]) {
      if (!fits(cost.who, states.get(cost.stateId))) out.push(`${approach.name} costs ${nameOf(cost.stateId)}, which ${cost.who === 'place' ? 'a place' : 'a character'} doesn't hold.`);
    }
  }
  for (const deed of ruleset.deeds) if (!approaches.has(deed.approach)) out.push(`The deed "${deed.label}" uses an approach that isn't there.`);
  const dice = ruleset.dice;
  if (dice) {
    if (dice.push && !forPlayer(states.get(dice.push.stateId))) out.push(`Pushing costs ${nameOf(dice.push.stateId)}, which the player doesn't hold.`);
    for (const key of ['edge', 'storyPoints', 'momentum'] as const) {
      const stateId = dice[key];
      if (stateId && !forPlayer(states.get(stateId))) out.push(`The dice point at ${nameOf(stateId)}, which the player doesn't hold.`);
    }
    for (const setback of dice.setbacks) if (!fits(setback.who, states.get(setback.stateId))) out.push(`The setback "${setback.reason}" watches ${nameOf(setback.stateId)}, which isn't there to watch.`);
  }
  for (const effect of ruleset.rest?.effects ?? []) if (!forPlayer(states.get(effect.stateId))) out.push(`A rest restores ${nameOf(effect.stateId)}, which the player doesn't hold.`);
  const fight = ruleset.fight;
  if (fight) {
    for (const stateId of [fight.harm, ...fight.yields.map((entry) => entry.stateId), ...(fight.settle ? [fight.settle.stateId] : [])]) {
      if (!states.has(stateId)) out.push(`A fight watches the state "${stateId}", which isn't there.`);
    }
  }
  if (ruleset.growth && !forPlayer(states.get(ruleset.growth.stateId))) out.push(`Experience is kept in ${nameOf(ruleset.growth.stateId)}, which the player doesn't hold.`);
  const trade = ruleset.trade;
  if (trade) {
    if (!forPlayer(states.get(trade.coin))) out.push(`The purse is ${nameOf(trade.coin)}, which the player doesn't hold.`);
    for (const stateId of [trade.bargain, trade.refusing, trade.armour]) if (stateId && !states.has(stateId)) out.push(`Trade points at the state "${stateId}", which isn't there.`);
  }
  for (const tier of TIERS) {
    for (const stateId of Object.keys(ruleset.tiers?.[tier]?.maxima ?? {})) if (!forCharacters(states.get(stateId))) out.push(`The ${tier} tier sets a most for "${stateId}", which a character doesn't hold.`);
  }
  for (const good of ruleset.goods) {
    for (const approachId of good.helps?.approaches ?? []) if (!approaches.has(approachId)) out.push(`${good.name} helps an approach that isn't there.`);
    for (const effect of good.restores) if (!fits(effect.who, states.get(effect.stateId))) out.push(`${good.name} restores ${nameOf(effect.stateId)}, which isn't there to restore.`);
  }
  return out;
}

// Deep equality on plain data, whatever order the keys were written in.
export function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a as Loose).filter((key) => (a as Loose)[key] !== undefined);
  const keysB = Object.keys(b as Loose).filter((key) => (b as Loose)[key] !== undefined);
  return keysA.length === keysB.length && keysA.every((key) => same((a as Loose)[key], (b as Loose)[key]));
}

// Where a part of the ruleset comes from: the standard, or this world.
export type Origin = 'standard' | 'world';

export function stateOrigin(rules: WorldRules | null | undefined, stateId: string): Origin {
  return rules?.states.some((state) => state.id === stateId) ? 'world' : 'standard';
}
export function approachOrigin(rules: WorldRules | null | undefined, approachId: string): Origin {
  return rules?.approaches.some((approach) => approach.id === approachId) ? 'world' : 'standard';
}
export function deedOrigin(rules: WorldRules | null | undefined, deed: Pick<Deed, 'kind' | 'approach'>): Origin {
  return rules?.deeds.some((entry) => deedKey(entry) === deedKey(deed)) ? 'world' : 'standard';
}
export function goodOrigin(rules: WorldRules | null | undefined, goodId: string): Origin {
  return rules?.goods.some((good) => good.id === goodId) ? 'world' : 'standard';
}
export function tierOrigin(rules: WorldRules | null | undefined, tier: Tier): Origin {
  return rules?.tiers[tier] ? 'world' : 'standard';
}
export function fieldOrigin(rules: WorldRules | null | undefined, block: Block, field: string): Origin {
  return rules?.[block] && (rules[block] as Loose)[field] !== undefined ? 'world' : 'standard';
}

// Whether the standard has a part with this id, so the Studio can say "put back" or "remove".
export const inStandard = {
  state: (stateId: string) => standardRuleset().states.some((state) => state.id === stateId),
  approach: (approachId: string) => standardRuleset().approaches.some((approach) => approach.id === approachId),
  deed: (deed: Pick<Deed, 'kind' | 'approach'>) => standardRuleset().deeds.some((entry) => deedKey(entry) === deedKey(deed)),
  good: (goodId: string) => standardRuleset().goods.some((good) => good.id === goodId),
};

// Drops everything that says what the standard already says, and the block itself when nothing
// is left. Only what the author changed is stored.
export function pruneRules(rules: WorldRules | null | undefined): WorldRules | undefined {
  if (!rules) return undefined;
  const base = standardRuleset();
  const kept = <T,>(own: T[], key: (entry: T) => string, theirs: T[], schema: z.ZodType<T>) => own.filter((entry) => {
    const match = theirs.find((candidate) => key(candidate) === key(entry));
    if (!match) return true;
    const read = schema.safeParse(entry);
    return !same(read.success ? read.data : entry, match);
  });
  const next: WorldRules = {
    ...rules,
    levels: pruneLevels(rules.levels),
    states: kept(rules.states, (entry) => entry.id, base.states, stateDefSchema),
    approaches: kept(rules.approaches, (entry) => entry.id, base.approaches, approachSchema as z.ZodType<Approach>),
    deeds: kept(rules.deeds, deedKey, base.deeds, deedSchema),
    follow: kept(rules.follow, (entry) => entry.id, base.follow, followRuleSchema),
    goods: kept(rules.goods, (entry) => entry.id, base.goods, goodSchema),
    tiers: Object.fromEntries(TIERS.flatMap((tier) => {
      const own = rules.tiers[tier];
      return own && !same(tierSchema.parse(own), base.tiers?.[tier]) ? [[tier, own]] : [];
    })),
  };
  for (const block of BLOCKS) {
    const own = rules[block] as Loose | undefined;
    if (!own) continue;
    const theirs = (base[block] ?? {}) as Loose;
    const fields = Object.fromEntries(Object.entries(own).filter(([key, value]) => value !== undefined && !same(value, theirs[key])));
    if (Object.keys(fields).length) (next as Loose)[block] = fields;
    else delete (next as Loose)[block];
  }
  const empty = !next.states.length && !next.approaches.length && !next.deeds.length && !next.follow.length && !next.goods.length && !Object.keys(next.tiers).length
    && BLOCKS.every((block) => !next[block]) && !next.calendar && !next.travel && !next.levels && !next.actions.length;
  return empty ? undefined : next;
}

const replaceBy = <T,>(list: T[], entry: T, key: (entry: T) => string) =>
  (list.some((existing) => key(existing) === key(entry)) ? list.map((existing) => (key(existing) === key(entry) ? entry : existing)) : [...list, entry]);

// Changes to a world's rules. Each returns the pruned block, or undefined when the world is back
// on the standard alone.
export const changeRules = {
  state: (rules: WorldRules | null | undefined, def: StateDef) => pruneRules({ ...(rules ?? EMPTY_RULES), states: replaceBy(rules?.states ?? [], def, (entry) => entry.id) }),
  withoutState: (rules: WorldRules | null | undefined, stateId: string) => pruneRules({ ...(rules ?? EMPTY_RULES), states: (rules?.states ?? []).filter((entry) => entry.id !== stateId) }),
  approach: (rules: WorldRules | null | undefined, approach: Approach) => pruneRules({ ...(rules ?? EMPTY_RULES), approaches: replaceBy(rules?.approaches ?? [], approach, (entry) => entry.id) }),
  withoutApproach: (rules: WorldRules | null | undefined, approachId: string) => pruneRules({ ...(rules ?? EMPTY_RULES), approaches: (rules?.approaches ?? []).filter((entry) => entry.id !== approachId) }),
  deed: (rules: WorldRules | null | undefined, deed: Deed) => pruneRules({ ...(rules ?? EMPTY_RULES), deeds: replaceBy(rules?.deeds ?? [], deed, deedKey) }),
  withoutDeed: (rules: WorldRules | null | undefined, deed: Pick<Deed, 'kind' | 'approach'>) => pruneRules({ ...(rules ?? EMPTY_RULES), deeds: (rules?.deeds ?? []).filter((entry) => deedKey(entry) !== deedKey(deed)) }),
  good: (rules: WorldRules | null | undefined, good: GoodDef) => pruneRules({ ...(rules ?? EMPTY_RULES), goods: replaceBy(rules?.goods ?? [], good, (entry) => entry.id) }),
  withoutGood: (rules: WorldRules | null | undefined, goodId: string) => pruneRules({ ...(rules ?? EMPTY_RULES), goods: (rules?.goods ?? []).filter((entry) => entry.id !== goodId) }),
  tier: (rules: WorldRules | null | undefined, tier: Tier, value: TierRules) => pruneRules({ ...(rules ?? EMPTY_RULES), tiers: { ...(rules?.tiers ?? {}), [tier]: value } }),
  withoutTier: (rules: WorldRules | null | undefined, tier: Tier) => {
    const tiers = { ...(rules?.tiers ?? {}) };
    delete tiers[tier];
    return pruneRules({ ...(rules ?? EMPTY_RULES), tiers });
  },
  field: (rules: WorldRules | null | undefined, block: Block, field: string, value: unknown) => pruneRules({ ...(rules ?? EMPTY_RULES), [block]: { ...((rules?.[block] ?? {}) as Loose), [field]: value } } as WorldRules),
  withoutField: (rules: WorldRules | null | undefined, block: Block, field: string) => {
    const fields = { ...((rules?.[block] ?? {}) as Loose) };
    delete fields[field];
    return pruneRules({ ...(rules ?? EMPTY_RULES), [block]: fields } as WorldRules);
  },
};

// How many parts of the ruleset this world has changed.
export function changedCount(rules: WorldRules | null | undefined): number {
  if (!rules) return 0;
  return rules.states.length + rules.approaches.length + rules.deeds.length + rules.follow.length + rules.goods.length + Object.keys(rules.tiers).length
    + BLOCKS.reduce((sum, block) => sum + Object.keys((rules[block] ?? {}) as Loose).length, 0) + (rules.calendar ? 1 : 0) + (rules.travel ? 1 : 0) + levelsChanged(rules.levels) + rules.actions.length;
}

// States an author can add in one tap, beyond the standard: a faction's standing and what it has
// to spend. Not part of the standard, so worlds that don't ask for them never see them.
export const EXTRA_STATES: StateDef[] = [
  stateDefSchema.parse({
    id: 'standing', name: 'Standing', scope: 'faction', min: 0, max: 4, start: 2, category: 'Factions', display: 'band', restBand: 2,
    bands: [
      { at: 0, label: 'wants you gone, and will act on it' },
      { at: 1, label: "doesn't trust you" },
      { at: 2, label: "doesn't know you" },
      { at: 3, label: 'counts you a friend' },
      { at: 4, label: 'counts you one of its own' },
    ],
    line: '[|name| |bandLabel|.]',
  }),
  stateDefSchema.parse({
    id: 'resources', name: 'Resources', scope: 'faction', min: 0, max: 3, start: 2, category: 'Factions', display: 'band', restBand: 2,
    bands: [
      { at: 0, label: 'has nothing left to spend' },
      { at: 1, label: 'is stretched thin' },
      { at: 2, label: 'has what it needs' },
      { at: 3, label: 'has money and hands to spare' },
    ],
    line: '[|name| |bandLabel|.]',
  }),
];
