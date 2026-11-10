// Checks for authors: what would trip the adventure, or a reader, found before it is played.
// Bogwater's census (never more than four named people in one place) made a tool.
//
// Pure: no DOM, no network, no storage.
import type { StoryRecord, World } from '../records/schema.js';
import { DEFAULT_CALENDAR, MINUTES_PER_DAY, dayOf, monthOf, stamp, weekdayOf, type Calendar } from '../rules/clock.js';
import { rulesFor, goodsOf } from '../rules/for.js';
import { AREA_KINDS, type ScheduleWhen } from '../rules/ruleset.js';
import { readRuleset } from '../rules/world-rules.js';
import { plansFromEvents, type PlanSchedule } from './schedule.js';

export interface Problem {
  // The record to open to fix it, or null for the world's own pages.
  recordId: string | null;
  where: string;
  text: string;
}

export const CENSUS_LIMIT = 4;
// Morning, afternoon, evening, night: the times of day a player notices.
const HOURS = [6, 12, 18, 22];
type Raw = Record<string, unknown>;
const carriedOf = (record: StoryRecord) => (record.carried ?? {}) as Raw;

function holds(when: ScheduleWhen, calendar: Calendar, t: number, state: (condition: NonNullable<ScheduleWhen['state']>) => boolean): boolean {
  const month = monthOf(calendar, t);
  if (when.weekday !== undefined && when.weekday !== weekdayOf(calendar, t)) return false;
  if (when.month !== undefined && when.month !== month?.index) return false;
  if (when.monthDay !== undefined && when.monthDay !== month?.dayOfMonth) return false;
  if (when.fromDay !== undefined && dayOf(t) < when.fromDay) return false;
  if (when.toDay !== undefined && dayOf(t) > when.toDay) return false;
  return !when.state || state(when.state);
}

function placeAt(schedule: PlanSchedule, calendar: Calendar, t: number, hour: number, state: (condition: NonNullable<ScheduleWhen['state']>) => boolean): string | null {
  const rule = schedule.rules.find((entry) => holds(entry.when, calendar, t, state) && schedule.plans.some((plan) => plan.id === entry.planId));
  const plan = rule ? schedule.plans.find((entry) => entry.id === rule.planId)! : schedule.plans[0];
  if (!plan?.rows.length) return null;
  const rows = [...plan.rows].sort((a, b) => a.fromHour - b.fromHour);
  let found = rows[rows.length - 1]!;
  for (const row of rows) if (row.fromHour <= hour) found = row;
  return found.locationId;
}

export function checkWorld(world: World, days = 40): Problem[] {
  const out: Problem[] = [];
  const byId = new Map(world.records.map((record) => [record.id, record]));
  const add = (record: StoryRecord | null, text: string) => out.push({ recordId: record?.id ?? null, where: record?.name ?? world.name, text });
  const isPlace = (id: unknown) => typeof id === 'string' && byId.get(id)?.kind === 'place';
  const isArea = (id: string) => AREA_KINDS.includes(byId.get(id)?.rules?.placeKind ?? 'other');
  const nameOf = (id: unknown) => (typeof id === 'string' && byId.get(id)?.name) || `"${String(id)}"`;
  const reading = readRuleset(world.rules);
  const ruleset = reading.ruleset;
  const states = new Map(ruleset.states.map((def) => [def.id, def]));
  const approaches = new Set(ruleset.approaches.map((approach) => approach.id));
  const goods = new Set(goodsOf(world).map((good) => good.id));
  const calendar = world.rules?.calendar ?? DEFAULT_CALENDAR;
  const conditions = new Set(world.conditions.map((condition) => condition.id));
  for (const problem of reading.problems) add(null, problem);

  // Every When has its condition.
  for (const record of world.records) {
    for (const section of record.sections) {
      if (section.reach === 'when' && (!section.when || !conditions.has(section.when))) add(record, `The section "${section.title}" is When, with no condition to wait on.`);
    }
    for (const set of record.sets) for (const member of set.members) if (member.lock && !conditions.has(member.lock)) add(record, `"${member.name}" in ${set.title} is locked behind a condition that is gone.`);
    for (const groupId of record.groupIds) if (byId.get(groupId)?.kind !== 'group') add(record, `Belongs to a group that is gone.`);
    if (record.kind === 'place' && record.parentId && !isPlace(record.parentId)) add(record, 'Is inside a place that is gone.');
  }

  // Nothing a rule points at is missing.
  const stateValue = (ownerId: string | undefined, self: StoryRecord, stateId: string): number | null => {
    const def = states.get(stateId);
    if (!def) return null;
    if (ownerId === 'world') return def.scope === 'world' ? def.start : null;
    const owner = ownerId ? byId.get(ownerId) : self;
    const found = owner ? rulesFor(world, owner)?.states.find((state) => state.def.id === stateId) : undefined;
    return found ? found.value.value : null;
  };
  for (const record of world.records) {
    const rules = record.rules;
    if (!rules) continue;
    const own = new Set(rulesFor(world, record)?.states.map((state) => state.def.id) ?? []);
    for (const block of [rules, rules.members ?? {}]) {
      const target = block === rules ? own : new Set(ruleset.states.filter((def) => def.scope === 'char' || def.scope === 'npc').map((def) => def.id));
      for (const field of ['states', 'maxima'] as const) for (const stateId of Object.keys(block[field] ?? {})) if (!target.has(stateId)) add(record, `Sets ${states.get(stateId)?.name ?? `"${stateId}"`}, which ${block === rules ? 'it' : 'a member'} doesn't hold.`);
      for (const approachId of Object.keys(block.difficulty ?? {})) if (approachId !== 'all' && !approaches.has(approachId)) add(record, `Sets a difficulty for an approach that is gone: "${approachId}".`);
      for (const approachId of Object.keys(block.charges ?? {})) if (!approaches.has(approachId)) add(record, `Has charges for an approach that is gone: "${approachId}".`);
      for (const goodId of [...(block.sells ?? []), ...(block.carries ?? [])]) if (!goods.has(goodId)) add(record, `Sells or carries something that is gone: "${goodId}".`);
    }
  }
  for (const action of world.rules?.actions ?? []) {
    const say = (text: string) => add(null, `The scene action "${action.name}" ${text}`);
    for (const placeId of action.placeIds) if (!isPlace(placeId)) say(`is offered at a place that is gone: ${nameOf(placeId)}.`);
    for (const personId of action.present) if (!['character', 'persona'].includes(byId.get(personId)?.kind ?? '')) say(`needs someone who is gone: ${nameOf(personId)}.`);
    for (const entry of [...action.when, ...action.effects]) {
      if (entry.stateId && !states.has(entry.stateId)) say(`points at a state that is gone: "${entry.stateId}".`);
      if (entry.characterId && entry.characterId !== 'world' && !byId.has(entry.characterId)) say(`points at someone who is gone: ${nameOf(entry.characterId)}.`);
      if ('goodId' in entry && entry.goodId && !goods.has(entry.goodId)) say(`gives or takes something that is gone: "${entry.goodId}".`);
    }
  }

  // Every route connects.
  for (const route of world.routes ?? []) {
    for (const end of [route.from, route.to]) {
      if (!isPlace(end)) add(null, `A route ends at a place that is gone: ${nameOf(end)}.`);
      else if (isArea(end)) add(byId.get(end)!, 'A route ends here, but a region is not somewhere a road can end.');
    }
    if (route.from === route.to) add(byId.get(route.from) ?? null, 'A route leads from here back to here.');
    for (const need of route.requires) if (!states.has(need.stateId)) add(byId.get(route.from) ?? null, `The route to ${nameOf(route.to)} needs a state that is gone: "${need.stateId}".`);
  }

  // Every schedule stop is a real place, and people's days are worked out for the census.
  const scenario = world.records.find((record) => record.kind === 'scenario');
  const start = scenario ? carriedOf(scenario) : {};
  if (typeof start.startPlaceId === 'string' && !isPlace(start.startPlaceId)) add(scenario!, 'Play starts at a place that is gone.');
  const days0 = typeof start.startAt === 'number' ? dayOf(start.startAt) : 0;
  const people = world.records.filter((record) => record.kind === 'character');
  const schedules = new Map<string, PlanSchedule>();
  for (const person of people) {
    for (const [day, events] of Object.entries(person.schedule ?? {})) {
      for (const event of events) {
        if (event.place === undefined) continue;
        if (!isPlace(event.place)) add(person, `A stop on ${day} is at a place that is gone: ${nameOf(event.place)}.`);
        else if (isArea(event.place)) add(person, `A stop on ${day} is at ${nameOf(event.place)}, a region, not somewhere to be.`);
        const state = event.when?.state;
        if (state && stateValue(state.characterId, person, state.stateId) === null) add(person, `A stop on ${day} waits on a state its owner doesn't hold: "${state.stateId}".`);
      }
    }
    const plans = plansFromEvents(person.schedule, calendar.dayNames);
    if (plans) schedules.set(person.id, plans);
    const home = carriedOf(person).homeLocationId;
    if (home !== undefined && !isPlace(home)) add(person, 'Lives at a place that is gone.');
  }
  for (const item of world.records.filter((record) => record.kind === 'item')) {
    const lies = carriedOf(item).locationId;
    if (lies !== undefined && !isPlace(lies)) add(item, 'Lies at a place that is gone.');
  }

  // The census: at the four times of day, over a span of days, no place holds more than four.
  const crowded = new Set<string>();
  for (let day = days0; day < days0 + days; day++) {
    for (const hour of HOURS) {
      const t = day * MINUTES_PER_DAY + hour * 60;
      const counts = new Map<string, string[]>();
      for (const person of people) {
        const plans = schedules.get(person.id);
        const state = (condition: NonNullable<ScheduleWhen['state']>) => {
          const value = stateValue(condition.characterId, person, condition.stateId);
          return value !== null && (condition.atLeast === undefined || value >= condition.atLeast) && (condition.atMost === undefined || value <= condition.atMost);
        };
        const home = carriedOf(person).homeLocationId;
        const placeId = plans ? placeAt(plans, calendar, t, hour, state) : typeof home === 'string' ? home : null;
        if (placeId) counts.set(placeId, [...(counts.get(placeId) ?? []), person.name]);
      }
      for (const [placeId, names] of counts) {
        if (names.length <= CENSUS_LIMIT || crowded.has(placeId)) continue;
        crowded.add(placeId);
        add(byId.get(placeId) ?? null, `Holds ${names.length} people at once on ${stamp(calendar, t)}, day ${day - days0 + 1}: ${names.join(', ')}. More than ${CENSUS_LIMIT} is a crowd the narrator loses track of.`);
      }
    }
  }
  return out;
}
