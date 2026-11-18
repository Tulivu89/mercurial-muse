// A chat: one character and one player, as an instance (docs/records.md, Play data). It points
// at records in a world and never writes to them. What the character learns about the player
// (the journal, CharacterRoom's Jots) lives here, per pairing. Pure: ids and times come in.
import { z } from 'zod';
import { RELATIONSHIPS } from '../records/charactercard.js';
import { EMOTIONS, FALLBACK_EMOTION, parseReply, type ReplyPart } from './emotions.js';
import { DEFAULT_CLOCK, storyActive } from './time.js';

export const CHAT_FORMAT = 'inkwyrm-chat/1';
export const CHAT_EXPORT_FORMAT = 'inkwyrm-chat-export/1';
export const BACKUP_FORMAT = 'inkwyrm-backup/1';

// CharacterRoom's chat settings (F-13). `novel` is sent to xialong as "roleplay, novel style".
export const STYLES = ['chat', 'roleplay', 'novel'] as const;
export type Style = (typeof STYLES)[number];
export const STYLE_NAMES: Record<Style, string> = { chat: 'Chat', roleplay: 'Roleplay', novel: 'Novel' };
export const STYLE_HINTS: Record<Style, string> = {
  chat: 'Text messages. Short lines, little narration.',
  roleplay: 'Speech mixed with actions.',
  novel: 'Full prose paragraphs.',
};
export const aetherRoomStyle = (style: Style) => (style === 'novel' ? 'roleplay, novel style' : style);

export const RESPONSE_LENGTHS = ['unspecified', 'short', 'medium', 'long', 'very long', 'para', 'rapid spam', 'spam', 'spammy short', 'spammy medium', 'spammy long', 'spammy very long', 'spammy para'] as const;
export type ResponseLength = (typeof RESPONSE_LENGTHS)[number];

const id = z.string().min(1).max(80);
const partSchema = z.object({ text: z.string().max(40_000), emotion: z.enum(EMOTIONS).catch(FALLBACK_EMOTION) });
// `ended` says a reply stopped before the model finished it: at the reply limit, or at the
// provider's filter. `thinking` is what the model spent thinking first, where it said.
const altSchema = z.object({
  parts: z.array(partSchema).max(40),
  at: z.number().nonnegative().default(0),
  model: z.string().max(200).default(''),
  ended: z.enum(['limit', 'filter']).optional().catch(undefined),
  thinking: z.number().int().nonnegative().optional().catch(undefined),
});
export const messageSchema = z.object({
  id,
  // A note is a directive in square brackets, from outside the story: it sets the scene or
  // changes something, and is nobody's turn.
  from: z.enum(['user', 'character', 'note']),
  at: z.number().nonnegative().default(0),
  // Every reply written for this turn is kept; `pick` is the one in the story.
  alts: z.array(altSchema).min(1).max(200),
  pick: z.number().int().nonnegative().default(0),
  // Story time when this was written, so removing it puts the clock back.
  clock: z.number().nonnegative().optional(),
});
export type ChatMessage = z.infer<typeof messageSchema>;
export type Alt = z.infer<typeof altSchema>;

export const journalEntrySchema = z.object({ id, text: z.string().max(2000), at: z.number().nonnegative().default(0), active: z.boolean().default(true) });
export type JournalEntry = z.infer<typeof journalEntrySchema>;

// A memory the character keeps: a diary entry or a feeling about one moment (CharacterRoom's Diary
// and Process). It comes back into context when one of its keys is said.
export const memorySchema = z.object({ id, name: z.string().max(200).default(''), content: z.string().max(8000), keys: z.array(z.string().min(1).max(80)).max(40).default([]), at: z.number().nonnegative().default(0) });
export type Memory = z.infer<typeof memorySchema>;

// A chapter: the messages that left the General window, written up once by a side request
// (core/chat/chapters.ts; docs/reviews/memory/decision.md). It covers the messages from `fromId`
// to `toId`; `seal` is what they said when it was written, so a later edit marks it out of date.
export const chapterSchema = z.object({
  id,
  fromId: id,
  toId: id,
  text: z.string().max(8000).default(''),
  keys: z.array(z.string().min(1).max(80)).max(12).default([]),
  pinned: z.boolean().default(false),
  state: z.enum(['pending', 'written', 'failed']).default('pending'),
  tries: z.number().int().nonnegative().default(0),
  seal: z.string().max(40).default(''),
  at: z.number().nonnegative().default(0),
});
export type Chapter = z.infer<typeof chapterSchema>;

// A plan: something the character means to do in the next few turns (CharacterRoom's Plans, F-20).
// The AI's own or the player's, limited to a number of turns or ongoing.
export const PLAN_TURNS = 3;
export const planSchema = z.object({
  id,
  name: z.string().max(200).default(''),
  content: z.string().max(4000),
  planType: z.enum(['AI', 'User']).default('AI'),
  durationType: z.enum(['Limited', 'Ongoing']).default('Limited'),
  totalTurns: z.number().int().min(1).max(999).default(PLAN_TURNS),
  remainingTurns: z.number().int().min(-1).max(999).default(PLAN_TURNS),
  running: z.boolean().default(false),
  startedAtCount: z.number().int().default(-1),
});
export type Plan = z.infer<typeof planSchema>;

export const clockSchema = z.object({
  mode: z.enum(['real', 'story']).default('real'),
  storyMs: z.number().nonnegative().default(0),
  stepMin: z.number().int().min(0).max(1440).default(0),
  trackReal: z.boolean().default(false),
});

export const chatSchema = z.object({
  format: z.literal(CHAT_FORMAT),
  id,
  worldId: id,
  characterId: id,
  personaId: id.nullable().default(null),
  scenarioId: id.nullable().default(null),
  // Kept so the list still reads if the record is gone, and for a chat with no persona.
  characterName: z.string().max(120).default(''),
  userName: z.string().min(1).max(120).default('User'),
  relationship: z.enum(RELATIONSHIPS).default('stranger'),
  style: z.enum(STYLES).default('chat'),
  responseLength: z.enum(RESPONSE_LENGTHS).default('unspecified'),
  messages: z.array(messageSchema).max(20_000).default([]),
  journal: z.array(journalEntrySchema).max(500).default([]),
  // Lore records switched off for this chat.
  loreOff: z.array(id).max(5000).default([]),
  // AetherRoom's rollover window, kept between replies so the prefix holds until a trim.
  roll: z.object({ startIndex: z.number().int().nonnegative(), pathIdList: z.array(z.string()).max(40_000), trimmed: z.boolean() }).default({ startIndex: 0, pathIdList: [], trimmed: false }),
  // The General profile's window: the first message still sent.
  windowStart: z.number().int().nonnegative().default(0),
  draft: z.string().max(40_000).default(''),
  clock: clockSchema.default(DEFAULT_CLOCK),
  // Emotional modes (F-16): the character's recent emotions, or time away, set a mood.
  moods: z.boolean().default(false),
  diary: z.array(memorySchema).max(500).default([]),
  process: z.array(memorySchema).max(500).default([]),
  plans: z.array(planSchema).max(100).default([]),
  // What left the window, in chapters, oldest first.
  chapters: z.array(chapterSchema).max(2000).default([]),
  // Set members pinned for this chat, by "recordId:setId": an outfit, a location.
  pins: z.record(z.string().max(200), id).default({}),
  createdAt: z.number().nonnegative().default(0),
  updatedAt: z.number().nonnegative().default(0),
});
export type Chat = z.infer<typeof chatSchema>;

export function parseChat(raw: unknown): { ok: true; chat: Chat } | { ok: false; errors: string[] } {
  const parsed = chatSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.slice(0, 10).map((issue) => `${issue.path.join('.') || 'chat'}: ${issue.message}`) };
  const chat = parsed.data;
  return { ok: true, chat: { ...chat, messages: chat.messages.map((message) => ({ ...message, pick: Math.min(message.pick, message.alts.length - 1) })) } };
}

export interface NewChat {
  id: string; worldId: string; characterId: string; characterName: string; personaId: string | null; scenarioId: string | null;
  userName: string; relationship: Chat['relationship']; style: Style; responseLength: ResponseLength;
  greeting: { text: string; emotion: string } | null;
}

export function newChat(input: NewChat, ids: () => string, now: number): Chat {
  const chat: Chat = {
    format: CHAT_FORMAT, id: input.id, worldId: input.worldId, characterId: input.characterId, characterName: input.characterName,
    personaId: input.personaId, scenarioId: input.scenarioId, userName: input.userName.trim() || 'User',
    relationship: input.relationship, style: input.style, responseLength: input.responseLength,
    messages: [], journal: [], loreOff: [], roll: { startIndex: 0, pathIdList: [], trimmed: false }, windowStart: 0, draft: '',
    clock: { ...DEFAULT_CLOCK }, moods: false, diary: [], process: [], plans: [], chapters: [], pins: {}, createdAt: now, updatedAt: now,
  };
  const text = input.greeting?.text.trim();
  if (text) {
    const emotion = (EMOTIONS as readonly string[]).includes(input.greeting!.emotion) ? input.greeting!.emotion as ReplyPart['emotion'] : FALLBACK_EMOTION;
    chat.messages.push({ id: ids(), from: 'character', at: now, alts: [{ parts: [{ text, emotion }], at: now, model: '' }], pick: 0 });
  }
  return chat;
}

export const pickedAlt = (message: ChatMessage): Alt => message.alts[Math.min(message.pick, message.alts.length - 1)]!;
export const messageText = (message: ChatMessage): string => pickedAlt(message).parts.map((part) => part.text).join('\n');
export const lastEmotion = (chat: Chat): ReplyPart['emotion'] => {
  for (let index = chat.messages.length - 1; index >= 0; index -= 1) {
    const message = chat.messages[index]!;
    if (message.from === 'character') return pickedAlt(message).parts.at(-1)?.emotion ?? FALLBACK_EMOTION;
  }
  return FALLBACK_EMOTION;
};

const touch = (chat: Chat, now: number, messages: ChatMessage[]): Chat => ({ ...chat, messages, updatedAt: now });
const change = (chat: Chat, messageId: string, now: number, edit: (message: ChatMessage) => ChatMessage): Chat =>
  touch(chat, now, chat.messages.map((message) => (message.id === messageId ? edit(message) : message)));

export function addUserMessage(chat: Chat, text: string, messageId: string, now: number): Chat {
  return touch(chat, now, [...chat.messages, { id: messageId, from: 'user', at: now, alts: [{ parts: [{ text, emotion: FALLBACK_EMOTION }], at: now, model: '' }], pick: 0 }]);
}

// --- Notes: the house's square brackets, used as directives (docs/content/hog-wild/01-decisions.md,
// decision 4): [Chat: …], [Bid: …], [SYS: …], or any other line from outside the story. A note
// goes into the transcript without asking for a reply.

const BRACKETED = /^(?:\s*\[[^[\]]*\]\s*)+$/;
// Whether text is nothing but bracketed lines, so it reads as a note however it was entered.
export const isNoteText = (text: string): boolean => {
  const lines = text.split('\n').filter((line) => line.trim());
  return lines.length > 0 && lines.every((line) => BRACKETED.test(line));
};
// Text as a note: each line in its own square brackets, unless it already is.
export function noteText(text: string): string {
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
    .map((line) => (BRACKETED.test(line) ? line : `[${line.replace(/^\[+|\]+$/g, '').trim()}]`))
    .filter((line) => line !== '[]').join('\n');
}

export function addNote(chat: Chat, text: string, messageId: string, now: number): Chat {
  const clean = noteText(text);
  if (!clean) return chat;
  return touch(chat, now, [...chat.messages, { id: messageId, from: 'note', at: now, alts: [{ parts: [{ text: clean, emotion: FALLBACK_EMOTION }], at: now, model: '' }], pick: 0 }]);
}

export function addReply(chat: Chat, parts: ReplyPart[], messageId: string, now: number, model = ''): Chat {
  // In story time the reply is stamped with the clock, and the clock then takes its step.
  const story = storyActive(chat.clock);
  const next = touch(chat, now, [...chat.messages, { id: messageId, from: 'character', at: now, alts: [{ parts, at: now, model }], pick: 0, ...(story ? { clock: chat.clock.storyMs } : {}) }]);
  return story && chat.clock.stepMin > 0 ? { ...next, clock: { ...chat.clock, storyMs: chat.clock.storyMs + chat.clock.stepMin * 60_000 } } : next;
}

// Another reply for the same turn. The earlier ones are kept, and the new one is shown.
export function addAlternative(chat: Chat, messageId: string, parts: ReplyPart[], now: number, model = ''): Chat {
  return change(chat, messageId, now, (message) => ({ ...message, alts: [...message.alts, { parts, at: now, model }], pick: message.alts.length }));
}

export function replacePicked(chat: Chat, messageId: string, parts: ReplyPart[], now: number): Chat {
  return change(chat, messageId, now, (message) => ({ ...message, alts: message.alts.map((alt, index) => (index === Math.min(message.pick, message.alts.length - 1) ? { ...alt, parts } : alt)) }));
}

export type Ended = 'limit' | 'filter';

// How a provider's finish reason reads: cut at the limit, stopped by a filter, or finished.
export function endedFrom(finishReason: unknown): Ended | undefined {
  const reason = typeof finishReason === 'string' ? finishReason.toLowerCase() : '';
  if (reason === 'length' || reason === 'max_tokens') return 'limit';
  if (['content_filter', 'safety', 'prohibited_content', 'blocklist', 'spii', 'recitation', 'refusal'].includes(reason)) return 'filter';
  return undefined;
}

// Thinking tokens from a reply's usage, in the places providers report them.
export function thinkingTokens(usage: unknown): number | undefined {
  const top = usage && typeof usage === 'object' ? usage as Record<string, unknown> : {};
  const details = top.completion_tokens_details && typeof top.completion_tokens_details === 'object' ? top.completion_tokens_details as Record<string, unknown> : {};
  const value = [details.reasoning_tokens, top.reasoning_tokens, top.thoughts_token_count].find((entry) => typeof entry === 'number' && Number.isSafeInteger(entry) && entry > 0);
  return typeof value === 'number' ? value : undefined;
}

// Marks the shown reply of a message with how it ended; a reply that finished loses the mark.
export function markEnded(chat: Chat, messageId: string, ended: Ended | undefined, thinking: number | undefined): Chat {
  const index = chat.messages.findIndex((message) => message.id === messageId);
  if (index < 0) return chat;
  const message = chat.messages[index]!;
  const pick = Math.min(message.pick, message.alts.length - 1);
  const alts = message.alts.map((alt, at) => {
    if (at !== pick) return alt;
    const { ended: _ended, thinking: _thinking, ...rest } = alt;
    return { ...rest, ...(ended ? { ended } : {}), ...(ended && thinking ? { thinking } : {}) };
  });
  const messages = [...chat.messages];
  messages[index] = { ...message, alts };
  return { ...chat, messages };
}

export function stepAlternative(chat: Chat, messageId: string, by: number, now: number): Chat {
  return change(chat, messageId, now, (message) => ({ ...message, pick: Math.min(message.alts.length - 1, Math.max(0, message.pick + by)) }));
}

// The text an edit box holds for a message: the player's words as they are, a character's turn
// as the model wrote it, less its leading name.
export function editableText(message: ChatMessage, charName: string): string {
  const parts = pickedAlt(message).parts;
  if (message.from !== 'character') return parts.map((part) => part.text).join('\n');
  return parts.map((part, index) => `${index ? `${charName}: ` : ''}${part.text}\n  Emotion: ${part.emotion}`).join('\n');
}

export function editMessage(chat: Chat, messageId: string, text: string, charName: string, now: number): Chat {
  const message = chat.messages.find((entry) => entry.id === messageId);
  if (!message) return chat;
  if (message.from === 'user') return text.trim() ? replacePicked(chat, messageId, [{ text: text.trim(), emotion: FALLBACK_EMOTION }], now) : chat;
  if (message.from === 'note') return noteText(text) ? replacePicked(chat, messageId, [{ text: noteText(text), emotion: FALLBACK_EMOTION }], now) : chat;
  const parts = parseReply(`${charName}: ${text}`, charName);
  return parts.length ? replacePicked(chat, messageId, parts, now) : chat;
}

export function deleteMessage(chat: Chat, messageId: string, now: number): Chat {
  const at = chat.messages.findIndex((message) => message.id === messageId);
  if (at < 0) return chat;
  const gone = chat.messages[at]!;
  const next = { ...touch(chat, now, chat.messages.filter((message) => message.id !== messageId)), windowStart: Math.min(chat.windowStart, Math.max(0, chat.messages.length - 1)) };
  // Taking back the latest reply puts story time back to when it was written.
  const rewind = at === chat.messages.length - 1 && storyActive(chat.clock) && gone.clock !== undefined && gone.clock < chat.clock.storyMs;
  return rewind ? { ...next, clock: { ...chat.clock, storyMs: gone.clock! } } : next;
}

// Remember this: a fact for the character's journal about the player.
export function remember(chat: Chat, text: string, entryId: string, now: number): Chat {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 2000);
  if (!clean) return chat;
  return { ...chat, journal: [...chat.journal, { id: entryId, text: clean, at: now, active: true }], updatedAt: now };
}

export function setJournalEntry(chat: Chat, entryId: string, patch: Partial<Pick<JournalEntry, 'text' | 'active'>> | null, now: number): Chat {
  const journal = patch === null ? chat.journal.filter((entry) => entry.id !== entryId) : chat.journal.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry));
  return { ...chat, journal, updatedAt: now };
}

// The character's last few emotions, newest first, for emotional modes. Neutral when there are none.
export function recentEmotions(chat: Chat, count: number, upTo = chat.messages.length): string[] {
  const found: string[] = [];
  for (let index = Math.min(upTo, chat.messages.length) - 1; index >= 0 && found.length < count; index -= 1) {
    const message = chat.messages[index]!;
    if (message.from !== 'character') continue;
    const parts = pickedAlt(message).parts;
    for (let at = parts.length - 1; at >= 0 && found.length < count; at -= 1) found.push(parts[at]!.emotion);
  }
  return found.length ? found : [FALLBACK_EMOTION];
}

// When the character last wrote, on the chat's clock: story time if the chat keeps it, else real.
export function lastContactMs(chat: Chat, upTo = chat.messages.length): number | undefined {
  for (let index = Math.min(upTo, chat.messages.length) - 1; index >= 0; index -= 1) {
    const message = chat.messages[index]!;
    if (message.from === 'character') return storyActive(chat.clock) ? message.clock : message.at || undefined;
  }
  return undefined;
}

export type MemoryKind = 'diary' | 'process';
export function addMemory(chat: Chat, kind: MemoryKind, entry: Omit<Memory, 'at'>, now: number): Chat {
  return { ...chat, [kind]: [...chat[kind], { ...entry, at: now }], updatedAt: now };
}
export function setMemory(chat: Chat, kind: MemoryKind, entryId: string, patch: Partial<Pick<Memory, 'name' | 'content' | 'keys'>> | null, now: number): Chat {
  const list = patch === null ? chat[kind].filter((entry) => entry.id !== entryId) : chat[kind].map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry));
  return { ...chat, [kind]: list, updatedAt: now };
}
export function addPlan(chat: Chat, plan: Pick<Plan, 'id' | 'name' | 'content'> & Partial<Plan>, now: number): Chat {
  const turns = plan.totalTurns ?? PLAN_TURNS;
  return { ...chat, plans: [...chat.plans, { planType: 'AI', durationType: 'Limited', totalTurns: turns, remainingTurns: turns, running: false, startedAtCount: -1, ...plan }], updatedAt: now };
}
export function setPlan(chat: Chat, planId: string, patch: Partial<Plan> | null, now: number): Chat {
  const plans = patch === null ? chat.plans.filter((plan) => plan.id !== planId) : chat.plans.map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan));
  return { ...chat, plans, updatedAt: now };
}

// Who the player is in this chat: one of their personas, or just a name.
export function setPersona(chat: Chat, personaId: string | null, userName: string, now: number): Chat {
  return { ...chat, personaId, userName: userName.trim() || chat.userName, updatedAt: now };
}

export const lastLine = (chat: Chat): string => {
  const last = chat.messages.at(-1);
  return last ? messageText(last).replace(/\s+/g, ' ').slice(0, 140) : '';
};

// --- Files

export const chatExportSchema = z.object({ format: z.literal(CHAT_EXPORT_FORMAT), exportedAt: z.number().default(0), chat: z.unknown() });
export function exportChat(chat: Chat, now: number) { return { format: CHAT_EXPORT_FORMAT, exportedAt: now, chat }; }

export function readChatFile(raw: unknown): { ok: true; chat: Chat } | { ok: false; errors: string[] } {
  const top = raw && typeof raw === 'object' ? raw as { format?: unknown; chat?: unknown } : {};
  if (top.format === CHAT_EXPORT_FORMAT) return parseChat(top.chat);
  if (top.format === CHAT_FORMAT) return parseChat(raw);
  return { ok: false, errors: ['This is not a chat file from Inkwyrm.'] };
}
