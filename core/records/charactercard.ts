// Brings a CharacterRoom (AnotherRoom) contact card into a world as a character record.
// docs/records.md, Bringing records in: persona and appearance become Here sections, the
// description becomes the line, card brains become sections, conditional brains become Named
// sections behind a bond condition when they need one, and greetings and example chats carry over.
import { z } from 'zod';
import type { Section, StoryRecord, World } from './schema.js';
import { ensureCondition, newRecord, putRecord } from './world.js';

const text = z.string().max(40000).catch('');
const cardSchema = z.object({
  cardType: z.literal('contact'),
  name: z.string().min(1).max(120),
  alias: text.default(''),
  description: text.default(''),
  pronouns: text.default(''),
  species: text.default(''),
  tags: text.default(''),
  persona: text.default(''),
  appearance: text.default(''),
  greeting: text.default(''),
  greetingEmotion: text.default(''),
  exampleMessages: z.array(z.object({
    name: text.default(''),
    userName: text.default('User'),
    messages: z.array(z.object({ isContact: z.boolean().catch(false), text: text.default(''), emotion: text.default('') })).catch([]).default([]),
  })).catch([]).default([]),
  brains: z.array(z.object({ name: text.default(''), content: text.default('') })).catch([]).default([]),
  brainsConditional: z.array(z.object({
    name: text.default(''),
    content: text.default(''),
    keys: z.array(z.string()).catch([]).default([]),
    requiredIntimacy: text.default('none'),
  })).catch([]).default([]),
  schedule: z.unknown().optional(),
});

// CharacterRoom's intimacy ladder, as shared conditions: each one holds at its tier and above.
export const BOND_CONDITIONS = [
  { tier: 'acquaintance', id: 'bond-acquaintance', label: 'Acquaintance or closer' },
  { tier: 'close', id: 'bond-close', label: 'Close or closer' },
  { tier: 'romantic', id: 'bond-romantic', label: 'Romantic' },
] as const;

export interface CardImport { world: World; recordId: string; notes: string[] }

export function importCharacterCard(world: World, raw: unknown, ids: () => string, now: number): { ok: true; result: CardImport } | { ok: false; errors: string[] } {
  const parsed = cardSchema.safeParse(raw);
  if (!parsed.success) {
    const notACard = !raw || typeof raw !== 'object' || (raw as { cardType?: unknown }).cardType !== 'contact';
    return { ok: false, errors: notACard ? ['This is not a CharacterRoom contact card.'] : parsed.error.issues.slice(0, 10).map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
  }
  const card = parsed.data;
  const notes: string[] = [];
  let next = world;

  const record: StoryRecord = { ...newRecord('character', ids(), card.name.trim(), ids), sections: [] };
  record.keys = card.alias.split(',').map((key) => key.trim()).filter(Boolean);
  record.line = card.description.trim();
  record.pronouns = card.pronouns.trim();
  record.tags = card.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 40);

  const section = (title: string, reach: Section['reach'], body: string, extra: Partial<Section> = {}): Section =>
    ({ id: ids(), title, reach, keys: [], when: null, text: body.trim(), ...extra });
  if (card.persona.trim()) record.sections.push(section('Personality', 'here', card.persona));
  if (card.appearance.trim()) record.sections.push(section('Appearance', 'here', card.appearance));
  // Always-on brains are in context whenever the character is.
  for (const brain of card.brains) if (brain.content.trim()) record.sections.push(section(brain.name || 'Brain', 'here', brain.content));
  for (const brain of card.brainsConditional) {
    if (!brain.content.trim()) continue;
    const keys = brain.keys.map((key) => key.trim()).filter(Boolean).slice(0, 40);
    const bond = BOND_CONDITIONS.find((condition) => condition.tier === brain.requiredIntimacy.trim().toLowerCase());
    if (bond) {
      next = ensureCondition(next, { id: bond.id, label: bond.label });
      record.sections.push(section(brain.name || 'Brain', 'when', brain.content, { keys, when: bond.id }));
    } else {
      record.sections.push(section(brain.name || 'Brain', 'named', brain.content, { keys }));
    }
  }

  if (card.greeting.trim()) record.greetings = [{ id: ids(), text: card.greeting.trim(), emotion: card.greetingEmotion.trim() }];
  record.examples = card.exampleMessages.filter((chat) => chat.messages.length).slice(0, 30).map((chat) => ({
    id: ids(),
    name: chat.name.trim() || 'Example',
    userName: chat.userName.trim() || 'User',
    messages: chat.messages.slice(0, 80).map((message) => ({ fromCharacter: message.isContact, text: message.text, emotion: message.emotion.trim() })),
  }));

  // The species becomes a group, shared with anyone else of the same kind.
  const species = card.species.trim();
  if (species) {
    let group = next.records.find((candidate) => candidate.kind === 'group' && candidate.groupKind === 'species' && candidate.name.toLowerCase() === species.toLowerCase());
    if (!group) {
      group = { ...newRecord('group', ids(), species, ids), groupKind: 'species' };
      next = putRecord(next, group, now);
      notes.push(`Made the species group ${species}.`);
    }
    record.groupIds = [group.id];
  }

  if (card.schedule && typeof card.schedule === 'object' && Object.values(card.schedule as Record<string, unknown>).some((day) => Array.isArray(day) && day.length)) {
    notes.push('The schedule was not brought in: schedules come in a later version.');
  }
  next = putRecord(next, record, now);
  return { ok: true, result: { world: next, recordId: record.id, notes } };
}
