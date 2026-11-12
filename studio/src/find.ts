// Find, for the record list: every kind at once, by name first, then by a key, then by the words
// of the line, then by the place something is in. Each result says what matched, so a record
// found by a key doesn't look like a mistake.
import type { RecordKind, StoryRecord, World } from '../../core/records/index.js';
import { byName, sortKey, withinOf } from './RecordPick';

export interface Found {
  id: string;
  name: string;
  kind: RecordKind;
  within: string;
  // What matched, when it wasn't the name: "key: bog-woman", or the words of the line around it.
  why: string;
  rank: number;
}

function around(text: string, at: number, length: number): string {
  const from = Math.max(0, at - 24);
  const to = Math.min(text.length, at + length + 36);
  return `${from > 0 ? '…' : ''}${text.slice(from, to).trim()}${to < text.length ? '…' : ''}`;
}

function score(world: World, record: StoryRecord, query: string): Found | null {
  const base = { id: record.id, name: record.name, kind: record.kind, within: withinOf(world, record) };
  const name = record.name.toLocaleLowerCase();
  if (name === query || sortKey(record.name) === query) return { ...base, why: '', rank: 6 };
  if (name.startsWith(query) || sortKey(record.name).startsWith(query)) return { ...base, why: '', rank: 5 };
  if (name.split(/[\s'’-]+/).some((word) => word.startsWith(query))) return { ...base, why: '', rank: 4 };
  if (name.includes(query)) return { ...base, why: '', rank: 3 };
  const key = record.keys.find((entry) => entry.toLocaleLowerCase().startsWith(query)) ?? record.keys.find((entry) => entry.toLocaleLowerCase().includes(query));
  if (key) return { ...base, why: `key: ${key}`, rank: 2 };
  const at = record.line.toLocaleLowerCase().indexOf(query);
  if (at >= 0) return { ...base, why: around(record.line, at, query.length), rank: 1 };
  if (base.within.toLocaleLowerCase().includes(query)) return { ...base, why: '', rank: 0.5 };
  return null;
}

export function findRecords(world: World, typed: string, limit = 60): Found[] {
  const query = typed.trim().toLocaleLowerCase();
  if (!query) return [];
  return world.records
    .map((record) => score(world, record, query))
    .filter((entry): entry is Found => entry !== null)
    .sort((a, b) => b.rank - a.rank || byName(a, b))
    .slice(0, limit);
}
