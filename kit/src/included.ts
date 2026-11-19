// Worlds that come with the site as world files (studio-world/1). The dragon's resort is the
// first and, for now, the house: Qiulong, Errata and Echydna at Autumn's Leaves, the pilot's
// flagship Home (docs/content/pilot-brief.md). Its source is content/dragons-resort/. Its
// Errata is the site's Errata; the older mascot world ('inkwyrm-house') is retired. HOG Wild
// (content/hog-wild/) is the second, brought in only when someone asks for it. Volungraiv
// (content/volungraiv/) is the first adventure module: a world, not a household, so it comes in
// from the Studio, to be played in the adventure, and Chat leaves it alone.
import { parseWorld, type World } from '../../core/records/index.js';

export const RESORT_WORLD_ID = 'dragons-resort';
export const RESORT_NAME = 'The dragon\'s resort';
export const ERRATA_ID = 'errata';
export const HOG_WILD_WORLD_ID = 'hog-wild';
export const VOLUNGRAIV_WORLD_ID = 'volungraiv';

// The world Chat puts in a first visitor's browser, and the Overview offers before that.
export const HOUSE_WORLD_ID = RESORT_WORLD_ID;
// Raised when the house changes in a way a browser that already has it should take up.
// 3: the resort replaced the old mascot world. 4: the greetings were rewritten.
export const HOUSE_VERSION = 4;
export const RETIRED_HOUSE_ID = 'inkwyrm-house';

// Each world the site carries: its id, the name on its button, who is in it, whether it is a
// household (made for Chat) or a world (played in the adventure), and its file, fetched only when
// asked for, so a side that doesn't need it never carries it.
export interface IncludedWorld { id: string; name: string; who: string; household: boolean; file: () => Promise<{ default: unknown }> }
export const INCLUDED_WORLDS: readonly IncludedWorld[] = [
  { id: RESORT_WORLD_ID, name: RESORT_NAME, who: 'Qiulong, Errata and Echydna at Autumn’s Leaves, the household that comes with the site.', household: true, file: () => import('../../content/dragons-resort/world.json') },
  { id: HOG_WILD_WORLD_ID, name: 'HOG Wild', who: 'Six residents of a glass house on the Mile, streamed to the whole city.', household: true, file: () => import('../../content/hog-wild/world.json') },
  { id: VOLUNGRAIV_WORLD_ID, name: 'Volungraiv', who: 'Lowgate, the quarter inside Qetzal’s Gate, on the evening the bell rings: an adventure.', household: false, file: () => import('../../content/volungraiv/world.json') },
];
// The ones Chat offers and keeps: households only.
export const INCLUDED_HOUSEHOLDS: readonly IncludedWorld[] = INCLUDED_WORLDS.filter((entry) => entry.household);
export const includedWorld = (id: string) => INCLUDED_WORLDS.find((entry) => entry.id === id) ?? null;

// A bundled file, read and checked. `now` stamps it as this browser's copy.
export function includedFrom(raw: unknown, now: number, name = 'A world that comes with the site'): World {
  const read = parseWorld(raw);
  if (!read.ok) throw new Error(`${name} could not be read: ${read.errors.join(' ')}`);
  return { ...read.world, updatedAt: now };
}
export const resortFrom = (raw: unknown, now: number) => includedFrom(raw, now, RESORT_NAME);

export async function loadIncluded(id: string, now: number): Promise<World> {
  const entry = includedWorld(id);
  if (!entry) throw new Error(`No world called ${id} comes with the site.`);
  return includedFrom((await entry.file()).default, now, entry.name);
}
export const loadResort = (now: number) => loadIncluded(RESORT_WORLD_ID, now);
