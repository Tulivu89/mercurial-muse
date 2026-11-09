// A chat: one character and one player, as an instance (docs/records.md, Play data). It points
// at records in a world and never writes to them. What the character learns about the player
// (the journal, CharacterRoom's Jots) lives here, per pairing. Pure: ids and times come in.
import { z } from 'zod';
import { RELATIONSHIPS } from '../records/charactercard.js';
import { EMOTIONS, FALLBACK_EMOTION, parseReply, type ReplyPart } from './emotions.js';

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
const altSchema = z.object({ parts: z.array(partSchema).max(40), at: z.number().nonnegative().default(0), model: z.string().max(200).default('') });
export const messageSchema = z.object({
  id,
  from: z.enum(['user', 'character']),
  at: z.number().nonnegative().default(0),
  // Every reply written for this turn is kept; `pick` is the one in the story.
  alts: z.array(altSchema).min(1).max(200),
  pick: z.number().int().nonnegative().default(0),
});
export type ChatMessage = z.infer<typeof messageSchema>;
export type Alt = z.infer<typeof altSchema>;

export const journalEntrySchema = z.object({ id, text: z.string().max(2000), at: z.number().nonnegative().default(0), active: z.boolean().default(true) });
export type JournalEntry = z.infer<typeof journalEntrySchema>;

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
    messages: [], journal: [], loreOff: [], roll: { startIndex: 0, pathIdList: [], trimmed: false }, windowStart: 0, draft: '', createdAt: now, updatedAt: now,
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

export function addReply(chat: Chat, parts: ReplyPart[], messageId: string, now: number, model = ''): Chat {
  return touch(chat, now, [...chat.messages, { id: messageId, from: 'character', at: now, alts: [{ parts, at: now, model }], pick: 0 }]);
}

// Another reply for the same turn. The earlier ones are kept, and the new one is shown.
export function addAlternative(chat: Chat, messageId: string, parts: ReplyPart[], now: number, model = ''): Chat {
  return change(chat, messageId, now, (message) => ({ ...message, alts: [...message.alts, { parts, at: now, model }], pick: message.alts.length }));
}

export function replacePicked(chat: Chat, messageId: string, parts: ReplyPart[], now: number): Chat {
  return change(chat, messageId, now, (message) => ({ ...message, alts: message.alts.map((alt, index) => (index === Math.min(message.pick, message.alts.length - 1) ? { ...alt, parts } : alt)) }));
}

export function stepAlternative(chat: Chat, messageId: string, by: number, now: number): Chat {
  return change(chat, messageId, now, (message) => ({ ...message, pick: Math.min(message.alts.length - 1, Math.max(0, message.pick + by)) }));
}

// The text an edit box holds for a message: the player's words as they are, a character's turn
// as the model wrote it, less its leading name.
export function editableText(message: ChatMessage, charName: string): string {
  const parts = pickedAlt(message).parts;
  if (message.from === 'user') return parts.map((part) => part.text).join('\n');
  return parts.map((part, index) => `${index ? `${charName}: ` : ''}${part.text}\n  Emotion: ${part.emotion}`).join('\n');
}

export function editMessage(chat: Chat, messageId: string, text: string, charName: string, now: number): Chat {
  const message = chat.messages.find((entry) => entry.id === messageId);
  if (!message) return chat;
  if (message.from === 'user') return text.trim() ? replacePicked(chat, messageId, [{ text: text.trim(), emotion: FALLBACK_EMOTION }], now) : chat;
  const parts = parseReply(`${charName}: ${text}`, charName);
  return parts.length ? replacePicked(chat, messageId, parts, now) : chat;
}

export function deleteMessage(chat: Chat, messageId: string, now: number): Chat {
  const at = chat.messages.findIndex((message) => message.id === messageId);
  if (at < 0) return chat;
  return { ...touch(chat, now, chat.messages.filter((message) => message.id !== messageId)), windowStart: Math.min(chat.windowStart, Math.max(0, chat.messages.length - 1)) };
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
