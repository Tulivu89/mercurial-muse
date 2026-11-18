// Characters out as cards, and CHARX in (docs/reviews/standards/decision.md, X3).
//
// Out: a Character Card V3 that every app reads. Here and Always sections are the description,
// the line is the personality, greetings and example chats go across, Named sections become the
// card's lorebook with their keys, and the sections import keeps for other apps (the character's
// note, the card's own prompts, group greetings, creator notes) go back where they came from. The
// whole record rides in `extensions.inkwyrm`, so a card taken out and brought back loses nothing;
// the card's other apps' extensions are written back untouched. As a PNG, the card sits in both
// a `chara` chunk (for apps that read only V2) and a `ccv3` chunk, as SillyTavern writes them.
//
// In: a CHARX file is a zip with `card.json` and its pictures; the icon becomes the portrait and
// emotion pictures fill the emotion slots of the same name.
import { unzipSync } from 'fflate';
import { CARD_POST_TITLE, CARD_PROMPT_TITLE } from './tavern.js';
import { ensureCondition, putRecord, recordById } from './world.js';
import { conditionSchema, recordSchema, type Section, type StoryRecord, type World } from './schema.js';
import type { ImportResult } from './charactercard.js';

type Json = Record<string, unknown>;

export const INKWYRM_EXTENSION = 'inkwyrm';
const NOTE_TITLE = 'Character\'s note (from the card)';
const GROUP_TITLE = 'Group greetings (from the card)';
const CREATOR_TITLE = 'Creator notes';
const BACK_HOME = new Set([NOTE_TITLE, GROUP_TITLE, CREATOR_TITLE, CARD_PROMPT_TITLE, CARD_POST_TITLE]);

const textOf = (record: StoryRecord, title: string) => record.sections.find((section) => section.title === title)?.text.trim() ?? '';
const block = (sections: Section[]) => sections.filter((section) => section.text.trim()).map((section) => `${section.title}: ${section.text.trim()}`).join('\n\n');

export function cardFromRecord(world: World, recordId: string, now: number): Json | null {
  const record = recordById(world, recordId);
  if (!record || (record.kind !== 'character' && record.kind !== 'persona')) return null;
  const own = record.sections.filter((section) => !BACK_HOME.has(section.title));
  const description = block(own.filter((section) => section.reach === 'here' || section.reach === 'always'));
  const book = own.filter((section) => (section.reach === 'named' || section.reach === 'when') && section.text.trim()).map((section, index) => ({
    keys: section.keys.length ? section.keys : [record.name, ...record.keys],
    content: section.text.trim(),
    extensions: {},
    // A section behind a condition has no place in a card; it goes along switched off.
    enabled: section.reach === 'named',
    insertion_order: index,
    use_regex: false,
    constant: false,
    selective: !!section.also?.length,
    secondary_keys: section.also ?? [],
    name: section.title,
    comment: section.reach === 'when' ? `Only while: ${world.conditions.find((condition) => condition.id === section.when)?.label ?? 'a condition'}` : section.title,
  }));
  const examples = record.examples.map((example) => ['<START>', ...example.messages.map((message) => `${message.fromCharacter ? '{{char}}' : '{{user}}'}: ${message.text}`)].join('\n')).join('\n');
  const groupGreetings = textOf(record, GROUP_TITLE).split(/\n\n---\n\n/).map((text) => text.trim()).filter(Boolean);
  const note = textOf(record, NOTE_TITLE);
  const conditions = world.conditions.filter((condition) => record.sections.some((section) => section.when === condition.id));
  const seconds = Math.floor(now / 1000);
  return {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: record.name,
      nickname: '',
      description,
      personality: record.line,
      scenario: '',
      first_mes: record.greetings[0]?.text ?? '',
      alternate_greetings: record.greetings.slice(1).map((greeting) => greeting.text),
      group_only_greetings: groupGreetings,
      mes_example: examples,
      creator_notes: textOf(record, CREATOR_TITLE),
      system_prompt: textOf(record, CARD_PROMPT_TITLE),
      post_history_instructions: textOf(record, CARD_POST_TITLE),
      tags: record.tags,
      creator: '',
      character_version: '',
      creation_date: 0,
      modification_date: seconds,
      ...(book.length ? { character_book: { name: `${record.name}'s lore`, extensions: {}, entries: book } } : {}),
      extensions: {
        ...(record.cardExtensions ?? {}),
        ...(note ? { depth_prompt: { prompt: note, depth: 4, role: 'system' } } : {}),
        [INKWYRM_EXTENSION]: { format: 'inkwyrm-record/1', record: { ...record, cardExtensions: undefined }, conditions },
      },
    },
  };
}

// A card that left Inkwyrm comes back whole, as the record it was, when nothing on the card was
// changed elsewhere since (its description, personality and first greeting still match). A card
// changed in another app comes in as any card does. Null when it isn't one of ours.
export function restoreFromCard(world: World, raw: unknown, ids: () => string, now: number): ImportResult | null {
  const data = raw && typeof raw === 'object' && (raw as Json).data && typeof (raw as Json).data === 'object' ? (raw as { data: Json }).data : null;
  const ours = data?.extensions && typeof data.extensions === 'object' ? (data.extensions as Json)[INKWYRM_EXTENSION] : null;
  if (!ours || typeof ours !== 'object') return null;
  const parsed = recordSchema.safeParse((ours as Json).record);
  if (!parsed.success) return null;
  const conditions = Array.isArray((ours as Json).conditions) ? (ours as { conditions: unknown[] }).conditions.flatMap((entry) => { const condition = conditionSchema.safeParse(entry); return condition.success ? [condition.data] : []; }) : [];
  // What the card would say now, from the record it carries, against what it says.
  let check = world;
  for (const condition of conditions) check = ensureCondition(check, condition);
  const again = cardFromRecord(putRecord(check, parsed.data, now), parsed.data.id, now)?.data as Json | undefined;
  const same = (field: string) => String(again?.[field] ?? '') === String(data![field] ?? '');
  if (!again || !same('description') || !same('personality') || !same('first_mes')) return null;
  // Other apps' extensions ride along again; ours and the character's note (a section) don't.
  const { [INKWYRM_EXTENSION]: _ours, depth_prompt: _note, ...others } = data!.extensions as Json;
  const { cardExtensions: _old, ...carried } = parsed.data;
  const record: StoryRecord = { ...carried, id: ids(), ...(Object.keys(others).length ? { cardExtensions: others } : {}) };
  const kind = record.kind === 'persona' ? 'persona' : 'character';
  return { ok: true, result: { world: putRecord(check, record, now), recordId: record.id, kind, notes: ['It came back whole, as it left Inkwyrm.'] } };
}

// --- PNG

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  return table;
})();
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const latin1Bytes = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
const base64 = (text: string) => { const bytes = new TextEncoder().encode(text); let binary = ''; for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!); return btoa(binary); };

function textChunk(keyword: string, value: string): Uint8Array {
  const data = new Uint8Array([...latin1Bytes(keyword), 0, ...latin1Bytes(value)]);
  const typeAndData = new Uint8Array([...latin1Bytes('tEXt'), ...data]);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typeAndData, 4);
  view.setUint32(8 + data.length, crc32(typeAndData));
  return out;
}

// A PNG with the card in it: any card chunks it had are taken out, and `chara` (the card as V2)
// and `ccv3` go in before the end.
export function pngWithCard(png: Uint8Array, card: Json): Uint8Array {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const kept: Uint8Array[] = [png.subarray(0, 8)];
  let at = 8;
  let end: Uint8Array | null = null;
  while (at + 12 <= png.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
    const chunk = png.subarray(at, at + 12 + length);
    if (type === 'IEND') { end = chunk; break; }
    const keyword = type === 'tEXt' || type === 'iTXt' ? String.fromCharCode(...png.subarray(at + 8, at + 8 + Math.min(length, 80))).split('\0')[0] : '';
    if (keyword !== 'chara' && keyword !== 'ccv3') kept.push(chunk);
    at += 12 + length;
  }
  const json = JSON.stringify(card);
  const v2 = JSON.stringify({ ...card, spec: 'chara_card_v2', spec_version: '2.0' });
  const parts = [...kept, textChunk('chara', base64(v2)), textChunk('ccv3', base64(json)), end ?? new Uint8Array([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

// --- CHARX

export const isZip = (bytes: Uint8Array) => bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;

const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };
const dataUrl = (bytes: Uint8Array, ext: string) => { let binary = ''; for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!); return `data:${IMAGE_TYPES[ext] ?? 'application/octet-stream'};base64,${btoa(binary)}`; };

export interface Charx { card: unknown; icon: string; emotions: Record<string, string> }

// A CHARX zip: its card, its main icon and its emotion pictures by name, as data URLs.
export function readCharx(bytes: Uint8Array): { ok: true; charx: Charx } | { ok: false; error: string } {
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(bytes); } catch { return { ok: false, error: 'This CHARX file could not be opened as a zip.' }; }
  const cardFile = files['card.json'];
  if (!cardFile) return { ok: false, error: 'This CHARX file has no card.json.' };
  let card: unknown;
  try { card = JSON.parse(new TextDecoder().decode(cardFile)); } catch { return { ok: false, error: 'The card in this CHARX file is not JSON.' }; }
  const data = card && typeof card === 'object' && (card as Json).data && typeof (card as Json).data === 'object' ? (card as { data: Json }).data : {};
  const assets = Array.isArray(data.assets) ? data.assets.filter((asset): asset is Json => !!asset && typeof asset === 'object') : [];
  const fileFor = (uri: unknown) => {
    const path = typeof uri === 'string' ? uri.replace(/^(embeded|embedded):\/\//, '').replace(/^__asset:/, '') : '';
    return path && files[path] ? files[path] : null;
  };
  let icon = '';
  const emotions: Record<string, string> = {};
  for (const asset of assets) {
    const file = fileFor(asset.uri);
    const ext = typeof asset.ext === 'string' ? asset.ext.toLowerCase() : '';
    if (!file || !IMAGE_TYPES[ext]) continue;
    if (asset.type === 'icon' && (!icon || asset.name === 'main')) icon = dataUrl(file, ext);
    if (asset.type === 'emotion' && typeof asset.name === 'string') emotions[asset.name.toLowerCase()] = dataUrl(file, ext);
  }
  return { ok: true, charx: { card, icon, emotions } };
}
