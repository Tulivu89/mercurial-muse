// Worlds that come with the site as world files (studio-world/1), fetched only when someone asks
// for one. The dragon's resort is the first: Qiulong, Errata and Echydna at Autumn's Leaves, the
// pilot's flagship Home (docs/content/pilot-brief.md). Its source is content/dragons-resort/.
import { parseWorld, type World } from '../../core/records/index.js';

export const RESORT_WORLD_ID = 'dragons-resort';
export const RESORT_NAME = 'The dragon\'s resort';

// The bundled file, read and checked. `now` stamps it as this browser's copy.
export async function loadResort(now: number): Promise<World> {
  const loaded = await import('../../content/dragons-resort/world.json');
  const read = parseWorld(loaded.default);
  if (!read.ok) throw new Error(`The dragon's resort could not be read: ${read.errors.join(' ')}`);
  return { ...read.world, updatedAt: now };
}
