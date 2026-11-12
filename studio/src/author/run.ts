// One draft from one call, or two: a reply whose content is wrong goes back once with the exact
// fix (docs/bids/worldbuilding/decision.md). A second failure comes back unfinished, for the
// author to edit. A fault on the connection's side is never resent: it throws.
import type { Message } from '../../../core/narration/formats.js';
import type { StoryRecord, World } from '../../../core/records/index.js';
import type { Built } from './prompts';
import { clean, needsOf, readNames, type NameIdea } from './reading';
import type { Shape } from './shapes';

export interface CallOptions { maxTokens: number; temperature: number; prefill?: string; signal?: AbortSignal; onDelta?: (text: string) => void }
export type Generate = (messages: Message[], options: CallOptions) => Promise<{ text: string; model: string }>;

export interface Outcome {
  state: 'ready' | 'needs' | 'unfinished';
  text: string;
  // The question a NEEDS reply asks.
  question?: string;
  // What was still wrong after the resend.
  fault?: string;
  calls: 1 | 2;
  model: string;
  // Every message sent, for What this sends.
  sent: Message[];
}

const optionsOf = (built: Built, signal?: AbortSignal, onDelta?: (text: string) => void): CallOptions => ({
  maxTokens: built.maxTokens, temperature: built.temperature, ...(built.prefill ? { prefill: built.prefill } : {}), signal, onDelta,
});

function judge(raw: string, shape: Shape): { text: string; question: string | null; fault: string | null } {
  const text = clean(raw, shape.title);
  const question = needsOf(text);
  if (question) return { text, question, fault: null };
  if (!text) return { text, question: null, fault: `That was empty. Write ${shape.title}.` };
  return { text, question: null, fault: shape.fault(text) };
}

export async function runFieldWrite(built: Built, shape: Shape, generate: Generate, signal?: AbortSignal, onDelta?: (text: string) => void): Promise<Outcome> {
  const first = await generate(built.messages, optionsOf(built, signal, onDelta));
  const one = judge(first.text, shape);
  if (one.question) return { state: 'needs', text: '', question: one.question, calls: 1, model: first.model, sent: built.messages };
  if (!one.fault) return { state: 'ready', text: one.text, calls: 1, model: first.model, sent: built.messages };

  // Sent back once: the request, the reply as it came, and the fix.
  const again: Message[] = [
    ...built.messages,
    { role: 'assistant', content: `${built.prefill}${first.text}`.trim() },
    { role: 'user', content: `${one.fault} Write only ${shape.title}.` },
  ];
  onDelta?.('');
  const second = await generate(again, optionsOf(built, signal, onDelta));
  const two = judge(second.text, shape);
  if (two.question) return { state: 'needs', text: '', question: two.question, calls: 2, model: second.model, sent: again };
  if (!two.fault) return { state: 'ready', text: two.text, calls: 2, model: second.model, sent: again };
  return { state: 'unfinished', text: two.text || one.text, fault: two.fault, calls: 2, model: second.model, sent: again };
}

export interface NamesOutcome { ideas: NameIdea[]; calls: 1 | 2; model: string; sent: Message[] }

// Fewer than three names a reader could use is a wrong answer, and goes back once.
export async function runNames(built: Built, world: World, record: StoryRecord, generate: Generate, signal?: AbortSignal): Promise<NamesOutcome> {
  const first = await generate(built.messages, optionsOf(built, signal));
  const ideas = readNames(first.text, world, record);
  if (ideas.filter((idea) => !idea.taken).length >= 3) return { ideas, calls: 1, model: first.model, sent: built.messages };
  const again: Message[] = [
    ...built.messages,
    { role: 'assistant', content: first.text.trim() },
    { role: 'user', content: 'Write six new names, one per line, nothing else, none of them already used here.' },
  ];
  const second = await generate(again, optionsOf(built, signal));
  const more = readNames(second.text, world, record);
  const seen = new Set(ideas.map((idea) => idea.name.toLowerCase()));
  return { ideas: [...ideas, ...more.filter((idea) => !seen.has(idea.name.toLowerCase()))].slice(0, 8), calls: 2, model: second.model, sent: again };
}

export interface Checked<T> { value: T; fault: string | null; calls: 1 | 2; model: string; sent: Message[] }

// Any call whose reply the Studio reads and checks: sent back once with the fix when the check
// fails, then returned as it stands, fault and all.
export async function runChecked<T>(built: Built, read: (raw: string) => { value: T; fault: string | null }, generate: Generate, signal?: AbortSignal): Promise<Checked<T>> {
  const first = await generate(built.messages, optionsOf(built, signal));
  const one = read(first.text);
  if (!one.fault) return { ...one, calls: 1, model: first.model, sent: built.messages };
  const again: Message[] = [...built.messages, { role: 'assistant', content: first.text.trim() }, { role: 'user', content: one.fault }];
  const second = await generate(again, optionsOf(built, signal));
  const two = read(second.text);
  return { ...two, calls: 2, model: second.model, sent: again };
}

// One call, read by the caller: a talk turn, where any words are an answer.
export function generateOnce(built: Built, generate: Generate, signal?: AbortSignal) {
  return generate(built.messages, optionsOf(built, signal));
}
