// Reading a reply (docs/bids/worldbuilding/decision.md, *Reading every reply*). Pure.
//
// Decoration is ignored: case, spacing, Markdown, a preface line, the field's own title, wrapping
// quotes, <draft> tags. Wrong content is never repaired here: the shape's check names the fix, and
// the call sends it back once.
import type { StoryRecord, World } from '../../../core/records/index.js';

const PREFACE = /^(?:sure|certainly|of course|okay|ok|here(?:'s| is| are)|below is|i(?:'ve| have) written)\b[^\n]*[:.!]?\s*$/i;

export function clean(reply: string, title: string): string {
  let text = reply.replace(/\r\n?/g, '\n');
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<\/?draft>/gi, '');
  text = text.replace(/^```[^\n]*\n?/gm, '');
  text = text.trim();
  // A first line that only introduces the answer.
  const lines = text.split('\n');
  if (lines.length > 1 && PREFACE.test(lines[0].trim())) text = lines.slice(1).join('\n').trim();
  // The field's own title as a heading, or in front of the text.
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  text = text.replace(new RegExp(`^(?:#+\\s*|\\*\\*)?${escaped}(?:\\*\\*)?\\s*[:\\-–—]?\\s*(?:\\*\\*)?\\s*\\n?`, 'i'), '').trim();
  text = text.replace(/^#+\s+[^\n]*\n/, (heading) => (lines.length > 1 ? '' : heading)).trim();
  // Bold and underline marks; a single asterisk is left, since actions use it.
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1');
  // Quotes around the whole reply.
  const pairs: Record<string, string> = { '"': '"', '“': '”', "'": "'", '‘': '’' };
  const open = text[0];
  if (open && pairs[open] && text.endsWith(pairs[open]) && text.length > 1) {
    const inner = text.slice(1, -1);
    if (!inner.includes(open) && !inner.includes(pairs[open])) text = inner.trim();
  }
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// A reply that asks the author instead of inventing: "NEEDS: one question".
export function needsOf(text: string): string | null {
  const match = text.match(/^\s*NEEDS\s*:\s*([\s\S]+)$/i);
  return match ? match[1].trim().split('\n')[0].trim() : null;
}

// Names and keys compared as a reader would: case, spacing and accents folded.
export const fold = (name: string) => name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function namesInUse(world: World, except?: string): Set<string> {
  const used = new Set<string>();
  for (const record of world.records) {
    if (record.id === except) continue;
    used.add(fold(record.name));
    for (const key of record.keys) used.add(fold(key));
  }
  used.delete('');
  return used;
}

export interface NameIdea { name: string; taken: boolean }

// Name ideas, one per line. Numbers, bullets and anything after a dash or a colon are decoration.
export function readNames(reply: string, world: World, record: StoryRecord): NameIdea[] {
  const used = namesInUse(world, record.id);
  const seen = new Set<string>();
  const ideas: NameIdea[] = [];
  for (const raw of clean(reply, 'Names').split('\n')) {
    const name = raw
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
      .split(/\s+[-–—]\s+|:\s/)[0]
      .replace(/^["'“‘*]+|["'”’*.,]+$/g, '')
      .trim();
    if (!name || name.length > 60 || name.split(/\s+/).length > 5) continue;
    const key = fold(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    ideas.push({ name, taken: used.has(key) });
  }
  return ideas.slice(0, 8);
}

// Words a draft is underlined for. Matching one proves nothing; it asks for a second look.
export const FLAGGED = [
  'tapestry', 'testament', 'palpable', 'a dance of', 'delve', 'myriad', 'unspoken', 'couldn\'t help but',
  'a sense of', 'the air thick', 'shiver down', 'symphony', 'kaleidoscope', 'labyrinthine', 'nestled',
  'bustling', 'vibrant', 'enigmatic', 'an air of', 'intricate', 'whisper of', 'little did',
];

export interface Flag { start: number; end: number; word: string }

export function flagsIn(text: string): Flag[] {
  const lower = text.toLowerCase();
  const flags: Flag[] = [];
  for (const word of FLAGGED) {
    for (let at = lower.indexOf(word); at >= 0; at = lower.indexOf(word, at + word.length)) {
      const before = at === 0 ? ' ' : lower[at - 1];
      const after = lower[at + word.length] ?? ' ';
      // Whole words only, so "testament" doesn't light up "testamentary" or "intestate".
      if (/\p{L}/u.test(before) || /\p{L}/u.test(after)) continue;
      flags.push({ start: at, end: at + word.length, word });
    }
  }
  return flags.sort((a, b) => a.start - b.start);
}
