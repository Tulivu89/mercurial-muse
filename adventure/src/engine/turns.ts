// Turns: the transcript's unit, and the boundary for reroll and undo.
//
// A turn is created by the player speaking or acting. An action is resolved by the rules
// first; the turn then carries the outcome as a directive for the narrator. A reroll replaces
// the narration and never resolves the action again. Undo restores the world as it was before
// the turn and drops everything recorded since, including any hand edits made after it.
//
// Turn ids are passed in, never generated here, so the engine stays deterministic.

import { atlasOf } from './world';
import { durationWords } from './clock';
import { stateDefFor, type PraxisModule, type SceneAction } from './module';
import { fact, read, write, type StateTerminal } from './state';
import { playable } from './records';
import { windowStartFor } from './context';
import { definite, listOf, midSentence, pronounsOf } from './words';
import { restEffects, settleCheck, type CheckChoice, type Target } from './checks';
import { followSchedules } from './schedule';
import { followingAs } from './follow';
import { buy, countDown, loot, openNow, renewArmour, sell, useGood } from './trade';
import { reachMilestones } from './threads';
import { playerOf, travel, wait, type ActionResult, type CheckRecord, type LedgerEntry, type Save, type Turn, type WorldState } from './session';

export type TurnResult =
  | { ok: true; save: Save; turn: Turn; entries: LedgerEntry[]; terminals: StateTerminal[] }
  | { ok: false; reason: string };

function worldOf(save: Save): WorldState {
  return { clock: save.clock, positions: save.positions, values: save.values, spent: save.spent, held: save.held, following: save.following, earned: save.earned, ladders: save.ladders, pack: save.pack, works: save.works };
}

function open(module: PraxisModule, before: Save, after: Save, turn: Omit<Turn, 'before' | 'ledgerStart' | 'reply' | 'windowStart' | 'check'> & { check?: CheckRecord }, entries: LedgerEntry[], terminals: StateTerminal[] = []): TurnResult {
  const draft: Turn = { ...turn, reply: null, before: worldOf(before), ledgerStart: before.ledger.length, windowStart: 0 };
  const withTurn: Save = { ...after, turns: [...after.turns, draft] };
  const full: Turn = { ...draft, windowStart: windowStartFor(module, withTurn) };
  return { ok: true, save: { ...after, turns: [...after.turns, full] }, turn: full, entries, terminals };
}

// A name as it reads inside a sentence: "The harbour" becomes "the harbour".
export function inSentence(name: string): string {
  return name.startsWith('The ') ? `the ${name.slice(4)}` : name;
}

// How long something took, in the words a narrator would use. Exact minutes stay off the page.
export function roughDuration(minutes: number): string {
  if (minutes < 20) return 'a short walk';
  if (minutes < 90) return 'about an hour';
  if (minutes < 6 * 60) return 'a few hours';
  if (minutes < 12 * 60) return 'most of a day';
  return 'more than a day';
}

export function say(module: PraxisModule, save: Save, id: string, text: string): TurnResult {
  const input = text.trim();
  if (!input) return { ok: false, reason: 'Write something first.' };
  return open(module, save, save, { id, kind: 'say', input, directive: null }, []);
}

export type Action =
  | { type: 'travel'; to: string }
  | { type: 'wait'; minutes: number }
  | { type: 'scene'; actionId: string }
  // Trade, settled by the rules like a scene action: buying from and selling to someone here,
  // taking what someone down carries, using something up.
  | { type: 'buy'; from: string; goodId: string }
  | { type: 'sell'; to: string; goodId: string }
  | { type: 'loot'; from: string }
  | { type: 'use'; goodId: string }
  // A check. `random` is the dice; null settles it without rolling, by the player's choice.
  | { type: 'check'; target: Target; choice: CheckChoice; input: string; random: (() => number) | null };

// Whether an authored action is offered to the player where they are now.
function offered(module: PraxisModule, save: Save, action: SceneAction): boolean {
  const playerId = playerOf(module);
  const here = save.positions[playerId];
  if (action.placeIds.length && (!here || !action.placeIds.includes(here))) return false;
  if (action.present.some((personId) => !here || save.positions[personId] !== here)) return false;
  if (!openNow(module, save, action)) return false;
  // Goods it takes from your pack must be there.
  if (action.effects.some((effect) => effect.goodId && (effect.add ?? 0) < 0 && (save.pack[effect.goodId] ?? 0) < -(effect.add ?? 0))) return false;
  return action.when.every((condition) => {
    const owner = condition.characterId ?? playerId;
    const def = stateDefFor(module, condition.stateId, owner);
    if (!def) return false;
    const value = read(save.values, def, owner);
    return (condition.atLeast === undefined || value >= condition.atLeast) && (condition.atMost === undefined || value <= condition.atMost);
  });
}

export function sceneActionsFor(module: PraxisModule, save: Save): SceneAction[] {
  const world = playable(module, save.local);
  return world.ruleset.actions.filter((action) => offered(world, save, action));
}

// Resolves an authored action: its effects are written by the rules, in order, on the player
// or on the person each effect names.
function resolveScene(module: PraxisModule, save: Save, action: SceneAction): ActionResult {
  const playerId = playerOf(module);
  let values = save.values;
  const entries: LedgerEntry[] = [];
  const terminals: StateTerminal[] = [];
  let pack: Record<string, number> = { ...save.pack };
  for (const effect of action.effects) {
    if (effect.goodId) {
      const from = pack[effect.goodId] ?? 0;
      const next = from + (effect.add ?? 0);
      if (next < 0) return { ok: false, reason: 'You do not have that.' };
      pack = { ...pack, [effect.goodId]: next };
      if (!next) delete pack[effect.goodId];
      if (next !== from) entries.push({ kind: 'goods', at: save.clock, goodId: effect.goodId, from, to: next, source: 'rule' });
      continue;
    }
    if (!effect.stateId) continue;
    const owner = effect.characterId ?? playerId;
    const def = stateDefFor(module, effect.stateId, owner);
    if (!def) return { ok: false, reason: `"${effect.stateId}" is not a state here.` };
    const current = read(values, def, owner);
    const next = effect.set !== undefined ? effect.set : current + (effect.add ?? 0);
    const result = write(values, def, owner, next, 'rule');
    values = result.values;
    if (result.change) entries.push({ kind: 'state', at: save.clock, ...result.change });
    if (result.terminal) terminals.push(result.terminal);
  }
  const settled: Save = { ...save, values, pack, ledger: [...save.ledger, ...entries] };
  const armour = renewArmour(module, save, settled);
  return { ok: true, save: armour.save, entries: [...entries, ...armour.entries], terminals };
}

// After the rules have moved the clock: everyone whose day takes them elsewhere goes, and
// the narrator hears who left or came, when the player stayed where they were.
function passTime(world: PraxisModule, before: Save, settled: Save, settledEntries: LedgerEntry[], directive: string, hold: boolean): { save: Save; entries: LedgerEntry[]; directive: string } {
  // Terms run out as the clock passes midnight, or the hour.
  const counted = countDown(world, settled, before.clock, settled.clock);
  const after = counted.save;
  const entries = [...settledEntries, ...counted.entries];
  const scheduled = followSchedules(world, after, before.clock, after.clock, { hold });
  // Milestones last, so they see the world the turn left: who is where, and what changed.
  const reached = reachMilestones(world, scheduled.save);
  const followed = { ...scheduled, save: reached.save, entries: [...scheduled.entries, ...reached.entries] };
  if (!scheduled.entries.length) return { save: followed.save, entries: [...entries, ...reached.entries], directive };
  const playerId = playerOf(world);
  const stayed = before.positions[playerId] === after.positions[playerId];
  const places = atlasOf(world).places;
  const news = stayed ? [
    ...followed.left.map(({ character, to }) => `${midSentence(character.name)} leaves for ${inSentence(places.get(to)?.name ?? to)}`),
    ...followed.arrived.map((character) => `${midSentence(character.name)} arrives`),
    ...followed.passed.map(({ character, to }) => `${midSentence(character.name)} comes by and goes on to ${inSentence(places.get(to)?.name ?? to)}`),
  ] : [];
  return {
    save: followed.save,
    entries: [...entries, ...followed.entries],
    directive: news.length ? `${directive}\nMeanwhile, ${news.join('; ')}.` : directive,
  };
}

type Done = Extract<ActionResult, { ok: true }>;

// The moves that only pass time or change place.
export type Move = Extract<Action, { type: 'travel' } | { type: 'wait' }>;

// Travelling or waiting by the rules: the move, the words for the turn, what the narrator is
// told, and the same for the player in exact terms.
function moveBy(world: PraxisModule, save: Save, action: Move, quiet: boolean): { ok: true; result: Done; input: string; directive: string; told: string } | { ok: false; reason: string } {
  const playerId = playerOf(world);
  const nameOf = (characterId: string) => world.characters.find((character) => character.id === characterId)?.name ?? characterId;
  if (action.type === 'travel') {
    const place = atlasOf(world).places.get(action.to);
    const result = travel(world, save, action.to, quiet);
    if (!result.ok) return result;
    const move = result.entries.find((entry): entry is Extract<LedgerEntry, { kind: 'move' }> => entry.kind === 'move' && entry.characterId === playerId);
    const minutes = move?.minutes ?? 0;
    const name = inSentence(place?.name ?? action.to);
    // Who came with you, and who stopped following.
    const came = result.entries.filter((entry): entry is Extract<LedgerEntry, { kind: 'move' }> => entry.kind === 'move' && entry.characterId !== playerId);
    const stayed = result.entries.filter((entry): entry is Extract<LedgerEntry, { kind: 'follow' }> => entry.kind === 'follow' && entry.as === null && save.positions[entry.characterId] === save.positions[playerId]);
    const party = came.map((entry) => `${midSentence(nameOf(entry.characterId))}, ${followingAs(world, result.save, entry.characterId)}`);
    const behind = stayed.map((entry) => `\n${nameOf(entry.characterId)} does not come with you.`).join('');
    const company = came.length ? `, with ${listOf(came.map((entry) => midSentence(nameOf(entry.characterId))))}` : '';
    return {
      ok: true,
      result,
      input: `I head for ${name}.`,
      directive: `You have just arrived at ${name} after ${roughDuration(minutes)}${party.length ? `, with ${party.join(' and ')}` : ''}.${behind}`,
      told: `You are at ${name}${minutes ? `, ${durationWords(minutes)} later` : ''}${company}.${behind}`,
    };
  }
  let result = wait(save, action.minutes, quiet);
  if (!result.ok) return result;
  const rest = world.ruleset.rest;
  if (rest && action.minutes >= rest.minutes) {
    const rested = restEffects(world, result.save);
    result = { ...result, save: rested.save, entries: [...result.entries, ...rested.entries] };
    return {
      ok: true,
      result,
      input: `I rest for ${durationWords(action.minutes)}.`,
      directive: `You rest for ${roughDuration(action.minutes)} and wake refreshed.`,
      told: `You rested for ${durationWords(action.minutes)}.`,
    };
  }
  return {
    ok: true,
    result,
    input: `I wait for ${durationWords(action.minutes)}.`,
    directive: `Time passes where you are: ${roughDuration(action.minutes).replace('a short walk', 'a little while')}.`,
    told: `${durationWords(action.minutes)} passed.`,
  };
}

export function act(module: PraxisModule, save: Save, id: string, action: Action): TurnResult {
  const world = playable(module, save.local);
  if (action.type === 'check') {
    const settled = settleCheck(world, save, action.target, action.choice, action.random);
    if (!settled.ok) return settled;
    const { outcome } = settled;
    const input = action.input.trim() || `I try ${outcome.record.approachName.toLowerCase()} on ${midSentence(outcome.record.target.label.split(' · ')[0] ?? 'it')}.`;
    const timed = passTime(world, save, outcome.save, outcome.entries, outcome.directive, true);
    return open(world, save, timed.save, { id, kind: 'action', input, directive: timed.directive, check: outcome.record }, timed.entries, outcome.terminals);
  }
  if (action.type === 'scene') {
    const chosen = world.ruleset.actions.find((entry) => entry.id === action.actionId);
    if (!chosen) return { ok: false, reason: 'That action does not exist.' };
    if (!offered(world, save, chosen)) return { ok: false, reason: `${chosen.name} is not possible here and now.` };
    const result = resolveScene(world, save, chosen);
    if (!result.ok) return result;
    // What the action changed, in each condition's own words, and any terminal it reached,
    // are part of what the narrator must show; they are not repeated as conditions to keep.
    const playerId = playerOf(world);
    const changed = result.entries.flatMap((entry) => {
      if (entry.kind !== 'state') return [];
      // Your purse and armour are counted, not told.
      if (entry.defId === world.ruleset.trade?.coin || entry.defId === world.ruleset.trade?.armour) return [];
      const def = stateDefFor(world, entry.defId, entry.owner);
      const person = world.characters.find((character) => character.id === entry.owner);
      if (!def || !person) return [];
      const said = fact(def, definite(person.name), entry.to, entry.owner === playerId, false, pronounsOf(person.pronouns));
      return said ? [said] : [];
    });
    const outcome = [chosen.outcome, ...changed, ...result.terminals.map((terminal) => terminal.note)].join('\n');
    const timed = passTime(world, save, result.save, result.entries, outcome, true);
    return open(world, save, timed.save, { id, kind: 'action', input: chosen.input, directive: timed.directive }, timed.entries, result.terminals);
  }
  if (action.type === 'buy' || action.type === 'sell' || action.type === 'loot' || action.type === 'use') {
    const done = action.type === 'buy' ? buy(world, save, action.from, action.goodId)
      : action.type === 'sell' ? sell(world, save, action.to, action.goodId)
        : action.type === 'loot' ? loot(world, save, action.from)
          : useGood(world, save, action.goodId);
    if (!done.ok) return done;
    const timed = passTime(world, save, done.save, done.entries, done.outcome, true);
    return open(world, save, timed.save, { id, kind: 'action', input: done.input, directive: timed.directive }, timed.entries, done.terminals);
  }
  const moved = moveBy(world, save, action, false);
  if (!moved.ok) return moved;
  const timed = passTime(world, save, moved.result.save, moved.result.entries, moved.directive, false);
  return open(world, save, timed.save, { id, kind: 'action', input: moved.input, directive: timed.directive }, timed.entries, moved.result.terminals);
}

// Travelling or waiting without a turn. The rules run as they do for the narrated move:
// the clock, followers, schedules and rest. Nothing is written and the narrator is not
// called; it sees where and when you are on your next turn. For putting the time or the
// place right when the story has drifted. Undo takes it back with the turn before it, like
// any other change made by hand. `told` is what happened, for the player to read.
export function moveQuietly(module: PraxisModule, save: Save, action: Move): (Done & { told: string }) | { ok: false; reason: string } {
  const world = playable(module, save.local);
  const moved = moveBy(world, save, action, true);
  if (!moved.ok) return moved;
  const timed = passTime(world, save, moved.result.save, moved.result.entries, moved.told, false);
  return { ok: true, save: timed.save, entries: timed.entries, terminals: moved.result.terminals, told: timed.directive.replace(/\n/g, ' ') };
}

export function lastTurn(save: Save): Turn | null {
  return save.turns[save.turns.length - 1] ?? null;
}

// Narration lands on the latest turn only. A reply for an older turn is stale by definition.
export function setReply(save: Save, turnId: string, reply: string): { ok: true; save: Save } | { ok: false; reason: string } {
  const last = lastTurn(save);
  if (!last || last.id !== turnId) return { ok: false, reason: 'That turn is no longer the latest.' };
  const text = reply.trim();
  if (!text) return { ok: false, reason: 'The narrator returned nothing.' };
  return { ok: true, save: { ...save, turns: [...save.turns.slice(0, -1), { ...last, reply: text }] } };
}

export function undoLastTurn(save: Save): { ok: true; save: Save; turn: Turn } | { ok: false; reason: string } {
  const last = lastTurn(save);
  if (!last) return { ok: false, reason: 'There is nothing to undo.' };
  return {
    ok: true,
    turn: last,
    save: { ...save, ...last.before, ledger: save.ledger.slice(0, last.ledgerStart), turns: save.turns.slice(0, -1) },
  };
}

// Tidies a model reply: drops a speaker label the model added, a game note it copied, and an
// echo of the player's words.
export function cleanReply(reply: string, input: string): string {
  let text = reply.replace(/\r\n/g, '\n');
  // A reasoning model may leave its thinking in the reply.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '').trim();
  // A model that wrote its own "Understood. I will: …" before the story: keep only the story.
  const mark = text.lastIndexOf('[Of course, here you go:]');
  if (mark >= 0) text = text.slice(mark + '[Of course, here you go:]'.length).trim();
  else if (/^Understood\. I will:/.test(text)) text = text.replace(/^Understood\. I will:\n(?:- .*\n?)*/, '').trim();
  text = text.replace(/^(?:narrator|assistant|gm)\s*:\s*/i, '');
  // A note the model copied from what it was sent: a whole line of [ Lore ], [ Scene ] or [ Outcome ].
  text = text.replace(/^[ \t]*\[\s*(?:lore|scene|outcome|present)\b[^\n]*\][ \t]*$/gim, '').trim();
  const echo = input.trim();
  if (echo && text.startsWith(echo)) text = text.slice(echo.length).trim();
  return text.replace(/\n{3,}/g, '\n\n');
}
