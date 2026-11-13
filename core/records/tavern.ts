// Brings the character cards most of the character-sharing world uses into a world: Character
// Card V1 (flat fields), V2 (`chara_card_v2`) and V3 (`chara_card_v3`), as JSON or inside a PNG's
// `chara` or `ccv3` text chunk, and the older Pygmalion and text-generation-webui shape
// (`char_name`, `char_persona`). They become records in our own model:
//   description, personality        Here sections
//   scenario                        a Scenario record
//   first_mes, alternate_greetings  greetings
//   mes_example                     example chats
//   character_book entries          Named sections with their keys; constant entries Here
//   creator_notes                   Never
//   system_prompt, post_history_instructions   kept as Never sections, not sent
import type { ExampleChat, Section, StoryRecord, World } from './schema.js';
import { newRecord, putRecord } from './world.js';
import type { ImportResult } from './charactercard.js';

type Ids = () => string;
type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);
const str = (value: unknown): string => (typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '');
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.map(str).filter(Boolean) : typeof value === 'string' ? value.split(',').map((entry) => entry.trim()).filter(Boolean) : []);

// --- PNG

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
export const isPng = (bytes: Uint8Array) => bytes.length > 8 && PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);

const latin1 = (bytes: Uint8Array) => { let out = ''; for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]!); return out; };

// The text chunks of a PNG by keyword. Cards sit in tEXt; iTXt is read when it isn't compressed.
export function pngTextChunks(bytes: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isPng(bytes)) return out;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 8;
  while (at + 12 <= bytes.length) {
    const length = view.getUint32(at);
    const type = latin1(bytes.subarray(at + 4, at + 8));
    const data = bytes.subarray(at + 8, Math.min(at + 8 + length, bytes.length));
    if (type === 'tEXt') {
      const split = data.indexOf(0);
      if (split > 0) out[latin1(data.subarray(0, split))] = latin1(data.subarray(split + 1));
    } else if (type === 'iTXt') {
      const split = data.indexOf(0);
      if (split > 0 && data[split + 1] === 0) {
        const language = data.indexOf(0, split + 3);
        const translated = language < 0 ? -1 : data.indexOf(0, language + 1);
        if (translated > 0) out[latin1(data.subarray(0, split))] = new TextDecoder().decode(data.subarray(translated + 1));
      }
    } else if (type === 'IEND') break;
    at += 12 + length;
  }
  return out;
}

function decodeBase64Json(text: string): unknown {
  const binary = atob(text.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}

// The card inside a PNG: V3's chunk first, then V2's.
export function cardFromPng(bytes: Uint8Array): { ok: true; card: unknown } | { ok: false; error: string } {
  if (!isPng(bytes)) return { ok: false, error: 'This is not a PNG file.' };
  const chunks = pngTextChunks(bytes);
  for (const key of ['ccv3', 'chara']) {
    if (!chunks[key]) continue;
    try { return { ok: true, card: decodeBase64Json(chunks[key]!) }; } catch { /* try the other chunk */ }
  }
  return { ok: false, error: 'This PNG has no character card in it. Card pictures keep theirs in a text chunk named chara or ccv3; a screenshot or a re-saved copy loses it.' };
}

// --- The card

interface Flat {
  name: string; description: string; personality: string; scenario: string; firstMes: string; mesExample: string;
  creatorNotes: string; systemPrompt: string; postHistory: string; alternateGreetings: string[]; tags: string[];
  creator: string; version: string; nickname: string; book: Json | null; spec: string;
}

// Any of the shapes, flattened. Null when it is not a character card at all.
export function readTavernCard(raw: unknown): Flat | null {
  if (!isObject(raw)) return null;
  const data = isObject(raw.data) ? raw.data : raw;
  const legacy = !isObject(raw.data) && typeof raw.char_name === 'string';
  const name = str(legacy ? raw.char_name : data.name);
  const looksLikeCard = legacy || typeof raw.spec === 'string' || ['description', 'personality', 'first_mes', 'mes_example'].some((key) => typeof data[key] === 'string');
  if (!name || !looksLikeCard) return null;
  return {
    name,
    description: str(legacy ? raw.char_persona : data.description),
    personality: str(data.personality),
    scenario: str(legacy ? raw.world_scenario : data.scenario),
    firstMes: str(legacy ? raw.char_greeting : data.first_mes),
    mesExample: str(legacy ? raw.example_dialogue : data.mes_example),
    creatorNotes: str(data.creator_notes) || str(data.creatorcomment),
    systemPrompt: str(data.system_prompt),
    postHistory: str(data.post_history_instructions),
    alternateGreetings: strings(data.alternate_greetings),
    tags: strings(data.tags),
    creator: str(data.creator),
    version: str(data.character_version),
    nickname: str(data.nickname),
    book: isObject(data.character_book) ? data.character_book : null,
    spec: typeof raw.spec === 'string' ? raw.spec : legacy ? 'legacy' : 'chara_card_v1',
  };
}

export const isTavernCard = (raw: unknown) => readTavernCard(raw) !== null;

// `<START>` blocks of `{{user}}:` and `{{char}}:` lines. A line with no speaker continues the
// message above it.
export function parseExampleChats(text: string, charName: string, ids: Ids): ExampleChat[] {
  const chats: ExampleChat[] = [];
  const escaped = charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const speaker = new RegExp(`^\\s*(\\{\\{char\\}\\}|<BOT>|${escaped}|\\{\\{user\\}\\}|<USER>|You|User)\\s*:\\s?(.*)$`, 'i');
  const isChar = (who: string) => /^(\{\{char\}\}|<BOT>)$/i.test(who) || who.toLowerCase() === charName.toLowerCase();
  for (const block of text.split(/^\s*<START>\s*$/im)) {
    const messages: ExampleChat['messages'] = [];
    for (const line of block.split('\n')) {
      const match = speaker.exec(line);
      if (match) messages.push({ fromCharacter: isChar(match[1]!), text: match[2]!.trim(), emotion: '' });
      else if (messages.length && line.trim()) messages[messages.length - 1]!.text += `\n${line.trim()}`;
    }
    const kept = messages.filter((message) => message.text.trim()).slice(0, 80).map((message) => ({ ...message, text: message.text.slice(0, 8000) }));
    if (kept.length) chats.push({ id: ids(), name: `Example ${chats.length + 1}`, userName: '{{user}}', messages: kept });
    if (chats.length >= 30) break;
  }
  return chats;
}

const section = (ids: Ids, title: string, reach: Section['reach'], body: string, keys: string[] = []): Section =>
  ({ id: ids(), title: title.slice(0, 120) || 'Entry', reach, keys: keys.map((key) => key.slice(0, 60)).filter(Boolean).slice(0, 40), when: null, text: body.slice(0, 20000) });

interface BookEntry { title: string; reach: Section['reach']; keys: string[]; text: string }

function bookEntries(book: Json | null): BookEntry[] {
  const raw = book?.entries;
  const entries: unknown[] = Array.isArray(raw) ? raw : isObject(raw) ? Object.values(raw) : [];
  const out: BookEntry[] = [];
  for (const entry of entries) {
    if (!isObject(entry)) continue;
    const text = str(entry.content);
    if (!text) continue;
    const keys = strings(entry.keys ?? entry.key);
    const reach: Section['reach'] = entry.enabled === false || entry.disable === true ? 'never' : entry.constant === true ? 'here' : 'named';
    out.push({ title: str(entry.name) || str(entry.comment) || keys[0] || 'Lore', reach, keys, text });
  }
  return out;
}

// Room on a character for lorebook sections before a big book becomes Lore records instead.
const BOOK_ON_CHARACTER = 60;

export function importTavernCard(world: World, raw: unknown, ids: Ids, now: number): ImportResult {
  const card = readTavernCard(raw);
  if (!card) return { ok: false, errors: ['This is not a character card.'] };
  const notes: string[] = [];
  let next = world;

  const record: StoryRecord = { ...newRecord('character', ids(), card.name.slice(0, 120), ids), chatListed: true, sections: [] };
  if (card.nickname && card.nickname.toLowerCase() !== card.name.toLowerCase()) record.keys = [card.nickname.slice(0, 60)];
  // These cards have no one-line summary; a short personality field is the nearest thing.
  if (card.personality && card.personality.length <= 200 && !card.personality.includes('\n')) record.line = card.personality;
  record.tags = [...new Set(card.tags.map((tag) => tag.slice(0, 40)))].slice(0, 40);
  if (card.description) record.sections.push(section(ids, 'Description', 'here', card.description));
  if (card.personality) record.sections.push(section(ids, 'Personality', 'here', card.personality));

  const book = bookEntries(card.book);
  if (book.length && book.length <= BOOK_ON_CHARACTER) {
    for (const entry of book) record.sections.push(section(ids, entry.title, entry.reach, entry.text, entry.keys));
    notes.push(`Its lorebook came in as ${book.length} section${book.length === 1 ? '' : 's'}.`);
  } else if (book.length) {
    for (const entry of book.slice(0, 2000)) {
      const lore: StoryRecord = { ...newRecord('lore', ids(), entry.title.slice(0, 120), ids), sections: [section(ids, 'Entry', entry.reach === 'here' ? 'always' : entry.reach, entry.text)] };
      lore.keys = entry.keys.map((key) => key.slice(0, 60)).filter(Boolean).slice(0, 40);
      next = putRecord(next, lore, now);
    }
    notes.push(`Its lorebook has ${book.length} entries, so they came in as Lore records.`);
  }

  if (card.creatorNotes) record.sections.push(section(ids, 'Creator notes', 'never', card.creatorNotes));
  if (card.systemPrompt) record.sections.push(section(ids, 'System prompt (from the card)', 'never', card.systemPrompt));
  if (card.postHistory) record.sections.push(section(ids, 'Post-history instructions (from the card)', 'never', card.postHistory));
  if (card.systemPrompt || card.postHistory) notes.push('The card\'s own system prompt is kept as a Never section and not sent. Change its reach in the Studio to send it.');
  record.notes = [card.creator && `By ${card.creator}.`, card.version && `Version ${card.version}.`, `Imported from a ${card.spec} card.`].filter(Boolean).join(' ');

  record.greetings = [card.firstMes, ...card.alternateGreetings].filter(Boolean).slice(0, 20).map((text) => ({ id: ids(), text: text.slice(0, 8000), emotion: '' }));
  record.examples = parseExampleChats(card.mesExample, card.name, ids);
  if (card.mesExample && !record.examples.length) notes.push('Its example messages had no speaker lines, so none came in.');

  let scenarioId: string | undefined;
  if (card.scenario) {
    const scenario: StoryRecord = { ...newRecord('scenario', ids(), `${card.name}: scenario`.slice(0, 120), ids), sections: [section(ids, 'Scene', 'always', card.scenario)] };
    next = putRecord(next, scenario, now);
    scenarioId = scenario.id;
    notes.push('Its scenario came in as a Scenario.');
  }

  return { ok: true, result: { world: putRecord(next, record, now), recordId: record.id, kind: 'character', notes, scenarioId } };
}
