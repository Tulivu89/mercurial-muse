// Lorebooks in and out (docs/reviews/standards/decision.md, X2).
//
// In: every dialect the review found, read loosely as RisuAI does: SillyTavern's World Info
// (`entries` keyed by id, `key`, `keysecondary`, `comment`, `disable`), Character Card V3's
// `lorebook_v3`, a V2 character book on its own, Agnai's memory books (`keywords`, `entry`),
// RisuAI's exports (`type: risu`, comma-separated `key`) and NovelAI's `.lorebook` (`text`,
// `displayName`, `forceActivation`, categories). Each entry becomes a Lore record.
//
// Out: a world as SillyTavern's World Info file, the one shape every app reads. Lore records go
// as they are; characters, places, items and groups go as one entry each under their names, with
// what a scene would send of them, so a world can be taken to another app as its lorebook.
import { bookEntries, leftoverNotes, noLeftovers, type BookLeftovers } from './tavern.js';
import { newRecord, putRecord } from './world.js';
import type { Section, StoryRecord, World } from './schema.js';

type Json = Record<string, unknown>;
type Ids = () => string;
const isObject = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);
const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export type LorebookDialect = 'sillytavern' | 'lorebook_v3' | 'character_book' | 'agnai' | 'risu' | 'novelai';
export const DIALECT_NAMES: Record<LorebookDialect, string> = {
  sillytavern: 'SillyTavern World Info', lorebook_v3: 'Character Card V3 lorebook', character_book: 'character book',
  agnai: 'Agnai memory book', risu: 'RisuAI lorebook', novelai: 'NovelAI lorebook',
};

// The book in V2's words, whatever it came as, so the card importer's reader does the rest. A
// NovelAI category becomes a tag.
function normalise(raw: unknown): { dialect: LorebookDialect; name: string; book: Json; tags: Map<number, string> } | null {
  if (!isObject(raw)) return null;
  const tags = new Map<number, string>();
  if (raw.spec === 'lorebook_v3' && isObject(raw.data)) return { dialect: 'lorebook_v3', name: str(raw.data.name), book: raw.data, tags };
  if (raw.kind === 'memory' && Array.isArray(raw.entries)) {
    const entries = raw.entries.filter(isObject).map((entry) => ({ name: entry.name, content: entry.entry, keys: entry.keywords, enabled: entry.enabled !== false, insertion_order: entry.weight }));
    return { dialect: 'agnai', name: str(raw.name), book: { entries }, tags };
  }
  if (raw.type === 'risu' && Array.isArray(raw.data)) {
    const entries = raw.data.filter(isObject).filter((entry) => entry.mode !== 'folder').map((entry) => ({
      name: entry.comment, content: entry.content, keys: str(entry.key).split(',').map((key) => key.trim()).filter(Boolean),
      secondary_keys: str(entry.secondkey).split(',').map((key) => key.trim()).filter(Boolean), selective: entry.selective === true,
      constant: entry.alwaysActive === true || entry.mode === 'constant', enabled: true,
    }));
    return { dialect: 'risu', name: '', book: { entries }, tags };
  }
  if (typeof raw.lorebookVersion === 'number' && Array.isArray(raw.entries)) {
    const categories = new Map<string, string>();
    if (Array.isArray(raw.categories)) for (const category of raw.categories.filter(isObject)) if (str(category.id)) categories.set(str(category.id), str(category.name));
    const entries = raw.entries.filter(isObject).map((entry, index) => {
      const category = categories.get(str(entry.category));
      if (category) tags.set(index, category);
      return { name: entry.displayName, content: entry.text, keys: entry.keys, enabled: entry.enabled !== false, constant: entry.forceActivation === true };
    });
    return { dialect: 'novelai', name: '', book: { entries }, tags };
  }
  if (isObject(raw.entries) && !Array.isArray(raw.entries)) return { dialect: 'sillytavern', name: str(raw.name), book: raw, tags };
  if (Array.isArray(raw.entries)) return { dialect: 'character_book', name: str(raw.name), book: raw, tags };
  return null;
}

export const isLorebook = (raw: unknown) => normalise(raw) !== null;

export type LorebookImport = { ok: true; world: World; count: number; dialect: LorebookDialect; notes: string[] } | { ok: false; errors: string[] };

// Brings a lorebook into a world as Lore records. An always-on entry is Always, a disabled one
// Never, the rest Named by their keys; a second key list comes in as "And one of these too".
export function importLorebook(world: World, raw: unknown, ids: Ids, now: number): LorebookImport {
  const found = normalise(raw);
  if (!found) return { ok: false, errors: ['This file is not a lorebook Inkwyrm knows.'] };
  const left: BookLeftovers = noLeftovers();
  const entries = bookEntries(found.book, left);
  if (!entries.length) return { ok: false, errors: [`This ${DIALECT_NAMES[found.dialect]} has no entries with text.`] };
  let next = world;
  const book = found.name ? [found.name.slice(0, 40)] : [];
  for (const entry of entries.slice(0, 2000)) {
    const tag = found.tags.get(entry.index);
    const reach: Section['reach'] = entry.reach === 'here' ? 'always' : entry.reach;
    const lore: StoryRecord = {
      ...newRecord('lore', ids(), entry.title.slice(0, 120), ids),
      keys: entry.keys.map((key) => key.slice(0, 60)).filter(Boolean).slice(0, 40),
      tags: [...new Set([...book, ...(tag ? [tag.slice(0, 40)] : [])])],
      sections: [{ id: ids(), title: 'Entry', reach, keys: [], ...(entry.also.length ? { also: entry.also.slice(0, 40) } : {}), when: null, text: entry.text.slice(0, 20000) }],
    };
    next = putRecord(next, lore, now);
  }
  const notes = leftoverNotes(left);
  if (entries.length > 2000) notes.push(`Only the first 2,000 of its ${entries.length} entries came in.`);
  return { ok: true, world: next, count: Math.min(entries.length, 2000), dialect: found.dialect, notes };
}

// What of a record goes into its lorebook entry: its line and every section a scene could send
// (Always, Here, Named), never its Never or When sections.
function entryText(record: StoryRecord): string {
  const shown = record.sections.filter((section) => ['always', 'here', 'named'].includes(section.reach) && section.text.trim());
  const body = shown.map((section) => (record.kind === 'lore' && shown.length === 1 ? section.text.trim() : `${section.title}: ${section.text.trim()}`));
  return [record.kind === 'lore' ? '' : record.name, record.line.trim(), ...body].filter(Boolean).join('\n');
}

const EXPORTED = new Set(['lore', 'character', 'place', 'item', 'group', 'faction']);

// The world as SillyTavern World Info. Lore that was Always stays constant; everything else is
// brought in by its name and keys.
export function worldInfoFrom(world: World): { entries: Record<string, Json>; name: string } {
  const entries: Record<string, Json> = {};
  let uid = 0;
  for (const record of world.records) {
    if (!EXPORTED.has(record.kind)) continue;
    const content = entryText(record);
    if (!content) continue;
    const always = record.kind === 'lore' && record.sections.some((section) => section.reach === 'always' && section.text.trim());
    const also = record.sections.find((section) => section.also?.length)?.also ?? [];
    const keys = [...new Set([record.name, ...record.keys])].filter(Boolean);
    entries[String(uid)] = {
      uid, key: keys, keysecondary: also, comment: record.name, content,
      constant: always, selective: also.length > 0, selectiveLogic: 0, order: 100, position: record.kind === 'lore' ? 1 : 0,
      disable: false, addMemo: true, excludeRecursion: false, preventRecursion: false, probability: 100, useProbability: true,
      depth: 4, group: '', groupOverride: false, groupWeight: 100, scanDepth: null, caseSensitive: null, matchWholeWords: null,
      vectorized: false, displayIndex: uid,
    };
    uid += 1;
  }
  return { name: world.name, entries };
}
