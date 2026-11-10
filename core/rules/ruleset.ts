// The ruleset: what a world's rules are made of. Moved here from the adventure's module schema
// in 0.23.0, because the Studio is now its second reader. The adventure's module format still
// carries these shapes unchanged (adventure/src/engine/module.ts re-exports them).
//
// Pure data and validation: no DOM, no network, no storage.

import { z } from 'zod';
import { calendarSchema } from './clock.js';
import { stateDefSchema } from './state.js';
import { STANDARD_RULESET_ID } from './standard.js';

const id = z.string().min(1).max(200);
const text = (max: number) => z.string().max(max);

export const PLACE_KINDS = [
  'continent', 'major region', 'region', 'subregion', 'territory', 'settlement', 'town', 'village',
  'district', 'wilderness', 'building', 'landmark', 'road or trail', 'river', 'lake', 'sea or ocean', 'other',
] as const;

// Places that are areas on a map rather than somewhere to stand. They hold other places,
// are never a destination, and nobody walks through one to reach a sibling.
export const AREA_KINDS: readonly string[] = ['continent', 'major region', 'region', 'subregion', 'territory'];

// How hard something is to act on: the Genesys ladder from Simple (0) to Formidable (5), or
// 'random', rolled once per save. By approach, or 'all' for every approach.
export const DIFFICULTY_NAMES = ['Simple', 'Easy', 'Average', 'Hard', 'Daunting', 'Formidable'] as const;
export const levelSchema = z.union([z.number().int().min(0).max(5), z.literal('random')]);
export const difficultySchema = z.record(z.string(), levelSchema).default({});
export const TIERS = ['minion', 'rival', 'nemesis'] as const;
// A thing the player is making is owned as "work:<good id>".
export const WORK_PREFIX = 'work:';
// A charge ladder, lowest first. Each step adds the next charge: raw (+1) to master (+1 to +5).
export const LADDER = ['raw', 'practiced', 'trained', 'expert', 'master'] as const;

// How long a hop between a place and the place inside it takes, by the depth of the inner
// place (the island is 0). A tier with no row is free. No default numbers: there is no
// honest guess at the scale of a world nobody has written yet.
export const travelTierSchema = z.object({
  tier: z.number().int().min(0).max(20),
  minutes: z.number().int().min(0).max(100_000),
});

export const travelSchema = z.object({
  // Orbis's own on-foot pace for its route estimates.
  walkKph: z.number().positive().max(100).default(4),
  tiers: z.array(travelTierSchema).max(21).default([]),
});

// Something the player can do at a place that the rules settle outright, such as signing
// the Covenant at the gate. Offered while its conditions hold; resolving it writes its
// effects to the player's character and hands the narrator its outcome.
export const sceneActionSchema = z.object({
  id,
  name: z.string().min(1).max(120),
  // What it does, for the player.
  summary: text(400).default(''),
  // Where it is offered. Empty means anywhere.
  placeIds: z.array(id).max(200).default([]),
  // People who must be here for it to be offered: the broker for a sale, the sellsword for a hire.
  present: z.array(id).max(8).default([]),
  // Conditions, all of which must hold: on the player's character, or on someone else's when
  // `characterId` names them.
  when: z.array(z.object({
    stateId: id,
    characterId: id.optional(),
    atLeast: z.number().int().optional(),
    atMost: z.number().int().optional(),
  })).max(8).default([]),
  // When it is offered: on these weekdays (0 is the calendar's first day), between these
  // hours. Market days, opening hours, a deal that comes round now and then.
  open: z.object({
    weekdays: z.array(z.number().int().min(0).max(30)).max(31).default([]),
    fromHour: z.number().int().min(0).max(23).optional(),
    toHour: z.number().int().min(1).max(24).optional(),
  }).optional(),
  // What it changes, in order: the player's states, or someone else's when `characterId`
  // names them; or goods into or out of your pack (`goodId`, with `add`). A purchase pays
  // from your Coin and sets the person's contract.
  effects: z.array(z.object({
    stateId: id.optional(),
    goodId: id.optional(),
    characterId: id.optional(),
    set: z.number().int().optional(),
    add: z.number().int().optional(),
  })).min(1).max(8),
  // The player's line in the transcript.
  input: z.string().min(1).max(400),
  // What the narrator must show, for this turn only.
  outcome: z.string().min(1).max(1000),
}).passthrough();

// What a check costs: a change to the player's character, the place, or the target.
export const costSchema = z.object({
  stateId: id,
  who: z.enum(['player', 'place', 'target']),
  add: z.number().int(),
});

// One of the Four Approaches. Its rating is the character state with the same id. Failure
// and two or more threat cost what is listed here, paid by whoever owns the ground: an
// approach used as a secondary pays its owner's costs.
export const approachSchema = z.object({
  id,
  name: z.string().min(1).max(60),
  failure: z.array(costSchema).max(8).default([]),
  failureMinutes: z.number().int().min(0).max(100_000).default(0),
  threat: z.array(costSchema).max(8).default([]),
  threatMinutes: z.number().int().min(0).max(100_000).default(0),
}).passthrough();

// A condition that adds a setback die: the player hurt, the place watchful.
export const setbackSchema = z.object({
  stateId: id,
  who: z.enum(['player', 'place']),
  atLeast: z.number().int().optional(),
  atMost: z.number().int().optional(),
  // Only for these approaches. Empty means every approach.
  approaches: z.array(id).max(8).default([]),
  reason: z.string().min(1).max(200),
});

export const diceSchema = z.object({
  // Difficulty dice when nothing else sets it. Two is Genesys's Average.
  difficulty: z.number().int().min(0).max(5).default(2),
  // The player's states that hold Edge, Story Points and the hidden momentum count.
  edge: id.optional(),
  storyPoints: id.optional(),
  momentum: id.optional(),
  setbacks: z.array(setbackSchema).max(20).default([]),
  // What pushing costs the player: reusing a spent charge. Four Approaches: 2 Strain.
  push: z.object({ stateId: id, add: z.number().int() }).optional(),
});

// A full rest: waiting at least this long restores what is listed and resets charges.
export const restSchema = z.object({
  minutes: z.number().int().min(1).max(100_000).default(480),
  effects: z.array(z.object({ stateId: id, add: z.number().int().optional(), toMax: z.boolean().optional() })).max(8).default([]),
  resetCharges: z.boolean().default(true),
});

// An act with no state to wear down: it works or it fails, and fails at the approach's cost.
// Four Approaches: Finesse against a person (lift, slip past, plant).
export const deedSchema = z.object({
  kind: z.enum(['person', 'thing', 'place']),
  approach: id,
  label: z.string().min(1).max(120),
});

// When a fight is over. A check that brings someone to an end on `harm`, by any approach, or
// on a `yields` state by one of its approaches, ends the fight once no one else here is
// still in it: hurt on `harm` but standing. The narrator is told it is over, and the place's
// `settle` state falls to `atMost`. Four Approaches: Health; Strain by Force; Alert to 1.
export const fightSchema = z.object({
  harm: id,
  yields: z.array(z.object({ stateId: id, approaches: z.array(id).min(1).max(8) })).max(4).default([]),
  settle: z.object({ stateId: id, atMost: z.number().int() }).optional(),
});

// How experience is earned and spent. It is a state on the player (`stateId`). Overcoming
// someone the first time (bringing them to an end by a check) earns by their tier; an
// obstacle earns `obstacle`, or `hardObstacle` from difficulty `hardFrom`; failing against
// a rival or nemesis earns `lesson`, at most once a scene. A rating step costs
// `ratingCost` × the new rating, up to `ratingMax`; a ladder step `chargeCost` × the new
// top charge.
export const growthSchema = z.object({
  stateId: id,
  overcome: z.object({ minion: z.number().int().min(0), rival: z.number().int().min(0), nemesis: z.number().int().min(0) }),
  obstacle: z.number().int().min(0).default(1),
  hardObstacle: z.number().int().min(0).default(2),
  hardFrom: z.number().int().min(0).max(5).default(3),
  lesson: z.number().int().min(0).default(1),
  ratingCost: z.number().int().min(1).default(10),
  ratingMax: z.number().int().min(1).max(10).default(4),
  chargeCost: z.number().int().min(1).default(5),
});

// A kind of thing that changes hands: what it is worth on the ten-step scale, and what it
// does. A better sword does nothing a sword doesn't. `name` reads for one ("a mail shirt"),
// `plural` for more ("mail shirts").
export const goodSchema = z.object({
  id,
  name: z.string().min(1).max(80),
  plural: z.string().min(1).max(80).optional(),
  description: text(1000).default(''),
  worth: z.number().int().min(0).max(1_000_000),
  // help: a boost die on checks it fits. weapon: more harm on a Force success against a
  // person. armour: takes the first Health a failure costs, renewed on a rest. use: spent
  // when used. goods: worth only.
  kind: z.enum(['help', 'weapon', 'armour', 'use', 'goods']),
  // What a help fits: these approaches, on these kinds of target, or these ones by id.
  helps: z.object({
    approaches: z.array(id).min(1).max(4),
    kinds: z.array(z.enum(['person', 'thing', 'place'])).max(3).default([]),
    ids: z.array(id).max(40).default([]),
  }).optional(),
  harm: z.number().int().min(0).max(5).optional(),
  // A weapon that can be carried unseen.
  hidden: z.boolean().default(false),
  armour: z.number().int().min(0).max(5).optional(),
  // Approaches it gets in the way of, with one setback die: plate and Finesse.
  hinders: z.array(id).max(4).default([]),
  // Whether Focus can make it, and whether that is fine or secret work (Hard): a forgery.
  makeable: z.boolean().default(true),
  fine: z.boolean().default(false),
  // A use: what it changes, on you or on the place.
  restores: z.array(z.object({ stateId: id, who: z.enum(['player', 'place']).default('player'), add: z.number().int() })).max(4).default([]),
});

// Trade in the Four Approaches standard. `coin` is the player's purse. `bargain` is a seller's
// state, built by Flair: each point takes a quarter off your next purchase from them, up to
// half. `refusing` marks a seller who won't deal with you for now. `price` is the bribe that
// tempts someone, and `purse` the coin they carry, by tier. A seller pays a good's worth for
// what they sell, and `sellBack` of it for anything else. Bribes help `bribeApproaches`.
export const tradeSchema = z.object({
  coin: id,
  bargain: id.optional(),
  refusing: id.optional(),
  armour: id.optional(),
  price: z.object({ minion: z.number().int().min(0), rival: z.number().int().min(0), nemesis: z.number().int().min(0) }),
  purse: z.object({ minion: z.number().int().min(0), rival: z.number().int().min(0), nemesis: z.number().int().min(0) }),
  sellBack: z.number().min(0).max(1).default(0.5),
  bribeApproaches: z.array(id).max(4).default([]),
});

// Making things with Focus. A work is a track (`stateId`) that grows like Prepared; when it is
// full the thing is made. The good's worth picks its step: how long the track is, and how
// long each check takes. Materials cost `materials` of the worth, paid when you start. Each
// check is `difficulty`, or `fineDifficulty` for fine or secret work. A failure takes as long
// again; a despair spoils the materials.
export const craftSchema = z.object({
  approach: id,
  stateId: id,
  materials: z.number().min(0).max(1).default(0.5),
  difficulty: z.number().int().min(0).max(5).default(2),
  fineDifficulty: z.number().int().min(0).max(5).default(3),
  steps: z.array(z.object({ upTo: z.number().int().min(0), track: z.number().int().min(1).max(20), minutes: z.number().int().min(1) })).min(1).max(10),
});

export const tierSchema = z.object({
  difficulty: z.number().int().min(0).max(5),
  maxima: z.record(z.string(), z.number().int()).default({}),
});

// A way someone can come along with you when you travel. It holds when any one of its
// conditions does: a state of theirs within bounds, or a bond with you at or above the tier
// its kind marks (StateDef.followsFrom).
export const followConditionSchema = z.union([
  z.object({ stateId: id, atLeast: z.number().int().optional(), atMost: z.number().int().optional() }).strict(),
  z.object({ bond: z.literal('follows') }).strict(),
]);

export const followRuleSchema = z.object({
  id,
  // The button: "Bring along as your captive".
  label: z.string().min(1).max(80),
  // How the narrator hears it: "your captive", "travelling with you".
  as: z.string().min(1).max(80),
  anyOf: z.array(followConditionSchema).min(1).max(8),
});

export const rulesetSchema = z.object({
  // "four-approaches/1" lays the standard ruleset beneath this one (standard.ts).
  extends: z.literal(STANDARD_RULESET_ID).optional(),
  states: z.array(stateDefSchema).max(500).default([]),
  // Absent means the real calendar (DEFAULT_CALENDAR).
  calendar: calendarSchema.optional(),
  travel: travelSchema.default({ walkKph: 4, tiers: [] }),
  actions: z.array(sceneActionSchema).max(1000).default([]),
  approaches: z.array(approachSchema).max(12).default([]),
  dice: diceSchema.optional(),
  rest: restSchema.optional(),
  deeds: z.array(deedSchema).max(40).default([]),
  follow: z.array(followRuleSchema).max(12).default([]),
  fight: fightSchema.optional(),
  growth: growthSchema.optional(),
  goods: z.array(goodSchema).max(2000).default([]),
  trade: tradeSchema.optional(),
  craft: craftSchema.optional(),
  tiers: z.object({ minion: tierSchema.optional(), rival: tierSchema.optional(), nemesis: tierSchema.optional() }).optional(),
});

export type Ruleset = z.infer<typeof rulesetSchema>;
export type SceneAction = z.infer<typeof sceneActionSchema>;
export type Approach = z.infer<typeof approachSchema>;
export type Deed = z.infer<typeof deedSchema>;
export type FollowRule = z.infer<typeof followRuleSchema>;
export type GoodDef = z.infer<typeof goodSchema>;
export type TierRules = z.infer<typeof tierSchema>;
export type Level = z.infer<typeof levelSchema>;
export type Tier = (typeof TIERS)[number];
export type LadderStep = (typeof LADDER)[number];
export type Cost = z.infer<typeof costSchema>;
export type PlaceKind = (typeof PLACE_KINDS)[number];
