// The record model (docs/records.md): a world holds records, and every block of text in a record
// says when it reaches the model. Pure data and validation: no DOM, no network, no storage.
import { z } from 'zod';

export const WORLD_FORMAT = 'studio-world/1';

// When a block of text enters context. See docs/records.md, Reach.
export const REACHES = ['always', 'here', 'named', 'when', 'never'] as const;
export type Reach = (typeof REACHES)[number];

export const REACH_NAMES: Record<Reach, string> = {
  always: 'Always',
  here: 'Here',
  named: 'Named',
  when: 'When',
  never: 'Never',
};

export const REACH_HINTS: Record<Reach, string> = {
  always: 'Every turn. Keep it small.',
  here: 'While this is in the scene.',
  named: 'When one of its keys comes up, until the scene moves on.',
  when: 'Only while a condition holds.',
  never: 'Your notes. The model never sees them.',
};

export const RECORD_KINDS = ['character', 'place', 'group', 'item', 'lore', 'thread', 'scenario', 'persona'] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export const KIND_NAMES: Record<RecordKind, { one: string; many: string }> = {
  character: { one: 'Character', many: 'Characters' },
  place: { one: 'Place', many: 'Places' },
  group: { one: 'Group', many: 'Groups' },
  item: { one: 'Item', many: 'Items' },
  lore: { one: 'Lore', many: 'Lore' },
  thread: { one: 'Thread', many: 'Threads' },
  scenario: { one: 'Scenario', many: 'Scenarios' },
  persona: { one: 'Persona', many: 'Personas' },
};

export const GROUP_KINDS = ['species', 'family', 'faction', 'crew', 'profession', 'other'] as const;
export type GroupKind = (typeof GROUP_KINDS)[number];

const id = z.string().min(1).max(80);
const shortText = (max: number) => z.string().max(max);
const keys = z.array(z.string().min(1).max(60)).max(40).default([]);

export const sectionSchema = z.object({
  id,
  title: shortText(120),
  reach: z.enum(REACHES),
  // Named: what brings it in. Empty means the record's own name and keys.
  keys,
  // When: the condition that must hold, by its id in the world's conditions.
  when: id.nullable().default(null),
  text: shortText(20000),
});
export type Section = z.infer<typeof sectionSchema>;

// A set: several entries, one in use at a time (outfits, a scenario's locations, versions).
export const setSchema = z.object({
  id,
  title: shortText(120),
  reach: z.enum(REACHES).default('here'),
  active: id.nullable().default(null),
  members: z.array(z.object({
    id,
    name: shortText(120),
    text: shortText(20000),
    // A condition that must hold before the player can pick this one by hand (a place she takes
    // you to only once you're close). A schedule can still put her there.
    lock: id.nullable().default(null),
  })).max(60).default([]),
});
export type RecordSet = z.infer<typeof setSchema>;

export const greetingSchema = z.object({ id, text: shortText(8000), emotion: shortText(40).default('') });
export type Greeting = z.infer<typeof greetingSchema>;

export const exampleChatSchema = z.object({
  id,
  name: shortText(120),
  userName: shortText(60).default('User'),
  messages: z.array(z.object({
    fromCharacter: z.boolean(),
    text: shortText(8000),
    emotion: shortText(40).default(''),
  })).max(80).default([]),
});
export type ExampleChat = z.infer<typeof exampleChatSchema>;

// A character's week, in CharacterRoom's shape: events in minutes from midnight, per weekday and
// under Daily. A range may wrap past midnight. A stop says what they are doing, never how they
// arrive. Kept on import; chat reads it from Phase B.
export const SCHEDULE_DAYS = ['Daily', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const scheduleEventSchema = z.object({
  id,
  startTime: z.number().int().min(0).max(1440),
  endTime: z.number().int().min(0).max(1440),
  text: shortText(2000),
  requiredIntimacy: shortText(40).default('none'),
  // While this is on: the member each set uses, by set id (her pajamas while asleep).
  sets: z.record(id, id).default({}),
  // Where it happens in a scenario: the member of that scenario's set, by the scenario's id, or
  // by the id its card had where it came from.
  rooms: z.record(id, id).default({}),
});
export type ScheduleEvent = z.infer<typeof scheduleEventSchema>;
export const scheduleSchema = z.record(z.string().max(20), z.array(scheduleEventSchema).max(200));
export type Schedule = z.infer<typeof scheduleSchema>;

export const recordSchema = z.object({
  id,
  kind: z.enum(RECORD_KINDS),
  name: z.string().min(1).max(120),
  keys,
  // Who or what this is to a stranger, in one sentence.
  line: shortText(400).default(''),
  sections: z.array(sectionSchema).max(80).default([]),
  sets: z.array(setSchema).max(20).default([]),
  groupIds: z.array(id).max(40).default([]),
  tags: z.array(z.string().min(1).max(40)).max(40).default([]),
  notes: shortText(20000).default(''),
  // Places: the place this one is inside.
  parentId: id.nullable().default(null),
  // Groups: what kind of group.
  groupKind: z.enum(GROUP_KINDS).default('other'),
  // Characters and personas.
  pronouns: shortText(40).default(''),
  gender: shortText(80).default(''),
  schedule: scheduleSchema.nullable().default(null),
  // What a new chat with this character starts set to. Empty means the app's own default.
  chatDefaults: z.object({ relationship: shortText(40).default(''), style: shortText(40).default(''), responseLength: shortText(40).default('') }).nullable().default(null),
  // The id this had on the card it was imported from, so links between cards still meet.
  sourceId: shortText(80).default(''),
  // Characters, for chat only.
  greetings: z.array(greetingSchema).max(20).default([]),
  examples: z.array(exampleChatSchema).max(30).default([]),
});
export type StoryRecord = z.infer<typeof recordSchema>;

// Conditions are shared: defined once in the world, pointed at by any record's When text.
export const conditionSchema = z.object({ id, label: z.string().min(1).max(120) });
export type Condition = z.infer<typeof conditionSchema>;

export const worldSchema = z.object({
  format: z.literal(WORLD_FORMAT),
  id,
  name: z.string().min(1).max(120),
  premise: shortText(4000).default(''),
  genre: shortText(80).default(''),
  tone: shortText(200).default(''),
  conditions: z.array(conditionSchema).max(200).default([]),
  records: z.array(recordSchema).max(5000).default([]),
  updatedAt: z.number().int().nonnegative().default(0),
}).superRefine((world, context) => {
  const ids = new Set<string>();
  world.records.forEach((record, index) => {
    if (ids.has(record.id)) context.addIssue({ code: 'custom', path: ['records', index, 'id'], message: `"${record.id}" is used twice.` });
    ids.add(record.id);
  });
  const conditions = new Set(world.conditions.map((condition) => condition.id));
  world.records.forEach((record, index) => {
    if (record.parentId && !ids.has(record.parentId)) context.addIssue({ code: 'custom', path: ['records', index, 'parentId'], message: `"${record.parentId}" is not in this world.` });
    record.sections.forEach((section, at) => {
      if (section.when && !conditions.has(section.when)) context.addIssue({ code: 'custom', path: ['records', index, 'sections', at, 'when'], message: `The condition "${section.when}" is not in this world.` });
    });
  });
});
export type World = z.infer<typeof worldSchema>;

export function parseWorld(raw: unknown): { ok: true; world: World } | { ok: false; errors: string[] } {
  const format = raw && typeof raw === 'object' ? (raw as { format?: unknown }).format : undefined;
  if (format !== WORLD_FORMAT) return { ok: false, errors: ['This is not a world file from the Studio.'] };
  const parsed = worldSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.slice(0, 20).map((issue) => `${issue.path.join('.') || 'world'}: ${issue.message}`) };
  return { ok: true, world: parsed.data };
}
