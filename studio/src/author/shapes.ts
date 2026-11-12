// What each field a draft can fill looks like, and how a reply for it is checked
// (docs/bids/worldbuilding/decision.md, *The shapes*). Pure.
//
// The Studio checks what code can check: how many sentences, how many words, whether the reply
// stopped mid-sentence. A reply that fails gets sent back once with the exact fix. The model is
// never asked to count.
import type { Reach, Section, StoryRecord } from '../../../core/records/index.js';

// What a draft is for. W1 drafts the line and sections; names are offered by their own call.
export type Target = { field: 'line' } | { field: 'section'; sectionId: string };

export interface Shape {
  title: string;
  reach: Reach | null;
  // Sent to the model as the part's shape.
  says: string;
  // The most tokens the reply may run to.
  cap: number;
  // What is wrong with a reply, as the fix to send back, or null when it fits.
  fault: (text: string) => string | null;
}

export const sectionOf = (record: StoryRecord, target: Target): Section | undefined =>
  target.field === 'section' ? record.sections.find((section) => section.id === target.sectionId) : undefined;

export const targetKey = (target: Target) => (target.field === 'section' ? `section:${target.sectionId}` : target.field);

// The field's text as it stands now, which a draft is measured against when it is kept.
export function currentText(record: StoryRecord, target: Target): string | undefined {
  if (target.field === 'line') return record.line;
  return sectionOf(record, target)?.text;
}

export function withText(record: StoryRecord, target: Target, text: string): StoryRecord {
  if (target.field === 'line') return { ...record, line: text };
  return { ...record, sections: record.sections.map((section) => (section.id === target.sectionId ? { ...section, text } : section)) };
}

export const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// Common short forms whose full stop doesn't end a sentence.
const SHORT_FORMS = /\b(?:Mr|Mrs|Ms|Dr|St|Mt|Jr|Sr|No|vs|etc|e\.g|i\.e|a\.m|p\.m|[A-Z])\.$/;

// Sentences, counted by their ends: a full stop, question or exclamation mark (with any closing
// quote or bracket after it) followed by a space or the end of the text.
export function sentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  let count = 0;
  const ends = /[.!?]+["'”’)\]]*(?=\s|$)/g;
  for (let match = ends.exec(trimmed); match; match = ends.exec(trimmed)) {
    const before = trimmed.slice(0, match.index + 1);
    if (match[0].startsWith('.') && SHORT_FORMS.test(before)) continue;
    count += 1;
  }
  // Text after the last end, such as a line with no full stop, is a sentence too.
  const last = trimmed.replace(/["'”’)\]]+$/, '').slice(-1);
  if (!/[.!?]/.test(last)) count += 1;
  return count;
}

// A reply that stopped short: it doesn't end on a sentence's end.
export const cutOff = (text: string) => !/[.!?…]["'”’)\]*_]*$/.test(text.trim());

const REACH_WORDS: Record<Reach, string> = {
  always: 'the narrator reads it every turn',
  here: 'the narrator reads it while this is in the scene',
  named: 'the narrator reads it when its name comes up',
  when: 'the narrator reads it while a condition holds',
  never: 'notes for the author; never sent in play',
};
export const reachWords = (reach: Reach) => REACH_WORDS[reach];

const plural = (count: number, one: string) => `${count} ${one}${count === 1 ? '' : 's'}`;

function lineShape(): Shape {
  return {
    title: 'Line', reach: null, cap: 60,
    says: 'One sentence, under 25 words: who or what this is to a stranger.',
    fault: (text) => {
      const count = sentences(text);
      if (count > 1) return `That was ${plural(count, 'sentence')}. Write the line as one sentence under 25 words.`;
      const many = words(text);
      if (many > 25) return `That was ${many} words. Write the line as one sentence under 25 words.`;
      return null;
    },
  };
}

function sectionShape(section: Section): Shape {
  const title = section.title.trim() || 'this part';
  const stopped = (text: string) => (cutOff(text) ? 'That stopped mid-sentence. Write it again, shorter, and end on a full stop.' : null);
  switch (section.reach) {
    case 'always':
      return {
        title, reach: section.reach, cap: 100,
        says: 'One or two sentences, under 40 words. It goes out every turn, so keep it small.',
        fault: (text) => {
          const many = words(text);
          if (many > 40) return `That was ${many} words. Write it in one or two sentences under 40 words.`;
          return stopped(text);
        },
      };
    case 'here':
      return {
        title, reach: section.reach, cap: 250,
        says: 'Two to four sentences.',
        fault: (text) => {
          const count = sentences(text);
          if (count > 6) return `That was ${plural(count, 'sentence')}. Write two to four.`;
          return stopped(text);
        },
      };
    case 'named':
    case 'when':
      return {
        title, reach: section.reach, cap: 300,
        says: 'Two to five sentences.',
        fault: (text) => {
          const count = sentences(text);
          if (count > 7) return `That was ${plural(count, 'sentence')}. Write two to five.`;
          return stopped(text);
        },
      };
    case 'never':
      return {
        title, reach: section.reach, cap: 200,
        says: 'Notes for the author, one to three plain sentences.',
        fault: stopped,
      };
  }
}

export function shapeFor(record: StoryRecord, target: Target): Shape | null {
  if (target.field === 'line') return lineShape();
  const section = sectionOf(record, target);
  return section ? sectionShape(section) : null;
}
