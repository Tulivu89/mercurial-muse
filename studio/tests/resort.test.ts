// The dragon's resort (content/dragons-resort/world.json), the pilot's flagship world, held to the
// content standard on every change: it reads, the checker finds nothing, every schedule stop points
// at something real, and it goes to the adventure and back.
import { describe, expect, it } from 'vitest';
import { parseWorld, type World } from '../../core/records/index.js';
import { checkWorld, moduleToWorld, worldToModule } from '../../core/convert/index.js';
import { lintWorld } from '../src/content/lint';
import { RESORT_WORLD_ID, loadResort } from '../../kit/src/included';
import file from '../../content/dragons-resort/world.json';

function resort(): World {
  const read = parseWorld(file);
  if (!read.ok) throw new Error(read.errors.join(' '));
  return read.world;
}

describe('the dragon\'s resort', () => {
  it('reads as a world, through the same loader the site uses', async () => {
    const world = await loadResort(5);
    expect(world.id).toBe(RESORT_WORLD_ID);
    expect(world.updatedAt).toBe(5);
    expect(world.records.filter((record) => record.kind === 'character').map((record) => record.name)).toEqual(['Qiulong', 'Errata', 'Echydna']);
  });

  it('passes the content checker with nothing to look at twice', () => {
    expect(lintWorld(resort()).findings).toEqual([]);
  });

  it('has no problems on the Checks page', () => {
    expect(checkWorld(resort())).toEqual([]);
  });

  it('points every schedule stop at a real place, outfit, room and figure', () => {
    const world = resort();
    const places = new Set(world.records.filter((record) => record.kind === 'place').map((record) => record.id));
    const scenario = world.records.find((record) => record.kind === 'scenario')!;
    const rooms = new Set(scenario.sets.flatMap((set) => set.members.map((member) => member.id)));
    const wrong: string[] = [];
    for (const person of world.records.filter((record) => record.kind === 'character')) {
      expect(person.chatListed).toBe(true);
      const outfits = new Map(person.sets.map((set) => [set.id, new Set(set.members.map((member) => member.id))]));
      const figures = new Set(person.figures.map((figure) => figure.id));
      for (const [day, events] of Object.entries(person.schedule ?? {})) {
        for (const event of events) {
          const where = `${person.name} ${day} ${event.id}`;
          if (event.place && !places.has(event.place)) wrong.push(`${where}: place ${event.place}`);
          for (const [setId, memberId] of Object.entries(event.sets ?? {})) if (!outfits.get(setId)?.has(memberId)) wrong.push(`${where}: outfit ${memberId}`);
          for (const room of Object.values(event.rooms ?? {})) if (!rooms.has(room)) wrong.push(`${where}: room ${room}`);
          for (const spot of Object.values(event.spots ?? {})) if (spot.pic && !figures.has(spot.pic)) wrong.push(`${where}: figure ${spot.pic}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('goes out to the adventure as a module and comes back', () => {
    const out = worldToModule(resort());
    const back = moduleToWorld(out.module, 1);
    expect(back.ok).toBe(true);
  });
});
