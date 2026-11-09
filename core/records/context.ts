// What a world sends the model in a given moment, by reach (docs/records.md). The Studio shows
// it as "In context now"; chat and the adventure will build their prompts from the same answer.
import type { Reach, RecordKind, StoryRecord, World } from './schema.js';
import { ancestors, recordById } from './world.js';

export interface Situation {
  // Who and what is in the scene: characters, items, the place you're in.
  hereIds: string[];
  // The player's words and the last few turns, for Named keys.
  recentText: string;
  // The conditions that hold right now, by id.
  conditionIds: string[];
}

export type Why = 'always' | 'here' | 'named' | 'when' | 'line';

export interface ContextPart { title: string; reach: Reach | 'line'; text: string }
export interface ContextBlock { recordId: string | null; name: string; kind: RecordKind | 'world'; why: Why; parts: ContextPart[] }
export interface ContextAnswer { blocks: ContextBlock[]; tokens: number }

const KIND_ORDER: RecordKind[] = ['scenario', 'persona', 'place', 'character', 'item', 'group', 'thread', 'lore'];

// Whole-word, case-insensitive, any script.
export function mentions(text: string, terms: readonly string[]): boolean {
  if (!text.trim()) return false;
  return terms.some((term) => {
    const clean = term.trim();
    if (!clean) return false;
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu');
    return pattern.test(text);
  });
}

// A rough count for showing size; providers count exactly.
export const roughTokens = (text: string) => Math.ceil(text.length / 4);

export function contextFor(world: World, situation: Situation): ContextAnswer {
  const blocks: ContextBlock[] = [];
  if (world.premise.trim()) {
    blocks.push({ recordId: null, name: world.name, kind: 'world', why: 'always', parts: [{ title: 'Premise', reach: 'always', text: world.premise.trim() }] });
  }

  // The place you're in sends its entry, and so does the place it is inside; further out, lines only.
  const here = new Set(situation.hereIds.filter((id) => recordById(world, id)));
  const lineOnly = new Set<string>();
  for (const id of [...here]) {
    const record = recordById(world, id);
    if (record?.kind !== 'place') continue;
    const [parent, ...further] = ancestors(world, id);
    if (parent) here.add(parent.id);
    for (const place of further) if (!here.has(place.id)) lineOnly.add(place.id);
  }
  // A group's line comes in when one of its members is here.
  const groupLines = new Set<string>();
  for (const id of here) for (const groupId of recordById(world, id)?.groupIds ?? []) groupLines.add(groupId);

  const conditions = new Set(situation.conditionIds);
  const ordered = [...world.records].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  for (const record of ordered) {
    const block = blockFor(record, here.has(record.id), lineOnly.has(record.id) || groupLines.has(record.id), situation.recentText, conditions);
    if (block) blocks.push(block);
  }
  const tokens = blocks.reduce((sum, block) => sum + block.parts.reduce((total, part) => total + roughTokens(part.text) + roughTokens(part.title) + 1, roughTokens(block.name)), 0);
  return { blocks, tokens };
}

function blockFor(record: StoryRecord, isHere: boolean, lineWanted: boolean, recentText: string, conditions: Set<string>): ContextBlock | null {
  const ownKeys = ownTerms(record);
  const isNamed = mentions(recentText, ownKeys);
  const reaches = (reach: Reach, keys: readonly string[], when: string | null) => {
    switch (reach) {
      case 'always': return true;
      case 'here': return isHere;
      case 'named': return mentions(recentText, keys.length ? keys : ownKeys);
      case 'when': return !!when && conditions.has(when) && (keys.length ? mentions(recentText, keys) : isHere || isNamed);
      case 'never': return false;
    }
  };

  const parts: ContextPart[] = [];
  let reachedBy: Why | null = null;
  for (const section of record.sections) {
    if (!section.text.trim() || !reaches(section.reach, section.keys, section.when)) continue;
    parts.push({ title: section.title, reach: section.reach, text: section.text.trim() });
    if (section.reach === 'always' || section.reach === 'when') reachedBy ??= section.reach;
  }
  for (const set of record.sets) {
    const member = set.members.find((candidate) => candidate.id === set.active);
    if (!member?.text.trim() || !reaches(set.reach, [], null)) continue;
    parts.push({ title: `${set.title}: ${member.name}`, reach: set.reach, text: member.text.trim() });
  }
  if ((isHere || isNamed || lineWanted || parts.length) && record.line.trim()) parts.unshift({ title: 'Line', reach: 'line', text: record.line.trim() });
  if (!parts.length) return null;
  const why: Why = isHere ? 'here' : isNamed ? 'named' : reachedBy ?? 'line';
  return { recordId: record.id, name: record.name, kind: record.kind, why, parts };
}

// What brings a record in by name: its name and keys, and for a person, their first name alone
// ("Ada" for Ada Moss), since that is how people get talked about.
export function ownTerms(record: StoryRecord): string[] {
  const terms = [record.name, ...record.keys];
  const first = record.name.trim().split(/\s+/)[0] ?? '';
  if ((record.kind === 'character' || record.kind === 'persona') && first.length >= 3 && first !== record.name.trim()) terms.push(first);
  return terms;
}

// The answer as plain text, the way a prompt would carry it.
export function contextText(answer: ContextAnswer): string {
  return answer.blocks.map((block) => [
    `[${block.name}]`,
    ...block.parts.map((part) => (part.reach === 'line' ? part.text : `${part.title}: ${part.text}`)),
  ].join('\n')).join('\n\n');
}
