// Worlds that come with the site as world files (studio-world/1). The dragon's resort is the
// first and, for now, the house: Qiulong, Errata and Echydna at Autumn's Leaves, the pilot's
// flagship Home (docs/content/pilot-brief.md). Its source is content/dragons-resort/. Its
// Errata is the site's Errata; the older mascot world ('inkwyrm-house') is retired.
import { parseWorld, type World } from '../../core/records/index.js';

export const RESORT_WORLD_ID = 'dragons-resort';
export const RESORT_NAME = 'The dragon\'s resort';
export const ERRATA_ID = 'errata';

// The world Chat puts in a first visitor's browser, and the Overview offers before that.
export const HOUSE_WORLD_ID = RESORT_WORLD_ID;
// Raised when the house changes in a way a browser that already has it should take up.
// 3: the resort replaced the old mascot world. 4: the greetings were rewritten.
export const HOUSE_VERSION = 4;
export const RETIRED_HOUSE_ID = 'inkwyrm-house';

// The bundled file, read and checked. `now` stamps it as this browser's copy.
export function resortFrom(raw: unknown, now: number): World {
  const read = parseWorld(raw);
  if (!read.ok) throw new Error(`The dragon's resort could not be read: ${read.errors.join(' ')}`);
  return { ...read.world, updatedAt: now };
}

// The same, fetched only when asked for, so a side that doesn't need it never carries it.
export async function loadResort(now: number): Promise<World> {
  const loaded = await import('../../content/dragons-resort/world.json');
  return resortFrom(loaded.default, now);
}
