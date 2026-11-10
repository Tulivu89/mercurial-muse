// The chat's clock, and what a schedule says is on at a given moment. CharacterRoom's rules
// (CR-PLAN §6.6): one clock read per chat, real or story; a schedule in minutes from midnight,
// by weekday and under Daily, whose ranges may wrap past midnight; and relationship levels as a
// ladder, where a level reaches everything gated at it or below it (D-126).
import { RELATIONSHIPS } from '../records/charactercard.js';
import type { RecordSet, Schedule, ScheduleEvent, StoryRecord } from '../records/schema.js';

export const MIN_MS = 60_000;
export const DAY_MIN = 1440;
export const MORNING_MIN = 480;
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const CLOCK_STEPS = [0, 5, 15, 30, 60] as const;

// Times of day, as the worldbuilding rules name them. The Studio offers these as presets.
export const TIMES_OF_DAY = [
  { name: 'Morning', start: 360, end: 720 },
  { name: 'Afternoon', start: 720, end: 1080 },
  { name: 'Evening', start: 1080, end: 1320 },
  { name: 'Night', start: 1320, end: 360 },
] as const;

export interface Clock {
  mode: 'real' | 'story';
  // Story time, in milliseconds like a date. Zero until story time is first turned on.
  storyMs: number;
  // Minutes story time moves with each reply; zero is off.
  stepMin: number;
  // Real mode only: whether time reaches the model at all (Time Apart, the schedule).
  trackReal: boolean;
}
export const DEFAULT_CLOCK: Clock = { mode: 'real', storyMs: 0, stepMin: 0, trackReal: false };

export const storyActive = (clock: Clock) => clock.mode === 'story' && clock.storyMs > 0;
export const clockNow = (clock: Clock, realNowMs: number) => (storyActive(clock) ? clock.storyMs : realNowMs);
// Whether the model is told the time: always in story time, and in real time when asked.
export const clockTracks = (clock: Clock) => storyActive(clock) || (clock.mode === 'real' && clock.trackReal);

export function roundToHalfHour(ms: number): number {
  const date = new Date(ms);
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() < 30 ? 0 : 30);
  return date.getTime();
}

export function nextMorningMs(fromMs: number): number {
  const date = new Date(fromMs);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(MORNING_MIN / 60), MORNING_MIN % 60, 0, 0).getTime();
  return target > fromMs ? target : target + DAY_MIN * MIN_MS;
}

export function timeOfDayMs(fromMs: number, minutes: number): number {
  const minute = ((Math.round(minutes) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const date = new Date(fromMs);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minute / 60), minute % 60, 0, 0).getTime();
}

export function setClockMode(clock: Clock, mode: Clock['mode'], realNowMs: number): Clock {
  return { ...clock, mode, storyMs: mode === 'story' && clock.storyMs <= 0 ? roundToHalfHour(realNowMs) : clock.storyMs };
}
export const moveClock = (clock: Clock, minutes: number): Clock => (storyActive(clock) ? { ...clock, storyMs: clock.storyMs + Math.round(minutes) * MIN_MS } : clock);

const two = (value: number) => String(Math.floor(Math.abs(value))).padStart(2, '0');
export const minutesOfDay = (ms: number) => { const date = new Date(ms); return date.getHours() * 60 + date.getMinutes(); };
export const weekdayOf = (ms: number): string => WEEKDAYS[new Date(ms).getDay()]!;
export const formatMinutes = (minutes: number) => { const minute = Math.max(0, Math.round(minutes)); return minute >= DAY_MIN ? '24:00' : `${two(minute / 60)}:${two(minute % 60)}`; };
export const formatStamp = (ms: number) => `${weekdayOf(ms)} ${formatMinutes(minutesOfDay(ms))}`;
export const formatDate = (ms: number) => { const date = new Date(ms); return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`; };

// A relationship reaches a gate at its own level or below. An unknown gate is reached by nothing.
export function levelReaches(have: string, need: string | undefined): boolean {
  if (!need || need === 'none' || need === have) return true;
  const a = (RELATIONSHIPS as readonly string[]).indexOf(have);
  const b = (RELATIONSHIPS as readonly string[]).indexOf(need);
  return a >= 0 && b >= 0 && a >= b;
}

const isLive = (event: ScheduleEvent, minutes: number) => (event.startTime <= event.endTime
  ? minutes >= event.startTime && minutes <= event.endTime
  : minutes >= event.startTime || minutes <= event.endTime);

export interface StatusRead {
  // What is on now and reaches this relationship: the day's own lines first, then Daily.
  live: ScheduleEvent[];
  // On now, but held back by the relationship.
  gated: ScheduleEvent[];
  day: string;
  minutes: number;
}

export function readSchedule(schedule: Schedule | null | undefined, relationship: string, nowMs: number): StatusRead {
  const day = weekdayOf(nowMs);
  const minutes = minutesOfDay(nowMs);
  const live: ScheduleEvent[] = [];
  const gated: ScheduleEvent[] = [];
  for (const list of [schedule?.[day] ?? [], schedule?.Daily ?? []]) {
    for (const event of list) {
      if (!isLive(event, minutes)) continue;
      (levelReaches(relationship, event.requiredIntimacy) ? live : gated).push(event);
    }
  }
  return { live, gated, day, minutes };
}

export const hasSchedule = (schedule: Schedule | null | undefined) => !!schedule && Object.values(schedule).some((events) => events.length > 0);

export function statusText(read: StatusRead): string {
  if (read.live.length) return read.live.map((event) => event.text.trim() || 'something unwritten').join('  ·  ');
  if (read.gated.length) return `${read.gated.length} event${read.gated.length === 1 ? '' : 's'} on now, held back by the relationship`;
  return 'Nothing scheduled right now.';
}

// The schedule as the AetherRoom kernel reads it. The kernel gates on an exact match, so an
// event the ladder reaches is handed over ungated and one it doesn't is left out; every day is
// present, because the kernel looks each one up.
export function kernelSchedule(schedule: Schedule | null | undefined, relationship: string): Record<string, ScheduleEvent[]> | undefined {
  if (!hasSchedule(schedule)) return undefined;
  const out: Record<string, ScheduleEvent[]> = {};
  for (const day of ['Daily', ...WEEKDAYS]) {
    out[day] = (schedule![day] ?? []).filter((event) => levelReaches(relationship, event.requiredIntimacy)).map((event) => ({ ...event, requiredIntimacy: 'none' }));
  }
  return out;
}

// --- Sets that choose themselves (CharacterRoom D-119).

export type SetWhy = 'pinned' | 'schedule' | 'default';
export interface SetPick { setId: string; ownerId: string; memberId: string | null; why: SetWhy; event: string }
export const pinKey = (ownerId: string, setId: string) => `${ownerId}:${setId}`;

// Which member of a set is in use, and why: the one pinned in this chat, else the one the current
// schedule event links (for a scenario, the room that event happens in), else the record's own
// choice, else the first.
export function resolveSet(owner: StoryRecord, set: RecordSet, pins: Record<string, string>, live: readonly ScheduleEvent[]): SetPick {
  const has = (id: string | null | undefined) => !!id && set.members.some((member) => member.id === id);
  const base = { setId: set.id, ownerId: owner.id };
  const pinned = pins[pinKey(owner.id, set.id)];
  if (has(pinned)) return { ...base, memberId: pinned!, why: 'pinned', event: '' };
  for (const event of live) {
    const linked = event.sets[set.id] ?? (owner.kind === 'scenario' ? event.rooms[owner.id] ?? (owner.sourceId ? event.rooms[owner.sourceId] : undefined) : undefined);
    if (has(linked)) return { ...base, memberId: linked!, why: 'schedule', event: event.text.trim() };
  }
  return { ...base, memberId: has(set.active) ? set.active : set.members[0]?.id ?? null, why: 'default', event: '' };
}

export const setWhyText = (pick: SetPick) => (pick.why === 'pinned' ? 'pinned in this chat' : pick.why === 'schedule' ? `by schedule${pick.event ? `: ${pick.event}` : ''}` : 'its usual one');
