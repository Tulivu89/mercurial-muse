// The prompts a draft is written from (docs/bids/worldbuilding/decision.md, *The prompts* and
// *What one call sends*). Pure: the world and record come in, the messages go out.
//
// No prompt names the words it forbids, carries history or explains itself: what a model is
// shown, it copies. Examples are real text from the world, or one weak line beside a better one.
import type { Message } from '../../../core/narration/formats.js';
import {
  KIND_NAMES, hintFor, roughTokens, type RecordKind, type StoryRecord, type World,
} from '../../../core/records/index.js';
import { reachWords, sectionOf, shapeFor, words, type Target } from './shapes';

// When the provider doesn't say how much its model reads.
export const DEFAULT_WINDOW = 8000;
// Kept free beside the reply, because a rough count misses.
export const MARGIN = 1000;

export const TEMPERATURE = { write: 0.5, names: 0.7 } as const;

export interface PartTally { label: string; tokens: number; left: boolean; note?: string }

export interface Built {
  messages: Message[];
  prefill: string;
  maxTokens: number;
  temperature: number;
  tokens: number;
  window: number;
  parts: PartTally[];
}

export type BuildResult = { ok: true; built: Built } | { ok: false; reason: string };

const kindNoun = (kind: RecordKind) => KIND_NAMES[kind].one.toLowerCase();

export function houseRules(world: World): string {
  return [
    'How this world\'s records are written:',
    '- Concrete and plain: what someone could see, hear or do in a scene.',
    '- Behaviour, not adjectives. Weak: "She is pragmatic and guarded." Better: "Sells first and asks nothing."',
    '- Names a reader can say on first sight, and plain words for things.',
    world.genre.trim() ? `- The genre is ${world.genre.trim()}. Its own things, in its own words.` : '- Its own things, in its own words, whatever the genre.',
  ].join('\n');
}

export function kindRule(kind: RecordKind): string {
  if (kind === 'character') return 'Their kind shows in one or two traits and a colouring.';
  if (kind === 'place') return 'At most four named people here at once.';
  return '';
}

// The first two sentences: the premise's compact view when the window is short.
const firstSentences = (text: string, count = 2) => {
  const parts = text.trim().match(/[^.!?]+[.!?]+["'”’)]*\s*/g);
  return parts ? parts.slice(0, count).join('').trim() : text.trim();
};

const lineOf = (record: StoryRecord) => `${record.name} (${kindNoun(record.kind)})${record.line.trim() ? `: ${record.line.trim()}` : ''}`;

// What's near a record, by line only: the place it's in, its groups, and the records its
// sections name.
export function nearLines(world: World, record: StoryRecord): string[] {
  const near = new Map<string, StoryRecord>();
  const add = (id: string | null | undefined) => {
    const found = id ? world.records.find((entry) => entry.id === id) : undefined;
    if (found && found.id !== record.id) near.set(found.id, found);
  };
  add(record.parentId);
  record.groupIds.forEach(add);
  const text = [record.line, ...record.sections.map((section) => section.text)].join('\n').toLowerCase();
  for (const entry of world.records) {
    if (near.size >= 12) break;
    if (entry.id === record.id || entry.name.trim().length < 3) continue;
    if (text.includes(entry.name.trim().toLowerCase())) near.set(entry.id, entry);
  }
  return [...near.values()].map(lineOf);
}

// Up to two examples of this part from the world's other records of the same kind: the same
// section title, or other lines. Short ones first, so they show the length as well as the voice.
export function examplesFor(world: World, record: StoryRecord, target: Target, count: number): string[] {
  const others = world.records.filter((entry) => entry.kind === record.kind && entry.id !== record.id);
  let found: string[];
  if (target.field === 'line') {
    found = others.map((entry) => entry.line.trim()).filter(Boolean);
  } else {
    const title = sectionOf(record, target)?.title.trim().toLowerCase() ?? '';
    found = others.flatMap((entry) => entry.sections.filter((section) => section.title.trim().toLowerCase() === title).map((section) => section.text.trim())).filter(Boolean);
  }
  return found.filter((text) => words(text) <= 120).sort((a, b) => a.length - b.length).slice(0, count);
}

export interface WriteRequest {
  world: World;
  record: StoryRecord;
  target: Target;
  window?: number;
  prefill: boolean;
  // The author's own direction for this draft, if any.
  direction?: string;
  // What the talk settled (W2). A generate button sends none.
  settled?: string[];
}

export function buildFieldWrite(request: WriteRequest): BuildResult {
  const { world, record, target } = request;
  const shape = shapeFor(record, target);
  if (!shape) return { ok: false, reason: 'That part is gone from the record.' };
  const window = request.window && request.window > 0 ? request.window : DEFAULT_WINDOW;
  const small = window <= DEFAULT_WINDOW;
  const title = shape.title;
  const kind = kindNoun(record.kind);

  const visible = record.sections.filter((section) => section.reach !== 'never' && section.text.trim() && !(target.field === 'section' && section.id === target.sectionId));
  const keptBack = record.sections.filter((section) => section.reach === 'never' && section.text.trim() && !(target.field === 'section' && section.id === target.sectionId));
  const readByNarrator = target.field === 'line' || shape.reach !== 'never';
  const visibleRule = readByNarrator && keptBack.length
    ? 'The story\'s narrator reads this part and treats all of it as known to everyone in the scene. The author\'s notes, under "Kept back", are for you only. Where they matter here, show them as something a person could notice; never state them, and never call anything secret.'
    : '';
  const examples = examplesFor(world, record, target, small ? 1 : 2);
  const hint = target.field === 'section' ? hintFor(record.kind, title) : '';

  const system = [
    'You write one part of a record for a story world. Write only that part, in the world\'s own voice: no heading, no preface, no quotes, no note to the author.',
    `World: ${world.name}.${world.genre.trim() ? ` ${world.genre.trim()}.` : ''}${world.tone.trim() ? ` ${world.tone.trim()}` : ''}`,
    houseRules(world),
    kindRule(record.kind),
    visibleRule,
    'Keep every settled fact. Don\'t contradict the record. Don\'t name a person or place the record and the settled facts don\'t name.',
    'If this part can\'t be written without a decision only the author can make, reply with exactly "NEEDS:" and one short question.',
    `The part: ${title}, ${target.field === 'line' ? 'the record\'s line: the narrator reads it whenever the record comes up' : reachWords(shape.reach!)}. ${shape.says}`,
    hint,
    examples.length ? `Like this, from this world:\n${examples.map((text) => `${title}: ${text}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');

  const premise = world.premise.trim();
  const recordText = [
    `${KIND_NAMES[record.kind].one} "${record.name}": ${record.line.trim() || '(no line yet)'}`,
    visible.length ? `Already written:\n${visible.map((section) => `${section.title}: ${section.text.trim()}`).join('\n')}` : '',
    keptBack.length ? `Kept back:\n${keptBack.map((section) => `${section.title}: ${section.text.trim()}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
  const near = nearLines(world, record);
  const settled = request.settled?.filter((line) => line.trim()) ?? [];
  const closing = [
    request.direction?.trim() ? `The author asks: ${request.direction.trim()}` : '',
    `Write ${title}.`,
  ].filter(Boolean).join('\n');

  const parts = {
    premise: premise ? `The world: ${premise}` : '',
    record: recordText,
    near: near.length ? `Near it:\n${near.join('\n')}` : '',
    settled: settled.length ? `Settled:\n${settled.join('\n')}` : '',
    closing,
  };
  const tally: PartTally[] = [
    { label: 'The job and the house rules', tokens: roughTokens(system), left: false },
    { label: 'The world', tokens: roughTokens(parts.premise), left: false },
    { label: `This ${kind}${keptBack.length ? `, with ${keptBack.length} kept back` : ''}`, tokens: roughTokens(parts.record), left: false, note: keptBack.length ? `Kept back: ${keptBack.map((section) => section.title).join(', ')}` : undefined },
    { label: 'Near it', tokens: roughTokens(parts.near), left: false },
    { label: 'Settled', tokens: roughTokens(parts.settled), left: false },
    { label: 'The ask', tokens: roughTokens(parts.closing), left: false },
  ].filter((part) => part.tokens > 0);

  const budget = window - shape.cap - MARGIN;
  const total = () => roughTokens(system) + roughTokens(parts.premise) + roughTokens(parts.record) + roughTokens(parts.near) + roughTokens(parts.settled) + roughTokens(parts.closing);
  // Left out first: what's near it. Then the premise goes as its first two sentences.
  if (total() > budget && parts.near) {
    parts.near = '';
    tally.find((part) => part.label === 'Near it')!.left = true;
  }
  if (total() > budget && premise) {
    const compact = `The world: ${firstSentences(premise)}`;
    if (compact.length < parts.premise.length) {
      parts.premise = compact;
      const part = tally.find((entry) => entry.label === 'The world')!;
      part.tokens = roughTokens(compact);
      part.note = 'The premise\'s first two sentences';
    }
  }
  if (total() > budget) {
    return { ok: false, reason: `This needs about ${total().toLocaleString()} tokens and the model reads about ${window.toLocaleString()}, with room kept for the reply. Shorten the record's sections, or set a larger window for the model.` };
  }

  const user = [parts.premise, parts.record, parts.near, parts.settled, parts.closing].filter(Boolean).join('\n\n');
  return {
    ok: true,
    built: {
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      prefill: request.prefill ? `${title}:\n` : '',
      maxTokens: shape.cap,
      temperature: TEMPERATURE.write,
      tokens: roughTokens(system) + roughTokens(user),
      window,
      parts: tally,
    },
  };
}

export interface NamesRequest { world: World; record: StoryRecord; window?: number }

// Six names for a new record. The model sees the names it can fit; the Studio checks every
// idea against the whole world afterwards.
export function buildNames({ world, record, window: asked }: NamesRequest): BuildResult {
  const window = asked && asked > 0 ? asked : DEFAULT_WINDOW;
  const kind = kindNoun(record.kind);
  const system = [
    `Suggest six names for a ${kind} in "${world.name}"${world.genre.trim() ? ` (${world.genre.trim()})` : ''}. Names a reader can say on first sight: no invented languages, no titles.`,
    'One per line, nothing else.',
  ].join('\n');
  const about = [
    record.line.trim() ? `What it is: ${record.line.trim()}` : '',
    world.premise.trim() ? `The world: ${firstSentences(world.premise, 3)}` : '',
  ].filter(Boolean).join('\n');
  // Names of the same kind first, since those are the ones a new name would be mistaken for.
  const sameKind = world.records.filter((entry) => entry.id !== record.id && entry.kind === record.kind).map((entry) => entry.name);
  const otherKinds = world.records.filter((entry) => entry.id !== record.id && entry.kind !== record.kind).map((entry) => entry.name);
  const budget = window - 120 - MARGIN - roughTokens(system) - roughTokens(about) - 20;
  const shown: string[] = [];
  let spent = 0;
  for (const name of [...sameKind, ...otherKinds]) {
    const cost = roughTokens(name) + 1;
    if (spent + cost > budget) break;
    shown.push(name);
    spent += cost;
  }
  const user = [about, shown.length ? `Names already used here: ${shown.join(', ')}` : '', `Six names for this ${kind}.`].filter(Boolean).join('\n\n');
  const left = sameKind.length + otherKinds.length - shown.length;
  return {
    ok: true,
    built: {
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      prefill: '',
      maxTokens: 120,
      temperature: TEMPERATURE.names,
      tokens: roughTokens(system) + roughTokens(user),
      window,
      parts: [
        { label: 'The job', tokens: roughTokens(system), left: false },
        { label: 'What it is', tokens: roughTokens(about), left: false },
        { label: `Names already used${left > 0 ? `, ${shown.length} of ${shown.length + left}` : ''}`, tokens: spent, left: false, note: left > 0 ? 'The rest are still checked by the Studio.' : undefined },
      ].filter((part) => part.tokens > 0),
    },
  };
}
