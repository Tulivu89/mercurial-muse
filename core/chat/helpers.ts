// Helpers: small calls before or after a reply, for something the site does with it. The first is
// the emotion: models other than xialong write no emotion line, so where something shows one (a
// character's emotion portraits, or moods), a one-word call picks it after the reply is written.
// Others can join (docs/reviews/prompt-setup/decision.md).
import type { Message } from '../narration/formats.js';
import { pickedAlt, type Chat } from './chat.js';
import { EMOTIONS, FALLBACK_EMOTION, type Emotion } from './emotions.js';

// Whether a chat needs its replies' emotions: a portrait for some emotion other than neutral, or
// moods kept from them.
export function wantsEmotions(portraitSlots: readonly string[], moods: boolean): boolean {
  return moods || portraitSlots.some((slot) => slot !== FALLBACK_EMOTION && (EMOTIONS as readonly string[]).includes(slot));
}

// The request: the reply, and one word back from the list. The last few picks are named so the
// model reaches past them when another fits as well.
export function emotionPick(reply: string, charName: string, recent: readonly string[]): Message[] {
  const avoid = [...new Set(recent.filter((emotion) => emotion !== FALLBACK_EMOTION))].slice(-3);
  return [
    {
      role: 'system',
      content: `Which emotion does ${charName} show at the end of this reply? Answer with one word from this list and nothing else: ${EMOTIONS.join(', ')}.${avoid.length ? ` ${charName} has just shown ${avoid.join(', ')}; pick another if it fits as well.` : ''}`,
    },
    { role: 'user', content: reply.slice(-3000) },
  ];
}
export const EMOTION_PICK_TOKENS = 16;

// The word that came back, if it is one of the list: an exact word first, then one inside it.
export function readEmotionPick(text: string): Emotion | null {
  const clean = text.toLowerCase().replace(/<think>[\s\S]*?<\/think>/g, '');
  const words = clean.match(/[a-z]+/g) ?? [];
  const exact = words.find((word) => (EMOTIONS as readonly string[]).includes(word));
  if (exact) return exact as Emotion;
  return (EMOTIONS.find((emotion) => clean.includes(emotion)) as Emotion | undefined) ?? null;
}

// Sets the emotion of the shown reply's last piece.
export function setReplyEmotion(chat: Chat, messageId: string, emotion: Emotion): Chat {
  const index = chat.messages.findIndex((message) => message.id === messageId);
  if (index < 0) return chat;
  const message = chat.messages[index]!;
  const pick = Math.min(message.pick, message.alts.length - 1);
  const alt = pickedAlt(message);
  if (!alt.parts.length) return chat;
  const parts = alt.parts.map((part, at) => (at === alt.parts.length - 1 ? { ...part, emotion } : part));
  const messages = [...chat.messages];
  messages[index] = { ...message, alts: message.alts.map((entry, at) => (at === pick ? { ...entry, parts } : entry)) };
  return { ...chat, messages };
}

// A reply cut off mid-sentence, back to its last sentence end. A reply with no sentence end is
// kept as it is.
export function trimToSentence(text: string): string {
  const match = /^[\s\S]*[.!?…*)"”~\]]/.exec(text);
  return match ? match[0] : text;
}
