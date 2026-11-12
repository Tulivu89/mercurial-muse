// Travel by level (docs/bids/maps/decision.md). Every kind of place belongs to a level: a land,
// a region, open country, a settlement or a site, a building. A level has a typical trip across
// it and a cost to step inside one of its places, in minutes. A world changes only the numbers
// it wants; the rest are these. Level by kind, never by depth: a town sits one level down in one
// world and three in the next. Pure: no DOM, no network, no storage.

import { z } from 'zod';
import type { PlaceKind } from './ruleset.js';

export const TRAVEL_LEVELS = ['land', 'region', 'open', 'settlement', 'building'] as const;
export type TravelLevel = (typeof TRAVEL_LEVELS)[number];

export const LEVEL_OF: Record<PlaceKind, TravelLevel> = {
  'continent': 'land', 'major region': 'land',
  'region': 'region', 'subregion': 'region', 'territory': 'region', 'sea or ocean': 'region',
  'wilderness': 'open', 'lake': 'open', 'river': 'open', 'road or trail': 'open',
  'settlement': 'settlement', 'town': 'settlement', 'village': 'settlement', 'district': 'settlement', 'landmark': 'settlement', 'other': 'settlement',
  'building': 'building',
};

export const LEVEL_NAMES: Record<TravelLevel, { name: string; kinds: string }> = {
  land: { name: 'A land', kinds: 'continent, major region' },
  region: { name: 'A region', kinds: 'region, subregion, territory, sea or ocean' },
  open: { name: 'Open country', kinds: 'wilderness, lake, river, road or trail' },
  settlement: { name: 'A settlement or a site', kinds: 'settlement, town, village, district, landmark, other' },
  building: { name: 'A building', kinds: 'building' },
};

export interface LevelTimes { across: number; step: number }
export const STANDARD_LEVELS: Record<TravelLevel, LevelTimes> = {
  land: { across: 2880, step: 0 },
  region: { across: 240, step: 0 },
  open: { across: 60, step: 5 },
  settlement: { across: 10, step: 2 },
  building: { across: 2, step: 0 },
};
// A step along a road costs this share of a cell.
export const STANDARD_ROAD = 0.4;
// A cell is this share of a level's typical trip, until a sheet sets its own.
export const CELLS_PER_TRIP = 4;

const minutes = z.number().int().min(0).max(525_600);
const levelTimesSchema = z.object({ across: minutes.optional(), step: minutes.optional() });
// A world's own: only the numbers it changed.
export const levelsSchema = z.object({
  land: levelTimesSchema.optional(),
  region: levelTimesSchema.optional(),
  open: levelTimesSchema.optional(),
  settlement: levelTimesSchema.optional(),
  building: levelTimesSchema.optional(),
  road: z.number().min(0.05).max(1).optional(),
});
export type WorldLevels = z.infer<typeof levelsSchema>;

export interface Levels { times: Record<TravelLevel, LevelTimes>; road: number }

// The levels a world travels by: its own numbers over the standard.
export function levelsOf(own: WorldLevels | null | undefined): Levels {
  const times = Object.fromEntries(TRAVEL_LEVELS.map((level) => [level, { ...STANDARD_LEVELS[level], ...stripUndefined(own?.[level]) }])) as Record<TravelLevel, LevelTimes>;
  return { times, road: own?.road ?? STANDARD_ROAD };
}
const stripUndefined = <T extends object>(value: T | undefined): Partial<T> => Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined)) as Partial<T>;

// Only the numbers that differ from the standard, or undefined when none do.
export function pruneLevels(own: WorldLevels | null | undefined): WorldLevels | undefined {
  if (!own) return undefined;
  const out: WorldLevels = {};
  for (const level of TRAVEL_LEVELS) {
    const entry = own[level];
    if (!entry) continue;
    const kept: { across?: number; step?: number } = {};
    if (entry.across !== undefined && entry.across !== STANDARD_LEVELS[level].across) kept.across = entry.across;
    if (entry.step !== undefined && entry.step !== STANDARD_LEVELS[level].step) kept.step = entry.step;
    if (Object.keys(kept).length) out[level] = kept;
  }
  if (own.road !== undefined && own.road !== STANDARD_ROAD) out.road = own.road;
  return Object.keys(out).length ? out : undefined;
}

export function levelsChanged(own: WorldLevels | null | undefined): number {
  const kept = pruneLevels(own);
  if (!kept) return 0;
  return TRAVEL_LEVELS.reduce((sum, level) => sum + Object.keys(kept[level] ?? {}).length, 0) + (kept.road !== undefined ? 1 : 0);
}
