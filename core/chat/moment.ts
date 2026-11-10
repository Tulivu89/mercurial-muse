// What changes from one reply to the next: time apart, what the schedule has on, the mood, and
// plans. The AetherRoom kernel works these out for xialong itself; this is the same reckoning
// for every other model, in CharacterRoom's own words where it has them. A test holds the plan
// arithmetic here to the kernel's.
import type { ScheduleEvent } from '../records/schema.js';
import { EMOTIONAL_MODES, EMOTIONAL_MODE_ATTR, formatTime } from './aetherroom.js';
import type { Plan } from './chat.js';
import { replaceMacros } from './macros.js';

type Rng = (min: number, max: number) => number;

// Whole hours since the character last wrote; zero when under an hour or never.
export function hoursApart(nowMs: number, lastContactMs: number | undefined): number {
  if (!lastContactMs || lastContactMs <= 0) return 0;
  return Math.floor(Math.abs(nowMs - lastContactMs) / 3_600_000);
}
export const timeApartLine = (hours: number, charName: string, userName: string) => `It's been ${hours} hour${hours === 1 ? '' : 's'} since ${charName} last messaged ${userName}.`;

export function currentEventsLine(live: readonly ScheduleEvent[], day: string, minutes: number, charName: string, userName: string, nowMs: number): string {
  if (!live.length) return '';
  const lines = live.map((event) => `- Time Range: ${formatTime(event.startTime)} - ${formatTime(event.endTime)}, Event: ${replaceMacros(event.text, charName, userName, nowMs)}`);
  return `Today is ${day} at ${formatTime(minutes)} (24-hour clock). Current scheduled events for ${charName}:\n${lines.join('\n')}\nAn event can be something ${charName} is currently doing or planning to do during this time.`;
}

// The mood, if any: after time away one of the nine at random; otherwise a mode all of whose
// triggers cover the last three emotions, at random among those that fit.
export function moodFor(recent: readonly string[], away: boolean, rngInt: Rng): { mode: string; away: boolean } | null {
  if (away) return { mode: EMOTIONAL_MODES[rngInt(0, EMOTIONAL_MODES.length - 1)]!, away: true };
  const matched = EMOTIONAL_MODES.filter((mode) => recent.every((emotion) => EMOTIONAL_MODE_ATTR[mode]!.triggers.has(emotion)));
  if (!matched.length) return null;
  return { mode: matched.length > 1 ? matched[rngInt(0, matched.length - 1)]! : matched[0]!, away: false };
}
export function moodLine(mood: { mode: string; away: boolean }, charName: string): string {
  const lead = mood.away
    ? `While away from the chat, ${charName} experienced emotions that put them in the following state of mind.`
    : `${charName}'s recent emotions have put them in the following state of mind.`;
  return `${lead}\n${mood.mode}: ${EMOTIONAL_MODE_ATTR[mood.mode]!.prompt}`;
}

export interface PlanPick { contents: string[]; limited: number; plans: Plan[]; changed: boolean }

// One ongoing plan and one limited plan, each at random among those still eligible, and the
// plans as they stand afterwards: a limited plan starts counting when first used, counts down by
// the player's messages since, and an AI plan that has run out is dropped.
export function pickPlans(plans: readonly Plan[], rngInt: Rng, userMsgCount: number, dryRun: boolean): PlanPick {
  const limited: number[] = [];
  const ongoing: number[] = [];
  plans.forEach((plan, index) => {
    if (!plan.content) return;
    const eligible = (plan.planType === 'AI' && plan.remainingTurns >= 0) || (plan.planType === 'User' && plan.remainingTurns > 0);
    if (!eligible) return;
    (plan.durationType === 'Ongoing' ? ongoing : limited).push(index);
  });
  const contents: string[] = [];
  let picked = -1;
  if (ongoing.length) contents.push(plans[ongoing[rngInt(0, ongoing.length - 1)]!]!.content);
  if (limited.length) {
    picked = limited[rngInt(0, limited.length - 1)]!;
    contents.push(plans[picked]!.content);
  }
  if (dryRun || !contents.length) return { contents, limited: picked, plans: [...plans], changed: false };
  const next = plans.map((plan, index): Plan => {
    if (index !== picked) return plan;
    if (!plan.running) return { ...plan, running: true, startedAtCount: userMsgCount };
    if (userMsgCount < plan.startedAtCount) return { ...plan, remainingTurns: 0 };
    return { ...plan, remainingTurns: plan.totalTurns - (userMsgCount - plan.startedAtCount) };
  });
  return { contents, limited: picked, plans: next.filter((plan) => plan.planType === 'User' || plan.remainingTurns > 0), changed: true };
}
