// Save validation and the export file.
//
// A save coming from storage or a file is untrusted until it parses and matches its module:
// every position must name a place and a character the module has, and the player must be
// somewhere. An export carries its module with it, so a file is playable on any device.

import { z } from 'zod';
import { isArea, atlasOf } from './world';
import { LADDER, loadModule, type PraxisModule } from './module';
import { optionsSchema } from './options';
import { journalSchema } from './journal';
import { localRecordSchema, playable } from './records';
import { LEGACY_SAVE_FORMAT, SAVE_FORMAT, playerOf, type Save } from './session';

const id = z.string().min(1).max(200);
const source = z.enum(['rule', 'player']);
const stateValues = z.record(z.string(), z.record(z.string(), z.number().finite()));
const worldState = {
  clock: z.number().int().nonnegative(),
  positions: z.record(z.string(), z.string()),
  values: stateValues,
  // Added in 0.9.
  spent: z.record(z.string(), z.record(z.string(), z.array(z.number().int()).max(12))).default({}),
  // Added in 0.14.
  held: z.array(id).max(500).default([]),
  following: z.record(z.string(), z.string().min(1).max(200)).default({}),
  // Added in 0.17.
  earned: z.array(z.string().min(1).max(400)).max(5000).default([]),
  ladders: z.record(z.string(), z.record(z.string(), z.enum(LADDER))).default({}),
  // Added in 0.18.
  pack: z.record(z.string(), z.number().int().min(0).max(1_000_000)).default({}),
  // Added in 0.19.
  works: z.array(id).max(200).default([]),
};

const checkSchema = z.object({
  approach: id,
  approachName: z.string().max(60),
  intent: z.string().max(300).optional(),
  partial: z.boolean().optional(),
  bribe: z.number().int().min(0).optional(),
  bought: z.boolean().optional(),
  // defId is null for a deed: an act with no state to wear down.
  target: z.object({ owner: id, defId: id.nullable(), label: z.string().max(200) }),
  charge: z.number().int(),
  push: z.boolean(),
  storyPoint: z.boolean(),
  auto: z.boolean(),
  good: z.array(z.object({ kind: z.string().max(20), face: z.string().max(8) })).max(20),
  bad: z.array(z.object({ kind: z.string().max(20), face: z.string().max(8) })).max(20),
  netSuccess: z.number().int(),
  netAdvantage: z.number().int(),
  succeeded: z.boolean(),
  triumph: z.boolean(),
  despair: z.boolean(),
  chance: z.number().min(0).max(1),
});

const ledgerEntrySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('state'), at: z.number(), defId: id, owner: id, from: z.number(), to: z.number(), source }),
  z.object({ kind: z.literal('clock'), at: z.number(), from: z.number(), to: z.number(), source, reason: z.string().max(200) }),
  z.object({ kind: z.literal('move'), at: z.number(), characterId: id, from: id.nullable(), to: id.nullable(), minutes: z.number(), source }),
  z.object({ kind: z.literal('follow'), at: z.number(), characterId: id, as: z.string().min(1).max(200).nullable(), source }),
  z.object({ kind: z.literal('goods'), at: z.number(), goodId: id, from: z.number().int(), to: z.number().int(), source }),
  z.object({ kind: z.literal('work'), at: z.number(), goodId: id, event: z.enum(['start', 'finish', 'spoil', 'abandon']), source }),
  z.object({ kind: z.literal('grow'), at: z.number(), characterId: id, approach: id, from: z.enum(LADDER).nullable(), to: z.enum(LADDER).nullable(), source }),
]);

const turnSchema = z.object({
  id,
  kind: z.enum(['say', 'action']),
  input: z.string().max(20_000),
  directive: z.string().max(4000).nullable(),
  reply: z.string().max(40_000).nullable(),
  before: z.object(worldState),
  ledgerStart: z.number().int().nonnegative(),
  check: checkSchema.optional(),
  // Saves from before 0.8 have no window; they start at the beginning.
  windowStart: z.number().int().nonnegative().default(0),
});

export const saveSchema = z.object({
  format: z.enum([SAVE_FORMAT, LEGACY_SAVE_FORMAT]).transform((): typeof SAVE_FORMAT => SAVE_FORMAT),
  module: z.object({ id, version: z.string().min(1).max(40) }),
  ...worldState,
  ledger: z.array(ledgerEntrySchema).max(200_000),
  turns: z.array(turnSchema).max(50_000),
  // Added in 0.8. Older saves get an empty journal, no records and default settings.
  journal: journalSchema.default({ entries: [], coveredTo: 0, pending: null, compressDeclinedAt: 0 }),
  local: z.array(localRecordSchema).max(5000).default([]),
  options: optionsSchema.default(optionsSchema.parse({})),
  seed: z.number().int().nonnegative().default(0),
});

// Problems that make a save unplayable with this module, as readable lines.
export function checkSave(module: PraxisModule, save: Save): string[] {
  const errors: string[] = [];
  if (save.module.id !== module.id) errors.push(`This save belongs to module "${save.module.id}", not "${module.id}".`);
  const world = playable(module, save.local);
  const places = atlasOf(world).places;
  const characters = new Set(world.characters.map((character) => character.id));
  const localIds = new Set<string>();
  for (const record of save.local) {
    if (localIds.has(record.id)) errors.push(`Two of this save's records share the id "${record.id}".`);
    localIds.add(record.id);
  }
  for (const record of save.local) {
    if (record.type === 'place' && record.parentLocationId && !places.has(record.parentLocationId)) errors.push(`${record.name} is inside "${record.parentLocationId}", which is not in this world.`);
    if (record.type === 'bond' && (record.personIds.length !== 2 || record.personIds.some((personId) => !characters.has(personId)))) errors.push(`The bond "${record.name}" names someone who is not in this world.`);
  }
  for (const [characterId, placeId] of Object.entries(save.positions)) {
    if (!characters.has(characterId)) errors.push(`The save places "${characterId}", who is not in the module.`);
    const place = places.get(placeId);
    if (!place) errors.push(`The save puts someone at "${placeId}", which is not in the module.`);
    else if (isArea(place)) errors.push(`The save puts someone in the area "${place.name}".`);
  }
  if (!save.positions[playerOf(module)]) errors.push('The player character is not anywhere in this save.');
  for (const characterId of [...save.held, ...Object.keys(save.following)]) {
    if (!characters.has(characterId)) errors.push(`The save keeps "${characterId}" with you, who is not in the module.`);
  }
  return errors;
}

export function parseSave(module: PraxisModule, raw: unknown): { ok: true; save: Save } | { ok: false; errors: string[] } {
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'save'}: ${issue.message}`) };
  }
  const save = parsed.data as Save;
  const errors = checkSave(module, save);
  return errors.length ? { ok: false, errors } : { ok: true, save };
}

export const EXPORT_FORMAT = 'adventure-export/1';
// Still read: save files exported before the formats got neutral names in 0.22.0.
export const LEGACY_EXPORT_FORMAT = 'praxis-export/1';

export interface SaveFile {
  format: typeof EXPORT_FORMAT;
  name: string;
  module: PraxisModule;
  save: Save;
}

export function exportSave(module: PraxisModule, save: Save, name: string): SaveFile {
  return { format: EXPORT_FORMAT, name, module, save };
}

export function readSaveFile(raw: unknown): { ok: true; name: string; module: PraxisModule; save: Save } | { ok: false; errors: string[] } {
  const format = raw && typeof raw === 'object' ? (raw as { format?: unknown }).format : undefined;
  if (format !== EXPORT_FORMAT && format !== LEGACY_EXPORT_FORMAT) {
    return { ok: false, errors: ['This is not a save file from the adventure.'] };
  }
  const file = raw as { name?: unknown; module?: unknown; save?: unknown };
  const loaded = loadModule(file.module);
  if (!loaded.ok) return { ok: false, errors: loaded.errors.map((error) => `module.${error}`) };
  const save = parseSave(loaded.module, file.save);
  if (!save.ok) return save;
  const name = typeof file.name === 'string' && file.name.trim() ? file.name.trim().slice(0, 120) : loaded.module.name;
  return { ok: true, name, module: loaded.module, save: save.save };
}
