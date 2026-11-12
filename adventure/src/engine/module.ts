// A Praxis module: read-only canon for one playthrough.
//
//   world     Orbis record shapes, with Orbis field names and IDs. Orbis documents are
//             free-form JSON, so every record keeps fields this schema does not name; a
//             later Orbis loader then replaces a file read rather than a translation.
//             A place can say what crossing to or from it asks (`crossing`). Routes retired
//             in 0.27.0: travel comes from the levels and the map (docs/bids/maps/decision.md).
//   ruleset   The state catalog, the calendar and travel by level; from v0.2, dice.
//   map       What an author changed on each sheet of the map, roads included (core/map).
//   scenario  Where and when play starts, and who is present.
//   threads   What is pushing the story, with milestones the rules see reached (0.25.0).
//
// Play never writes to a module. Current values live in the save.

import { z } from 'zod';
import { appliesTo, forOwner, WORLD_OWNER, type StateDef } from './state';
import { withStandard } from './standard';
import {
  AREA_KINDS, LADDER, PLACE_KINDS, TIERS, WORK_PREFIX, difficultySchema, requirementSchema, rulesetSchema,
} from '../../../core/rules/ruleset';
import { mapSchema } from '../../../core/map/schema';
import { threadSchema } from '../../../core/rules/threads';

// The ruleset's own shapes live in core/rules since 0.23.0; they are part of this module's surface as before.
export * from '../../../core/rules/ruleset';

export const MODULE_FORMAT = 'adventure-module/1';
// Still read: modules written before the formats got neutral names in 0.22.0.
export const LEGACY_MODULE_FORMAT = 'praxis-module/1';

const id = z.string().min(1).max(200);
const text = (max: number) => z.string().max(max);

// Fields every Orbis library record shares.
const recordBase = {
  id,
  name: z.string().min(1).max(120),
  summary: text(2000).optional(),
  contentRating: z.enum(['sfw', 'adult']).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
};



export const placeSchema = z.object({
  id,
  name: z.string().min(1).max(120),
  description: text(8000).default(''),
  kind: z.enum(PLACE_KINDS).default('other'),
  parentLocationId: id.nullable().default(null),
  difficulty: difficultySchema,
  // What crossing to or from this place asks of a traveller: a boat for an island. A requirement
  // whose `toward` is this place applies only on the way in.
  crossing: z.array(requirementSchema).max(8).default([]),
}).passthrough();

// Species, factions, societies and families: the Orbis editor asks only for these two fields.
export const worldEntrySchema = z.object({
  id,
  name: z.string().min(1).max(120),
  description: text(8000).default(''),
}).passthrough();

// Orbis titles memories with `title`, not `name`.
export const memorySchema = z.object({
  id,
  title: z.string().min(1).max(200),
  description: text(8000).default(''),
}).passthrough();

// One stop in a day: from this hour until the next stop, the person is here doing this.
// The last stop runs on past midnight to the first, so someone asleep from 23:00 is still
// asleep at 01:00. Character Engine's shape.
export const scheduleRowSchema = z.object({
  fromHour: z.number().int().min(0).max(23),
  locationId: id,
  doing: text(400).default(''),
});

export const dayPlanSchema = z.object({
  id,
  name: z.string().min(1).max(80),
  rows: z.array(scheduleRowSchema).min(1).max(24),
});

// A state a schedule rule waits on: someone's, or the world's. `characterId` names the owner:
// absent, the person whose schedule it is; "world" for a world state. So a girl who turns
// feral leaves her room only once she has, and a patrol stays away once its errand is known.
export const scheduleStateSchema = z.object({
  stateId: id,
  characterId: id.optional(),
  atLeast: z.number().int().optional(),
  atMost: z.number().int().optional(),
});

// When a plan other than the first applies. Every field must match; an absent field matches
// anything. Weekday, month and day of the month count from zero; fromDay and toDay are
// absolute days since story zero, for a world with no week.
export const planRuleSchema = z.object({
  planId: id,
  when: z.object({
    weekday: z.number().int().min(0).optional(),
    month: z.number().int().min(0).optional(),
    monthDay: z.number().int().min(0).optional(),
    fromDay: z.number().int().min(0).optional(),
    toDay: z.number().int().min(0).optional(),
    state: scheduleStateSchema.optional(),
  }),
});

// Where someone is when the story is not watching. The first plan is the ordinary day; the
// first rule that matches picks another.
export const scheduleSchema = z.object({
  plans: z.array(dayPlanSchema).min(1).max(20),
  rules: z.array(planRuleSchema).max(50).default([]),
});

export const characterSchema = z.object({
  ...recordBase,
  description: text(8000).default(''),
  // The dossier. Orbis characters take these as free-form fields; the names follow Orbis's
  // persona record (appearance, personality, speech) so one shape serves both.
  role: text(200).optional(),
  // As Orbis's persona record writes them: "she/her", "he/him", "they/them", "it/its".
  // Unset reads as they/them.
  pronouns: text(40).optional(),
  appearance: text(4000).optional(),
  personality: text(4000).optional(),
  speech: text(4000).optional(),
  speciesId: id.optional(),
  factionIds: z.array(id).max(50).default([]),
  homeLocationId: id.optional(),
  workplaceLocationIds: z.array(id).max(20).default([]),
  schedule: scheduleSchema.optional(),
  // Starting values that differ from a state's own start.
  states: z.record(z.string(), z.number().int()).default({}),
  // This character's own maximum for a state, such as a minion's 2 Health. Bands with a
  // 'share' basis read against it.
  maxima: z.record(z.string(), z.number().int()).default({}),
  // Four Approaches charges, by approach, a step on the ladder: raw (+1), practiced (+1, +2),
  // trained (+1 to +3), expert (+1 to +4), master (+1 to +5).
  charges: z.record(z.string(), z.enum(LADDER)).default({}),
  // The Four Approaches tier: sets how hard they are to act against and, unless `maxima`
  // says otherwise, their Health and Strain.
  tier: z.enum(TIERS).optional(),
  // Each rank upgrades one of their difficulty dice to a challenge die: 0 to 2.
  rank: z.number().int().min(0).max(2).default(0),
  // A group that acts as one, such as three dock toughs: their number is their Health and
  // Strain, and how many difficulty dice they bring, up to four.
  gang: z.number().int().min(2).max(8).optional(),
  // Trade. Goods they sell, at their worth; goods they carry, which you can take when they are
  // down or have given way; the coin they carry, unless their tier's purse; the bribe that
  // tempts them, unless their tier's price; and whether they can be bought at all.
  sells: z.array(id).max(60).default([]),
  carries: z.array(id).max(20).default([]),
  purse: z.number().int().min(0).optional(),
  price: z.number().int().min(0).optional(),
  forSale: z.boolean().default(true),
  difficulty: difficultySchema,
}).passthrough();

// Two people and what lies between them, Character Engine's pair record. Not an Orbis
// collection yet; part of the Orbis proposal. `bondStateId` names a relationship-scoped
// state whose bands are the bond's tiers. `states` holds starting values, as on characters.
export const relationshipSchema = z.object({
  id,
  personIds: z.tuple([id, id]),
  bondStateId: id.optional(),
  // What the relationship is. Shared by both sides.
  shape: text(2000).default(''),
  // What happens in the room when both are there.
  together: text(1000).default(''),
  // What each side wants out of it, by character id.
  wants: z.record(z.string(), text(600)).default({}),
  states: z.record(z.string(), z.number().int()).default({}),
}).passthrough();

export const itemSchema = z.object({
  ...recordBase,
  description: text(8000).default(''),
  // Where it lies, or who carries it. Orbis items take free-form fields; these follow the
  // names Praxis's own records use.
  locationId: id.optional(),
  heldBy: id.optional(),
  difficulty: difficultySchema,
}).passthrough();

export const worldSchema = z.object({
  ...recordBase,
  identity: z.object({
    name: text(120).optional(),
    description: text(8000).optional(),
    genre: text(200).optional(),
    tone: text(200).optional(),
  }).passthrough().default({}),
  lore: z.record(z.string(), z.unknown()).default({}),
  rules: z.record(z.string(), z.unknown()).default({}),
  timeWeather: z.record(z.string(), z.unknown()).default({}),
  places: z.array(placeSchema).max(5000).default([]),
  species: z.array(worldEntrySchema).max(500).default([]),
  factions: z.array(worldEntrySchema).max(500).default([]),
  societies: z.array(worldEntrySchema).max(500).default([]),
  families: z.array(worldEntrySchema).max(500).default([]),
  memories: z.array(memorySchema).max(5000).default([]),
});


export const scenarioSchema = z.object({
  title: z.string().min(1).max(200),
  startPlaceId: id,
  // Minutes since story zero.
  startAt: z.number().int().nonnegative().default(8 * 60),
  playerCharacterId: id,
  presentCharacterIds: z.array(id).max(200).default([]),
  opening: text(20000).default(''),
});

export const moduleSchema = z.object({
  format: z.enum([MODULE_FORMAT, LEGACY_MODULE_FORMAT]).transform((): typeof MODULE_FORMAT => MODULE_FORMAT),
  id,
  name: z.string().min(1).max(200),
  version: z.string().min(1).max(40),
  // For authors: what is placeholder, where the material came from.
  notes: text(8000).default(''),
  source: z.object({
    kind: z.enum(['orbis', 'local']),
    worldId: id.optional(),
    revision: z.string().max(80).optional(),
  }),
  world: worldSchema,
  characters: z.array(characterSchema).max(5000).default([]),
  relationships: z.array(relationshipSchema).max(5000).default([]),
  items: z.array(itemSchema).max(5000).default([]),
  ruleset: rulesetSchema.default({ states: [], actions: [], approaches: [], deeds: [], follow: [], goods: [] }),
  map: mapSchema.optional(),
  scenario: scenarioSchema,
  threads: z.array(threadSchema).max(200).default([]),
}).superRefine((module, context) => {
  const issue = (path: (string | number)[], message: string) => context.addIssue({ code: 'custom', path, message });

  const unique = (ids: string[], path: (string | number)[]) => {
    const seen = new Set<string>();
    ids.forEach((value, index) => {
      if (seen.has(value)) issue([...path, index, 'id'], `Duplicate id "${value}".`);
      seen.add(value);
    });
  };

  const places = new Map(module.world.places.map((place) => [place.id, place]));
  const characterIds = new Set(module.characters.map((character) => character.id));
  const states = new Map(module.ruleset.states.map((state) => [state.id, state]));
  const isArea = (placeId: string) => AREA_KINDS.includes(places.get(placeId)?.kind ?? '');
  const characterState = (state: StateDef | undefined) => Boolean(state && (appliesTo(state, 'character', true) || appliesTo(state, 'character', false)));

  unique(module.world.places.map((place) => place.id), ['world', 'places']);
  unique(module.characters.map((character) => character.id), ['characters']);
  unique(module.ruleset.states.map((state) => state.id), ['ruleset', 'states']);

  module.world.places.forEach((place, index) => {
    if (place.parentLocationId !== null && !places.has(place.parentLocationId)) {
      issue(['world', 'places', index, 'parentLocationId'], `Unknown parent place "${place.parentLocationId}".`);
    }
  });

  // A place inside itself, at any depth, would hang every walk up the map.
  module.world.places.forEach((place, index) => {
    const seen = new Set<string>([place.id]);
    let parent = place.parentLocationId;
    while (parent !== null && places.has(parent)) {
      if (seen.has(parent)) {
        issue(['world', 'places', index, 'parentLocationId'], `Place "${place.id}" is inside itself.`);
        break;
      }
      seen.add(parent);
      parent = places.get(parent)?.parentLocationId ?? null;
    }
  });

  // What crossing to or from a place asks waits on a state a traveller holds.
  module.world.places.forEach((place, index) => {
    place.crossing.forEach((requirement, requirementIndex) => {
      const path = ['world', 'places', index, 'crossing', requirementIndex];
      if (!characterState(states.get(requirement.stateId))) issue([...path, 'stateId'], `"${requirement.stateId}" is not a state a character holds.`);
      if (requirement.toward !== undefined && requirement.toward !== place.id) issue([...path, 'toward'], `"${requirement.toward}" is not this place; a crossing rule can apply only on the way in to it.`);
    });
  });

  module.ruleset.states.forEach((state, index) => {
    if (state.bands.length > 0 && state.restBand >= state.bands.length) {
      issue(['ruleset', 'states', index, 'restBand'], `Resting band ${state.restBand} does not exist.`);
    }
    if (state.npcLabels && state.npcLabels.length !== state.bands.length) {
      issue(['ruleset', 'states', index, 'npcLabels'], `There are ${state.bands.length} bands but ${state.npcLabels.length} labels for other people.`);
    }
  });

  const playerState = (state: StateDef | undefined) => Boolean(state && appliesTo(state, 'character', true));
  const placeState = (state: StateDef | undefined) => Boolean(state && appliesTo(state, 'place'));
  const approachIds = new Set(module.ruleset.approaches.map((approach) => approach.id));
  const goodIds = new Set(module.ruleset.goods.map((good) => good.id));
  unique(module.ruleset.goods.map((good) => good.id), ['ruleset', 'goods']);
  unique(module.ruleset.approaches.map((approach) => approach.id), ['ruleset', 'approaches']);
  module.ruleset.approaches.forEach((approach, index) => {
    if (!characterState(states.get(approach.id))) issue(['ruleset', 'approaches', index, 'id'], `An approach's rating is the character state "${approach.id}", which does not exist.`);
    (['failure', 'threat'] as const).forEach((kind) => approach[kind].forEach((cost, costIndex) => {
      const state = states.get(cost.stateId);
      const fits = cost.who === 'place' ? placeState(state) : cost.who === 'player' ? playerState(state) : characterState(state);
      if (!fits) issue(['ruleset', 'approaches', index, kind, costIndex, 'stateId'], `"${cost.stateId}" is not a state ${cost.who === 'place' ? 'a place' : 'a character'} holds.`);
    }));
  });
  module.ruleset.states.forEach((state, index) => {
    if (!state.approach || !approachIds.size) return;
    for (const approachId of [state.approach.owner, ...state.approach.secondary]) {
      if (!approachIds.has(approachId)) issue(['ruleset', 'states', index, 'approach'], `Unknown approach "${approachId}".`);
    }
  });
  const dice = module.ruleset.dice;
  if (dice) {
    if (dice.push && !playerState(states.get(dice.push.stateId))) issue(['ruleset', 'dice', 'push', 'stateId'], `"${dice.push.stateId}" is not a state the player's character holds.`);
    for (const key of ['edge', 'storyPoints', 'momentum'] as const) {
      const stateId = dice[key];
      if (stateId && !playerState(states.get(stateId))) issue(['ruleset', 'dice', key], `"${stateId}" is not a state the player's character holds.`);
    }
    dice.setbacks.forEach((setback, setbackIndex) => {
      const state = states.get(setback.stateId);
      if (!(setback.who === 'place' ? placeState(state) : playerState(state))) issue(['ruleset', 'dice', 'setbacks', setbackIndex, 'stateId'], `"${setback.stateId}" does not fit "${setback.who}".`);
    });
  }
  const fight = module.ruleset.fight;
  if (fight) {
    if (!states.has(fight.harm)) issue(['ruleset', 'fight', 'harm'], `Unknown state "${fight.harm}".`);
    fight.yields.forEach((entry, index) => {
      if (!states.has(entry.stateId)) issue(['ruleset', 'fight', 'yields', index, 'stateId'], `Unknown state "${entry.stateId}".`);
      entry.approaches.forEach((approachId, at) => {
        if (!approachIds.has(approachId)) issue(['ruleset', 'fight', 'yields', index, 'approaches', at], `Unknown approach "${approachId}".`);
      });
    });
    if (fight.settle && !states.has(fight.settle.stateId)) issue(['ruleset', 'fight', 'settle', 'stateId'], `Unknown state "${fight.settle.stateId}".`);
  }
  const growth = module.ruleset.growth;
  if (growth && !playerState(states.get(growth.stateId))) issue(['ruleset', 'growth', 'stateId'], `"${growth.stateId}" is not a state the player's character holds.`);
  module.ruleset.rest?.effects.forEach((effect, effectIndex) => {
    if (!playerState(states.get(effect.stateId))) issue(['ruleset', 'rest', 'effects', effectIndex, 'stateId'], `"${effect.stateId}" is not a state the player's character holds.`);
  });
  module.characters.forEach((character, index) => {
    for (const approachId of Object.keys(character.charges)) {
      if (!approachIds.has(approachId)) issue(['characters', index, 'charges', approachId], `Unknown approach "${approachId}".`);
    }
    if (character.tier && !module.ruleset.tiers?.[character.tier]) issue(['characters', index, 'tier'], `The ruleset has no "${character.tier}" tier.`);
  });
  const checkDifficulty = (difficulty: Record<string, unknown>, path: (string | number)[]) => {
    for (const key of Object.keys(difficulty)) {
      if (key !== 'all' && !approachIds.has(key)) issue([...path, 'difficulty', key], `Unknown approach "${key}".`);
    }
  };
  module.characters.forEach((character, index) => checkDifficulty(character.difficulty, ['characters', index]));
  module.items.forEach((item, index) => checkDifficulty(item.difficulty, ['items', index]));
  module.world.places.forEach((place, index) => checkDifficulty(place.difficulty, ['world', 'places', index]));
  module.ruleset.deeds.forEach((deed, index) => {
    if (!approachIds.has(deed.approach)) issue(['ruleset', 'deeds', index, 'approach'], `Unknown approach "${deed.approach}".`);
  });
  unique(module.ruleset.follow.map((rule) => rule.id), ['ruleset', 'follow']);
  module.ruleset.follow.forEach((rule, index) => {
    rule.anyOf.forEach((condition, conditionIndex) => {
      if (!('stateId' in condition)) return;
      const state = states.get(condition.stateId);
      if (!state || !['char', 'npc'].includes(state.scope)) issue(['ruleset', 'follow', index, 'anyOf', conditionIndex, 'stateId'], `"${condition.stateId}" is not a state other people hold.`);
    });
  });
  unique(module.ruleset.actions.map((action) => action.id), ['ruleset', 'actions']);
  module.ruleset.actions.forEach((action, index) => {
    const path = ['ruleset', 'actions', index];
    action.placeIds.forEach((placeId, placeIndex) => {
      if (!places.has(placeId)) issue([...path, 'placeIds', placeIndex], `Unknown place "${placeId}".`);
    });
    // A condition or effect on the player, on a named person who is not the player, or on
    // the world ("world").
    const holds = (stateId: string, characterId: string | undefined) => {
      if (!characterId) return playerState(states.get(stateId));
      const state = states.get(stateId);
      if (characterId === WORLD_OWNER) return state?.scope === 'world';
      return Boolean(state && characterIds.has(characterId) && characterId !== module.scenario.playerCharacterId && appliesTo(state, 'character', false));
    };
    action.present.forEach((personId, personIndex) => {
      if (!characterIds.has(personId)) issue([...path, 'present', personIndex], `Unknown character "${personId}".`);
    });
    action.when.forEach((condition, conditionIndex) => {
      if (!holds(condition.stateId, condition.characterId)) issue([...path, 'when', conditionIndex, 'stateId'], condition.characterId ? `"${condition.stateId}" is not a state ${condition.characterId} holds.` : `"${condition.stateId}" is not a state the player's character holds.`);
    });
    action.effects.forEach((effect, effectIndex) => {
      if ((effect.stateId === undefined) === (effect.goodId === undefined)) issue([...path, 'effects', effectIndex], 'An effect changes either a state or goods in your pack.');
      if (effect.stateId !== undefined && !holds(effect.stateId, effect.characterId)) issue([...path, 'effects', effectIndex, 'stateId'], effect.characterId ? `"${effect.stateId}" is not a state ${effect.characterId} holds.` : `"${effect.stateId}" is not a state the player's character holds.`);
      if (effect.goodId !== undefined) {
        if (!goodIds.has(effect.goodId)) issue([...path, 'effects', effectIndex, 'goodId'], `Unknown good "${effect.goodId}".`);
        if (effect.add === undefined || effect.set !== undefined || effect.characterId !== undefined) issue([...path, 'effects', effectIndex], 'Goods are added to or taken from your pack.');
      } else if ((effect.set === undefined) === (effect.add === undefined)) issue([...path, 'effects', effectIndex], 'An effect either sets a value or adds to it.');
    });
  });

  // A milestone's conditions are on the player, a named person, or the world; what it turns on
  // is a place, a person or a thing in the module.
  unique(module.threads.map((thread) => thread.id), ['threads']);
  const itemIds = new Set(module.items.map((item) => item.id));
  module.threads.forEach((thread, index) => {
    unique(thread.milestones.map((milestone) => milestone.id), ['threads', index, 'milestones']);
    thread.milestones.forEach((milestone, milestoneIndex) => {
      const path = ['threads', index, 'milestones', milestoneIndex];
      if (milestone.targetId !== undefined && !places.has(milestone.targetId) && !characterIds.has(milestone.targetId) && !itemIds.has(milestone.targetId)) issue([...path, 'targetId'], `Unknown place, person or thing "${milestone.targetId}".`);
      if (milestone.fromDay !== undefined && milestone.byDay !== undefined && milestone.byDay < milestone.fromDay) issue([...path, 'byDay'], 'It would be missed before it could be reached.');
      milestone.when.forEach((condition, conditionIndex) => {
        const state = states.get(condition.stateId);
        const fits = !condition.characterId || condition.characterId === module.scenario.playerCharacterId ? playerState(state)
          : condition.characterId === WORLD_OWNER ? state?.scope === 'world'
            : Boolean(state && characterIds.has(condition.characterId) && appliesTo(state, 'character', false));
        if (!fits) issue([...path, 'when', conditionIndex, 'stateId'], `"${condition.stateId}" is not a state ${condition.characterId ?? "the player's character"} holds.`);
      });
    });
  });

  const trade = module.ruleset.trade;
  if (trade) {
    if (!playerState(states.get(trade.coin))) issue(['ruleset', 'trade', 'coin'], `"${trade.coin}" is not a state the player's character holds.`);
    if (trade.armour && !playerState(states.get(trade.armour))) issue(['ruleset', 'trade', 'armour'], `"${trade.armour}" is not a state the player's character holds.`);
    for (const key of ['bargain', 'refusing'] as const) {
      const stateId = trade[key];
      if (stateId && !states.get(stateId)) issue(['ruleset', 'trade', key], `Unknown state "${stateId}".`);
    }
  }
  module.ruleset.goods.forEach((good, index) => {
    good.helps?.approaches.forEach((approachId, at) => {
      if (!approachIds.has(approachId)) issue(['ruleset', 'goods', index, 'helps', 'approaches', at], `Unknown approach "${approachId}".`);
    });
    good.restores.forEach((effect, at) => {
      const state = states.get(effect.stateId);
      if (!(effect.who === 'place' ? placeState(state) : playerState(state))) issue(['ruleset', 'goods', index, 'restores', at, 'stateId'], `"${effect.stateId}" does not apply there.`);
    });
  });

  module.characters.forEach((character, index) => {
    [...character.sells.map((goodId, at) => ['sells', at, goodId] as const), ...character.carries.map((goodId, at) => ['carries', at, goodId] as const)].forEach(([field, at, goodId]) => {
      if (!goodIds.has(goodId)) issue(['characters', index, field, at], `Unknown good "${goodId}".`);
    });
    if (character.homeLocationId !== undefined && !places.has(character.homeLocationId)) {
      issue(['characters', index, 'homeLocationId'], `Unknown place "${character.homeLocationId}".`);
    }
    for (const stateId of Object.keys(character.states)) {
      if (!characterState(states.get(stateId))) issue(['characters', index, 'states', stateId], `"${stateId}" is not a state a character holds.`);
    }
    for (const [stateId, maximum] of Object.entries(character.maxima)) {
      const state = states.get(stateId);
      if (!characterState(state)) issue(['characters', index, 'maxima', stateId], `"${stateId}" is not a state a character holds.`);
      else if (state && maximum <= Math.min(state.min, state.max)) issue(['characters', index, 'maxima', stateId], `A maximum of ${maximum} leaves no room above the minimum.`);
    }
  });

  module.items.forEach((item, index) => {
    if (item.locationId !== undefined && !places.has(item.locationId)) issue(['items', index, 'locationId'], `Unknown place "${item.locationId}".`);
    if (item.heldBy !== undefined && !characterIds.has(item.heldBy)) issue(['items', index, 'heldBy'], `Unknown character "${item.heldBy}".`);
  });

  module.characters.forEach((character, index) => {
    character.workplaceLocationIds.forEach((placeId, placeIndex) => {
      if (!places.has(placeId)) issue(['characters', index, 'workplaceLocationIds', placeIndex], `Unknown place "${placeId}".`);
    });
    const schedule = character.schedule;
    if (!schedule) return;
    if (character.id === module.scenario.playerCharacterId) issue(['characters', index, 'schedule'], 'The player character keeps no schedule; the player decides where they go.');
    unique(schedule.plans.map((plan) => plan.id), ['characters', index, 'schedule', 'plans']);
    const planIds = new Set(schedule.plans.map((plan) => plan.id));
    schedule.plans.forEach((plan, planIndex) => {
      const hours = new Set<number>();
      plan.rows.forEach((row, rowIndex) => {
        const path = ['characters', index, 'schedule', 'plans', planIndex, 'rows', rowIndex];
        if (hours.has(row.fromHour)) issue([...path, 'fromHour'], `Two stops start at ${row.fromHour}:00.`);
        hours.add(row.fromHour);
        if (!places.has(row.locationId)) issue([...path, 'locationId'], `Unknown place "${row.locationId}".`);
        else if (isArea(row.locationId)) issue([...path, 'locationId'], `"${row.locationId}" is an area, not somewhere to be.`);
      });
    });
    schedule.rules.forEach((rule, ruleIndex) => {
      if (!planIds.has(rule.planId)) issue(['characters', index, 'schedule', 'rules', ruleIndex, 'planId'], `Unknown plan "${rule.planId}".`);
      const condition = rule.when.state;
      if (!condition) return;
      const state = states.get(condition.stateId);
      const owner = condition.characterId ?? character.id;
      const fits = owner === WORLD_OWNER
        ? state?.scope === 'world'
        : characterIds.has(owner) && Boolean(state && appliesTo(state, 'character', owner === module.scenario.playerCharacterId));
      if (!fits) issue(['characters', index, 'schedule', 'rules', ruleIndex, 'when', 'state'], `"${condition.stateId}" is not a state ${owner === WORLD_OWNER ? 'the world' : owner} holds.`);
    });
  });

  unique(module.relationships.map((relationship) => relationship.id), ['relationships']);
  const pairs = new Set<string>();
  module.relationships.forEach((relationship, index) => {
    const [a, b] = relationship.personIds;
    relationship.personIds.forEach((personId, personIndex) => {
      if (!characterIds.has(personId)) issue(['relationships', index, 'personIds', personIndex], `Unknown character "${personId}".`);
    });
    if (a === b) issue(['relationships', index, 'personIds'], 'A relationship needs two different people.');
    const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (pairs.has(pair)) issue(['relationships', index, 'personIds'], 'These two already have a relationship.');
    pairs.add(pair);
    const bond = relationship.bondStateId ? states.get(relationship.bondStateId) : undefined;
    if (relationship.bondStateId && bond?.scope !== 'relationship') issue(['relationships', index, 'bondStateId'], `"${relationship.bondStateId}" is not a relationship state.`);
    for (const stateId of Object.keys(relationship.states)) {
      if (states.get(stateId)?.scope !== 'relationship') issue(['relationships', index, 'states', stateId], `"${stateId}" is not a relationship state.`);
    }
    for (const personId of Object.keys(relationship.wants)) {
      if (personId !== a && personId !== b) issue(['relationships', index, 'wants', personId], `"${personId}" is not one of the two.`);
    }
  });

  const { scenario } = module;
  if (!places.has(scenario.startPlaceId)) issue(['scenario', 'startPlaceId'], `Unknown place "${scenario.startPlaceId}".`);
  else if (isArea(scenario.startPlaceId)) issue(['scenario', 'startPlaceId'], `"${scenario.startPlaceId}" is an area, not somewhere to start.`);
  if (!characterIds.has(scenario.playerCharacterId)) issue(['scenario', 'playerCharacterId'], `Unknown character "${scenario.playerCharacterId}".`);
  scenario.presentCharacterIds.forEach((characterId, index) => {
    if (!characterIds.has(characterId)) issue(['scenario', 'presentCharacterIds', index], `Unknown character "${characterId}".`);
    if (characterId === scenario.playerCharacterId) issue(['scenario', 'presentCharacterIds', index], 'The player character is always present.');
  });
});

export type PraxisModule = z.infer<typeof moduleSchema>;
export type Place = z.infer<typeof placeSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
export type ScheduleState = z.infer<typeof scheduleStateSchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
export type ScheduleRow = z.infer<typeof scheduleRowSchema>;
export type Item = z.infer<typeof itemSchema>;
export type WorldEntry = z.infer<typeof worldEntrySchema>;
export type Memory = z.infer<typeof memorySchema>;

// A state's definition as it applies to one owner, with that character's own maximum.
export function stateDefFor(module: PraxisModule, defId: string, ownerId: string): StateDef | undefined {
  const def = module.ruleset.states.find((state) => state.id === defId);
  if (!def) return undefined;
  const character = module.characters.find((entry) => entry.id === ownerId);
  // A work's track is as long as its good's step.
  if (ownerId.startsWith(WORK_PREFIX)) {
    const good = module.ruleset.goods.find((entry) => entry.id === ownerId.slice(WORK_PREFIX.length));
    const step = good ? module.ruleset.craft?.steps.find((entry) => good.worth <= entry.upTo) : undefined;
    return forOwner(def, step?.track);
  }
  const fight = module.ruleset.fight;
  const gang = character?.gang && fight && (defId === fight.harm || fight.yields.some((rule) => rule.stateId === defId)) ? character.gang : undefined;
  const maximum = character?.maxima[defId] ?? gang ?? (character?.tier ? module.ruleset.tiers?.[character.tier]?.maxima[defId] : undefined);
  return forOwner(def, maximum);
}

export type ModuleLoadResult =
  | { ok: true; module: PraxisModule }
  | { ok: false; errors: string[] };

// Parses and validates a module. Errors come back as readable lines with their location.
export function loadModule(raw: unknown): ModuleLoadResult {
  const parsed = moduleSchema.safeParse(withStandard(raw));
  if (parsed.success) return { ok: true, module: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((entry) => `${entry.path.length ? entry.path.join('.') : 'module'}: ${entry.message}`),
  };
}
