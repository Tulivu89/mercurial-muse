// The record model (docs/records.md): a world holds records, and every block of text in a record
// says when it reaches the model. Pure data and validation: no DOM, no network, no storage.
import { z } from 'zod';
import { recordRulesSchema } from '../rules/record-rules.js';
import { worldRulesSchema } from '../rules/world-rules.js';
import { scheduleWhenSchema } from '../rules/ruleset.js';
import { mapSchema } from '../map/schema.js';

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

// Where a figure stands in a room's picture, as fractions of the picture: x of its width, y of
// its height, and the figure's own width as a share of the room's. `pic` names one of the
// character's figures.
export const spotSchema = z.object({ x: z.number().min(0).max(1).default(0.5), y: z.number().min(0).max(1).default(0.62), scale: z.number().min(0.02).max(2).default(0.3), pic: shortText(80).default('') });
export type Spot = z.infer<typeof spotSchema>;
export const placedSchema = spotSchema.extend({ room: shortText(80).default('') });
export type Placed = z.infer<typeof placedSchema>;

// A picture laid over or under a room's figures: lantern light, steam, rain on the glass.
export const LAYER_MOTIONS = ['none', 'drift', 'sway', 'flicker', 'pulse', 'rise'] as const;
export const LAYER_BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'lighten', 'darken'] as const;
export const layerSchema = z.object({
  id,
  name: shortText(80).default(''),
  // Drawn over the figures, or between them and the room.
  above: z.boolean().default(true),
  // Stretched over the whole room, or placed like a figure.
  fill: z.boolean().default(false),
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
  scale: z.number().min(0.02).max(4).default(1),
  opacity: z.number().min(0).max(1).default(1),
  blend: z.enum(LAYER_BLENDS).catch('normal').default('normal'),
  shown: z.boolean().default(true),
  motion: z.enum(LAYER_MOTIONS).catch('none').default('none'),
});
export type Layer = z.infer<typeof layerSchema>;

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
    // Home: pictures laid over this place.
    layers: z.array(layerSchema).max(12).default([]),
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
  // Home: where they stand in that room, by the same scenario id.
  spots: z.record(id, spotSchema).default({}),
  // Home: what this does to their needs while it is on, a change an hour by need id.
  needs: z.record(id, z.number().min(-1000).max(1000)).default({}),
  // The adventure: the place they are while this is on, by the place record's id. An event
  // with no place moves nobody.
  place: id.optional(),
  // The adventure: this holds only while the condition does, and a day with a condition that
  // holds replaces the ordinary day (a market day, the day of the raid, once she is cured).
  when: scheduleWhenSchema.optional(),
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
  // Home (CharacterRoom's Tamagotchi mode). Figures are named pictures of the character doing
  // something; the pictures themselves are kept by Chat. Idle is where they are in a scenario
  // when nothing is scheduled.
  figures: z.array(z.object({ id, name: shortText(80).default('') })).max(40).default([]),
  idle: z.record(id, placedSchema).default({}),
  // A need falls by `decay` an hour unless a schedule event says otherwise; at `low` or under,
  // the figure shows `lowEmotion` and the model is told `note`.
  needs: z.array(z.object({ id, name: shortText(60), max: z.number().min(1).max(100000).default(100), decay: z.number().min(0).max(1000).default(4), low: z.number().min(0).default(25), lowEmotion: shortText(40).default(''), note: shortText(400).default('') })).max(12).default([]),
  homeActions: z.array(z.object({
    id, name: shortText(60), effects: z.record(id, z.number()).default({}), say: shortText(600).default(''),
    // The relationship it needs, hours before it can be done again, and what it does to the bond.
    level: shortText(40).default(''), cooldown: z.number().min(0).max(10000).default(0), bond: z.number().default(0),
  })).max(30).default([]),
  // A track that rises while every need is kept at `upAt` percent or more, and falls while needs are low.
  bond: z.object({ name: shortText(60).default('Bond'), max: z.number().min(1).default(100), up: z.number().default(4), down: z.number().default(4), upAt: z.number().min(0).max(100).default(60), downWhen: z.enum(['all', 'any']).catch('all').default('all') }).nullable().default(null),
  // The id this had on the card it was imported from, so links between cards still meet.
  sourceId: shortText(80).default(''),
  // Characters, for chat only.
  greetings: z.array(greetingSchema).max(20).default([]),
  examples: z.array(exampleChatSchema).max(30).default([]),
  // The rules: only what the author set here. Everything else is worked out from the record's
  // kind, its tier, its groups and the world's ruleset (core/rules, rulesFor).
  rules: recordRulesSchema.optional(),
  // What came with this record from an adventure module and has no place in the record model
  // yet (where an item lies, a day's stops), in the module's own names. It goes back out
  // unchanged when the world is exported as a module (core/convert).
  carried: z.record(z.string().max(80), z.unknown()).optional(),
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
  // The world's own rules: only what it changes from the standard ruleset (core/rules).
  rules: worldRulesSchema.optional(),
  // The map: only what an author changed on each sheet (core/map). Absent, every sheet lays
  // itself out from the place tree.
  map: mapSchema.optional(),
  // The same for the world: the module's own id and version and its relationships.
  carried: z.record(z.string().max(80), z.unknown()).optional(),
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
