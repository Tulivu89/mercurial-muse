// The General context: the same chat as AetherRoom gets, laid out for every other model
// (docs/records.md, How a turn's context is laid out). Stable parts come first so consecutive
// requests share the longest prefix and a provider's cache can reuse it:
//   1. rules   2. the character's standing sections and the persona   3. the scenario
//   4. example chats   5. the journal   6. the transcript   7. the moment
// The moment (what keys and conditions bring in, the style line) rides on the last user turn as
// a note in square brackets, because some formats move a late system message to the top, which
// would change the prefix every turn.
import type { Message } from '../narration/formats.js';
import { contextFor, type ContextAnswer, type ContextBlock } from '../records/context.js';
import { messageSchema, pickedAlt, type Chat, type ResponseLength, type Style } from './chat.js';
import { mergeParts, openReplyText } from './emotions.js';
import { DEFAULT_PROMPT, rulesText, type PromptSetup } from './prompt.js';
import { storySoFar } from './chapters.js';
import { CARD_POST_TITLE, CARD_PROMPT_TITLE } from '../records/tavern.js';
import { replaceMacros } from './macros.js';
import { recentText, type Scene } from './scene.js';
import type { z } from 'zod';

type ChatMessage = z.infer<typeof messageSchema>;

// A deliberately high estimate, so the window is never overfilled; providers count exactly.
export const estimateTokens = (text: string) => Math.ceil(text.length / 3.5);
export const MOMENT_RESERVE = 1200;

const STYLE_RULE: Record<Style, string> = {
  chat: 'chat: text messages, short lines, little or no narration',
  roleplay: 'roleplay: speech mixed with *actions*',
  novel: 'novel: full prose paragraphs, still only from your side',
};

// The rules for a chat reply, from the player's prompt setup (core/chat/prompt.ts).
export function rulesFor(charName: string, userName: string, setup: PromptSetup = DEFAULT_PROMPT): string {
  return rulesText(setup, charName, userName);
}

const RELATIONSHIP_LINE: Record<Chat['relationship'], (char: string, user: string) => string> = {
  stranger: (char, user) => `${char} doesn't know ${user} yet.`,
  acquaintance: (char, user) => `${char} and ${user} are acquaintances.`,
  close: (char, user) => `${char} and ${user} are close.`,
  romantic: (char, user) => `${char} and ${user} are romantic partners.`,
};

const isStable = (reach: string) => reach === 'line' || reach === 'always' || reach === 'here';
const partLine = (part: ContextBlock['parts'][number]) => (part.reach === 'line' ? part.text : `${part.title}: ${part.text}`);

function blockText(block: ContextBlock | undefined, stable: boolean): string[] {
  if (!block) return [];
  return block.parts.filter((part) => isStable(part.reach) === stable).map(partLine);
}

export interface GeneralOptions {
  // Messages [0, upTo) are the story so far.
  upTo: number;
  windowStart: number;
  // The target can continue text we start for it (a completions prompt, or an assistant prefill).
  canPrefill: boolean;
  // The last message in the history is the character's and is being carried on.
  continuing: boolean;
  nowMs: number;
  draft?: string;
  // More for the moment, already worded: time apart, the schedule, the mood, plans, memories.
  momentLines?: string[];
  // Something other than a reply: a diary entry, a plan. It takes the place of the chat rules
  // and of the moment, and the model is started on `lead`.
  task?: { rules: string; ask: string; lead: string };
  // The player's prompt setup; left out, the defaults.
  prompt?: PromptSetup;
  // What the story so far may take (core/chat/chapters.ts); left out, no limit.
  storyTokens?: number;
}

export interface GeneralPart { label: string; text: string; tokens: number }
export interface GeneralBuild {
  messages: Message[];
  prefill: string;
  // What the model's reply is appended to before it is read as a turn.
  lead: string;
  answer: ContextAnswer;
  parts: GeneralPart[];
  prefixTokens: number;
  // The cost of each chat message as sent, for sizing the window.
  costs: number[];
}

// A reply as the model sees it: the character's name and the text, in one piece, with no emotion
// line. Emotions are picked after a reply where something shows them (core/chat/helpers.ts).
export function turnText(message: ChatMessage, charName: string): string {
  const parts = pickedAlt(message).parts;
  return message.from === 'character' ? openReplyText(mergeParts(parts), charName, false) : parts.map((part) => part.text).join('\n');
}

// How long a reply should be, in words a model follows. Unspecified is the middle length. The
// spammy lengths are CharacterRoom's (several short messages in a row) and read as their size.
const PROSE_LENGTH: Record<'short' | 'medium' | 'long' | 'very long', string> = {
  short: 'one paragraph',
  medium: 'two to four paragraphs',
  long: 'four to six paragraphs',
  'very long': 'six paragraphs or more',
};
const CHAT_LENGTH: Record<'short' | 'medium' | 'long' | 'very long', string> = {
  short: 'one or two short lines',
  medium: 'a few lines',
  long: 'several lines',
  'very long': 'a long run of lines',
};
export function lengthSize(length: ResponseLength): 'short' | 'medium' | 'long' | 'very long' {
  if (length === 'short' || length === 'para' || length === 'rapid spam' || length === 'spammy short' || length === 'spammy para') return 'short';
  if (length === 'long' || length === 'spammy long') return 'long';
  if (length === 'very long' || length === 'spammy very long') return 'very long';
  return 'medium';
}
export function lengthWords(style: Style, length: ResponseLength): string {
  const size = lengthSize(length);
  return style === 'chat' ? CHAT_LENGTH[size] : PROSE_LENGTH[size];
}
// The least reply allowance a length needs, so asking for long doesn't run into a small cap.
export const LENGTH_TOKENS: Record<'short' | 'medium' | 'long' | 'very long', number> = { short: 300, medium: 700, long: 1100, 'very long': 1600 };
export const replyTokensFor = (length: ResponseLength, setting: number) => Math.max(setting, LENGTH_TOKENS[lengthSize(length)]);

export function buildGeneral(chat: Chat, scene: Scene, options: GeneralOptions): GeneralBuild {
  const { charName, userName, character, persona, scenario } = scene;
  const macros = (text: string) => replaceMacros(text, charName, userName, options.nowMs);
  const answer = contextFor(scene.view, { hereIds: scene.hereIds, recentText: recentText(chat, options.upTo, options.draft), conditionIds: scene.conditionIds });
  const blockOf = (id: string | undefined) => answer.blocks.find((block) => block.recordId === id);
  const core = new Set(scene.hereIds);
  const others = answer.blocks.filter((block) => block.recordId && !core.has(block.recordId));
  const cameByKey = (block: ContextBlock) => block.why === 'named' || block.why === 'when';

  // 2. The character and the persona.
  const charLines = [
    ...blockText(blockOf(character.id), true),
    character.pronouns.trim() && `Pronouns: ${character.pronouns.trim()}`,
    character.gender.trim() && `Gender: ${character.gender.trim()}`,
    RELATIONSHIP_LINE[chat.relationship](charName, userName),
  ].filter(Boolean) as string[];
  const userLines = [
    ...blockText(blockOf(persona?.id), true),
    persona?.pronouns.trim() && `Pronouns: ${persona.pronouns.trim()}`,
    persona?.gender.trim() && `Gender: ${persona.gender.trim()}`,
  ].filter(Boolean) as string[];
  // 3. The scenario.
  const scenarioLines = blockText(blockOf(scenario?.id), true);
  const standing = others.filter((block) => !cameByKey(block)).map((block) => [`[${block.name}]`, ...blockText(block, true)]).filter((lines) => lines.length > 1);
  // 4. Example chats.
  const examples = character.examples.filter((example) => example.messages.length).map((example, index) => [
    `${index + 1}.`,
    ...example.messages.map((message) => (message.fromCharacter
      ? `${charName}: ${message.text}`
      : `${example.userName || userName}: ${message.text}`)),
  ].join('\n'));

  const parts: GeneralPart[] = [];
  const add = (label: string, text: string) => { if (text.trim()) parts.push({ label, text, tokens: estimateTokens(text) }); };
  const setup = options.prompt ?? DEFAULT_PROMPT;
  add('Rules', options.task?.rules ?? rulesFor(charName, userName, setup));
  // A card's own system prompt and post-history line, where the player sends them.
  const cardSection = (title: string) => (setup.cardPrompt && !options.task ? character.sections.find((section) => section.title === title && section.text.trim())?.text.trim() ?? '' : '');
  const cardPrompt = cardSection(CARD_PROMPT_TITLE);
  if (cardPrompt) add('Card prompt', macros(cardPrompt));
  add(charName, macros(`## ${charName}\n${charLines.join('\n')}`));
  if (userLines.length) add(`${userName} (you)`, macros(`## ${userName}, who ${charName} is talking to\n${userLines.join('\n')}`));
  if (scenarioLines.length) add('Scenario', macros(`## The scenario\n${scenarioLines.join('\n')}`));
  if (standing.length) add('Also true', macros(`## Also true\n${standing.map((lines) => lines.join('\n')).join('\n\n')}`));
  if (examples.length) add('Example chats', macros(`## How ${charName} writes\nExample chats, not part of this chat:\n${examples.join('\n')}`));
  const system = parts.map((part) => part.text).join('\n\n');

  // 5. The journal: what the character keeps about the player.
  const facts = chat.journal.filter((entry) => entry.active && entry.text.trim()).map((entry) => `- ${macros(entry.text.trim())}`);
  const journal = facts.length ? `## What ${charName} knows about ${userName}\n${charName} knows the following about ${userName} and is comfortable bringing it up.\n${facts.join('\n')}` : '';
  if (journal) parts.push({ label: 'Journal', text: journal, tokens: estimateTokens(journal) });
  // What left the window, written up as chapters (core/chat/chapters.ts).
  const story = macros(storySoFar(chat, Math.min(options.windowStart, options.upTo), options.storyTokens ?? Infinity, recentText(chat, options.upTo, options.draft)));
  if (story) parts.push({ label: 'The story so far', text: story, tokens: estimateTokens(story) });
  const prefixTokens = parts.reduce((sum, part) => sum + part.tokens, 0);

  // 6. The transcript, from the window's start.
  const history = chat.messages.slice(0, options.upTo);
  const costs = history.map((message) => estimateTokens(turnText(message, charName)) + 6);
  const start = Math.min(options.windowStart, history.length);
  const carried = options.continuing && history.at(-1)?.from === 'character' ? history.at(-1)! : null;
  const openText = carried ? openReplyText(mergeParts(pickedAlt(carried).parts), charName, false) : '';
  const shown = carried && options.canPrefill ? history.slice(start, -1) : history.slice(start);

  const turns: Message[] = [];
  const push = (role: 'user' | 'assistant', content: string) => {
    const last = turns.at(-1);
    if (last?.role === role) last.content += `\n${content}`;
    else turns.push({ role, content });
  };
  if (!shown[0] || shown[0].from === 'character') push('user', start > 0 ? '[Earlier messages are out of view.]' : '[The chat begins.]');
  for (const message of shown) {
    if (message === carried) push('assistant', openText);
    // A note rides in the player's turn, in its brackets: the rules say what brackets are, and a
    // system message this late would be moved to the top by some formats.
    else push(message.from === 'character' ? 'assistant' : 'user', turnText(message, charName));
  }

  // 7. The moment.
  const momentLines = [
    ...blockText(blockOf(character.id), false).map((line) => `${charName}, ${line}`),
    ...blockText(blockOf(persona?.id), false).map((line) => `${userName}, ${line}`),
    ...blockText(blockOf(scenario?.id), false),
    ...others.flatMap((block) => (cameByKey(block) ? block.parts.map((part) => `${block.name}: ${part.reach === 'line' ? part.text : part.text}`) : blockText(block, false).map((line) => `${block.name}, ${line}`))),
  ].map(macros);
  momentLines.push(...(options.momentLines ?? []).map(macros));
  const style = `Style: ${chat.style}. Length: ${lengthWords(chat.style, chat.responseLength)}.`;
  const ask = carried && !options.canPrefill
    ? `Carry on ${charName}'s last message from exactly where it stops. Don't repeat any of it.`
    : !history.length ? `Write ${charName}'s greeting.` : `Reply as ${charName} only.`;
  const after = [cardSection(CARD_POST_TITLE), setup.after.trim()].filter(Boolean).map(macros);
  const moment = options.task ? `[${options.task.ask}]` : `[${[style, ...momentLines, ...after, ask].join('\n')}]`;
  parts.push({ label: 'The moment', text: moment, tokens: estimateTokens(moment) });
  if (turns.at(-1)?.role === 'user') turns.at(-1)!.content += `\n\n${moment}`;
  else turns.push({ role: 'user', content: moment });

  const transcriptTokens = turns.reduce((sum, turn) => sum + estimateTokens(turn.content), 0) - estimateTokens(moment);
  parts.splice(parts.length - 1, 0, { label: 'Transcript', text: '', tokens: Math.max(0, transcriptTokens) });

  const kept = [journal, story].filter(Boolean).join('\n\n');
  const messages: Message[] = [{ role: 'system', content: system }, ...(kept ? [{ role: 'system' as const, content: kept }] : []), ...turns];
  const lead = options.task ? options.task.lead : carried ? openText : `${charName}:`;
  return { messages, prefill: options.canPrefill ? lead : '', lead, answer, parts, prefixTokens, costs };
}

// Where the transcript starts. It stays put while the window holds, so the prefix is stable;
// when it overflows `high`, whole messages leave until it is down to `low`; and when everything
// fits under `low` again (after deletions, or a bigger window), it goes back to the start.
export function windowStartFor(costs: readonly number[], previous: number, high: number, low: number): number {
  const from = (start: number) => { let total = 0; for (let index = start; index < costs.length; index += 1) total += costs[index]!; return total; };
  if (from(0) <= low) return 0;
  let start = Math.min(previous, Math.max(0, costs.length - 1));
  if (from(start) <= high) return start;
  let total = from(start);
  while (start < costs.length - 1 && total > low) { total -= costs[start]!; start += 1; }
  return start;
}

export interface WindowBudget { total: number; reply: number; prefix: number; high: number; low: number }

// The model's window, less the reply, the prefix and a reserve for the moment. A piece of the
// transcript leaves at once, so the start moves rarely.
export function budgetFor(contextTokens: number, replyTokens: number, prefixTokens: number): WindowBudget {
  const high = Math.max(600, contextTokens - replyTokens - MOMENT_RESERVE - prefixTokens);
  const piece = Math.min(8192, Math.floor(high * 0.4));
  return { total: contextTokens, reply: replyTokens, prefix: prefixTokens, high, low: high - piece };
}

export const responseLengthName = (length: ResponseLength) => (length === 'unspecified' ? 'Up to the character' : length.charAt(0).toUpperCase() + length.slice(1));
// The lengths offered for models other than xialong, which has CharacterRoom's whole list.
// Unspecified stands for medium, so a chat that never chose one gets the usual length.
export const GENERAL_LENGTHS: readonly ResponseLength[] = ['short', 'unspecified', 'long', 'very long'];
export const generalLengthName = (length: ResponseLength) => {
  const size = lengthSize(length);
  return size === 'medium' ? 'Medium: two to four paragraphs' : size === 'short' ? 'Short: one paragraph' : size === 'long' ? 'Long: four to six paragraphs' : 'Very long: six or more';
};
// The list entry a chat's length shows as, for models other than xialong.
export const generalLengthOf = (length: ResponseLength): ResponseLength => { const size = lengthSize(length); return size === 'medium' ? 'unspecified' : size; };
