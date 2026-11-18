// Chapters (docs/reviews/memory/decision.md, C1). When the General window moves on, the messages
// that left it are written up once, by a side request after a reply, as a chapter: a few plain
// sentences in the past tense, with names, never rewritten by the model. Chapters go above the
// chat as "The story so far" and change only when the window moves, so the prefix holds.
//
// Pure: ids, times and the model's text come in.
import type { Message } from '../narration/formats.js';
import { mergeParts } from './emotions.js';
import { pickedAlt, type Chapter, type Chat, type ChatMessage } from './chat.js';

export type ChapterLength = 'short' | 'usual' | 'full';
export const CHAPTER_SENTENCES: Record<ChapterLength, string> = { short: '2 or 3 sentences', usual: '3 to 6 sentences', full: '6 to 10 sentences' };
export const CHAPTER_TOKENS: Record<ChapterLength, number> = { short: 220, usual: 400, full: 700 };
// At most this much chat goes into one chapter; a longer stretch is written as several.
export const CHAPTER_SPAN_MESSAGES = 40;
export const CHAPTER_SPAN_CHARS = 24_000;
// A chapter that fails is tried again after later replies, this many times in all.
export const CHAPTER_TRIES = 3;

const messageText = (message: ChatMessage) => mergeParts(pickedAlt(message).parts)[0]?.text ?? '';
const speaker = (chat: Chat, message: ChatMessage) => (message.from === 'character' ? chat.characterName : message.from === 'user' ? chat.userName : 'Note');

// What the covered messages said, as a short fingerprint.
export function sealOf(messages: readonly ChatMessage[]): string {
  let h = 2166136261;
  for (const message of messages) {
    const text = `${message.id}\u0000${messageText(message)}\u0001`;
    for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(36);
}

// The messages a chapter covers, or null when its first or last message is gone.
export function chapterMessages(chat: Chat, chapter: Chapter): ChatMessage[] | null {
  const from = chat.messages.findIndex((message) => message.id === chapter.fromId);
  const to = chat.messages.findIndex((message) => message.id === chapter.toId);
  if (from < 0 || to < from) return null;
  return chat.messages.slice(from, to + 1);
}

// Written, but its messages have changed (or gone) since.
export function isStale(chat: Chat, chapter: Chapter): boolean {
  if (chapter.state !== 'written') return false;
  const covered = chapterMessages(chat, chapter);
  return !covered || sealOf(covered) !== chapter.seal;
}

// Where the chapters stop: the index of the first message no chapter covers.
export function coveredUpTo(chat: Chat): number {
  const last = chat.chapters.at(-1);
  if (!last) return 0;
  const to = chat.messages.findIndex((message) => message.id === last.toId);
  return to < 0 ? 0 : to + 1;
}

// New pending chapters for messages that have left the window and no chapter covers yet, in
// spans small enough for one request.
export function queueChapters(chat: Chat, windowStart: number, ids: () => string, now: number): Chat {
  let start = coveredUpTo(chat);
  if (windowStart <= start) return chat;
  const added: Chapter[] = [];
  while (start < windowStart) {
    let end = start;
    let chars = 0;
    while (end < windowStart && end - start < CHAPTER_SPAN_MESSAGES && (end === start || chars + messageText(chat.messages[end]!).length <= CHAPTER_SPAN_CHARS)) {
      chars += messageText(chat.messages[end]!).length;
      end += 1;
    }
    added.push({ id: ids(), fromId: chat.messages[start]!.id, toId: chat.messages[end - 1]!.id, text: '', keys: [], pinned: false, state: 'pending', tries: 0, seal: '', at: now, folded: false });
    start = end;
  }
  return { ...chat, chapters: [...chat.chapters, ...added] };
}

// The chapters still to write: pending, or failed with tries left; oldest first.
export const chaptersToWrite = (chat: Chat) => chat.chapters.filter((chapter) => chapter.state === 'pending' || (chapter.state === 'failed' && chapter.tries < CHAPTER_TRIES));

// The request for one chapter. The chapter before it goes along as context only.
export function chapterRequest(chat: Chat, chapter: Chapter, length: ChapterLength): Message[] | null {
  const covered = chapterMessages(chat, chapter);
  if (!covered?.length) return null;
  const index = chat.chapters.findIndex((entry) => entry.id === chapter.id);
  const before = chat.chapters.slice(0, Math.max(0, index)).reverse().find((entry) => entry.state === 'written' && entry.text.trim());
  const transcript = covered.map((message) => `${speaker(chat, message)}: ${messageText(message)}`).join('\n\n');
  const char = chat.characterName;
  const user = chat.userName;
  return [
    {
      role: 'system',
      content: [
        `You are keeping the record of a story between ${char} and ${user}. You are writing a document, not the story: do not continue the roleplay and do not speak as anyone.`,
        `Write up the transcript you are given as one chapter: ${CHAPTER_SENTENCES[length]} of plain prose in the past tense. Name ${char} and ${user}. Say what happened, what changed between them, and anything either of them learned, promised or decided. Keep places, objects and times that matter. No quoted dialogue, no headings, no commentary.`,
        'After the chapter, write one last line that starts "Keys:" with up to six words or names from it that should bring it back to mind, separated by commas.',
      ].join('\n\n'),
    },
    {
      role: 'user',
      content: [
        before ? `[The chapter before, for context only. Do not write it up again.]\n${before.text.trim()}\n` : '',
        '=== Transcript ===',
        transcript,
        '=== End of transcript ===',
        '',
        'Write the chapter now, then the Keys line.',
      ].filter((line, at) => at > 0 || line).join('\n'),
    },
  ];
}

// The model's text as a chapter and its keys. Null when nothing usable came back.
export function readChapter(text: string, chat: Chat): { text: string; keys: string[] } | null {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*(chapter[^\n:]*:|summary:)\s*/i, '').trim();
  const keysLine = /\n?\s*Keys\s*:\s*([^\n]*)\s*$/i.exec(clean);
  const body = (keysLine ? clean.slice(0, keysLine.index) : clean).replace(/^=+.*$/gm, '').trim();
  if (body.length < 20) return null;
  const names = new Set([chat.characterName.toLowerCase(), chat.userName.toLowerCase()]);
  const keys = (keysLine?.[1] ?? '').split(',').map((key) => key.replace(/["“”.]/g, '').trim()).filter((key) => key && key.length <= 60 && !names.has(key.toLowerCase()));
  return { text: body.slice(0, 8000), keys: [...new Set(keys)].slice(0, 6) };
}

// A chapter written, or a try that failed.
export function chapterWritten(chat: Chat, chapterId: string, written: { text: string; keys: string[] } | null, now: number): Chat {
  return {
    ...chat,
    updatedAt: now,
    chapters: chat.chapters.map((chapter) => {
      if (chapter.id !== chapterId) return chapter;
      if (!written) return { ...chapter, state: 'failed', tries: chapter.tries + 1 };
      const covered = chapterMessages(chat, chapter) ?? [];
      return { ...chapter, ...written, state: 'written', tries: chapter.tries + 1, seal: sealOf(covered), at: now };
    }),
  };
}

// The player's changes: the text, a pin, a redo (back to pending), or removal.
export function changeChapter(chat: Chat, chapterId: string, patch: Partial<Pick<Chapter, 'text' | 'keys' | 'pinned'>> | 'redo' | null, now: number): Chat {
  const chapters = patch === null
    ? chat.chapters.filter((chapter) => chapter.id !== chapterId)
    : chat.chapters.map((chapter) => {
      if (chapter.id !== chapterId) return chapter;
      if (patch === 'redo') return { ...chapter, state: 'pending' as const, tries: 0 };
      // Edited by hand: it now says what the player says, so it is sealed again.
      const covered = chapterMessages(chat, chapter);
      return { ...chapter, ...patch, ...(patch.text !== undefined && covered ? { seal: sealOf(covered) } : {}) };
    });
  return { ...chat, chapters, updatedAt: now };
}

const tokensOf = (text: string) => Math.ceil(text.length / 3.5);

// The written chapters wholly before `windowStart` (the first message still sent), oldest first.
// A chapter whose messages are back in view is left out.
function outOfView(chat: Chat, windowStart: number): Chapter[] {
  return chat.chapters.filter((chapter) => {
    if (chapter.state !== 'written' || !chapter.text.trim()) return false;
    const to = chat.messages.findIndex((message) => message.id === chapter.toId);
    return to >= 0 && to < windowStart;
  });
}

// The story so far, for the prompt (C1 to C3), within `budget` tokens:
//   memory brought in from earlier chats, under "Before this chat";
//   the Earlier summary the oldest chapters were folded into;
//   folded chapters whose keys come up in `recentText`;
//   the rest of the chapters, pinned ones always, then the newest that fit.
// Everything goes out oldest first.
export function storySoFar(chat: Chat, windowStart: number, budget = Infinity, recentText = ''): string {
  const earlier = chat.earlier.filter((entry) => entry.text.trim());
  const chapters = outOfView(chat, windowStart);
  const fold = chat.fold.text.trim();
  if (!earlier.length && !chapters.length && !fold) return '';
  let left = budget - earlier.reduce((sum, entry) => sum + tokensOf(entry.text), 0) - tokensOf(fold);
  const sent = new Set<string>();
  const take = (chapter: Chapter) => { sent.add(chapter.id); left -= tokensOf(chapter.text); };
  for (const chapter of chapters) if (chapter.pinned) take(chapter);
  const said = recentText.toLowerCase();
  for (const chapter of chapters) {
    if (!chapter.folded || chapter.pinned || !chapter.keys.some((key) => said.includes(key.toLowerCase()))) continue;
    if (tokensOf(chapter.text) <= left) take(chapter);
  }
  for (const chapter of [...chapters].reverse()) {
    if (chapter.folded || sent.has(chapter.id)) continue;
    if (tokensOf(chapter.text) > left) break;
    take(chapter);
  }
  const numbered = chapters.map((chapter, index) => ({ chapter, number: index + 1 })).filter(({ chapter }) => sent.has(chapter.id));
  return [
    `## The story so far`,
    ...(earlier.length ? [`Before this chat, ${chat.characterName} and ${chat.userName} talked before:`, ...earlier.map((entry) => entry.text.trim())] : []),
    ...(fold || numbered.length ? [`Earlier in this chat, before the messages below:`] : []),
    ...(fold ? [fold] : []),
    ...numbered.map(({ chapter, number }) => `Chapter ${number}. ${chapter.text.trim()}`),
  ].join('\n\n');
}

// --- Folding (C3)

// The share of the context the story so far may take.
export const STORY_SHARE = 0.15;

// The chapters to fold now: when the unfolded, unpinned chapters out of view take more than
// two thirds of the budget, the oldest of them, leaving the newest third of the budget's worth.
export function foldDue(chat: Chat, windowStart: number, budget: number): Chapter[] {
  const open = outOfView(chat, windowStart).filter((chapter) => !chapter.folded && !chapter.pinned);
  const total = open.reduce((sum, chapter) => sum + tokensOf(chapter.text), 0);
  if (open.length < 2 || total <= budget * (2 / 3)) return [];
  let keep = 0;
  let from = open.length;
  while (from > 0 && keep + tokensOf(open[from - 1]!.text) <= budget / 3) { from -= 1; keep += tokensOf(open[from]!.text); }
  return open.slice(0, Math.max(1, Math.min(from, open.length - 1)));
}

// The request that folds chapters into the Earlier summary, with the summary so far.
export function foldRequest(chat: Chat, chapters: readonly Chapter[], length: ChapterLength): Message[] {
  const sentences = length === 'short' ? '3 to 5 sentences' : length === 'full' ? '8 to 14 sentences' : '5 to 9 sentences';
  return [
    {
      role: 'system',
      content: [
        `You are keeping the record of a story between ${chat.characterName} and ${chat.userName}. You are writing a document, not the story: do not continue the roleplay and do not speak as anyone.`,
        `Combine what you are given into one summary of the earlier story, ${sentences} of plain prose in the past tense. Keep what lasts: what happened between them, what changed, promises, secrets, names, places and things that matter. Drop passing detail. No quoted dialogue, no headings, no commentary.`,
      ].join('\n\n'),
    },
    {
      role: 'user',
      content: [
        ...(chat.fold.text.trim() ? ['=== The summary so far ===', chat.fold.text.trim(), ''] : []),
        '=== Chapters to fold in, oldest first ===',
        ...chapters.map((chapter) => chapter.text.trim()),
        '=== End ===',
        '',
        'Write the one combined summary now.',
      ].join('\n'),
    },
  ];
}
export const FOLD_TOKENS: Record<ChapterLength, number> = { short: 350, usual: 600, full: 1000 };

// The fold written: the summary replaced, those chapters marked folded.
export function chaptersFolded(chat: Chat, chapterIds: readonly string[], text: string, now: number): Chat {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*summary:\s*/i, '').trim();
  if (clean.length < 20) return chat;
  const ids = new Set(chapterIds);
  return { ...chat, fold: { text: clean.slice(0, 12_000), at: now }, chapters: chat.chapters.map((chapter) => (ids.has(chapter.id) ? { ...chapter, folded: true } : chapter)), updatedAt: now };
}

// --- Memory between chats (C2)

// The other chats with the same character, newest first, that have something to carry.
export function chatsToCarry(chat: Chat, chats: readonly Chat[]): Chat[] {
  return chats
    .filter((other) => other.id !== chat.id && other.worldId === chat.worldId && other.characterId === chat.characterId && other.messages.some((message) => message.from === 'user'))
    .filter((other) => !chat.earlier.some((entry) => entry.fromChatId === other.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

// How another chat ended, for a request: its messages after its last chapter, the last
// CHAPTER_SPAN_MESSAGES of them at most. Null when its chapters cover it all.
export function endingRequest(source: Chat, length: ChapterLength): Message[] | null {
  const from = Math.max(coveredUpTo(source), source.messages.length - CHAPTER_SPAN_MESSAGES);
  if (from >= source.messages.length) return null;
  const tail: Chapter = { id: 'ending', fromId: source.messages[from]!.id, toId: source.messages.at(-1)!.id, text: '', keys: [], pinned: false, state: 'pending', tries: 0, seal: '', at: 0, folded: false };
  return chapterRequest({ ...source, chapters: [...source.chapters, tail] }, tail, length);
}

// Brings another chat's memory into this one: its journal, diary and feelings where this chat
// doesn't have them yet, and its chapters with how it ended (`ending`, written up from
// endingRequest) as one "Before this chat" entry.
export function bringMemory(chat: Chat, source: Chat, ending: string, ids: () => string, now: number): Chat {
  const has = (list: readonly string[], text: string) => list.some((entry) => entry.trim() === text.trim());
  const journal = [...chat.journal, ...source.journal.filter((entry) => entry.text.trim() && !has(chat.journal.map((own) => own.text), entry.text)).map((entry) => ({ ...entry, id: ids() }))];
  const carry = (own: Chat['diary'], theirs: Chat['diary']) => [...own, ...theirs.filter((entry) => !has(own.map((mine) => mine.content), entry.content)).map((entry) => ({ ...entry, id: ids() }))];
  const chapters = source.chapters.filter((chapter) => chapter.state === 'written' && chapter.text.trim()).map((chapter) => chapter.text.trim());
  const text = [...source.earlier.map((entry) => entry.text.trim()), ...chapters, ending.trim()].filter(Boolean).join('\n\n');
  const when = new Date(source.createdAt || source.updatedAt).toISOString().slice(0, 10);
  const earlier = text ? [...chat.earlier, { id: ids(), fromChatId: source.id, title: `The chat from ${when}`, text: text.slice(0, 20_000), at: now }] : chat.earlier;
  return { ...chat, journal, diary: carry(chat.diary, source.diary), process: carry(chat.process, source.process), earlier, earlierAsked: true, updatedAt: now };
}
