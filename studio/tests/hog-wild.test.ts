// HOG Wild (content/hog-wild/world.json), the second flagship world, held to the content standard
// on every change: it reads, the checker finds nothing, every schedule stop points at something
// real, its lab suite asks only for what is in it, and it goes to the adventure and back.
import { describe, expect, it } from 'vitest';
import { parseWorld, type World } from '../../core/records/index.js';
import { checkWorld, moduleToWorld, worldToModule } from '../../core/convert/index.js';
import { lintWorld } from '../src/content/lint';
import file from '../../content/hog-wild/world.json';
import suite from '../../content/hog-wild/lab-suite.json';

function hogWild(): World {
  const read = parseWorld(file);
  if (!read.ok) throw new Error(read.errors.join(' '));
  return read.world;
}

const leads = (world: World) => world.records.filter((record) => record.kind === 'character' && record.tags.includes('lead'));

describe('HOG Wild', () => {
  it('reads as a world, with wave 1\'s three leads', () => {
    const world = hogWild();
    expect(world.id).toBe('hog-wild');
    expect(leads(world).map((record) => record.name)).toEqual(['Nova', 'Lux', 'Primus']);
  });

  it('passes the content checker with nothing to look at twice', () => {
    expect(lintWorld(hogWild()).findings).toEqual([]);
  });

  it('has no problems on the Checks page', () => {
    expect(checkWorld(hogWild())).toEqual([]);
  });

  it('points every schedule stop at a real place, set member, room and figure', () => {
    const world = hogWild();
    const places = new Set(world.records.filter((record) => record.kind === 'place').map((record) => record.id));
    const scenario = world.records.find((record) => record.kind === 'scenario')!;
    const rooms = new Set(scenario.sets.flatMap((set) => set.members.map((member) => member.id)));
    const wrong: string[] = [];
    for (const person of leads(world)) {
      expect(person.chatListed).toBe(true);
      const sets = new Map(person.sets.map((set) => [set.id, new Set(set.members.map((member) => member.id))]));
      const figures = new Set(person.figures.map((figure) => figure.id));
      for (const [day, events] of Object.entries(person.schedule ?? {})) {
        for (const event of events) {
          const where = `${person.name} ${day} ${event.id}`;
          if (event.place && !places.has(event.place)) wrong.push(`${where}: place ${event.place}`);
          for (const [setId, memberId] of Object.entries(event.sets ?? {})) if (!sets.get(setId)?.has(memberId)) wrong.push(`${where}: set member ${memberId}`);
          for (const room of Object.values(event.rooms ?? {})) if (!rooms.has(room)) wrong.push(`${where}: room ${room}`);
          for (const spot of Object.values(event.spots ?? {})) if (spot.pic && !figures.has(spot.pic)) wrong.push(`${where}: figure ${spot.pic}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('keeps the house format in everything a chat model copies', () => {
    const wrong: string[] = [];
    for (const person of leads(hogWild())) {
      const texts = [...person.greetings.map((greeting) => greeting.text), ...person.examples.flatMap((chat) => chat.messages.map((message) => message.text))];
      for (const text of texts) {
        if (text.includes('\n\n')) wrong.push(`${person.name}: a blank line in "${text.slice(0, 40)}"`);
        if (text.includes('"')) wrong.push(`${person.name}: quotation marks in "${text.slice(0, 40)}"`);
      }
      // Brackets are the person's: a resident never writes a directive of her own.
      for (const chat of person.examples) for (const message of chat.messages) if (message.fromCharacter && /\[[^\]]*\]/.test(message.text)) wrong.push(`${person.name}: brackets in her own turn in ${chat.name}`);
      for (const greeting of person.greetings) if (/\[[^\]]*\]/.test(greeting.text)) wrong.push(`${person.name}: brackets in a greeting`);
    }
    expect(wrong).toEqual([]);
  });

  it('has a lab suite that asks only for characters and a scenario the world holds', () => {
    const world = hogWild();
    const ids = new Set(world.records.map((record) => record.id));
    for (const entry of suite.cases) {
      expect(ids.has(entry.character)).toBe(true);
      expect(ids.has(entry.scenario)).toBe(true);
    }
  });

  it('goes out to the adventure as a module and comes back', () => {
    const out = worldToModule(hogWild());
    const back = moduleToWorld(out.module, 1);
    expect(back.ok).toBe(true);
  });
});
