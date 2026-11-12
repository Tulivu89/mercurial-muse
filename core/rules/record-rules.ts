// The rules block on a record: only what its author set. Everything else is worked out from the
// record's kind, its tier, its groups and the world's ruleset (for.ts). Every field is optional
// and none has a default, so an untouched record stores nothing.
//
// Pure data and validation: no DOM, no network, no storage.

import { z } from 'zod';
import { LADDER, PLACE_KINDS, TIERS, goodSchema, levelSchema, requirementSchema } from './ruleset.js';
import { threadRulesSchema } from './threads.js';

const id = z.string().min(1).max(200);
const numbers = z.record(id, z.number().int());

// What a character can carry in the rules. A group can carry the same fields as defaults for
// its members.
const memberFields = {
  // The Four Approaches tier. null says "no tier", whatever a group would give.
  tier: z.enum(TIERS).nullable().optional(),
  // Each rank turns one of their difficulty dice into a challenge die.
  rank: z.number().int().min(0).max(2).optional(),
  // A group that acts as one: their number is their Health and Strain. null says "one person".
  gang: z.number().int().min(2).max(8).nullable().optional(),
  // By approach, a step on the charge ladder.
  charges: z.record(id, z.enum(LADDER)).optional(),
  // Where a state starts, by state id. Approach ratings are states too.
  states: numbers.optional(),
  // This one's own most for a state.
  maxima: numbers.optional(),
  // How hard they are to act on, by approach, or "all" for every approach.
  difficulty: z.record(id, levelSchema).optional(),
  purse: z.number().int().min(0).optional(),
  price: z.number().int().min(0).optional(),
  forSale: z.boolean().optional(),
  // Goods by id: the standard catalog's, the world's, or an item record's own id.
  sells: z.array(id).max(60).optional(),
  carries: z.array(id).max(20).optional(),
};

export const memberRulesSchema = z.object(memberFields);
export type MemberRules = z.infer<typeof memberRulesSchema>;

const good = goodSchema.shape;
// An item as a good: what it is worth and what it does. Its name and description are the record's.
export const goodRulesSchema = z.object({
  kind: good.kind.optional(),
  worth: good.worth.optional(),
  plural: good.plural,
  helps: good.helps,
  harm: good.harm,
  hidden: z.boolean().optional(),
  armour: good.armour,
  hinders: z.array(id).max(4).optional(),
  makeable: z.boolean().optional(),
  fine: z.boolean().optional(),
  restores: z.array(z.object({ stateId: id, who: z.enum(['player', 'place']).default('player'), add: z.number().int() })).max(4).optional(),
});
export type GoodRules = z.infer<typeof goodRulesSchema>;

export const recordRulesSchema = z.object({
  ...memberFields,
  // Places: what kind of place. Areas (regions and larger) hold places and are never stood in.
  placeKind: z.enum(PLACE_KINDS).optional(),
  // Places: what crossing to or from it asks of a traveller (a boat for an island). A requirement
  // whose `toward` is the place applies only on the way in.
  crossing: z.array(requirementSchema).max(8).optional(),
  // Places: the icon the map draws, when it isn't its kind's (kit/src/map-icons.ts).
  icon: z.string().min(1).max(40).optional(),
  // Items.
  good: goodRulesSchema.optional(),
  // Groups: what members get unless they set their own.
  members: memberRulesSchema.optional(),
  // Threads: their kind and milestones.
  thread: threadRulesSchema.optional(),
});
export type RecordRules = z.infer<typeof recordRulesSchema>;

type Loose = Record<string, unknown>;

const isEmpty = (value: unknown) => value === undefined || (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0);

// Sets one rule on a record's block. The path is the field, then the key inside it:
// ['tier'], ['maxima', 'health'], ['good', 'worth'], ['members', 'maxima', 'health'].
export function setRule(rules: RecordRules | null | undefined, path: readonly string[], value: unknown): RecordRules {
  const [head, ...rest] = path;
  if (!head) return rules ?? {};
  const current = ((rules ?? {}) as Loose)[head];
  const next = rest.length ? setRule((current ?? {}) as RecordRules, rest, value) : value;
  return { ...(rules ?? {}), [head]: next } as RecordRules;
}

// Puts one rule back: removes it, and any block it leaves empty. Undefined when nothing is set
// any more, so the record stores no rules at all.
export function clearRule(rules: RecordRules | null | undefined, path: readonly string[]): RecordRules | undefined {
  const [head, ...rest] = path;
  if (!rules || !head) return rules ?? undefined;
  const next = { ...(rules as Loose) };
  if (rest.length) {
    const inner = clearRule(next[head] as RecordRules | undefined, rest);
    if (isEmpty(inner)) delete next[head]; else next[head] = inner;
  } else delete next[head];
  return Object.keys(next).length ? (next as RecordRules) : undefined;
}

// How many separate things this record's author set.
export function setCount(rules: RecordRules | null | undefined): number {
  if (!rules) return 0;
  const count = (value: unknown): number => {
    if (value === undefined) return 0;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 1;
    return Object.values(value).reduce<number>((sum, inner) => sum + count(inner), 0);
  };
  // A good's "helps" and each "restores" list count once, not once a field.
  const { good: goodRules, ...rest } = rules;
  const goodCount = goodRules ? Object.values(goodRules).filter((value) => value !== undefined).length : 0;
  return count(rest) + goodCount;
}
