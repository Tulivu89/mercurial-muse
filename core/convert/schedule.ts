// One schedule model (docs/studio-brief.md, decision 6). A record's schedule is CharacterRoom's:
// events in minutes under Daily and the weekdays. The adventure's is a list of day plans, rows
// from an hour at a place, with rules that pick a plan. An event with a place is a row; an event
// with a condition belongs to the day that condition picks. These turn one into the other.
//
// Pure: no DOM, no network, no storage.
import type { Schedule, ScheduleEvent } from '../records/schema.js';
import type { ScheduleWhen } from '../rules/ruleset.js';

type Raw = Record<string, unknown>;
export interface PlanRow { fromHour: number; locationId: string; doing: string }
export interface DayPlan { id: string; name: string; rows: PlanRow[] }
export interface PlanSchedule { plans: DayPlan[]; rules: { planId: string; when: ScheduleWhen }[] }

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const sorted = (rows: PlanRow[]) => [...rows].sort((a, b) => a.fromHour - b.fromHour);
const stable = (value: unknown): string => (value && typeof value === 'object' && !Array.isArray(value)
  ? `{${Object.keys(value as Raw).sort().filter((key) => (value as Raw)[key] !== undefined).map((key) => `${key}:${stable((value as Raw)[key])}`).join(',')}}`
  : JSON.stringify(value));

function eventsOf(prefix: string, rows: PlanRow[], when?: ScheduleWhen): ScheduleEvent[] {
  const day = sorted(rows);
  return day.map((row, index) => ({
    id: `${prefix}-${row.fromHour}`, startTime: row.fromHour * 60, endTime: (day[(index + 1) % day.length]!.fromHour * 60), text: row.doing ?? '',
    requiredIntimacy: 'none', sets: {}, rooms: {}, spots: {}, needs: {}, place: row.locationId, ...(when ? { when } : {}),
  }));
}

// The adventure's plans as events: the ordinary day, then each rule's day behind its condition.
export function eventsFromPlans(schedule: PlanSchedule): Schedule {
  const first = schedule.plans[0];
  const events = first ? eventsOf('day', first.rows) : [];
  (schedule.rules ?? []).forEach((rule, index) => {
    const plan = schedule.plans.find((entry) => entry.id === rule.planId);
    if (plan) events.push(...eventsOf(`when${index + 1}`, plan.rows, rule.when));
  });
  return { Daily: events };
}

// Events as the adventure's plans, or null when no event names a place. The ordinary day is
// the placed events with no condition; a weekday's own events make that weekday's day; each
// condition, in the order it first appears, makes a day of its own. `dayNames` is the world's
// week, so a weekday is found by its name.
export function plansFromEvents(schedule: Schedule | null | undefined, dayNames: readonly string[]): PlanSchedule | null {
  if (!schedule) return null;
  const row = (event: ScheduleEvent): PlanRow => ({ fromHour: Math.min(23, Math.floor(event.startTime / 60)), locationId: event.place!, doing: event.text.slice(0, 400) });
  const day = (events: ScheduleEvent[]): PlanRow[] => {
    const hours = new Set<number>();
    return events.map(row).filter((entry) => (hours.has(entry.fromHour) ? false : (hours.add(entry.fromHour), true)));
  };
  const placed = (key: string) => (schedule[key] ?? []).filter((event) => event.place);
  const daily = placed('Daily');
  const ordinary = daily.filter((event) => !event.when);
  const plans: DayPlan[] = [];
  const rules: PlanSchedule['rules'] = [];
  const conditions = new Map<string, { when: ScheduleWhen; events: ScheduleEvent[] }>();
  for (const event of daily) {
    if (!event.when) continue;
    const key = stable(event.when);
    if (!conditions.has(key)) conditions.set(key, { when: event.when, events: [] });
    conditions.get(key)!.events.push(event);
  }
  [...conditions.values()].forEach((entry, index) => {
    plans.push({ id: `when-${index + 1}`, name: `When ${index + 1}`, rows: day(entry.events) });
    rules.push({ planId: `when-${index + 1}`, when: entry.when });
  });
  for (const name of WEEKDAYS) {
    const own = placed(name).filter((event) => !event.when);
    const weekday = dayNames.indexOf(name);
    if (!own.length || weekday < 0) continue;
    // A weekday's events are laid over the ordinary day.
    plans.push({ id: name.toLowerCase(), name, rows: day([...own, ...ordinary]) });
    rules.push({ planId: name.toLowerCase(), when: { weekday } });
  }
  if (!ordinary.length && !plans.length) return null;
  // With no ordinary day, the first day written stands in for it.
  const base: DayPlan = ordinary.length ? { id: 'day', name: 'Day', rows: day(ordinary) } : { ...plans[0]!, id: 'day', name: 'Day' };
  return { plans: [base, ...plans], rules };
}

// A schedule's days in the order the rules are tried, whatever its plans are called.
const shape = (schedule: PlanSchedule) => stable({
  day: sorted(schedule.plans[0]?.rows ?? []).map((entry) => [entry.fromHour, entry.locationId, entry.doing ?? '']),
  rules: (schedule.rules ?? []).map((rule) => [rule.when, sorted(schedule.plans.find((plan) => plan.id === rule.planId)?.rows ?? []).map((entry) => [entry.fromHour, entry.locationId, entry.doing ?? ''])]),
});
export const sameDays = (a: PlanSchedule, b: PlanSchedule) => shape(a) === shape(b);
