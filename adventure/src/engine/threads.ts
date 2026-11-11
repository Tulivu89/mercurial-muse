// Threads: what is pushing the story, and the milestones the rules can see reached.
//
// A milestone is reached when every one of its conditions holds, on or after its first day; it
// is missed once its last day is over. Either way the rules decide, at the end of every turn
// that moves the world (turns.ts, passTime), and a reached one pays its experience to the
// player as growth does. The narrator never hears of the experience. A milestone with no
// condition at all is for the player to mark by hand, because the rules cannot see it.
//
// What has been reached is kept among what has been earned ("milestone:<thread>:<milestone>"),
// so nothing pays twice and undo takes it back with the turn. Missed needs no keeping: it
// follows from the clock.
//
// The player follows one thread at a time. Its next beat goes to the narrator with the scene
// (context.ts); the others wait in the journal.

import { dayOf } from './clock';
import { stateDefFor, type PraxisModule } from './module';
import { read, write } from './state';
import { playable } from './records';
import { playerOf, type ActionResult, type LedgerEntry, type Save } from './session';
import { milestoneKey, seenByRules, type Milestone, type StateTest, type Thread } from '../../../core/rules/threads';

export type MilestoneStatus = 'reached' | 'missed' | 'open';

export interface MilestoneView {
  milestone: Milestone;
  status: MilestoneStatus;
  // The first open milestone: the thread's next beat.
  next: boolean;
  // Whether only the player's hand can mark it.
  byHand: boolean;
}

export interface ThreadView {
  thread: Thread;
  milestones: MilestoneView[];
  // Done once nothing is left open.
  done: boolean;
  // The one the player follows.
  followed: boolean;
}

function testHolds(module: PraxisModule, save: Save, test: StateTest): boolean {
  const owner = test.characterId ?? playerOf(module);
  const def = stateDefFor(module, test.stateId, owner);
  if (!def) return false;
  const value = read(save.values, def, owner);
  return (test.atLeast === undefined || value >= test.atLeast) && (test.atMost === undefined || value <= test.atMost);
}

function statusOf(save: Save, thread: Thread, milestone: Milestone): MilestoneStatus {
  if (save.earned.includes(milestoneKey(thread.id, milestone.id))) return 'reached';
  if (milestone.byDay !== undefined && dayOf(save.clock) > milestone.byDay) return 'missed';
  return 'open';
}

// Every thread as the player stands with it.
export function threadsOf(module: PraxisModule, save: Save): ThreadView[] {
  const world = playable(module, save.local);
  const views = world.threads.map((thread) => {
    let found = false;
    const milestones = thread.milestones.map((milestone): MilestoneView => {
      const status = statusOf(save, thread, milestone);
      const next = status === 'open' && !found;
      if (next) found = true;
      return { milestone, status, next, byHand: !seenByRules(milestone) };
    });
    return { thread, milestones, done: !found, followed: false };
  });
  // The one chosen, while it has anything left; otherwise the first that does.
  const chosen = views.find((view) => view.thread.id === save.thread && !view.done) ?? views.find((view) => !view.done);
  if (chosen) chosen.followed = true;
  return views;
}

// The thread the player follows and its next beat, or null when every thread is done.
export function followedThread(module: PraxisModule, save: Save): { thread: Thread; beat: Milestone } | null {
  const view = threadsOf(module, save).find((entry) => entry.followed);
  const beat = view?.milestones.find((entry) => entry.next)?.milestone;
  return view && beat ? { thread: view.thread, beat } : null;
}

function pay(module: PraxisModule, save: Save, thread: Thread, milestone: Milestone, source: 'rule' | 'player'): { save: Save; entries: LedgerEntry[] } {
  const entries: LedgerEntry[] = [];
  let values = save.values;
  const growth = module.ruleset.growth;
  const playerId = playerOf(module);
  const xpDef = growth ? stateDefFor(module, growth.stateId, playerId) : undefined;
  if (xpDef && milestone.experience > 0) {
    const paid = write(values, xpDef, playerId, read(values, xpDef, playerId) + milestone.experience, source);
    values = paid.values;
    if (paid.change) entries.push({ kind: 'state', at: save.clock, ...paid.change });
  }
  return { save: { ...save, values, earned: [...save.earned, milestoneKey(thread.id, milestone.id)] }, entries };
}

// Reaches every open milestone whose conditions hold now. Called as a turn ends; the entries are
// the experience paid, already on the save's ledger.
export function reachMilestones(module: PraxisModule, save: Save): { save: Save; entries: LedgerEntry[]; reached: { thread: Thread; milestone: Milestone }[] } {
  const world = playable(module, save.local);
  let next = save;
  const entries: LedgerEntry[] = [];
  const reached: { thread: Thread; milestone: Milestone }[] = [];
  const today = dayOf(save.clock);
  for (const thread of world.threads) {
    for (const milestone of thread.milestones) {
      if (!seenByRules(milestone) || statusOf(next, thread, milestone) !== 'open') continue;
      if (milestone.fromDay !== undefined && today < milestone.fromDay) continue;
      if (!milestone.when.every((test) => testHolds(world, next, test))) continue;
      const paid = pay(world, next, thread, milestone, 'rule');
      next = paid.save;
      entries.push(...paid.entries);
      reached.push({ thread, milestone });
    }
  }
  if (!reached.length) return { save, entries: [], reached };
  return { save: { ...next, ledger: [...next.ledger, ...entries] }, entries, reached };
}

// The player marks a milestone reached that the rules cannot see, or one they missed seeing.
export function markMilestone(module: PraxisModule, save: Save, threadId: string, milestoneId: string): ActionResult {
  const world = playable(module, save.local);
  const thread = world.threads.find((entry) => entry.id === threadId);
  const milestone = thread?.milestones.find((entry) => entry.id === milestoneId);
  if (!thread || !milestone) return { ok: false, reason: 'There is no such milestone.' };
  if (statusOf(save, thread, milestone) === 'reached') return { ok: false, reason: 'That is already reached.' };
  const paid = pay(world, save, thread, milestone, 'player');
  return { ok: true, save: { ...paid.save, ledger: [...save.ledger, ...paid.entries] }, entries: paid.entries, terminals: [] };
}

// Follows a thread: its next beat is the one the narrator hears.
export function followThread(module: PraxisModule, save: Save, threadId: string): { ok: true; save: Save } | { ok: false; reason: string } {
  const view = threadsOf(module, save).find((entry) => entry.thread.id === threadId);
  if (!view) return { ok: false, reason: 'There is no such thread.' };
  if (view.done) return { ok: false, reason: `${view.thread.name} has nothing left to reach.` };
  return { ok: true, save: { ...save, thread: threadId } };
}
