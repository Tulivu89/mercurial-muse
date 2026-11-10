// Brings CharacterRoom (AnotherRoom, AetherRoom) cards into a world: a contact card as a
// character, a user card as a persona, a scenario card as a scenario. docs/records.md, Bringing
// records in: persona and appearance become sections, the description becomes the line, always-on
// brains are Here, keyed brains are Named, and intimacy-gated brains are When behind the shared
// bond conditions. Greetings, example chats and the schedule carry over.
import { z } from 'zod';
import { SCHEDULE_DAYS, layerSchema, recordSchema, spotSchema, type RecordSet, type Schedule, type Section, type Spot, type StoryRecord, type World } from './schema.js';
import { ensureCondition, newRecord, putRecord } from './world.js';

const text = z.string().max(40000).catch('');
const brains = z.array(z.object({ name: text.default(''), content: text.default('') })).catch([]).default([]);
const brainsConditional = z.array(z.object({
  name: text.default(''),
  content: text.default(''),
  keys: z.array(z.string()).catch([]).default([]),
  requiredIntimacy: text.default('none'),
})).catch([]).default([]);
const image = z.string().max(4_000_000).catch('');

// CharacterRoom's own additions to a card. Read loosely: only what the record model has a place for.
const extra = z.unknown().optional();

const shared = {
  id: text.default(''),
  cr: extra,
  name: z.string().min(1).max(120),
  description: text.default(''),
  pronouns: text.default(''),
  species: text.default(''),
  gender: text.default(''),
  // CharacterRoom exports gender under this name.
  gndr: text.default(''),
  tags: text.default(''),
  persona: text.default(''),
  appearance: text.default(''),
  brains,
  brainsConditional,
};

const contactSchema = z.object({
  cardType: z.literal('contact'),
  ...shared,
  alias: text.default(''),
  greeting: text.default(''),
  greetingEmotion: text.default(''),
  exampleMessages: z.array(z.object({
    name: text.default(''),
    userName: text.default('User'),
    messages: z.array(z.object({ isContact: z.boolean().catch(false), text: text.default(''), emotion: text.default('') })).catch([]).default([]),
  })).catch([]).default([]),
  schedule: z.unknown().optional(),
  relationship: text.default(''),
  style: text.default(''),
  responseLength: text.default(''),
  avatarUri: image.default(''),
  emotions: z.record(z.string(), image).catch({}).default({}),
});
const userSchema = z.object({ cardType: z.literal('user'), ...shared });
const scenarioSchema = z.object({
  cardType: z.literal('scenario'),
  id: text.default(''),
  cr: extra,
  name: z.string().min(1).max(120),
  description: text.default(''),
  environment: text.default(''),
  scene: text.default(''),
  tags: text.default(''),
  brains,
  brainsConditional,
});

// CharacterRoom's intimacy ladder, as shared conditions: each one holds at its tier and above.
export const BOND_CONDITIONS = [
  { tier: 'acquaintance', id: 'bond-acquaintance', label: 'Acquaintance or closer' },
  { tier: 'close', id: 'bond-close', label: 'Close or closer' },
  { tier: 'romantic', id: 'bond-romantic', label: 'Romantic' },
] as const;

export const RELATIONSHIPS = ['stranger', 'acquaintance', 'close', 'romantic'] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

// The bond conditions that hold at a relationship: its own tier and every tier below it.
export function bondConditionsFor(relationship: Relationship): string[] {
  const at = RELATIONSHIPS.indexOf(relationship);
  return BOND_CONDITIONS.filter((condition) => RELATIONSHIPS.indexOf(condition.tier) <= at).map((condition) => condition.id);
}

// Pictures a card carried, as data URLs: the caller stores them, since records hold no images.
export interface CardImages { avatar: string; emotions: Record<string, string> }
export interface CardImport { world: World; recordId: string; kind: 'character' | 'persona' | 'scenario'; notes: string[]; images?: CardImages; scenarioId?: string }
export type ImportResult = { ok: true; result: CardImport } | { ok: false; errors: string[] };

type Ids = () => string;
const section = (ids: Ids, title: string, reach: Section['reach'], body: string, extra: Partial<Section> = {}): Section =>
  ({ id: ids(), title: title.slice(0, 120), reach, keys: [], when: null, text: body.trim().slice(0, 20000), ...extra });
const list = (value: string, max = 40) => value.split(',').map((entry) => entry.trim().slice(0, 40)).filter(Boolean).slice(0, max);

function brainSections(world: World, ids: Ids, always: z.infer<typeof brains>, keyed: z.infer<typeof brainsConditional>, alwaysReach: Section['reach']): { world: World; sections: Section[] } {
  let next = world;
  const sections: Section[] = [];
  for (const brain of always) if (brain.content.trim()) sections.push(section(ids, brain.name || 'Brain', alwaysReach, brain.content));
  for (const brain of keyed) {
    if (!brain.content.trim()) continue;
    const keys = brain.keys.map((key) => key.trim().slice(0, 60)).filter(Boolean).slice(0, 40);
    const bond = BOND_CONDITIONS.find((condition) => condition.tier === brain.requiredIntimacy.trim().toLowerCase());
    if (bond) {
      next = ensureCondition(next, { id: bond.id, label: bond.label });
      sections.push(section(ids, brain.name || 'Brain', 'when', brain.content, { keys, when: bond.id }));
    } else {
      sections.push(section(ids, brain.name || 'Brain', 'named', brain.content, { keys }));
    }
  }
  return { world: next, sections };
}

// The species becomes a group, shared with anyone else of the same kind.
function speciesGroup(world: World, species: string, ids: Ids, now: number, notes: string[]): { world: World; groupIds: string[] } {
  const name = species.trim().slice(0, 120);
  if (!name) return { world, groupIds: [] };
  const existing = world.records.find((candidate) => candidate.kind === 'group' && candidate.groupKind === 'species' && candidate.name.toLowerCase() === name.toLowerCase());
  if (existing) return { world, groupIds: [existing.id] };
  const group: StoryRecord = { ...newRecord('group', ids(), name, ids), groupKind: 'species' };
  notes.push(`Made the species group ${name}.`);
  return { world: putRecord(world, group, now), groupIds: [group.id] };
}

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const plainId = (value: unknown): string => (typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : '');

// CharacterRoom's sets (`cr.sets`): one version in use at a time. Outfits on a contact, locations
// on a scenario. A version's lock becomes the bond condition a player needs before picking it.
function readSets(world: World, cr: unknown, reach: Section['reach'], ids: Ids): { world: World; sets: RecordSet[] } {
  let next = world;
  const sets: RecordSet[] = [];
  const raw = isObject(cr) && Array.isArray(cr.sets) ? cr.sets : [];
  for (const entry of raw.slice(0, 20)) {
    if (!isObject(entry)) continue;
    const members: RecordSet['members'] = [];
    for (const variant of (Array.isArray(entry.variants) ? entry.variants : []).slice(0, 60)) {
      if (!isObject(variant)) continue;
      const bond = BOND_CONDITIONS.find((condition) => condition.tier === variant.lock);
      if (bond) next = ensureCondition(next, { id: bond.id, label: bond.label });
      members.push({
        id: plainId(variant.id) || ids(),
        name: typeof variant.name === 'string' ? variant.name.trim().slice(0, 120) : '',
        text: typeof variant.content === 'string' ? variant.content.trim().slice(0, 20000) : '',
        lock: bond?.id ?? null,
        layers: (Array.isArray(variant.layers) ? variant.layers : []).slice(0, 12).flatMap((layer) => {
          const read = layerSchema.safeParse({ ...(isObject(layer) ? layer : {}), id: isObject(layer) ? plainId(layer.id) || ids() : ids() });
          return read.success ? [read.data] : [];
        }),
      });
    }
    if (!members.length) continue;
    sets.push({ id: plainId(entry.id) || ids(), title: (typeof entry.name === 'string' && entry.name.trim().slice(0, 120)) || 'Set', reach, active: members[0]!.id, members });
  }
  return { world: next, sets };
}

// Schedule event id -> set id -> version id (`cr.schedLinks`), and event id -> scenario id -> the
// room it happens in (`cr.lineHome`). Both are folded into the events themselves.
type Rows<T> = Record<string, Record<string, T>>;
function readLinks(cr: unknown): { sets: Rows<string>; rooms: Rows<string>; spots: Rows<Spot>; needs: Rows<number> } {
  const out = { sets: {} as Rows<string>, rooms: {} as Rows<string>, spots: {} as Rows<Spot>, needs: {} as Rows<number> };
  if (!isObject(cr)) return out;
  for (const [eventId, row] of Object.entries(isObject(cr.schedLinks) ? cr.schedLinks : {})) {
    if (!isObject(row)) continue;
    for (const [setId, memberId] of Object.entries(row)) if (plainId(setId) && plainId(memberId)) (out.sets[eventId] ??= {})[setId] = memberId as string;
  }
  for (const [eventId, row] of Object.entries(isObject(cr.lineHome) ? cr.lineHome : {})) {
    if (!isObject(row)) continue;
    for (const [scenarioId, place] of Object.entries(row)) {
      if (!plainId(scenarioId) || !isObject(place) || !plainId(place.room)) continue;
      (out.rooms[eventId] ??= {})[scenarioId] = place.room as string;
      const spot = spotSchema.safeParse(place);
      if (spot.success) (out.spots[eventId] ??= {})[scenarioId] = spot.data;
    }
  }
  for (const [eventId, row] of Object.entries(isObject(cr.lineNeeds) ? cr.lineNeeds : {})) {
    if (!isObject(row)) continue;
    for (const [needId, rate] of Object.entries(row)) if (plainId(needId) && typeof rate === 'number' && Number.isFinite(rate)) (out.needs[eventId] ??= {})[needId] = Math.max(-1000, Math.min(1000, rate));
  }
  return out;
}

const STYLE_FROM_CARD: Record<string, string> = { chat: 'chat', roleplay: 'roleplay', 'roleplay, novel style': 'novel' };

function readSchedule(raw: unknown, ids: Ids, links: ReturnType<typeof readLinks> = { sets: {}, rooms: {}, spots: {}, needs: {} }): Schedule | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Schedule = {};
  let any = false;
  for (const day of SCHEDULE_DAYS) {
    const events = (raw as Record<string, unknown>)[day];
    out[day] = [];
    if (!Array.isArray(events)) continue;
    for (const event of events.slice(0, 200)) {
      if (!event || typeof event !== 'object') continue;
      const { id: eventId, startTime, endTime, text: body, requiredIntimacy } = event as Record<string, unknown>;
      const key = typeof eventId === 'string' ? eventId : '';
      if (typeof startTime !== 'number' || typeof endTime !== 'number' || typeof body !== 'string' || !body.trim()) continue;
      const minute = (value: number) => Math.min(1440, Math.max(0, Math.round(value)));
      out[day]!.push({
        id: plainId(key) || ids(), startTime: minute(startTime), endTime: minute(endTime), text: body.slice(0, 2000),
        requiredIntimacy: typeof requiredIntimacy === 'string' ? requiredIntimacy.slice(0, 40) : 'none',
        sets: links.sets[key] ?? {}, rooms: links.rooms[key] ?? {}, spots: links.spots[key] ?? {}, needs: links.needs[key] ?? {},
      });
      any = true;
    }
  }
  return any ? out : null;
}

const failed = (raw: unknown, error: z.ZodError, what: string): ImportResult => {
  const type = raw && typeof raw === 'object' ? (raw as { cardType?: unknown }).cardType : undefined;
  if (type !== 'contact' && type !== 'user' && type !== 'scenario') return { ok: false, errors: [`This is not a CharacterRoom ${what} card.`] };
  return { ok: false, errors: error.issues.slice(0, 10).map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
};

export function importCharacterCard(world: World, raw: unknown, ids: Ids, now: number): ImportResult {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return failed(raw, parsed.error, 'contact');
  const card = parsed.data;
  const notes: string[] = [];

  const record: StoryRecord = { ...newRecord('character', ids(), card.name.trim(), ids), sections: [] };
  record.keys = list(card.alias).map((key) => key.slice(0, 60));
  record.line = card.description.trim().slice(0, 400);
  record.pronouns = card.pronouns.trim().slice(0, 40);
  record.gender = (card.gndr || card.gender).trim().slice(0, 80);
  record.tags = list(card.tags);
  if (card.persona.trim()) record.sections.push(section(ids, 'Personality', 'here', card.persona));
  if (card.appearance.trim()) record.sections.push(section(ids, 'Appearance', 'here', card.appearance));
  // Always-on brains are in context whenever the character is.
  const brained = brainSections(world, ids, card.brains, card.brainsConditional, 'here');
  record.sections.push(...brained.sections);

  if (card.greeting.trim()) record.greetings = [{ id: ids(), text: card.greeting.trim().slice(0, 8000), emotion: card.greetingEmotion.trim().slice(0, 40) }];
  record.examples = card.exampleMessages.filter((chat) => chat.messages.length).slice(0, 30).map((chat) => ({
    id: ids(),
    name: chat.name.trim().slice(0, 120) || 'Example',
    userName: chat.userName.trim().slice(0, 60) || 'User',
    messages: chat.messages.slice(0, 80).map((message) => ({ fromCharacter: message.isContact, text: message.text.slice(0, 8000), emotion: message.emotion.trim().slice(0, 40) })),
  }));
  record.schedule = readSchedule(card.schedule, ids, readLinks(card.cr));
  if (record.schedule) notes.push('The schedule came in.');
  record.sourceId = card.id.trim().slice(0, 80);
  const relationship = (RELATIONSHIPS as readonly string[]).includes(card.relationship) ? card.relationship : '';
  const style = STYLE_FROM_CARD[card.style] ?? '';
  if (relationship || style || card.responseLength.trim()) record.chatDefaults = { relationship, style, responseLength: card.responseLength.trim().slice(0, 40) };
  const withSets = readSets(brained.world, card.cr, 'here', ids);
  if (withSets.sets.length) {
    record.sets = withSets.sets;
    notes.push(`Its sets came in: ${withSets.sets.map((set) => set.title).join(', ')}.`);
  }

  // Home: her pictures, where she idles, her needs and what can be done for her.
  const cr = isObject(card.cr) ? card.cr : {};
  const home = recordSchema.pick({ figures: true, idle: true, needs: true, homeActions: true, bond: true }).safeParse({
    figures: (Array.isArray(cr.pics) ? cr.pics : []).filter((pic) => isObject(pic) && plainId(pic.id)).slice(0, 40),
    idle: isObject(cr.homeIdle) ? Object.fromEntries(Object.entries(cr.homeIdle).filter(([key, value]) => plainId(key) && isObject(value))) : {},
    needs: (Array.isArray(cr.needs) ? cr.needs : []).filter((need) => isObject(need) && plainId(need.id)).slice(0, 12),
    homeActions: (Array.isArray(cr.homeActions) ? cr.homeActions : []).filter((action) => isObject(action) && plainId(action.id)).slice(0, 30),
    bond: isObject(cr.bond) ? cr.bond : null,
  });
  if (home.success) {
    Object.assign(record, home.data);
    if (record.needs.length) notes.push(`Home came in: ${record.needs.length} needs and ${record.homeActions.length} actions.`);
  }

  const grouped = speciesGroup(withSets.world, card.species, ids, now, notes);
  record.groupIds = grouped.groupIds;

  const emotions: Record<string, string> = {};
  for (const [name, data] of Object.entries(card.emotions)) if (data.startsWith('data:image/')) emotions[name.toLowerCase()] = data;
  const avatar = card.avatarUri.startsWith('data:image/') ? card.avatarUri : '';
  const images = avatar || Object.keys(emotions).length ? { avatar, emotions } : undefined;
  return { ok: true, result: { world: putRecord(grouped.world, record, now), recordId: record.id, kind: 'character', notes, images } };
}

// A CharacterRoom user card becomes a Persona.
export function importUserCard(world: World, raw: unknown, ids: Ids, now: number): ImportResult {
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) return failed(raw, parsed.error, 'user');
  const card = parsed.data;
  const notes: string[] = [];
  const record: StoryRecord = { ...newRecord('persona', ids(), card.name.trim(), ids), sections: [] };
  record.line = card.description.trim().slice(0, 400);
  record.pronouns = card.pronouns.trim().slice(0, 40);
  record.gender = (card.gndr || card.gender).trim().slice(0, 80);
  record.tags = list(card.tags);
  if (card.persona.trim()) record.sections.push(section(ids, 'Who you are', 'always', card.persona));
  if (card.appearance.trim()) record.sections.push(section(ids, 'Appearance', 'here', card.appearance));
  const brained = brainSections(world, ids, card.brains, card.brainsConditional, 'here');
  record.sections.push(...brained.sections);
  record.sourceId = card.id.trim().slice(0, 80);
  const withSets = readSets(brained.world, card.cr, 'here', ids);
  record.sets = withSets.sets;
  const grouped = speciesGroup(withSets.world, card.species, ids, now, notes);
  record.groupIds = grouped.groupIds;
  return { ok: true, result: { world: putRecord(grouped.world, record, now), recordId: record.id, kind: 'persona', notes } };
}

// A CharacterRoom scenario card becomes a Scenario, its brains as sections.
export function importScenarioCard(world: World, raw: unknown, ids: Ids, now: number): ImportResult {
  const parsed = scenarioSchema.safeParse(raw);
  if (!parsed.success) return failed(raw, parsed.error, 'scenario');
  const card = parsed.data;
  const record: StoryRecord = { ...newRecord('scenario', ids(), card.name.trim(), ids), sections: [] };
  record.line = card.description.trim().slice(0, 400);
  record.tags = list(card.tags);
  if (card.environment.trim()) record.sections.push(section(ids, 'Environment', 'always', card.environment));
  if (card.scene.trim()) record.sections.push(section(ids, 'Scene', 'always', card.scene));
  const brained = brainSections(world, ids, card.brains, card.brainsConditional, 'always');
  record.sections.push(...brained.sections);
  record.sourceId = card.id.trim().slice(0, 80);
  // A scenario's sets are its locations: one place's details in context at a time.
  const withSets = readSets(brained.world, card.cr, 'always', ids);
  record.sets = withSets.sets;
  const notes = withSets.sets.length ? [`Its sets came in: ${withSets.sets.map((set) => `${set.title} (${set.members.map((member) => member.name).join(', ')})`).join('; ')}.`] : [];
  return { ok: true, result: { world: putRecord(withSets.world, record, now), recordId: record.id, kind: 'scenario', notes } };
}

// Any CharacterRoom card, filed by what it says it is.
export function importRoomCard(world: World, raw: unknown, ids: Ids, now: number): ImportResult {
  const type = raw && typeof raw === 'object' ? (raw as { cardType?: unknown }).cardType : undefined;
  if (type === 'user') return importUserCard(world, raw, ids, now);
  if (type === 'scenario') return importScenarioCard(world, raw, ids, now);
  return importCharacterCard(world, raw, ids, now);
}
