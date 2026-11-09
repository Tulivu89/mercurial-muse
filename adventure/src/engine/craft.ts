// Making things with Focus.
//
// Leverage and Prepared help the next check against the same target. A made thing carries
// that help to any later target it fits. A work is a track that Focus builds up, like
// Prepared, owned as "work:<good id>": each success adds its successes, and when the track is
// full the good goes into your pack. The good's worth picks its step on the ten-step scale:
// how long the track is and how long each check takes. Materials cost half its worth, paid
// when you start. Fine or secret work is Hard. A failure takes as long again; a despair
// spoils the materials. Checks on a work are settled in checks.ts like any other.

import { WORK_PREFIX, stateDefFor, type PraxisModule } from './module';
import { read, write } from './state';
import { coinOf, goodOf, type Good } from './trade';
import { playerOf, type ActionResult, type LedgerEntry, type Save } from './session';

export const workId = (goodId: string) => `${WORK_PREFIX}${goodId}`;
export const isWork = (ownerId: string) => ownerId.startsWith(WORK_PREFIX);
export const workGood = (module: PraxisModule, ownerId: string): Good | undefined => (isWork(ownerId) ? goodOf(module, ownerId.slice(WORK_PREFIX.length)) : undefined);

// "the sword you are making".
export function workName(good: Good): string {
  return `the ${good.name.replace(/^(a|an|the) /i, '')} you are making`;
}

export interface Makeable {
  good: Good;
  // What the materials cost now, the track's length, and how long each check takes.
  materials: number;
  track: number;
  minutes: number;
  difficulty: number;
}

export function stepFor(module: PraxisModule, good: Good): { track: number; minutes: number } | null {
  const craft = module.ruleset.craft;
  if (!craft || !good.makeable || good.worth <= 0) return null;
  const step = craft.steps.find((entry) => good.worth <= entry.upTo);
  return step ? { track: step.track, minutes: step.minutes } : null;
}

// Everything Focus could make, with what it takes.
export function makeables(module: PraxisModule): Makeable[] {
  const craft = module.ruleset.craft;
  if (!craft) return [];
  return module.ruleset.goods.flatMap((good) => {
    const step = stepFor(module, good);
    if (!step) return [];
    return [{ good, materials: Math.ceil(good.worth * craft.materials), track: step.track, minutes: step.minutes, difficulty: good.fine ? craft.fineDifficulty : craft.difficulty }];
  });
}

export interface Work extends Makeable {
  id: string;
  progress: number;
}

// What you are making now, and how far along it is.
export function worksOf(module: PraxisModule, save: Save): Work[] {
  const craft = module.ruleset.craft;
  if (!craft) return [];
  return save.works.flatMap((goodId) => {
    const made = makeables(module).find((entry) => entry.good.id === goodId);
    const def = stateDefFor(module, craft.stateId, workId(goodId));
    if (!made || !def) return [];
    return [{ ...made, id: workId(goodId), progress: read(save.values, def, workId(goodId)) }];
  });
}

// Begins a work: the materials are paid for now. Not a turn: the checks that follow are.
export function startWork(module: PraxisModule, save: Save, goodId: string): ActionResult {
  const craft = module.ruleset.craft;
  const coinId = module.ruleset.trade?.coin;
  const made = makeables(module).find((entry) => entry.good.id === goodId);
  if (!craft || !made) return { ok: false, reason: 'That is not something you can make.' };
  if (save.works.includes(goodId)) return { ok: false, reason: `You are already making ${made.good.name}.` };
  const coin = coinOf(module, save);
  if (made.materials > coin) return { ok: false, reason: `The materials cost ${made.materials} coin. You have ${coin}.` };
  const playerId = playerOf(module);
  const entries: LedgerEntry[] = [];
  let values = save.values;
  if (coinId && made.materials) {
    const def = stateDefFor(module, coinId, playerId)!;
    const paid = write(values, def, playerId, coin - made.materials, 'rule');
    values = paid.values;
    if (paid.change) entries.push({ kind: 'state', at: save.clock, ...paid.change });
  }
  entries.push({ kind: 'work', at: save.clock, goodId, event: 'start', source: 'rule' });
  return { ok: true, save: { ...save, values, works: [...save.works, goodId], ledger: [...save.ledger, ...entries] }, entries, terminals: [] };
}

// Gives up a work. The materials are lost.
export function abandonWork(module: PraxisModule, save: Save, goodId: string): ActionResult {
  if (!save.works.includes(goodId)) return { ok: false, reason: 'You are not making that.' };
  const cleared = clearWork(module, save, goodId);
  const entry: LedgerEntry = { kind: 'work', at: save.clock, goodId, event: 'abandon', source: 'player' };
  return { ok: true, save: { ...cleared.save, works: save.works.filter((id) => id !== goodId), ledger: [...cleared.save.ledger, entry] }, entries: [...cleared.entries, entry], terminals: [] };
}

// Sets a work's track back to nothing, so the next one starts clean.
function clearWork(module: PraxisModule, save: Save, goodId: string): { save: Save; entries: LedgerEntry[] } {
  const craft = module.ruleset.craft;
  const def = craft ? stateDefFor(module, craft.stateId, workId(goodId)) : undefined;
  if (!def) return { save, entries: [] };
  const result = write(save.values, def, workId(goodId), def.min, 'rule');
  if (!result.change) return { save, entries: [] };
  const entry: LedgerEntry = { kind: 'state', at: save.clock, ...result.change };
  return { save: { ...save, values: result.values, ledger: [...save.ledger, entry] }, entries: [entry] };
}
