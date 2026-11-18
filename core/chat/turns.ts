// Small things every roleplay app has (docs/reviews/features/decision.md, F1): branching a chat
// from a message, the model drafting the player's next message, and a reply as plain words for
// reading aloud. Pure: ids and times come in.
import type { Message } from '../narration/formats.js';
import { mergeParts } from './emotions.js';
import { pickedAlt, type Chat } from './chat.js';

// A new chat that is this one up to and including `messageId`: every alternative kept, memory
// as it stands, chapters only where all their messages came along. It remembers where it came from.
export function branchChat(chat: Chat, messageId: string, newChatId: string, now: number): Chat | null {
  const at = chat.messages.findIndex((message) => message.id === messageId);
  if (at < 0) return null;
  const messages = chat.messages.slice(0, at + 1);
  const kept = new Set(messages.map((message) => message.id));
  const chapters = chat.chapters.filter((chapter) => kept.has(chapter.fromId) && kept.has(chapter.toId));
  return {
    ...chat,
    id: newChatId,
    messages,
    chapters,
    windowStart: Math.min(chat.windowStart, messages.length),
    roll: { startIndex: 0, pathIdList: [], trimmed: false },
    draft: '',
    branchOf: { chatId: chat.id, messageId },
    createdAt: now,
    updatedAt: now,
  };
}

// Write my turn: the reply's request, turned to drafting the player's next message instead. The
// last note gains one line; the model is started on the player's name.
export function myTurnRequest(messages: readonly Message[], charName: string, userName: string): { messages: Message[]; lead: string; stop: string[] } {
  const out = messages.map((message) => ({ ...message }));
  const ask = `[This time, write ${userName}'s next message instead of ${charName}'s: what ${userName} says and does next, in ${userName}'s own voice and the chat's format, a few lines at most. Write nothing for ${charName}.]`;
  const last = out.at(-1);
  if (last?.role === 'user') last.content += `\n\n${ask}`;
  else out.push({ role: 'user', content: ask });
  return { messages: out, lead: `${userName}:`, stop: [`\n${charName}:`] };
}

// The drafted message, without the name it was started on or anything past the player's turn.
export function readMyTurn(text: string, charName: string, userName: string): string {
  const escape = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let body = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(new RegExp(`^\\s*${escape(userName)}\\s*:\\s*`, 'i'), '');
  const theirs = new RegExp(`\\n\\s*${escape(charName)}\\s*:`, 'i').exec(body);
  if (theirs) body = body.slice(0, theirs.index);
  return body.replace(/\n\s*Emotion\s*:.*$/im, '').trim();
}

// A message as words to say: narration and thoughts kept as plain words, notes and markup dropped.
export function speakableText(chat: Chat, messageId: string): string {
  const message = chat.messages.find((entry) => entry.id === messageId);
  if (!message || message.from === 'note') return '';
  const text = mergeParts(pickedAlt(message).parts)[0]?.text ?? '';
  return text
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[*_~`#>]/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
