// Posts: what a character puts on their feed (CharacterRoom's Posts, F-21; CR-PLAN D-62 to D-69).
// A post is about their own day or about a chat, stamped on the character's clock, with comments
// under it from other people in the house, from strangers the model names, and from the player.
// A post belongs to the character, like their day, not to one chat. Pure: ids, times and the
// dice come in. Nothing here is written without a press: the player asks for a post or a
// comment, and each is one generation.
import { z } from 'zod';
import type { Message } from '../narration/formats.js';
import type { StoryRecord } from '../records/schema.js';
import type { Profile, SideTask } from './build.js';
import { EMOTIONS, FALLBACK_EMOTION, emotionOf } from './emotions.js';
import { replaceMacros } from './macros.js';
import { formatDate, formatMinutes, levelReaches, minutesOfDay, readSchedule, weekdayOf } from './time.js';

export const POST_FORMAT = 'inkwyrm-post/1';
const id = z.string().min(1).max(80);
const emotion = z.enum(EMOTIONS).catch(FALLBACK_EMOTION).default(FALLBACK_EMOTION);

export const commentSchema = z.object({
  id,
  // The name on the comment: a resident's, the player's, or a screen name the model made up.
  name: z.string().max(60).default('someone'),
  // A character of the house who wrote it, so the comment can carry their face.
  characterId: id.nullable().default(null),
  // The player's own comment.
  mine: z.boolean().default(false),
  content: z.string().max(4000),
  emotion,
  at: z.number().nonnegative().default(0),
});
export type PostComment = z.infer<typeof commentSchema>;

export const POST_KINDS = ['day', 'chat'] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const postSchema = z.object({
  format: z.literal(POST_FORMAT),
  id,
  // Whose it is: "worldId:characterId", the same key as their life.
  key: z.string().min(3).max(200),
  worldId: id,
  characterId: id,
  // About their own day, away from the player; or about a chat.
  kind: z.enum(POST_KINDS).default('day'),
  // The chat a chat post was written from.
  chatId: id.nullable().default(null),
  title: z.string().max(200).default(''),
  content: z.string().max(8000),
  emotion,
  // When it was written, on the character's own clock; and on this device's, for ordering.
  at: z.number().nonnegative().default(0),
  madeAt: z.number().nonnegative().default(0),
  // What they would attach, in plain words. It is what an image is asked for with, once the
  // site makes images; until then a picture is uploaded against it.
  photo: z.string().max(400).default(''),
  // Kept on the profile: never dropped when the feed is trimmed.
  kept: z.boolean().default(false),
  comments: z.array(commentSchema).max(200).default([]),
});
export type Post = z.infer<typeof postSchema>;

export function parsePost(raw: unknown): Post | null {
  const read = postSchema.safeParse(raw);
  return read.success ? read.data : null;
}

// How many posts a character's feed holds before the oldest unkept ones go.
export const FEED_LIMIT = 60;
// The posts to remove so one character's feed is back under its limit, oldest first, never a kept one.
export function overflow(posts: readonly Post[], key: string, limit = FEED_LIMIT): Post[] {
  const own = posts.filter((post) => post.key === key).sort((a, b) => a.madeAt - b.madeAt);
  const loose = own.filter((post) => !post.kept);
  return own.length > limit ? loose.slice(0, own.length - limit) : [];
}

// The picture a post carries, kept beside the character's portraits.
export const postSlot = (postId: string) => `post:${postId}`;

// --- The time frame (CR-PLAN D-66, D-68). A post is told the time both ways, as a clock time and
// as how long ago, because given only "four hours ago" a model can't tell breakfast from a night
// shift, and given only two clock times it does the subtraction itself and gets it wrong.

const SINCE_MAX_DAYS = 14;
const SINCE_MAX = 6;
const DATE_AFTER_DAYS = 6;
const DAY_MS = 86_400_000;

// The largest two units: "2 days and 3 hours", "4 hours and 10 minutes", "moments".
export function elapsedText(fromMs: number, toMs: number): string {
  const total = Math.max(0, Math.floor((toMs - fromMs) / 60_000));
  const unit = (count: number, name: string) => `${count} ${name}${count === 1 ? '' : 's'}`;
  if (total < 1) return 'moments';
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  if (days > 0) return hours > 0 ? `${unit(days, 'day')} and ${unit(hours, 'hour')}` : unit(days, 'day');
  if (hours > 0) return minutes > 0 ? `${unit(hours, 'hour')} and ${unit(minutes, 'minute')}` : unit(hours, 'hour');
  return unit(minutes, 'minute');
}

const whenText = (ms: number, withDate: boolean) => `${weekdayOf(ms)} at ${formatMinutes(minutesOfDay(ms))}${withDate ? ` (${formatDate(ms)})` : ''}`;

// A schedule line is a sentence its author typed and usually ends in a stop. Joined into a list
// it loses that stop, and the list is closed once.
const clause = (text: string) => { const clean = text.trim(); return /(\.\.\.|…)$/.test(clean) ? clean : clean.replace(/[\s.,;:]+$/, ''); };
export function clauseList(items: readonly string[]): string {
  const out = items.map(clause).filter(Boolean);
  if (!out.length) return '';
  const joined = out.join('; ');
  return /[.!?…]$/.test(joined) ? joined : `${joined}.`;
}

// What the schedule says filled a gap: each event that overlapped it, once, in order, at most six,
// and none at all past a fortnight. Events the relationship doesn't reach are left out.
export function sinceThen(record: StoryRecord, relationship: string, fromMs: number, toMs: number, userName = ''): string[] {
  const out: string[] = [];
  const schedule = record.schedule;
  if (!schedule || !(toMs > fromMs) || (toMs - fromMs) / DAY_MS > SINCE_MAX_DAYS) return out;
  const seen = new Set<string>();
  const day = new Date(fromMs);
  day.setHours(0, 0, 0, 0);
  for (let guard = 0; guard <= SINCE_MAX_DAYS + 1 && out.length < SINCE_MAX; guard += 1) {
    const dayMs = day.getTime();
    if (dayMs > toMs) break;
    for (const event of [...(schedule.Daily ?? []), ...(schedule[weekdayOf(dayMs)] ?? [])]) {
      const text = event.text.trim();
      if (!text || seen.has(text) || !levelReaches(relationship, event.requiredIntimacy)) continue;
      const start = dayMs + event.startTime * 60_000;
      const end = dayMs + event.endTime * 60_000 + (event.endTime < event.startTime ? DAY_MS : 0);
      if (!(start < toMs && end > fromMs)) continue;
      seen.add(text);
      out.push(replaceMacros(text, record.name, userName, start));
      if (out.length >= SINCE_MAX) break;
    }
    day.setDate(day.getDate() + 1);
  }
  return out;
}

export interface PostMoment {
  kind: PostKind;
  // Now, on the character's clock.
  nowMs: number;
  relationship: string;
  userName: string;
  // When the character and the player last spoke, and when the character last posted. Zero
  // when never; a stamp from the future is treated as never.
  lastSpokeMs?: number;
  lastPostMs?: number;
}

// The lines of the frame: now; the anchor both ways; what the schedule put in the gap; what they
// are doing this minute. A day post measures from when the two last spoke, since it covers what
// they did apart; a chat post measures post to post. The frame says which anchor it used.
export function timeFrameLines(record: StoryRecord, moment: PostMoment): string[] {
  const now = moment.nowMs;
  const past = (ms: number | undefined) => (ms && ms > 0 && ms <= now ? ms : 0);
  const spoke = past(moment.lastSpokeMs);
  const posted = past(moment.lastPostMs);
  const anchor = moment.kind === 'day' && spoke ? { at: spoke, label: `You last spoke with ${moment.userName || 'them'} on` } : posted ? { at: posted, label: 'Your last post was' } : null;
  const lines = [`It is ${whenText(now, false)}.`];
  if (anchor) {
    lines.push(`${anchor.label} ${whenText(anchor.at, (now - anchor.at) / DAY_MS > DATE_AFTER_DAYS)} — ${elapsedText(anchor.at, now)} ago.`);
    if (moment.kind === 'day' && posted && posted !== anchor.at) lines.push(`You last posted ${elapsedText(posted, now)} ago.`);
    const since = clauseList(sinceThen(record, moment.relationship, anchor.at, now, moment.userName));
    if (since) lines.push(`Since then: ${since}`);
  } else {
    lines.push('This is your first post.');
  }
  const live = clauseList(readSchedule(record.schedule, moment.relationship, now).live.map((event) => replaceMacros(event.text, record.name, moment.userName, now)));
  if (live) lines.push(`Right now you are: ${live}`);
  return lines;
}
export const timeFrame = (record: StoryRecord, moment: PostMoment) => `----\nTime\n${timeFrameLines(record, moment).join('\n')}`;

// --- Writing a post. The shape, the style and the primer are CharacterRoom's own, as xialong
// has been run with them; other models are asked for the same layout in a sentence.

export const POST_NAMES: Record<PostKind, { button: string; what: string }> = {
  day: { button: 'About their day', what: 'a post about their own day, away from you' },
  chat: { button: 'About your chat', what: 'a post about the chat you have been having' },
};

export function postTask(kind: PostKind, charName: string, frame: string): SideTask {
  const pad = ' '.repeat(18);
  return {
    kind: 'post',
    shape: `The author of the forum thread is ${charName}. The format is as follows.\n${pad}Thread: Thread Name\n${pad}====\n${pad}Author Name\n${pad}Body of post.\n${pad}  Emotion:`,
    frame: kind === 'day'
      ? [frame, 'This post is about your own life away from the conversation — where you have been since you last posted, what you have been doing, what is on your mind. It is NOT about the conversation you have been having, and it does not address anyone in it.']
      : [frame],
    style: kind === 'day' ? '[ Style: forum thread, posting about your own day ]' : '[ Style: forum thread, discussing recent chat ]',
    lead: 'Thread:',
    layout: 'Start with "Thread:" and a short title, then a line of ====, then the post itself in your own words, then "Emotion:" and one word for how you feel. Write only the post: no replies under it.',
    maxTokens: 250,
  };
}

const emotionLine = /^[ \t]*Emotion:[ \t]*(\w+)/i;
// Takes the last Emotion line out of a body and returns it.
function takeEmotion(lines: string[]): string {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const found = emotionLine.exec(lines[index]!);
    if (found) { lines.splice(index, 1); return found[1]!; }
  }
  return '';
}

export interface PostDraft { title: string; content: string; emotion: Post['emotion'] }

// What came back, read as a thread: the title after "Thread:", the body after the ==== line (less
// the author's name, when the model wrote it on a line of its own), and the emotion.
export function readPost(text: string, lead: string, charName: string): PostDraft | null {
  const whole = /Thread\s*:/i.test(text) ? text : `${lead} ${text}`;
  const lines = whole.replace(/\r\n?/g, '\n').split('\n');
  const title = (/Thread\s*:[ \t]*([^\n]*)/i.exec(whole)?.[1] ?? '').trim().replace(/^["“]|["”]$/g, '');
  const rule = lines.findIndex((line) => /^\s*={3,}\s*$/.test(line));
  let body = rule >= 0 ? lines.slice(rule + 1) : lines.slice(1);
  while (body.length && !body[0]!.trim()) body = body.slice(1);
  const first = body[0]?.trim() ?? '';
  // The author line: their name, or one bare word.
  if (first && (first.replace(/:$/, '').toLowerCase() === charName.toLowerCase() || !first.includes(' '))) body = body.slice(1);
  else if (first.toLowerCase().startsWith(`${charName.toLowerCase()}:`)) body[0] = first.slice(charName.length + 1).trim();
  const feeling = takeEmotion(body);
  const content = body.map((line) => line.replace(/^ {4}/, '')).join('\n').trim();
  if (!content) return null;
  return { title: (title || 'Untitled').slice(0, 200), content: content.slice(0, 8000), emotion: emotionOf(feeling) };
}

// --- Comments (CR-PLAN D-69). One press, one comment, each its own small generation, so four
// comments are four voices and the next one can see the last. Who is talking is decided here, by
// the dice, never by the model.

export interface Commenter { record?: StoryRecord; asAuthor: boolean }

// Sometimes someone else from the house; rarely the author, once there is something to answer;
// otherwise a stranger the model names.
export function pickCommenter(post: Post, author: StoryRecord, others: readonly StoryRecord[], rngInt: (min: number, max: number) => number): Commenter {
  if (others.length > 0 && rngInt(1, 3) === 1) return { record: others[rngInt(0, others.length - 1)], asAuthor: false };
  if (post.comments.length > 2 && rngInt(1, 4) === 1) return { record: author, asAuthor: true };
  return { asAuthor: false };
}

// The thread as a commenter reads it: the post, and the last six comments under it.
export function threadText(post: Post, authorName: string): string {
  const lines = [`Thread: ${post.title || 'Untitled'}`, `${authorName}: ${post.content.slice(0, 1600)}`];
  for (const comment of post.comments.slice(-6)) lines.push(`${comment.name || 'someone'}: ${comment.content.slice(0, 600)}`);
  return lines.join('\n');
}

const field = (name: string, value: string) => { const lines = value.trim().split('\n'); return `${name}: ${lines[0]}\n${lines.slice(1).map((line) => `    ${line}\n`).join('')}`; };
const sectionText = (record: StoryRecord, pattern: RegExp) => record.sections.filter((section) => pattern.test(section.title.trim()) && (section.reach === 'here' || section.reach === 'always') && section.text.trim()).map((section) => section.text.trim()).join('\n');

// A character as a forum commenter knows themselves: CharacterRoom's short sheet, with their
// example chats as quotes.
export function forumSheet(record: StoryRecord): string {
  let sheet = `${record.name}\nType: contact\n`;
  if (record.gender.trim()) sheet += field('Gender', record.gender);
  if (record.pronouns.trim()) sheet += field('Pronouns', record.pronouns);
  const personality = sectionText(record, /^(personality|who you are)$/i);
  const appearance = sectionText(record, /^appearance$/i);
  if (personality) sheet += field('Personality', personality);
  if (appearance) sheet += field('Appearance', appearance);
  if (record.tags.length) sheet += `Categories: ${record.tags.join(', ')}\n`;
  const examples = record.examples.filter((example) => example.messages.length);
  if (examples.length) {
    sheet += 'Example quotes:\n';
    examples.forEach((example, index) => {
      sheet += `${index + 1}.\n`;
      for (const message of example.messages) {
        const lines = message.text.split('\n');
        sheet += ` ${message.fromCharacter ? record.name : example.userName}: ${lines[0]}\n${lines.slice(1).map((line) => `     ${line}\n`).join('')}`;
        if (message.fromCharacter && message.emotion) sheet += `   Emotion: ${message.emotion}\n`;
      }
    });
  }
  return sheet;
}

export interface SmallRequest { messages: Message[]; prefill: string; lead: string; maxTokens: number; temperature: number }

export const COMMENT_TOKENS = 220;
export const PHOTO_TOKENS = 80;

// The request for one comment. For xialong, CharacterRoom's own messages; for other models the
// same content as one instruction, with the commenter's name started for them when it is known.
export function buildComment(post: Post, author: StoryRecord, who: Commenter, profile: Profile, canPrefill: boolean, nowMs: number): SmallRequest {
  const thread = `A forum thread.\n${threadText(post, author.name)}`;
  const known = who.record?.name ?? '';
  const role = who.record
    ? who.asAuthor
      ? `You are ${known}, the author of this thread, replying to the comments under it.`
      : `You are ${known}. You are replying to someone else's post on a forum you both use.`
    : 'You are another user of this forum, replying to the post. You do not know the author personally. Invent a screen name for yourself and put it on the first line by itself.';
  const sheet = who.record ? replaceMacros(forumSheet(who.record), known, author.name, nowMs) : '';
  if (profile === 'aetherroom') {
    const pad = ' '.repeat(18);
    const messages: Message[] = [{ role: 'system', content: thread }];
    if (sheet) messages.push({ role: 'system', content: sheet });
    messages.push({ role: 'system', content: role });
    messages.push({ role: 'system', content: `Write ONE comment. The format is as follows.\n${pad}ScreenName\n${pad}Body of the comment.\n${pad}Emotion: word` });
    messages.push({ role: 'system', content: '[ Style: forum comment, one reply ]' });
    if (known) messages.push({ role: 'assistant', content: known });
    return { messages, prefill: '', lead: known, maxTokens: COMMENT_TOKENS, temperature: 1 };
  }
  const system = [
    'You write one comment under a post on a forum, as the person described. Write only the comment, in the shape asked for, and nothing after it. No quotation marks around it.',
    sheet && `## Who you are\n${sheet.trim()}`,
  ].filter(Boolean).join('\n\n');
  const ask = `${thread}\n\n[${role} Write ONE comment, short, the way people write under a post. The shape:\n${known || 'ScreenName'}\nThe comment.\nEmotion: one word from: ${EMOTIONS.join(', ')}]`;
  return { messages: [{ role: 'system', content: system }, { role: 'user', content: ask }], prefill: known && canPrefill ? `${known}\n` : '', lead: known, maxTokens: COMMENT_TOKENS * 2, temperature: 1 };
}

// What came back, read as a comment: a screen name on the first line unless the commenter is
// known, the body, and the emotion. A known name the model repeats is not left in the body.
export function readComment(text: string, knownName: string): { name: string; content: string; emotion: Post['emotion'] } | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines[0]!.trim()) lines.shift();
  let name = knownName.trim();
  if (name && lines[0]?.trim().replace(/:$/, '').toLowerCase() === name.toLowerCase()) lines.shift();
  if (!name) name = (lines.shift() ?? '').trim().replace(/^[@*_]+|[*_:]+$/g, '').slice(0, 60);
  const feeling = takeEmotion(lines);
  let content = lines.join('\n').trim();
  if (name && content.toLowerCase().startsWith(`${name.toLowerCase()}:`)) content = content.slice(name.length + 1).trim();
  if (!content) return null;
  return { name: name || 'someone', content: content.slice(0, 4000), emotion: emotionOf(feeling) };
}

// --- A post's photo (CR-PLAN D-67). The character is asked, in their own voice, what they would
// attach; the answer is one plain line, kept on the post. It is the description an image is made
// from: plain words, never tags, and not their own face or body, which the image side knows.

export function buildPhotoAsk(post: Post, charName: string, profile: Profile, canPrefill: boolean): SmallRequest {
  const about = `${charName} has just written this post.\nTitle: ${post.title || 'Untitled'}\n${post.content}`;
  const ask = `Answer with ONE line describing the photo ${charName} would attach to it, in plain words, as they would describe it to a friend. No tags, no keywords, no lists. Do not describe your own face or body. Say what is in the picture and where it was taken. Say first whether you are in it.`;
  if (profile === 'aetherroom') {
    return {
      messages: [{ role: 'system', content: about }, { role: 'system', content: ask }, { role: 'system', content: '[ Style: one line, plain description ]' }, { role: 'assistant', content: 'Photo:' }],
      prefill: '', lead: 'Photo:', maxTokens: PHOTO_TOKENS, temperature: 0.9,
    };
  }
  return {
    messages: [{ role: 'system', content: `You answer as ${charName}, in one plain line and nothing else.` }, { role: 'user', content: `${about}\n\n[${ask}]` }],
    prefill: canPrefill ? 'Photo:' : '', lead: 'Photo:', maxTokens: PHOTO_TOKENS * 3, temperature: 0.9,
  };
}

// The first line with anything on it, less a "Photo:" the model wrote again.
export function readPhotoLine(text: string): string {
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/^[ \t\-*]+/, '').replace(/^Photo\s*:\s*/i, '').trim();
    if (line) return line.slice(0, 400);
  }
  return '';
}
