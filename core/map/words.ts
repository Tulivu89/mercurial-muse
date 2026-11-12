// A journey's legs in plain words, for the Studio's map and later the adventure's.
import { durationWords } from '../rules/index.js';
import type { Leg } from './journey.js';
import type { PlaceMap } from './sheet.js';

// "The eel traps" mid-sentence is "the eel traps".
export function midName(map: PlaceMap, id: string): string {
  const name = map.places.get(id)?.name ?? id;
  return /^The /.test(name) ? `the${name.slice(3)}` : name;
}

export const timeWords = (minutes: number) => (!Number.isFinite(minutes) ? 'no way there' : Math.round(minutes) === 0 ? 'no time' : durationWords(minutes));
export const cellWorthWords = (minutes: number) => (minutes < 1 ? `${Math.round(minutes * 60)} s` : durationWords(minutes));

export function legWords(map: PlaceMap, leg: Leg): { text: string; note?: string } {
  const at = (id: string) => midName(map, id);
  if (leg.kind === 'out') return { text: `Out of ${at(leg.from)}, into ${at(leg.into)}` };
  if (leg.kind === 'in') return { text: `From ${at(leg.from)} into ${at(leg.into)}` };
  const steps = `${leg.steps} ${leg.steps === 1 ? 'cell' : 'cells'}`;
  return {
    text: `Across ${at(leg.sheet)}: ${at(leg.from)} to ${at(leg.to)}`,
    note: leg.onRoad ? `${steps}, ${leg.onRoad} of them by road, at ${cellWorthWords(leg.cellMinutes)} a cell off the road` : `${steps} at ${cellWorthWords(leg.cellMinutes)} a cell`,
  };
}
