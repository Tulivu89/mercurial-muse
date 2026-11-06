// Growth: experience earned from what the rules can see, and spent at Genesys's prices.
//
// Earning happens as checks settle (checks.ts calls `awardsFor`): overcoming someone or
// something the first time, by tier, and a lesson from failing against a rival or nemesis,
// once a scene. A module's scene actions can grant experience too, as milestones, since it is
// an ordinary state. The narrator never hears of it.
//
// Spending raises an approach rating (`ratingCost` × the new rating) or climbs a charge
// ladder (`chargeCost` × the new top charge). A ladder changed in play is kept in the save;
// the module's own stands until then. See Praxis — Growth, Challenge and Economy.

import { LADDER, stateDefFor, type LadderStep, type PraxisModule } from './module';
import { read, write } from './state';
import { playable } from './records';
import { playerOf, type ActionResult, type LedgerEntry, type Save } from './session';

// The charges each ladder step holds.
export const CHARGE_SLOTS: Record<LadderStep, readonly number[]> = {
  raw: [1],
  practiced: [1, 2],
  trained: [1, 2, 3],
  expert: [1, 2, 3, 4],
  master: [1, 2, 3, 4, 5],
};

export const LADDER_NAMES: Record<LadderStep, string> = { raw: 'Raw', practiced: 'Practiced', trained: 'Trained', expert: 'Expert', master: 'Master' };

// Where someone stands on an approach's ladder: changed in play, or as the module has it.
export function trainingOf(module: PraxisModule, save: Save, characterId: string, approachId: string): LadderStep | null {
  const own = save.ladders[characterId]?.[approachId];
  if (own) return own;
  const character = module.characters.find((entry) => entry.id === characterId);
  return character?.charges[approachId] ?? null;
}

export interface GrowthStep {
  approach: string;
  name: string;
  rating: number;
  // The next rating and its price, or null at the top.
  raise: { to: number; cost: number } | null;
  training: LadderStep | null;
  // The next ladder step and its price, or null at Master.
  train: { to: LadderStep; cost: number } | null;
}

export interface Growth {
  experience: number;
  steps: GrowthStep[];
}

// What the player could buy now, approach by approach. Null when the module has no growth.
export function growthFor(module: PraxisModule, save: Save): Growth | null {
  const world = playable(module, save.local);
  const growth = world.ruleset.growth;
  if (!growth) return null;
  const playerId = playerOf(world);
  const xpDef = stateDefFor(world, growth.stateId, playerId);
  if (!xpDef) return null;
  const steps = world.ruleset.approaches.map((approach): GrowthStep => {
    const ratingDef = stateDefFor(world, approach.id, playerId);
    const rating = ratingDef ? read(save.values, ratingDef, playerId) : 0;
    const top = ratingDef ? Math.min(growth.ratingMax, ratingDef.max) : 0;
    const training = trainingOf(world, save, playerId, approach.id);
    const at = training ? LADDER.indexOf(training) : -1;
    const next = LADDER[at + 1];
    return {
      approach: approach.id,
      name: approach.name,
      rating,
      raise: ratingDef && rating < top ? { to: rating + 1, cost: growth.ratingCost * (rating + 1) } : null,
      training,
      train: next ? { to: next, cost: growth.chargeCost * (at + 2) } : null,
    };
  });
  return { experience: read(save.values, xpDef, playerId), steps };
}

// Spends experience on one step: a rating, or the next rung of a charge ladder.
export function grow(module: PraxisModule, save: Save, approachId: string, what: 'rating' | 'ladder'): ActionResult {
  const world = playable(module, save.local);
  const growth = world.ruleset.growth;
  const view = growthFor(world, save);
  if (!growth || !view) return { ok: false, reason: 'This module has no growth.' };
  const step = view.steps.find((entry) => entry.approach === approachId);
  if (!step) return { ok: false, reason: 'There is no such approach.' };
  const buying = what === 'rating' ? step.raise : step.train;
  if (!buying) return { ok: false, reason: what === 'rating' ? `${step.name} is as high as it goes.` : `${step.name} is already at Master.` };
  if (view.experience < buying.cost) return { ok: false, reason: `That takes ${buying.cost} experience. You have ${view.experience}.` };
  const playerId = playerOf(world);
  const entries: LedgerEntry[] = [];
  let values = save.values;
  const xpDef = stateDefFor(world, growth.stateId, playerId)!;
  const paid = write(values, xpDef, playerId, view.experience - buying.cost, 'rule');
  values = paid.values;
  if (paid.change) entries.push({ kind: 'state', at: save.clock, ...paid.change });
  let ladders = save.ladders;
  if (what === 'rating') {
    const ratingDef = stateDefFor(world, approachId, playerId)!;
    const raised = write(values, ratingDef, playerId, step.rating + 1, 'rule');
    values = raised.values;
    if (raised.change) entries.push({ kind: 'state', at: save.clock, ...raised.change });
  } else {
    const to = (buying as { to: LadderStep }).to;
    ladders = { ...ladders, [playerId]: { ...(ladders[playerId] ?? {}), [approachId]: to } };
    entries.push({ kind: 'grow', at: save.clock, characterId: playerId, approach: approachId, from: step.training, to, source: 'rule' });
  }
  return { ok: true, save: { ...save, values, ladders, ledger: [...save.ledger, ...entries] }, entries, terminals: [] };
}

// When the player arrived where they are: the scene, for lessons.
export function arrivalOf(save: Save, playerId: string): number {
  for (let index = save.ledger.length - 1; index >= 0; index -= 1) {
    const entry = save.ledger[index]!;
    if (entry.kind === 'move' && entry.characterId === playerId) return entry.at;
  }
  return 0;
}

export interface CheckFacts {
  targetOwner: string;
  kind: 'person' | 'thing' | 'place' | 'work';
  // The difficulty before anything helped.
  difficulty: number;
  succeeded: boolean;
  // The player settled it without rolling.
  auto: boolean;
  // States of the target that reached an end on this check.
  ended: string[];
}

// What a settled check earns: each award with the key that keeps it from paying twice.
// Settling without a roll earns nothing; that is the player's own choice, not a deed.
export function awardsFor(module: PraxisModule, save: Save, facts: CheckFacts): { key: string; amount: number }[] {
  const growth = module.ruleset.growth;
  if (!growth || facts.auto) return [];
  const playerId = playerOf(module);
  if (facts.targetOwner === playerId || facts.kind === 'place' || facts.kind === 'work') return [];
  const person = module.characters.find((entry) => entry.id === facts.targetOwner);
  const awards: { key: string; amount: number }[] = [];
  for (const defId of facts.ended) {
    const def = stateDefFor(module, defId, facts.targetOwner);
    if (!def || def.grows) continue;
    const amount = person
      ? growth.overcome[person.tier ?? 'minion'] * (person.gang ?? 1)
      : facts.difficulty >= growth.hardFrom ? growth.hardObstacle : growth.obstacle;
    awards.push({ key: `overcome:${facts.targetOwner}:${defId}`, amount });
  }
  if (!facts.succeeded && person && (person.tier === 'rival' || person.tier === 'nemesis')) {
    awards.push({ key: `lesson:${save.positions[playerId] ?? ''}:${arrivalOf(save, playerId)}`, amount: growth.lesson });
  }
  return awards.filter((award) => award.amount > 0 && !save.earned.includes(award.key));
}
