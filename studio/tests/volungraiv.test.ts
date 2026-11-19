// Volungraiv (content/volungraiv/world.json), the first adventure module, held to the content
// standard on every change: it reads through the loader the site uses, the checker finds nothing
// but the Lee's approved size, the Checks page is clean, every schedule stop is a real place, the
// thread turns on records the world holds, and it goes to the adventure and back.
import { describe, expect, it } from 'vitest';
import { parseWorld, type World } from '../../core/records/index.js';
import { checkWorld, moduleToWorld, worldToModule } from '../../core/convert/index.js';
import { lintWorld } from '../src/content/lint';
import { VOLUNGRAIV_WORLD_ID, loadIncluded } from '../../kit/src/included';
import file from '../../content/volungraiv/world.json';

function volungraiv(): World {
  const read = parseWorld(file);
  if (!read.ok) throw new Error(read.errors.join(' '));
  return read.world;
}

const people = (world: World) => world.records.filter((record) => record.kind === 'character');

describe('Volungraiv', () => {
  it('reads as a world through the same loader the site uses, as a world and not a household', async () => {
    const world = await loadIncluded(VOLUNGRAIV_WORLD_ID, 5);
    expect(world.id).toBe('volungraiv');
    expect(world.updatedAt).toBe(5);
    expect(world.use).toBeUndefined();
    // The people the thread turns on are its leads.
    expect(people(world).filter((record) => record.tags.includes('lead')).map((record) => record.name)).toEqual(['Hollis Crane', 'Wenna', 'Teague', 'Nefera', 'Tamsin', 'Ansel']);
  });

  it('passes the content checker, with only the Lee over its size (approved with the gold pair)', () => {
    const findings = lintWorld(volungraiv()).findings.filter((finding) => !(finding.recordId === 'the-lee' && finding.kind === 'over' && finding.where === 'here'));
    expect(findings).toEqual([]);
  });

  it('has no problems on the Checks page', () => {
    expect(checkWorld(volungraiv())).toEqual([]);
  });

  it('points every schedule stop at a real place someone can stand in', () => {
    const world = volungraiv();
    const places = new Map(world.records.filter((record) => record.kind === 'place').map((record) => [record.id, record]));
    const wrong: string[] = [];
    for (const person of people(world)) {
      for (const [day, events] of Object.entries(person.schedule ?? {})) {
        for (const event of events) {
          const where = `${person.name} ${day} ${event.id}`;
          if (!event.place) wrong.push(`${where}: no place`);
          else if (!places.has(event.place)) wrong.push(`${where}: place ${event.place}`);
          else if (places.get(event.place)?.rules?.placeKind === 'region') wrong.push(`${where}: a region`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('keeps its people to the sizes the adventure sends', () => {
    const over: string[] = [];
    for (const person of people(volungraiv())) {
      for (const section of person.sections) if (section.reach === 'here' && section.text.length >= 420) over.push(`${person.name}: ${section.title}`);
      if (person.line.split(/\s+/).length > 25) over.push(`${person.name}: line`);
    }
    expect(over).toEqual([]);
  });

  it('has Bought Out, with its ending held by a world state and the envoy on day 3', () => {
    const world = volungraiv();
    const ids = new Set(world.records.map((record) => record.id));
    const thread = world.records.find((record) => record.id === 'bought-out')!;
    const milestones = thread.rules?.thread?.milestones ?? [];
    expect(milestones.map((milestone) => milestone.id)).toEqual(['stand-down', 'count', 'coin', 'ending', 'envoy']);
    for (const milestone of milestones) if (milestone.targetId) expect(ids.has(milestone.targetId)).toBe(true);
    expect(milestones.find((milestone) => milestone.id === 'ending')?.when).toEqual([{ stateId: 'bought-out', characterId: 'world', atLeast: 1 }]);
    expect(milestones.find((milestone) => milestone.id === 'envoy')?.fromDay).toBe(3);
    // The day is the rules' to hold: no text names it.
    const texts = world.records.flatMap((record) => [record.line, ...record.sections.map((section) => section.text)]);
    expect(texts.filter((text) => /\bday (3|three)\b/i.test(text))).toEqual([]);
  });

  it('uses every condition it defines, and defines every one it uses', () => {
    const world = volungraiv();
    const used = new Set(world.records.flatMap((record) => record.sections.flatMap((section) => (section.when ? [section.when] : []))));
    expect([...used].sort()).toEqual(world.conditions.map((condition) => condition.id).sort());
  });

  it('goes out to the adventure as a module and comes back', () => {
    const out = worldToModule(volungraiv());
    // The Lee's watchful porters (its Alert) wait on the code that carries a place's states over.
    expect(out.notes).toEqual(['Where a place or a group starts its states stays in the Studio for now; the adventure starts them at rest.']);
    const back = moduleToWorld(out.module, 1);
    expect(back.ok).toBe(true);
  });
});
