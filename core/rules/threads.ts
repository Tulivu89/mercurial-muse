// Threads: what is pushing the story, after Character Engine's. A thread asks five questions
// (pressure, objective, opposition, cost, consequence) and has milestones: the next things the
// story can reach, in order. The rules see a milestone reached when its conditions hold, and
// pay its experience; the narrator hears only the next beat of the thread the player follows.
//
// Pure data and validation: no DOM, no network, no storage.
import { z } from 'zod';

const id = z.string().min(1).max(200);
const text = (max: number) => z.string().max(max);

// Character Engine's nine kinds and its tenth for none of them. A kind steers the questions'
// hints and nothing else.
export const THREAD_KINDS = [
  { id: 'errand', label: 'Errand', blurb: 'Something must be reached, fetched, delivered or destroyed.' },
  { id: 'mystery', label: 'Mystery', blurb: 'Something must be known.' },
  { id: 'reckoning', label: 'Reckoning', blurb: 'Someone must answer for something.' },
  { id: 'ascent', label: 'Ascent', blurb: 'A position must be taken.' },
  { id: 'bond', label: 'Bond', blurb: 'A relationship must change shape.' },
  { id: 'debt', label: 'Debt', blurb: 'Something is owed, and will be collected.' },
  { id: 'concealment', label: 'Concealment', blurb: 'Something must stay hidden.' },
  { id: 'siege', label: 'Siege', blurb: 'Something held must be kept.' },
  { id: 'ruin', label: 'Ruin', blurb: 'Something is going wrong and cannot be stopped, only slowed or survived.' },
  { id: 'custom', label: 'Custom', blurb: 'None of the nine.' },
] as const;
export const THREAD_QUESTIONS = ['pressure', 'objective', 'opposition', 'cost', 'consequence'] as const;
export type ThreadQuestion = (typeof THREAD_QUESTIONS)[number];

// A state that must hold: the player's own, or the one `characterId` names ("world" for a world
// state). The same shape as a scene action's conditions.
export const stateTestSchema = z.object({
  stateId: id,
  characterId: id.optional(),
  atLeast: z.number().int().optional(),
  atMost: z.number().int().optional(),
});
export type StateTest = z.infer<typeof stateTestSchema>;

export const milestoneSchema = z.object({
  id,
  // The beat, as the narrator hears it while this is next: "Get tamecap from the Woed's edge
  // into Morwen's hand before day 8."
  text: z.string().min(1).max(400),
  // The place, person or thing it turns on, if any.
  targetId: id.optional(),
  // Reached when every one of these holds, on or after `fromDay`. Days count from story zero, as
  // schedules count them. A milestone with no condition at all is marked by the player's hand.
  when: z.array(stateTestSchema).max(8).default([]),
  fromDay: z.number().int().min(0).optional(),
  // Missed once this day is over and it was not reached.
  byDay: z.number().int().min(0).optional(),
  experience: z.number().int().min(0).max(1000).default(0),
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const threadSchema = z.object({
  id,
  name: z.string().min(1).max(120),
  kind: text(40).default('custom'),
  pressure: text(2000).default(''),
  objective: text(2000).default(''),
  opposition: text(2000).default(''),
  cost: text(2000).default(''),
  consequence: text(2000).default(''),
  milestones: z.array(milestoneSchema).max(30).default([]),
}).passthrough();
export type Thread = z.infer<typeof threadSchema>;

// A thread record's rules block: its kind and milestones, only when set. The five questions are
// the record's sections.
export const threadRulesSchema = z.object({
  kind: text(40).optional(),
  milestones: z.array(milestoneSchema).max(30).optional(),
});
export type ThreadRules = z.infer<typeof threadRulesSchema>;

// Whether a milestone could ever be reached by the rules, rather than by hand.
export function seenByRules(milestone: Pick<Milestone, 'when' | 'fromDay'>): boolean {
  return milestone.when.length > 0 || milestone.fromDay !== undefined;
}

// The key a reached milestone leaves among what has been earned, so nothing pays twice and undo
// takes it back with the turn.
export function milestoneKey(threadId: string, milestoneId: string): string {
  return `milestone:${threadId}:${milestoneId}`;
}
