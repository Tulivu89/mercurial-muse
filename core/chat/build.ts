// One request for one reply: picks the context profile for the model and builds it from the same
// chat either way. AetherRoom for xialong-v1, exactly as CharacterRoom sends it; General for
// every other model. The interface shows these exact messages as "What was sent".
import type { Message } from '../narration/formats.js';
import { contextFor, type ContextAnswer } from '../records/context.js';
import type { World } from '../records/schema.js';
import { AETHERROOM_MODEL, brainEntries, contextBuilt, type KernelContext, type KernelMessage, type Roll } from './aetherroom.js';
import { aetherRoomStyle, pickedAlt, type Chat } from './chat.js';
import { openReplyText, parseReply, replyText, type ReplyPart } from './emotions.js';
import { budgetFor, buildGeneral, estimateTokens, windowStartFor } from './general.js';
import { recentText, sceneFor, type Scene } from './scene.js';
import { sheetFor } from './sheet.js';

export type Profile = 'aetherroom' | 'general';
export const profileFor = (model: string): Profile => (/xialong/i.test(model) ? 'aetherroom' : 'general');
export const PROFILE_NAMES: Record<Profile, string> = { aetherroom: 'AetherRoom (Xialong)', general: 'General' };

// What the owner's Discord bot runs xialong-v1 with.
export const XIALONG = { contextTokens: 28_672, rolloverTokens: 8_192, replyTokens: 1_000, temperature: 0.85, top_p: 0.95, top_k: 250, min_p: 0 } as const;

export interface BuildOptions {
  model: string;
  canPrefill: boolean;
  contextTokens: number;
  replyTokens: number;
  nowMs: number;
  // Messages [0, upTo) are the story the reply follows. Regenerating a turn stops before it.
  upTo: number;
  // Carry on the last message in that story instead of starting a new turn.
  continuing: boolean;
  // True until the first reply of this visit: AetherRoom trims a long chat down on its first build.
  firstBuild: boolean;
  rngInt: (min: number, max: number) => number;
  draft?: string;
}

export interface BuiltPart { label: string; tokens: number }
export interface Built {
  profile: Profile;
  messages: Message[];
  prefill: string;
  // The model's reply is appended to this before it is read as the character's turn.
  lead: string;
  // What to keep on the chat once the reply is in.
  roll: Chat['roll'];
  windowStart: number;
  // The first chat message still in the context.
  firstSent: number;
  answer: ContextAnswer;
  parts: BuiltPart[];
  tokens: number;
  notes: string[];
}

const answerFor = (scene: Scene, chat: Chat, options: BuildOptions) =>
  contextFor(scene.view, { hereIds: scene.hereIds, recentText: recentText(chat, options.upTo, options.draft), conditionIds: scene.conditionIds });

async function buildAetherRoom(chat: Chat, scene: Scene, options: BuildOptions): Promise<Built> {
  const sheet = sheetFor(scene);
  const history = chat.messages.slice(0, options.upTo);
  const carried = options.continuing && history.at(-1)?.from === 'character' ? history.pop()! : null;
  const slot = carried ? openReplyText(pickedAlt(carried).parts, scene.charName, true) : '';

  const ctx: KernelContext = {
    char: sheet.char, user: sheet.user, scenario: sheet.scenario,
    chat: { intimacy: chat.relationship, style: aetherRoomStyle(chat.style), responseLength: chat.responseLength },
    includeGameStats: false, gameRecord: {},
    floaty: sheet.floaty,
    jots: chat.journal.filter((entry) => entry.active).map((entry) => ({ id: entry.id, text: entry.text })),
    trackRealTime: false, useEmotionalModes: false, nowMs: options.nowMs,
  };
  // Keys are matched on what was said, without the speakers' names in front of each line.
  const story = [...history.map((message) => pickedAlt(message).parts.map((part) => part.text).join('\n')), options.draft ?? ''].join('\n');
  const brains = brainEntries(AETHERROOM_MODEL, story, ctx)?.temporaryLorebookEntries.filter((entry) => entry.active !== false) ?? [];

  const turns: KernelMessage[] = history.map((message) => (message.from === 'user'
    ? { role: 'user', content: pickedAlt(message).parts.map((part) => part.text).join('\n') }
    : { role: 'assistant', content: `${replyText(pickedAlt(message).parts, scene.charName, true)}\n` }));
  const input: KernelMessage[] = [...brains.map((entry): KernelMessage => ({ role: 'system', content: entry.content })), ...turns, { role: 'assistant', content: slot }];

  const rollover = Math.min(XIALONG.rolloverTokens, Math.floor(options.contextTokens * 0.28));
  const roll: Roll = { ...chat.roll, pathIdList: [...chat.roll.pathIdList], checkInitialTrim: options.firstBuild };
  const result = await contextBuilt(input, AETHERROOM_MODEL, true, ctx, {
    rngInt: options.rngInt,
    encode: (text) => new Array<number>(estimateTokens(text)).fill(0),
    maxTokens: () => options.contextTokens,
    rolloverTokens: () => rollover,
    naiSystemPrompt: () => '\u0000no NovelAI system prompt\u0000',
    recentEmotions: () => ['neutral'],
    log: () => {},
  }, roll);

  const built = (result.messages ?? []).map((message) => ({ role: message.role, content: message.content ?? '' }));
  // The last assistant message is where the reply goes. Empty, it is left for the provider to
  // open; with text in it (Continue), it is sent for the model to carry on.
  if (built.at(-1)?.role === 'assistant' && !built.at(-1)!.content) built.pop();
  const parts: BuiltPart[] = [
    { label: 'Sheet', tokens: estimateTokens(built[0]?.content ?? '') },
    { label: 'Brains and journal', tokens: brains.reduce((sum, entry) => sum + estimateTokens(entry.content), 0) },
    { label: 'Transcript', tokens: built.slice(1).filter((message) => message.role !== 'system').reduce((sum, message) => sum + estimateTokens(message.content), 0) },
  ];
  return {
    profile: 'aetherroom', messages: built, prefill: '', lead: slot,
    roll: { startIndex: roll.startIndex, pathIdList: roll.pathIdList, trimmed: roll.trimmed },
    windowStart: chat.windowStart,
    firstSent: Math.max(0, roll.startIndex - brains.length),
    answer: answerFor(scene, chat, options),
    parts, tokens: built.reduce((sum, message) => sum + estimateTokens(message.content), 0),
    notes: roll.startIndex > 0 ? [`The window starts at message ${Math.max(1, roll.startIndex - brains.length + 1)}; earlier ones are out of view.`] : [],
  };
}

function buildGeneralProfile(chat: Chat, scene: Scene, options: BuildOptions): Built {
  const base = { upTo: options.upTo, canPrefill: options.canPrefill, continuing: options.continuing, nowMs: options.nowMs, draft: options.draft };
  const sized = buildGeneral(chat, scene, { ...base, windowStart: 0 });
  const budget = budgetFor(options.contextTokens, options.replyTokens, sized.prefixTokens);
  const windowStart = windowStartFor(sized.costs, chat.windowStart, budget.high, budget.low);
  const built = windowStart === 0 ? sized : buildGeneral(chat, scene, { ...base, windowStart });
  const notes: string[] = [];
  if (windowStart > 0) notes.push(`The window starts at message ${windowStart + 1}; earlier ones are out of view.`);
  if (sized.prefixTokens > options.contextTokens * 0.6) notes.push('The character, persona, scenario and examples take most of the window. Trim them in the Studio, or raise the context size.');
  return {
    profile: 'general', messages: built.messages, prefill: built.prefill, lead: built.lead,
    roll: chat.roll, windowStart, firstSent: windowStart, answer: built.answer,
    parts: built.parts.map(({ label, tokens }) => ({ label, tokens })),
    tokens: built.messages.reduce((sum, message) => sum + estimateTokens(message.content), 0),
    notes,
  };
}

export async function buildRequest(chat: Chat, world: World, options: BuildOptions): Promise<Built | null> {
  const scene = sceneFor(world, chat);
  if (!scene) return null;
  return profileFor(options.model) === 'aetherroom' ? buildAetherRoom(chat, scene, options) : buildGeneralProfile(chat, scene, options);
}

// The model's text, read as the character's turn. With a lead (a prefill, or a message being
// carried on), the reply continues it, unless the model wrote the name out again itself.
export function readReply(text: string, lead: string, charName: string, userName: string): ReplyPart[] {
  const body = text.replace(/^\s*\n/, '');
  const named = new RegExp(`^\\s*${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'i').test(body);
  const opener = `${charName}:`;
  if (!lead) return parseReply(body, charName, userName);
  if (lead === opener) return parseReply(named ? body : `${opener} ${body.replace(/^ /, '')}`, charName, userName);
  return parseReply(`${lead}${named ? `\n${body}` : body}`, charName, userName);
}
