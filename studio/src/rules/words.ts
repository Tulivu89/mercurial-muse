// The ruleset in plain words, for the world's Rules page.
import { listOf, type Approach, type Cost, type Ruleset, type StateDef } from '../../../core/rules/index.js';
import { SCOPE_WORDS } from './bits';

const stateName = (ruleset: Ruleset, stateId: string) => ruleset.states.find((def) => def.id === stateId)?.name ?? stateId;

// "you lose 1 Health", "the place gains 1 Alert".
export function costWords(ruleset: Ruleset, cost: Cost): string {
  const who = cost.who === 'player' ? 'you' : cost.who === 'place' ? 'the place' : 'the target';
  const verb = cost.add < 0 ? (cost.who === 'player' ? 'lose' : 'loses') : cost.who === 'player' ? 'gain' : 'gains';
  return `${who} ${verb} ${Math.abs(cost.add)} ${stateName(ruleset, cost.stateId)}`;
}

function priceWords(ruleset: Ruleset, costs: readonly Cost[], minutes: number): string {
  const parts = costs.map((cost) => costWords(ruleset, cost));
  if (minutes) parts.push(`it takes ${minutes} more minutes`);
  return parts.length ? listOf(parts) : 'nothing';
}

const unique = (names: string[]) => [...new Set(names)];

// What an approach moves and what it costs when it goes wrong.
export function approachWords(ruleset: Ruleset, approach: Approach): string {
  const banded = ruleset.states.filter((def) => def.approach && def.bands.length > 0);
  const owned = unique(banded.filter((def) => def.approach!.owner === approach.id).map((def) => def.name));
  const reached = unique(banded.filter((def) => def.approach!.secondary.includes(approach.id)).map((def) => def.name));
  const deeds = ruleset.deeds.filter((deed) => deed.approach === approach.id);
  const out: string[] = [];
  out.push(owned.length ? `Moves ${listOf(owned)}.` : 'Moves nothing of its own.');
  if (reached.length) out.push(`Off its home ground it can move ${listOf(reached)}, with a setback die.`);
  for (const deed of deeds) out.push(`Against a ${deed.kind}: ${deed.label.charAt(0).toLowerCase()}${deed.label.slice(1)}, which works or fails.`);
  out.push(`When it fails, ${priceWords(ruleset, approach.failure, approach.failureMinutes)}.`);
  out.push(`On two or more threat, ${priceWords(ruleset, approach.threat, approach.threatMinutes)}.`);
  return out.join(' ');
}

// Who holds a state, its range, and what moves it.
export function stateWords(ruleset: Ruleset, def: StateDef): string {
  const name = (approachId: string) => ruleset.approaches.find((approach) => approach.id === approachId)?.name ?? approachId;
  const parts = [SCOPE_WORDS[def.scope], `${def.min} to ${def.max}`];
  if (def.approach) parts.push(`${name(def.approach.owner)} ${def.grows ? 'builds it' : 'wears it down'}${def.approach.secondary.length ? `, ${listOf(def.approach.secondary.map(name))} off its ground` : ''}`);
  if (!def.bands.length) parts.push('never reaches the narrator');
  return parts.join(' · ');
}
