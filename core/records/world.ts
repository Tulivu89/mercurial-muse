// Making and changing worlds and records. Pure: ids and times come in as arguments.
import { WORLD_FORMAT, type Condition, type Reach, type RecordKind, type Section, type StoryRecord, type World } from './schema.js';

type Template = { title: string; reach: Reach; hint: string };

// The sections a new record starts with. Authors add, rename, remove and reorder freely; the
// engine only reads titles, text and reach. The core of a character is Here, the rest Named.
export const TEMPLATES: Record<RecordKind, Template[]> = {
  character: [
    { title: 'Appearance', reach: 'here', hint: 'The fixed body: build, face, colouring, voice, how they move. Outfits go in a set.' },
    { title: 'Personality', reach: 'here', hint: 'Behaviour you could test in a scene: how they treat people, what they want, what they won\'t do.' },
    { title: 'Speech', reach: 'here', hint: 'Rhythm, register, habits. No sample lines; those go in example chats.' },
    { title: 'Background', reach: 'named', hint: 'History that matters once someone brings it up.' },
    { title: 'Wants', reach: 'named', hint: 'What they are after, and what is in the way.' },
  ],
  place: [
    { title: 'Entry', reach: 'here', hint: 'Facts: who runs it, what happens there, what it is known for.' },
    { title: 'Atmosphere', reach: 'here', hint: 'What it is like now: what you hear, who is about.' },
  ],
  group: [
    { title: 'Entry', reach: 'named', hint: 'What they are, what they want, how a member shows it.' },
  ],
  item: [
    { title: 'Entry', reach: 'here', hint: 'What it is, what it does, what it looks like in a hand.' },
  ],
  lore: [
    { title: 'Entry', reach: 'named', hint: 'A custom, a rumour, a piece of history, a rule of the world.' },
  ],
  thread: [
    { title: 'Next beat', reach: 'always', hint: 'One line: the one thing that should happen next.' },
    { title: 'Pressure', reach: 'never', hint: 'Why now?' },
    { title: 'Objective', reach: 'never', hint: 'What would have to happen for this to be over?' },
    { title: 'Opposition', reach: 'never', hint: 'What resists, and what does it do about it?' },
    { title: 'Cost', reach: 'never', hint: 'What does pursuing this take out of the protagonist?' },
    { title: 'Consequence', reach: 'never', hint: 'What is different afterwards, win or lose?' },
  ],
  scenario: [
    { title: 'Situation', reach: 'always', hint: 'Where, when, who, and what is happening as it starts.' },
  ],
  persona: [
    { title: 'Who you are', reach: 'always', hint: 'Who you are to the characters, in a line or two.' },
  ],
};

export function hintFor(kind: RecordKind, title: string): string {
  return TEMPLATES[kind].find((template) => template.title === title)?.hint ?? '';
}

export function newWorld(id: string, name: string, now: number): World {
  return { format: WORLD_FORMAT, id, name, premise: '', genre: '', tone: '', conditions: [], records: [], updatedAt: now };
}

export function newSection(id: string, title: string, reach: Reach = 'here'): Section {
  return { id, title, reach, keys: [], when: null, text: '' };
}

export function newRecord(kind: RecordKind, id: string, name: string, ids: () => string): StoryRecord {
  return {
    id, kind, name, keys: [], line: '', groupIds: [], tags: [], notes: '', parentId: null, groupKind: 'other', pronouns: '', gender: '', schedule: null,
    sections: TEMPLATES[kind].map((template) => newSection(ids(), template.title, template.reach)),
    sets: kind === 'character' ? [{ id: ids(), title: 'Outfits', reach: 'here', active: null, members: [] }] : [],
    greetings: [], examples: [],
  };
}

export function touch(world: World, now: number): World {
  return { ...world, updatedAt: now };
}

export function recordById(world: World, id: string | null | undefined): StoryRecord | undefined {
  return id ? world.records.find((record) => record.id === id) : undefined;
}

export function putRecord(world: World, record: StoryRecord, now: number): World {
  const at = world.records.findIndex((existing) => existing.id === record.id);
  const records = at < 0 ? [...world.records, record] : world.records.map((existing, index) => (index === at ? record : existing));
  return touch({ ...world, records }, now);
}

// Removes a record and every link to it: places inside it move up to its parent, and nobody
// belongs to a group that is gone.
export function removeRecord(world: World, id: string, now: number): World {
  const gone = recordById(world, id);
  if (!gone) return world;
  const records = world.records
    .filter((record) => record.id !== id)
    .map((record) => ({
      ...record,
      parentId: record.parentId === id ? gone.parentId : record.parentId,
      groupIds: record.groupIds.filter((groupId) => groupId !== id),
    }));
  return touch({ ...world, records }, now);
}

// The places a place sits inside, nearest first. Stops at a loop rather than hanging.
export function ancestors(world: World, id: string): StoryRecord[] {
  const out: StoryRecord[] = [];
  const seen = new Set([id]);
  let current = recordById(world, recordById(world, id)?.parentId);
  while (current && !seen.has(current.id)) {
    out.push(current);
    seen.add(current.id);
    current = recordById(world, current.parentId);
  }
  return out;
}

// True if putting `id` inside `parentId` would put a place inside itself.
export function wouldLoop(world: World, id: string, parentId: string | null): boolean {
  if (!parentId) return false;
  if (parentId === id) return true;
  return ancestors(world, parentId).some((place) => place.id === id);
}

// Places in reading order, each with its depth: every place directly after the place it is in.
export function placeTree(world: World): { record: StoryRecord; depth: number }[] {
  const places = world.records.filter((record) => record.kind === 'place');
  const ids = new Set(places.map((place) => place.id));
  const out: { record: StoryRecord; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    for (const place of places) {
      const parent = place.parentId && ids.has(place.parentId) ? place.parentId : null;
      if (parent !== parentId || seen.has(place.id)) continue;
      seen.add(place.id);
      out.push({ record: place, depth });
      walk(place.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const place of places) if (!seen.has(place.id)) out.push({ record: place, depth: 0 });
  return out;
}

export function membersOf(world: World, groupId: string): StoryRecord[] {
  return world.records.filter((record) => record.groupIds.includes(groupId));
}

export function ensureCondition(world: World, condition: Condition): World {
  if (world.conditions.some((existing) => existing.id === condition.id)) return world;
  return { ...world, conditions: [...world.conditions, condition] };
}
