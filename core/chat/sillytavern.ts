// Chats in and out as SillyTavern's chat files (docs/reviews/standards/decision.md, X4): JSON
// Lines, a header line then one line a message, which Agnai and RisuAI read as well. Out also as
// plain text, a paragraph a message.
//
// A message carries every alternative reply as `swipes`, with `swipe_id` the one shown. A note
// goes out as the player's turn in its brackets, and SillyTavern's hidden (`is_system`) lines come
// in as notes.
import { mergeParts } from './emotions.js';
import { FALLBACK_EMOTION, type Emotion } from './emotions.js';
import { pickedAlt, type Chat, type ChatMessage } from './chat.js';

const altText = (parts: ChatMessage['alts'][number]['parts']) => mergeParts(parts)[0]?.text ?? '';
const speaker = (chat: Chat, message: ChatMessage) => (message.from === 'character' ? chat.characterName : chat.userName);

export function chatToSillyTavern(chat: Chat): string {
  const header = { user_name: chat.userName, character_name: chat.characterName, create_date: new Date(chat.createdAt).toISOString(), chat_metadata: {} };
  const lines = chat.messages.map((message) => {
    const pick = Math.min(message.pick, message.alts.length - 1);
    const swipes = message.alts.map((alt) => altText(alt.parts));
    return {
      name: speaker(chat, message),
      is_user: message.from !== 'character',
      is_system: false,
      send_date: new Date(message.at).toISOString(),
      mes: swipes[pick] ?? '',
      ...(message.from === 'character' ? { swipes, swipe_id: pick } : {}),
      extra: {},
    };
  });
  return [header, ...lines].map((line) => JSON.stringify(line)).join('\n') + '\n';
}

export function chatToText(chat: Chat): string {
  return chat.messages.map((message) => `${message.from === 'note' ? 'Note' : speaker(chat, message)}: ${altText(pickedAlt(message).parts)}`).join('\n\n') + '\n';
}

export interface ReadTurn { from: ChatMessage['from']; texts: string[]; pick: number; at: number }
export type ReadSillyTavern = { ok: true; characterName: string; userName: string; turns: ReadTurn[] } | { ok: false; error: string };

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const asText = (value: unknown) => (typeof value === 'string' ? value : isObject(value) && typeof value.message === 'string' ? value.message : '');

// A SillyTavern chat file. The names come from the header where it still has them (older files),
// else from the messages.
export function readSillyTavernChat(text: string): ReadSillyTavern {
  const rows: Record<string, unknown>[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const row = JSON.parse(line); if (isObject(row)) rows.push(row); } catch { return { ok: false, error: 'This is not a SillyTavern chat file: a line is not JSON.' }; }
  }
  const head = rows[0] && ('chat_metadata' in rows[0] || 'user_name' in rows[0]) && !('mes' in rows[0]) ? rows.shift()! : {};
  const turns: ReadTurn[] = [];
  let characterName = typeof head.character_name === 'string' && head.character_name !== 'unused' ? head.character_name : '';
  let userName = typeof head.user_name === 'string' && head.user_name !== 'unused' ? head.user_name : '';
  for (const row of rows) {
    if (typeof row.mes !== 'string' && !Array.isArray(row.swipes)) continue;
    const swipes = Array.isArray(row.swipes) ? row.swipes.map(asText).filter((entry) => entry.trim()) : [];
    const shown = typeof row.mes === 'string' ? row.mes : '';
    const texts = swipes.length ? swipes : [shown];
    const pick = swipes.length ? Math.max(0, Math.min(typeof row.swipe_id === 'number' ? row.swipe_id : swipes.indexOf(shown), texts.length - 1)) : 0;
    if (!texts[pick]?.trim()) continue;
    const name = typeof row.name === 'string' ? row.name : '';
    const from: ChatMessage['from'] = row.is_system === true ? 'note' : row.is_user === true ? 'user' : 'character';
    if (from === 'character' && !characterName && name) characterName = name;
    if (from === 'user' && !userName && name) userName = name;
    const date = typeof row.send_date === 'number' ? row.send_date : Date.parse(String(row.send_date ?? ''));
    turns.push({ from, texts: texts.map((entry) => (from === 'note' && !/^\s*\[/.test(entry) ? `[${entry.trim()}]` : entry.trim())), pick, at: Number.isFinite(date) ? date : 0 });
  }
  if (!turns.length) return { ok: false, error: 'This SillyTavern chat file has no messages.' };
  return { ok: true, characterName, userName, turns };
}

// The read turns as a chat's messages, under a chat already made for the character.
export function withSillyTavernTurns(chat: Chat, turns: readonly ReadTurn[], ids: () => string, now: number): Chat {
  const emotion: Emotion = FALLBACK_EMOTION;
  const messages: ChatMessage[] = turns.map((turn, index) => {
    const at = turn.at || now - (turns.length - index) * 60_000;
    return { id: ids(), from: turn.from, at, alts: turn.texts.map((text) => ({ parts: [{ text, emotion }], at, model: '' })), pick: turn.pick };
  });
  return { ...chat, messages, updatedAt: now };
}
