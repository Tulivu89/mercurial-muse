// Errata on a record (docs/bids/worldbuilding/decision.md, phase W2): rounds of answers to pick,
// the talk, and Settled. Pure: the prompts and the reading of their replies.
//
// A round's questions are chosen by the Studio from the author's list; the model only writes the
// answers. A pick is settled by the Studio, in the author's words and the answer's, never by the
// model. Errata's voice is in these two prompts and nowhere else.
import type { Message } from '../../../core/narration/formats.js';
import { KIND_NAMES, roughTokens, type StoryRecord, type World } from '../../../core/records/index.js';
import { DEFAULT_WINDOW, MARGIN, houseRules, kindRule, nearLines, type BuildResult, type PartTally } from './prompts';
import type { Question } from './questions';
import { clean } from './reading';

export interface Turn { id: string; from: 'author' | 'errata'; text: string; at: number; offers?: string[] }
export interface Answer { text: string; note: string }
export interface RoundItem { questionId: string; question: string; answers: Answer[]; picked: number[]; own: string }
export interface Round { id: string; at: number; lead: string; reading: string; items: RoundItem[]; done: boolean }
export interface SettledLine { id: string; text: string }

export interface Talk {
  // `${worldId}/${recordId}`
  id: string;
  worldId: string;
  recordId: string;
  turns: Turn[];
  rounds: Round[];
  settled: SettledLine[];
  // Questions answered or skipped.
  asked: string[];
  updatedAt: number;
}

export const talkId = (worldId: string, recordId: string) => `${worldId}/${recordId}`;
export const emptyTalk = (worldId: string, recordId: string): Talk => ({ id: talkId(worldId, recordId), worldId, recordId, turns: [], rounds: [], settled: [], asked: [], updatedAt: 0 });

export const TEMPERATURE_TALK = 0.7;
const TALK_REPLY = 512;

const kindNoun = (record: StoryRecord) => KIND_NAMES[record.kind].one.toLowerCase();

function opening(world: World, record: StoryRecord, plain: boolean): string {
  return plain
    ? `You are the helper in Inkwyrm's Studio. You are helping the author build ${kindNoun(record)} "${record.name}" for the world "${world.name}". Talk plainly and briefly.`
    : `You are Errata, the helper in Inkwyrm's Studio. You are helping the author build ${kindNoun(record)} "${record.name}" for the world "${world.name}".`;
}

// The record as a helper call reads it: whole, its own Never sections under Kept back.
function recordBlock(record: StoryRecord): string {
  const visible = record.sections.filter((section) => section.reach !== 'never' && section.text.trim());
  const kept = record.sections.filter((section) => section.reach === 'never' && section.text.trim());
  return [
    `This record: ${KIND_NAMES[record.kind].one} "${record.name}": ${record.line.trim() || '(no line yet)'}`,
    visible.length ? `Written so far:\n${visible.map((section) => `${section.title}: ${section.text.trim()}`).join('\n')}` : 'Nothing written yet.',
    kept.length ? `Kept back (the author's notes; never shown to players):\n${kept.map((section) => `${section.title}: ${section.text.trim()}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

interface Common { world: World; record: StoryRecord; talk: Talk; window?: number; plain?: boolean }

function context(world: World, record: StoryRecord, talk: Talk) {
  const near = nearLines(world, record);
  return {
    world: [`World: ${world.name}.${world.genre.trim() ? ` ${world.genre.trim()}.` : ''}`, world.premise.trim()].filter(Boolean).join(' '),
    record: recordBlock(record),
    near: near.length ? `Near it:\n${near.join('\n')}` : '',
    settled: talk.settled.length ? `Settled:\n${talk.settled.map((line) => `- ${line.text}`).join('\n')}` : 'Settled: nothing yet.',
  };
}

// --- A round ---------------------------------------------------------------------------------

export function buildRound({ world, record, talk, window: asked, plain = false }: Common, questions: Question[], passed: Record<string, string[]> = {}): BuildResult {
  const window = asked && asked > 0 ? asked : DEFAULT_WINDOW;
  const system = [
    opening(world, record, plain),
    'The author answers your questions by picking. Under each question below, write three or four answers the author could pick.',
    'Each answer:',
    '- fits this record, this world and its genre, and is clearly different from the others;',
    '- is something you could see happen in a scene;',
    '- stays inside what the author has given: no secret, danger or twist they didn\'t ask for.',
    'The author can always answer in their own words, so never offer "other".',
    houseRules(world),
    kindRule(record.kind),
    'Write exactly this, nothing else:',
    'READING: one or two sentences for yourself: what the record already has, and what these questions turn on.',
    `LEAD: one short sentence to the author${plain ? '' : ', dry and brief'}.`,
    'then, for each question, its number, and its answers as a dash, the answer, a bar, and a few words on what it means, like this:',
    '### 1',
    '- Counts the change twice | makes a show of not trusting anyone',
    '- Pockets the tip without a word | quiet, and keeps a little back',
    'Write real answers only; never copy the example.',
  ].filter(Boolean).join('\n');
  const parts = context(world, record, talk);
  const avoid = questions.flatMap((question) => (passed[question.id]?.length ? [`Don't offer these again for ${questions.indexOf(question) + 1}: ${passed[question.id].join('; ')}`] : []));
  const ask = `Questions:\n${questions.map((question, index) => `${index + 1}. ${question.text}`).join('\n')}`;
  const pieces = [parts.world, parts.record, parts.near, parts.settled, avoid.join('\n'), ask];
  const tally: PartTally[] = [
    { label: 'The job', tokens: roughTokens(system), left: false },
    { label: 'The world', tokens: roughTokens(parts.world), left: false },
    { label: `This ${kindNoun(record)}`, tokens: roughTokens(parts.record), left: false },
    { label: 'Near it', tokens: roughTokens(parts.near), left: false },
    { label: 'Settled', tokens: roughTokens(parts.settled), left: false },
    { label: `${questions.length} question${questions.length === 1 ? '' : 's'}`, tokens: roughTokens(ask) + roughTokens(avoid.join('\n')), left: false },
  ].filter((part) => part.tokens > 0);
  const cap = 120 * questions.length + 80;
  const budget = window - cap - MARGIN;
  let total = roughTokens(system) + pieces.reduce((sum, piece) => sum + roughTokens(piece), 0);
  if (total > budget && parts.near) {
    total -= roughTokens(parts.near);
    pieces[2] = '';
    tally.find((part) => part.label === 'Near it')!.left = true;
  }
  if (total > budget) return { ok: false, reason: `This round needs about ${total.toLocaleString()} tokens and the model reads about ${window.toLocaleString()}. Shorten the record, or set a larger window.` };
  const user = pieces.filter(Boolean).join('\n\n');
  return { ok: true, built: { messages: [{ role: 'system', content: system }, { role: 'user', content: user }], prefill: '', maxTokens: cap, temperature: TEMPERATURE_TALK, tokens: roughTokens(system) + roughTokens(user), window, parts: tally } };
}

export interface ReadRound { reading: string; lead: string; answers: Answer[][]; fault: string | null }

// Reads a round back: each "### n" to its question, each "- answer | note" under it. A missing
// bar is the answer with no note; "other" is dropped. Fewer than two answers to a question is a
// wrong answer, sent back once.
export function readRound(reply: string, count: number): ReadRound {
  const text = clean(reply, 'Round');
  const reading = /^\s*READING\s*:\s*(.+)$/im.exec(text)?.[1]?.trim() ?? '';
  const lead = /^\s*LEAD\s*:\s*(.+)$/im.exec(text)?.[1]?.trim() ?? '';
  const answers: Answer[][] = Array.from({ length: count }, () => []);
  let at = -1;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const heading = /^#{1,4}\s*(\d+)\b/.exec(line) ?? /^(?:question\s*)?(\d+)[.):]\s*$/i.exec(line);
    if (heading) { at = Number(heading[1]) - 1; continue; }
    const item = /^(?:[-*•]|\d+[.)])\s+(.+)$/.exec(line);
    if (!item || at < 0 || at >= count) continue;
    const [answer, ...rest] = item[1].split('|');
    const words = answer.replace(/\*\*/g, '').trim();
    if (!words || /^other\b/i.test(words)) continue;
    if (answers[at].some((existing) => existing.text.toLowerCase() === words.toLowerCase())) continue;
    answers[at].push({ text: words, note: rest.join('|').trim() });
  }
  const short = answers.map((list, index) => (list.length < 2 ? index + 1 : 0)).filter(Boolean);
  const fault = short.length
    ? `Question${short.length > 1 ? 's' : ''} ${short.join(' and ')} had fewer than two answers. Write the round again: READING, LEAD, then "### 1" and so on, with three or four answers under each, each as "- answer | what it means".`
    : null;
  return { reading, lead, answers: answers.map((list) => list.slice(0, 4)), fault };
}

// What a pick settles: the question, then the answer and what it means, in the Studio's words.
export const settledFrom = (question: string, answer: Answer) => `${question.replace(/\?$/, '')}: ${answer.text}${answer.note ? ` (${answer.note})` : ''}`;

// --- A talk turn -----------------------------------------------------------------------------

export function buildTalkTurn({ world, record, talk, window: asked, plain = false }: Common, words: string): BuildResult {
  const window = asked && asked > 0 ? asked : DEFAULT_WINDOW;
  const system = [
    opening(world, record, plain),
    plain ? 'One question at a time.' : 'How you talk: dry and brief. Call something good only when it is, in a few words. No flattery, no stage directions, no talk about yourself.',
    'The record and the settled facts are true. Your own ideas are not settled until the author agrees to them. If the author says something that can\'t be true alongside a settled fact, quote the fact.',
    'You don\'t write the record. When a part is ready, name it and tell the author to use Write.',
    houseRules(world),
    'End with each fact the author said or agreed to in this reply, one per line, starting "Settled: ". If there are none, just end.',
    'Keep it under 120 words.',
  ].join('\n');
  const parts = context(world, record, talk);
  const head = [parts.world, parts.record, parts.near, parts.settled].filter(Boolean).join('\n\n');
  const budget = window - TALK_REPLY - MARGIN - roughTokens(system) - roughTokens(head) - roughTokens(words);
  if (budget < 0) return { ok: false, reason: `The record alone needs more than the model reads (about ${window.toLocaleString()} tokens). Shorten it, or set a larger window.` };
  // The talk, newest first, whole turns only, as many as fit; at most three exchanges on a small
  // window and six on a middling one.
  const most = window <= DEFAULT_WINDOW ? 6 : window < 32000 ? 12 : Infinity;
  const kept: Turn[] = [];
  let spent = 0;
  for (const turn of [...talk.turns].reverse()) {
    if (kept.length >= most) break;
    const cost = roughTokens(turn.text) + 4;
    if (spent + cost > budget) break;
    kept.unshift(turn);
    spent += cost;
  }
  const left = talk.turns.length - kept.length;
  // Turns alternate author and Errata; the head goes in front of the first of the author's.
  const turns: Message[] = [];
  for (const turn of [...kept, { id: 'now', from: 'author' as const, text: words, at: 0 }]) {
    const role = turn.from === 'author' ? 'user' : 'assistant';
    const last = turns.at(-1);
    if (last?.role === role) last.content = `${last.content}\n\n${turn.text}`;
    else turns.push({ role, content: turn.text });
  }
  if (turns[0].role === 'assistant') turns.unshift({ role: 'user', content: '(The talk so far.)' });
  turns[0] = { ...turns[0], content: `${head}\n\n${turns[0].content}` };
  const messages: Message[] = [{ role: 'system', content: system }, ...turns];
  const tokens = messages.reduce((sum, message) => sum + roughTokens(message.content), 0);
  return {
    ok: true,
    built: {
      messages, prefill: '', maxTokens: TALK_REPLY, temperature: TEMPERATURE_TALK, tokens, window,
      parts: [
        { label: 'Errata\'s job', tokens: roughTokens(system), left: false },
        { label: 'The world, the record and Settled', tokens: roughTokens(head), left: false },
        { label: left ? `The talk, the last ${kept.length} of ${talk.turns.length} turns` : 'The talk', tokens: spent, left: false, note: left ? `${left} older turns left out; Settled holds what they decided.` : undefined },
        { label: 'Your words', tokens: roughTokens(words), left: false },
      ].filter((part) => part.tokens > 0),
    },
  };
}

// A talk reply: the words to show, and the Settled lines it offers (taken only with a tap).
export function readTalk(reply: string): { text: string; offers: string[] } {
  const offers: string[] = [];
  const kept: string[] = [];
  for (const line of clean(reply, 'Errata').split('\n')) {
    const offer = /^\s*[-*]?\s*Settled\s*:\s*(.+)$/i.exec(line);
    if (offer) offers.push(offer[1].trim());
    else kept.push(line);
  }
  return { text: kept.join('\n').replace(/^Errata\s*:\s*/i, '').trim(), offers };
}

// The recent talk for a field write, newest last, within a budget.
export function recentTalk(talk: Talk, budget: number): string {
  const kept: string[] = [];
  let spent = 0;
  for (const turn of [...talk.turns].reverse()) {
    const line = `${turn.from === 'author' ? 'Author' : 'Errata'}: ${turn.text}`;
    if (spent + roughTokens(line) > budget) break;
    kept.unshift(line);
    spent += roughTokens(line);
  }
  return kept.join('\n');
}
