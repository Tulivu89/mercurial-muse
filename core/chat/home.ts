// Home: a character's day, kept per character on this device (CharacterRoom's Tamagotchi mode,
// CR-PLAN §6.12). Nothing runs while you are away: where they are and how their needs stand is
// worked out from the clock whenever it is looked at, the same way every time. A life holds
// what play has changed; the record holds the rest and is never written by it.
import { z } from 'zod';
import { RELATIONSHIPS } from '../records/charactercard.js';
import type { Placed, Spot, StoryRecord } from '../records/schema.js';
import { clockSchema } from './chat.js';
import { replaceMacros } from './macros.js';
import { DEFAULT_CLOCK, MIN_MS, clockNow, formatMinutes, levelReaches, minutesOfDay, readSchedule, weekdayOf, type StatusRead } from './time.js';

export const LIFE_FORMAT = 'inkwyrm-life/1';
const id = z.string().min(1).max(80);
const levelSchema = z.object({ v: z.number(), at: z.number().nonnegative() });

export const lifeSchema = z.object({
  format: z.literal(LIFE_FORMAT),
  // "worldId:characterId".
  key: z.string().min(3).max(200),
  worldId: id,
  characterId: id,
  // One clock and one relationship for the character, shared by Home and every chat with them.
  clock: clockSchema.default(DEFAULT_CLOCK),
  relationship: z.enum(RELATIONSHIPS).default('stranger'),
  pins: z.record(z.string().max(200), id).default({}),
  // Where each need stood, and when; reading one walks the clock on from there.
  levels: z.record(id, levelSchema).default({}),
  bond: levelSchema.nullable().default(null),
  // When each action was last done, on the life's clock.
  done: z.record(id, z.number().nonnegative()).default({}),
  log: z.array(z.object({ at: z.number().nonnegative(), text: z.string().max(600) })).max(200).default([]),
  // The clock when Home last looked, for "while you were away".
  seenAt: z.number().nonnegative().default(0),
});
export type Life = z.infer<typeof lifeSchema>;

export const lifeKey = (worldId: string, characterId: string) => `${worldId}:${characterId}`;
export function newLife(worldId: string, record: StoryRecord, nowMs: number): Life {
  const relationship = (RELATIONSHIPS as readonly string[]).includes(record.chatDefaults?.relationship ?? '') ? record.chatDefaults!.relationship as Life['relationship'] : 'stranger';
  return { format: LIFE_FORMAT, key: lifeKey(worldId, record.id), worldId, characterId: record.id, clock: { ...DEFAULT_CLOCK }, relationship, pins: {}, levels: {}, bond: null, done: {}, log: [], seenAt: nowMs };
}
export function parseLife(raw: unknown): Life | null {
  const read = lifeSchema.safeParse(raw);
  return read.success ? read.data : null;
}
export const lifeNow = (life: Life, realNowMs: number) => clockNow(life.clock, realNowMs);

const STEP = 15 * MIN_MS;
const SPAN = 14 * 1440 * MIN_MS;
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

export interface Care { needs: Record<string, number>; bond: number | null }

// Where every need and the bond stand at a moment. Each is walked forward from when it was
// last set, in quarter hours: a need moves at the rate the schedule event on at the time gives
// it, or falls by its own decay; the bond rises while every need is kept up and falls while
// needs are low. A need never set starts full and stays full until something sets it.
export function careAt(record: StoryRecord, life: Life, ms: number): Care {
  const until = Math.floor(ms / MIN_MS) * MIN_MS;
  const needs: Record<string, number> = {};
  for (const need of record.needs) needs[need.id] = life.levels[need.id] ? clamp(life.levels[need.id]!.v, need.max) : need.max;
  const track = record.bond;
  let bond = track ? (life.bond ? clamp(life.bond.v, track.max) : Math.round(track.max / 2)) : null;
  const starts = [...record.needs.filter((need) => life.levels[need.id]).map((need) => life.levels[need.id]!.at), ...(track && life.bond ? [life.bond.at] : [])];
  const from = Math.max(starts.length ? Math.min(...starts) : until, until - SPAN);
  for (let a = from; a < until; a += STEP) {
    const b = Math.min(until, a + STEP);
    if (track && life.bond && life.bond.at < b && record.needs.length) {
      const allUp = record.needs.every((need) => needs[need.id]! >= need.max * track.upAt / 100);
      const lows = record.needs.filter((need) => needs[need.id]! <= need.low).length;
      const falling = track.downWhen === 'any' ? lows > 0 : lows === record.needs.length;
      const rate = allUp ? track.up : falling ? -track.down : 0;
      bond = clamp(bond! + rate * (b - Math.max(a, life.bond.at)) / 3_600_000, track.max);
    }
    const live = readSchedule(record.schedule, life.relationship, a).live;
    for (const need of record.needs) {
      const set = life.levels[need.id];
      if (!set || set.at >= b) continue;
      const rate = live.find((event) => typeof event.needs[need.id] === 'number')?.needs[need.id] ?? -need.decay;
      needs[need.id] = clamp(needs[need.id]! + rate * (b - Math.max(a, set.at)) / 3_600_000, need.max);
    }
  }
  return { needs, bond };
}

export const lowNeeds = (record: StoryRecord, care: Care) => record.needs.filter((need) => (care.needs[need.id] ?? need.max) <= need.low);
// The face a figure shows: the first low need's, if any.
export const needEmotion = (record: StoryRecord, care: Care) => lowNeeds(record, care).find((need) => need.lowEmotion)?.lowEmotion ?? '';

// What the model is told, in CharacterRoom's words: every need where it stands now.
export function needsText(record: StoryRecord, care: Care, userName: string, nowMs: number): string {
  if (!record.needs.length) return '';
  const said = record.needs.map((need) => {
    const value = care.needs[need.id] ?? need.max;
    const note = need.note ? ` — ${replaceMacros(need.note, record.name, userName, nowMs)}` : '';
    return `${need.name || 'Need'} ${Math.round(value)}/${need.max}${value <= need.low ? ` (low${note})` : ''}`;
  });
  return `${record.name || 'They'}'s needs right now: ${said.join(', ')}.`;
}

type Action = StoryRecord['homeActions'][number];
// Whether an action can be done now, and if not, why.
export function actionBlocked(life: Life, action: Action, ms: number): string {
  if (action.level && !levelReaches(life.relationship, action.level)) return `Once you're ${action.level}.`;
  const last = life.done[action.id];
  if (action.cooldown > 0 && last !== undefined && ms - last < action.cooldown * 3_600_000) {
    const hours = Math.ceil((action.cooldown * 3_600_000 - (ms - last)) / 3_600_000);
    return `Again in ${hours} hour${hours === 1 ? '' : 's'}.`;
  }
  return '';
}

// Doing something for them: needs move by the action's effects, the bond by its own, and what
// happened goes in the log.
export function doAction(record: StoryRecord, life: Life, actionId: string, ms: number, userName: string): Life {
  const action = record.homeActions.find((entry) => entry.id === actionId);
  if (!action || actionBlocked(life, action, ms)) return life;
  const care = careAt(record, life, ms);
  // Every need is pinned to this moment, so the ones the action leaves alone start falling too.
  const levels: Life['levels'] = {};
  for (const need of record.needs) levels[need.id] = { v: clamp((care.needs[need.id] ?? need.max) + (action.effects[need.id] ?? 0), need.max), at: ms };
  const bond = record.bond ? { v: clamp((care.bond ?? record.bond.max / 2) + action.bond, record.bond.max), at: ms } : null;
  const text = action.say ? replaceMacros(action.say, record.name, userName, ms) : `${action.name}.`;
  return { ...life, levels, bond, done: { ...life.done, [action.id]: ms }, log: [...life.log, { at: ms, text }].slice(-200) };
}

// --- Where they are.

export interface Placement { room: string; spot: Spot; event: string; idle: boolean }
const forScenario = <T>(row: Record<string, T>, scenario: StoryRecord): T | undefined => row[scenario.id] ?? (scenario.sourceId ? row[scenario.sourceId] : undefined);

// The room of a scenario a character is in and where they stand in it: what the schedule event
// on now says, else where they idle there. Null when the scenario is no part of their day.
export function placeIn(record: StoryRecord, scenario: StoryRecord, status: StatusRead): Placement | null {
  for (const event of status.live) {
    const room = forScenario(event.rooms, scenario);
    if (!room) continue;
    const spot = forScenario(event.spots, scenario) ?? { x: 0.5, y: 0.62, scale: 0.3, pic: '' };
    return { room, spot, event: event.text.trim(), idle: false };
  }
  const idle: Placed | undefined = forScenario(record.idle, scenario);
  if (idle?.room) return { room: idle.room, spot: { x: idle.x, y: idle.y, scale: idle.scale, pic: idle.pic }, event: '', idle: true };
  return null;
}

// Whether a scenario is somewhere this character lives: a schedule event happens there, or they idle there.
export function livesIn(record: StoryRecord, scenario: StoryRecord): boolean {
  if (record.kind !== 'character') return false;
  if (forScenario(record.idle, scenario)) return true;
  return Object.values(record.schedule ?? {}).some((events) => events.some((event) => forScenario(event.rooms, scenario)));
}

export interface AwayEntry { at: number; text: string }

// What happened between two moments, replayed from the schedule and the needs: each event as it
// came on, and each need as it ran low. The same gap always replays to the same list.
export function whileAway(record: StoryRecord, life: Life, fromMs: number, toMs: number, userName: string, limit = 24): AwayEntry[] {
  const out: AwayEntry[] = [];
  const start = Math.max(fromMs, toMs - SPAN);
  if (toMs - start < STEP) return out;
  let on = new Set(readSchedule(record.schedule, life.relationship, start).live.map((event) => event.id));
  let low = new Set(lowNeeds(record, careAt(record, life, start)).map((need) => need.id));
  for (let at = Math.ceil((start + 1) / STEP) * STEP; at <= toMs; at += STEP) {
    const live = readSchedule(record.schedule, life.relationship, at).live;
    for (const event of live) if (!on.has(event.id) && event.text.trim()) out.push({ at, text: replaceMacros(event.text.trim(), record.name, userName, at) });
    on = new Set(live.map((event) => event.id));
    const nowLow = lowNeeds(record, careAt(record, life, at));
    for (const need of nowLow) if (!low.has(need.id)) out.push({ at, text: `${need.name} ran low.` });
    low = new Set(nowLow.map((need) => need.id));
  }
  return out.slice(-limit);
}

export const stampOf = (ms: number) => `${weekdayOf(ms).slice(0, 3)} ${formatMinutes(minutesOfDay(ms))}`;
