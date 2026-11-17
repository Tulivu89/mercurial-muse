// The reply format CharacterRoom's characters write in, and the 24 emotions it carries:
//   Name: text
//     Emotion: word
// Both context profiles keep character turns in this shape, so one parser serves every model.

export const EMOTIONS = [
  'angry', 'aroused', 'bored', 'confused', 'determined', 'disgusted',
  'embarrassed', 'excited', 'happy', 'hurt', 'irritated', 'laughing',
  'love', 'nervous', 'neutral', 'playful', 'sad', 'scared', 'shy',
  'smug', 'surprised', 'thinking', 'tired', 'worried',
] as const;
export type Emotion = (typeof EMOTIONS)[number];
export const FALLBACK_EMOTION: Emotion = 'neutral';

export const isEmotion = (word: string): word is Emotion => (EMOTIONS as readonly string[]).includes(word);
export const emotionOf = (word: string | null | undefined): Emotion => {
  const clean = (word ?? '').trim().toLowerCase();
  return isEmotion(clean) ? clean : FALLBACK_EMOTION;
};

// Which portrait stands in for an empty slot (CR-PLAN §6.5), nearest first.
export const EMOTION_NEIGHBOURS: Record<Emotion, Emotion[]> = {
  angry: ['irritated', 'disgusted', 'determined'],
  aroused: ['love', 'playful', 'embarrassed'],
  bored: ['tired', 'neutral', 'thinking'],
  confused: ['thinking', 'surprised', 'nervous'],
  determined: ['angry', 'thinking', 'neutral'],
  disgusted: ['irritated', 'angry', 'bored'],
  embarrassed: ['shy', 'nervous', 'surprised'],
  excited: ['happy', 'playful', 'surprised'],
  happy: ['playful', 'excited', 'laughing'],
  hurt: ['sad', 'scared', 'nervous'],
  irritated: ['angry', 'disgusted', 'bored'],
  laughing: ['happy', 'playful', 'excited'],
  love: ['happy', 'shy', 'aroused'],
  nervous: ['worried', 'scared', 'shy'],
  neutral: ['thinking', 'bored'],
  playful: ['happy', 'smug', 'excited'],
  sad: ['hurt', 'worried', 'tired'],
  scared: ['nervous', 'worried', 'surprised'],
  shy: ['embarrassed', 'nervous', 'love'],
  smug: ['playful', 'determined', 'happy'],
  surprised: ['confused', 'excited', 'scared'],
  thinking: ['neutral', 'confused', 'bored'],
  tired: ['bored', 'sad', 'neutral'],
  worried: ['nervous', 'sad', 'scared'],
};

export const AVATAR_SLOT = 'avatar';

// The slot to show for an emotion when only some portraits exist: the emotion itself, its
// nearest filled neighbour, neutral, the avatar, and failing all of those nothing (initials).
export function resolvePortrait(want: string, filled: readonly string[]): string | null {
  const has = new Set(filled);
  const asked = emotionOf(want);
  if (has.has(asked)) return asked;
  for (const near of EMOTION_NEIGHBOURS[asked]) if (has.has(near)) return near;
  if (has.has(FALLBACK_EMOTION)) return FALLBACK_EMOTION;
  return has.has(AVATAR_SLOT) ? AVATAR_SLOT : null;
}

export interface ReplyPart { text: string; emotion: Emotion }

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Splits what the model wrote into parts, one per "Name: text / Emotion: word" block. Lines
// the model wrote for the user end the reply. A part with no emotion line is neutral.
export function parseReply(raw: string, charName: string, userName = ''): ReplyPart[] {
  const own = new RegExp(`^\\s*${escapeRegExp(charName)}\\s*:[ \\t]?`, 'i');
  const theirs = userName.trim() ? new RegExp(`^\\s*${escapeRegExp(userName)}\\s*:`, 'i') : null;
  const emotionLine = /^\s*Emotion\s*:\s*([A-Za-z]+)\W*$/i;
  const parts: ReplyPart[] = [];
  let lines: string[] = [];
  let open = false;
  const close = (emotion: Emotion) => {
    const text = lines.join('\n').replace(/\s+$/, '').replace(/^\n+/, '');
    if (text.trim()) parts.push({ text, emotion });
    lines = [];
    open = false;
  };
  for (const line of raw.replace(/\r\n?/g, '\n').split('\n')) {
    if (theirs?.test(line)) break;
    const emotion = emotionLine.exec(line);
    if (emotion) {
      if (open) close(emotionOf(emotion[1]));
      else if (parts.length) parts[parts.length - 1]!.emotion = emotionOf(emotion[1]);
      continue;
    }
    if (own.test(line)) {
      if (open) close(FALLBACK_EMOTION);
      lines.push(line.replace(own, ''));
      open = true;
      continue;
    }
    if (line.trim() === '***') continue;
    // A continuation line; CharacterRoom's format indents these by four spaces.
    lines.push(line.replace(/^ {4}/, ''));
    if (line.trim()) open = true;
  }
  if (open) close(FALLBACK_EMOTION);
  return parts;
}

// Two pieces of one reply put back together: a piece that carries on mid-sentence (lower case,
// or punctuation) joins with a space, one that starts afresh after a finished sentence gets a
// line of its own.
export function joinText(before: string, after: string): string {
  if (!before) return after;
  if (!after) return before;
  if (/\s$/.test(before) || /^\s/.test(after)) return before + after;
  if (/^[,.;:!?…]/.test(after)) return before + after;
  if (/^[\p{Ll}]/u.test(after)) return `${before} ${after}`;
  return /[.!?…*)"”]$/.test(before) ? `${before}\n${after}` : `${before} ${after}`;
}

// A reply as one piece, showing the last emotion. Models other than xialong write one turn at a
// time, and a reply sent back in pieces, each with its own emotion line, teaches them to stop
// midway.
export function mergeParts(parts: readonly ReplyPart[]): ReplyPart[] {
  if (parts.length < 2) return [...parts];
  return [{ text: parts.reduce((text, part) => joinText(text, part.text), ''), emotion: parts[parts.length - 1]!.emotion }];
}

// The parts written back out as the character's turn. AetherRoom indents continuation lines.
export function replyText(parts: readonly ReplyPart[], charName: string, indent: boolean): string {
  return parts.map((part) => `${charName}: ${indent ? part.text.replaceAll('\n', '\n    ') : part.text}\n  Emotion: ${part.emotion}`).join('\n');
}

// A turn still being written (Continue): its text so far, with no emotion line yet.
export function openReplyText(parts: readonly ReplyPart[], charName: string, indent: boolean): string {
  if (!parts.length) return '';
  const done = parts.slice(0, -1);
  const last = parts[parts.length - 1]!;
  return `${done.length ? `${replyText(done, charName, indent)}\n` : ''}${charName}: ${indent ? last.text.replaceAll('\n', '\n    ') : last.text}`;
}
