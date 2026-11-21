// Group chat, G1 (docs/model-jobs.md, Group chat; docs/reviews/group-chat/decision.md): several
// characters in one chat with the player. This is the core: who is in it, who answers, the two
// layouts the lab compares, and the clean-up that keeps a reply to its own speaker.
//
// - A group is a chat whose `cast` holds two to four characters, the chat's character first. A
//   reply says who wrote it (`speaker`). A one-to-one chat has no cast and builds as it always has.
// - Layout B is a call per speaker: their own rules, sheet and examples first, the others present
//   by their line, then the transcript with every reply under its writer's name. Xialong always
//   takes B, through CharacterRoom's kernel, with the others' lines as named player turns.
// - Layout C is one shared prefix (rules, persona, scenario, everyone present by line, the journal,
//   the transcript) and the speaker's block at the very end, so the prefix before it is the same
//   whoever speaks and a provider's cache keeps it.
// - Private things go only with their owner: a diary, a feeling, a plan and the example chats are
//   sent only while their owner speaks. The code puts them in; the model is never asked to hide
//   them.
// - The code picks who answers: the one the player names, the author of the message the player
//   answers, then the agent's pick (a small side call) or the quietest, weighed by how talkative
//   each member is. A muted member speaks only when named.
// - Stops end a reply where someone else's line starts, and the parser makes sure of it where a
//   provider ignores stops.
import type { Message } from '../narration/formats.js';
import { contextFor, type ContextBlock } from '../records/context.js';
import { recordById } from '../records/world.js';
import type { StoryRecord, World } from '../records/schema.js';
import { DEFAULT_GROUP, MAX_CAST, newChat, pickedAlt, type CastMember, type Chat, type ChatMessage, type GroupSettings, type NewChat, type Talk } from './chat.js';
import { buildAetherRoom, buildGeneralProfile, chatNow, generalMoment, profileFor, type BuildOptions, type Built, type BuiltPart } from './build.js';
import { budgetFor, estimateTokens, lengthWords, turnText, windowStartFor } from './general.js';
import { EMOTIONS, FALLBACK_EMOTION, mergeParts, openReplyText, type ReplyPart } from './emotions.js';
import { DEFAULT_PROMPT, rulesText, type PromptSetup } from './prompt.js';
import { recentText, sceneFor, type Scene } from './scene.js';
import { STORY_SHARE, storySoFar } from './chapters.js';
import { replaceMacros } from './macros.js';
import { CARD_POST_TITLE } from '../records/tavern.js';

const emotionOf = (emotion: string): ReplyPart['emotion'] => ((EMOTIONS as readonly string[]).includes(emotion) ? emotion as ReplyPart['emotion'] : FALLBACK_EMOTION);

export interface Member { id: string; name: string; record: StoryRecord; talk: Talk; muted: boolean; model: string }

export const isGroup = (chat: Pick<Chat, 'cast'>): boolean => chat.cast.length > 1;
// Who wrote a reply: its speaker, or in a one-to-one chat the chat's character.
export const speakerOf = (chat: Pick<Chat, 'characterId'>, message: Pick<ChatMessage, 'speaker'>): string => message.speaker ?? chat.characterId;

// The members as records, in the cast's order. A member whose record is gone is left out.
export function membersOf(chat: Chat, world: World): Member[] {
  const cast: CastMember[] = chat.cast.length ? chat.cast : [{ characterId: chat.characterId, talk: 'usual', muted: false, model: '' }];
  return cast.flatMap((entry) => {
    const record = recordById(world, entry.characterId);
    return record && record.kind === 'character' ? [{ id: record.id, name: record.name, record, talk: entry.talk, muted: entry.muted, model: entry.model }] : [];
  });
}

// The name a reply is written under: its speaker's, or the chat's character's.
export function namer(chat: Chat, members: readonly Member[]): (message: ChatMessage) => string {
  const names = new Map(members.map((member) => [member.id, member.name]));
  return (message) => names.get(speakerOf(chat, message)) ?? chat.characterName;
}

// --- Making and changing a group.

// The chat with these characters in it, the chat's character first, at most four. Members who
// stay keep how talkative they are, their mute and their model.
export function withCast(chat: Chat, characterIds: readonly string[], now: number): Chat {
  const ids = [...new Set([chat.characterId, ...characterIds])].slice(0, MAX_CAST);
  const kept = new Map(chat.cast.map((entry) => [entry.characterId, entry]));
  const cast = ids.length > 1 ? ids.map((id) => kept.get(id) ?? { characterId: id, talk: 'usual' as const, muted: false, model: '' }) : [];
  return { ...chat, cast, updatedAt: now };
}

export function setMember(chat: Chat, characterId: string, patch: Partial<Omit<CastMember, 'characterId'>>, now: number): Chat {
  return { ...chat, cast: chat.cast.map((entry) => (entry.characterId === characterId ? { ...entry, ...patch } : entry)), updatedAt: now };
}

export function setGroup(chat: Chat, patch: Partial<GroupSettings>, now: number): Chat {
  return { ...chat, group: { ...DEFAULT_GROUP, ...chat.group, ...patch }, updatedAt: now };
}

// A new group chat that opens with each member's greeting, in the cast's order (the review's
// "opening a group"), or with nobody's when none of them has one.
export function newGroupChat(input: NewChat & { cast: string[]; greetings: Record<string, { text: string; emotion: string } | null> }, ids: () => string, now: number): Chat {
  const base = withCast(newChat({ ...input, greeting: null }, ids, now), input.cast, now);
  const messages: ChatMessage[] = [];
  for (const member of base.cast.length ? base.cast : [{ characterId: input.characterId }]) {
    const greeting = input.greetings[member.characterId];
    const text = greeting?.text.trim();
    if (!text) continue;
    messages.push({ id: ids(), from: 'character', at: now, alts: [{ parts: [{ text, emotion: emotionOf(greeting!.emotion) }], at: now, model: '' }], pick: 0, ...(base.cast.length ? { speaker: member.characterId } : {}) });
  }
  return { ...base, messages };
}

// --- Who answers.

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// What someone is called by: their whole name, and a first name of three letters or more.
function callsOf(member: Pick<Member, 'name'>): string[] {
  const first = member.name.trim().split(/\s+/)[0] ?? '';
  return [...new Set([member.name.trim(), ...(first.length >= 3 && first !== member.name.trim() ? [first] : [])])].filter(Boolean);
}
function firstCall(text: string, member: Pick<Member, 'name'>): number {
  let at = -1;
  for (const call of callsOf(member)) {
    const found = new RegExp(`(?:^|[^\\p{L}\\p{N}_])@?${escape(call)}(?![\\p{L}\\p{N}_])`, 'iu').exec(text);
    if (found) { const index = found.index + found[0].search(/@?\S/u); if (at < 0 || index < at) at = index; }
  }
  return at;
}

// The members a message names, in the order it names them.
export function namedIn(text: string, members: readonly Member[]): Member[] {
  return members.map((member) => ({ member, at: firstCall(text, member) })).filter((entry) => entry.at >= 0).sort((a, b) => a.at - b.at).map((entry) => entry.member);
}

const WEIGHT: Record<Talk, number> = { quiet: 0.5, usual: 1, chatty: 2 };

// Who has been quiet longest, weighed by how talkative each is: replies since they last spoke,
// times their weight. Someone who hasn't spoken yet comes first; ties go in the cast's order. A
// muted member is never the quietest.
export function quietest(chat: Chat, members: readonly Member[], upTo = chat.messages.length, except: readonly string[] = []): Member | null {
  const open = members.filter((member) => !member.muted && !except.includes(member.id));
  let best: { member: Member; score: number } | null = null;
  for (const member of open) {
    let since = 0;
    let spoke = false;
    for (let index = upTo - 1; index >= 0; index -= 1) {
      const message = chat.messages[index]!;
      if (message.from !== 'character') continue;
      if (speakerOf(chat, message) === member.id) { spoke = true; break; }
      since += 1;
    }
    const score = spoke ? since * WEIGHT[member.talk] : Number.POSITIVE_INFINITY;
    if (!best || score > best.score) best = { member, score };
  }
  return best?.member ?? null;
}

// Who has already answered the player's latest message, in order.
export function answeredSince(chat: Chat, upTo = chat.messages.length): string[] {
  const out: string[] = [];
  for (let index = upTo - 1; index >= 0; index -= 1) {
    const message = chat.messages[index]!;
    if (message.from === 'user') break;
    if (message.from === 'character') out.unshift(speakerOf(chat, message));
  }
  return out;
}

export type Why = 'named' | 'reply' | 'agent' | 'quietest' | 'handoff' | 'chosen';
export type NextSpeaker = { member: Member; why: Why } | { ask: Member[]; fallback: Member };

// Who answers next. The player's latest message decides first: someone it names, then the author
// of the message it answers. Otherwise the agent picks among those still to speak (the caller
// makes the side call and falls back), or with the agent off, the quietest answers. In "whoever
// has something to say", up to three answer one message, each seeing the ones before; null means
// nobody else is due.
export function nextSpeaker(chat: Chat, members: readonly Member[], upTo = chat.messages.length): NextSpeaker | null {
  if (!members.length) return null;
  const answered = answeredSince(chat, upTo);
  const several = chat.group.answers === 'several';
  if (answered.length >= (several ? 3 : 1)) return null;
  const last = [...chat.messages.slice(0, upTo)].reverse().find((message) => message.from === 'user');
  if (last) {
    const named = namedIn(pickedAlt(last).parts.map((part) => part.text).join('\n'), members).filter((member) => !answered.includes(member.id));
    if (named[0]) return { member: named[0], why: 'named' };
    const answering = last.replyTo ? chat.messages.find((message) => message.id === last.replyTo) : undefined;
    const author = answering?.from === 'character' ? members.find((member) => member.id === speakerOf(chat, answering)) : undefined;
    if (author && !answered.includes(author.id)) return { member: author, why: 'reply' };
  }
  // After the first answer, only those named (above) or handed to answer, unless the group lets
  // whoever has something to say.
  if (answered.length && !several) return null;
  const fallback = quietest(chat, members, upTo, answered);
  if (!fallback) return null;
  const open = members.filter((member) => !member.muted && !answered.includes(member.id));
  if (chat.group.picker === 'agent' && open.length > 1) return { ask: open, fallback };
  return { member: fallback, why: 'quietest' };
}

// A reply that hands the turn to someone by name: `@Name`, or a question put to them in its last
// lines. Each member is handed to at most once per player message, so two characters can't keep
// passing it back and forth.
export function handoffIn(reply: string, speakerId: string, members: readonly Member[], handed: readonly string[]): Member | null {
  const open = members.filter((member) => member.id !== speakerId && !handed.includes(member.id));
  const tagged = open.find((member) => callsOf(member).some((call) => new RegExp(`@${escape(call)}(?![\\p{L}\\p{N}_])`, 'iu').test(reply)));
  if (tagged) return tagged;
  const tail = reply.trim().split(/(?<=[.!?…])\s+|\n+/).slice(-2).filter((sentence) => sentence.includes('?')).join(' ');
  return tail ? namedIn(tail, open)[0] ?? null : null;
}

// --- The agent's pick: one question, one name back, at a low temperature.

export const PICKER = { maxTokens: 40, temperature: 0.2 } as const;

export function pickerRequest(chat: Chat, members: readonly Member[], open: readonly Member[], upTo = chat.messages.length): Message[] {
  const name = namer(chat, members);
  const recent = chat.messages.slice(Math.max(0, upTo - 8), upTo).map((message) => {
    const text = pickedAlt(message).parts.map((part) => part.text).join('\n');
    return message.from === 'character' ? `${name(message)}: ${text}` : message.from === 'note' ? text : `${chat.userName}: ${text}`;
  });
  const several = chat.group.answers === 'several' && answeredSince(chat, upTo).length > 0;
  return [
    {
      role: 'system',
      content: [
        `You decide who speaks next in a group chat between ${chat.userName} and ${members.map((member) => member.name).join(', ')}.`,
        `Choose one of: ${open.map((member) => member.name).join(', ')}. Pick the one the last message is for, or who would most naturally answer it.`,
        several ? 'If nobody else would say anything now, answer null.' : '',
        'Answer with JSON only, nothing else: {"speaker": "<name>"}',
      ].filter(Boolean).join('\n'),
    },
    { role: 'user', content: recent.join('\n\n') || '(The chat begins.)' },
  ];
}

// The pick read back: a member, 'nobody', or null when it can't be read (fall back).
export function readPick(text: string, open: readonly Member[]): Member | 'nobody' | null {
  const json = /\{[\s\S]*?\}/.exec(text)?.[0];
  let named: unknown;
  if (json) { try { named = (JSON.parse(json) as { speaker?: unknown }).speaker; } catch { named = undefined; } }
  if (named === null) return 'nobody';
  const said = typeof named === 'string' ? named : text;
  return namedIn(said, open)[0] ?? null;
}

// --- Keeping a reply to its own speaker.

// Stop strings for everyone else's label and the player's, at a line start. Providers take up to eight.
export function groupStops(members: readonly Member[], speakerId: string, userName: string): string[] {
  return [...new Set([...members.filter((member) => member.id !== speakerId).map((member) => `\n${member.name}:`), `\n${userName}:`])].slice(0, 8);
}

export interface Cleaned {
  text: string;
  // Whose lines were cut off the end.
  cut: string[];
  // The reply was only someone else's: nothing of the speaker's to keep.
  dropped: boolean;
  // Whose line it started with, before the speaker's own.
  skipped: string[];
}

const labelOf = (line: string, names: readonly string[]) => names.find((name) => new RegExp(`^\\s*[*_]{0,2}${escape(name)}[*_]{0,2}\\s*:`, 'i').test(line));

// The parser is the guarantee where stops aren't kept: a reply that starts with someone else's line
// keeps only what comes from the speaker's own label on; a reply that is only someone else's is
// dropped; and a reply is cut where another participant's line starts.
export function cleanGroupReply(text: string, speakerName: string, otherNames: readonly string[], userName: string): Cleaned {
  const others = [...otherNames, userName].filter((name) => name && name.toLowerCase() !== speakerName.toLowerCase());
  const lines = text.split('\n');
  const skipped: string[] = [];
  let start = lines.findIndex((line) => line.trim());
  if (start < 0) return { text: '', cut: [], dropped: false, skipped };
  const opener = labelOf(lines[start]!, others);
  if (opener) {
    const own = lines.findIndex((line, index) => index > start && labelOf(line, [speakerName]));
    if (own < 0) return { text: '', cut: [], dropped: true, skipped: [opener] };
    for (const line of lines.slice(start, own)) { const who = labelOf(line, others); if (who && !skipped.includes(who)) skipped.push(who); }
    start = own;
  }
  const cut: string[] = [];
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const who = labelOf(lines[index]!, others);
    if (who) { end = index; break; }
  }
  for (const line of lines.slice(end)) { const who = labelOf(line, others); if (who && !cut.includes(who)) cut.push(who); }
  return { text: lines.slice(start, end).join('\n').trimEnd(), cut, dropped: false, skipped };
}

// --- The two layouts.

// Group rules: the player's prompt parts, with "who the model plays" (and for C, the reply's shape)
// said for a group. The player's own rewrites of those two are written for one-on-one chats.
const ROLE_B = 'You are {{char}}, in a group chat with {{user}} and {{others}}. Write only {{char}}\'s side: what {{char}} says, does and thinks. Never write {{user}}\'s words or actions or anyone else\'s; the others speak for themselves. Never step outside {{char}} to narrate or explain.';
const ROLE_C = 'This is a group chat between {{user}} and {{cast}}. You write one of them at a time: the block at the end of the latest message names who you write as now. Write only their side: what they say, do and think. Never write {{user}}\'s words or actions or anyone else\'s, and never step outside the character to narrate or explain.';
const SHAPE_C = 'Start every reply with the name of the character you write as and a colon, and write the whole reply in one go, ending where they have finished for now.';
const listed = (names: readonly string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

export function groupRules(setup: PromptSetup, layout: 'b' | 'c', speakerName: string, userName: string, names: readonly string[]): string {
  if (layout === 'b') {
    const role = ROLE_B.replace('{{others}}', listed(names.filter((name) => name !== speakerName)));
    return rulesText({ ...setup, texts: { ...setup.texts, role } }, speakerName, userName);
  }
  const role = ROLE_C.replace('{{cast}}', listed(names));
  return rulesText({ ...setup, texts: { ...setup.texts, role, shape: SHAPE_C } }, 'each character', userName);
}

// The others present, by their line: who they are in a sentence, never their sheet.
export function castText(members: readonly Member[], heading: string): string {
  if (!members.length) return '';
  return [`## ${heading}`, ...members.map((member) => `${member.name}${member.record.line.trim() ? `: ${member.record.line.trim()}` : ''}`)].join('\n');
}

export interface GroupHow {
  // Left out: the chat's own setting. Xialong always takes B.
  layout?: 'b' | 'c';
  others?: 'assistant' | 'user';
  // C only: a line straight after the transcript naming who to write as, before their block.
  anchor?: boolean;
}

export async function buildGroupRequest(chat: Chat, world: World, speakerId: string, options: BuildOptions, how: GroupHow = {}): Promise<Built | null> {
  const members = membersOf(chat, world);
  const speaker = members.find((member) => member.id === speakerId);
  if (!speaker) return null;
  const nameOf = namer(chat, members);
  const xialong = profileFor(options.model) === 'aetherroom';
  const layout = xialong ? 'b' : how.layout ?? chat.group.layout;
  const othersAs = how.others ?? chat.group.others;
  const stop = groupStops(members, speaker.id, chat.userName);
  const now = chatNow(chat, options);
  const own = sceneFor(world, { ...chat, characterId: speaker.id, characterName: speaker.name }, now);
  if (!own) return null;
  if (layout === 'b') {
    const cast = castText(members.filter((member) => member.id !== speaker.id), `Also here, with ${speaker.name}`);
    const built = xialong
      ? await buildAetherRoom(chat, own, options, undefined, { nameOf, speakerId: speaker.id, cast, others: members.filter((member) => member.id !== speaker.id).map((member) => member.name) })
      : buildGeneralProfile(chat, own, options, undefined, { nameOf, speakerId: speaker.id, othersAs, cast, rules: groupRules(options.prompt ?? DEFAULT_PROMPT, 'b', speaker.name, own.userName, members.map((member) => member.name)) });
    return { ...built, stop, speaker: speaker.id };
  }
  const shared = sceneFor(world, chat, now);
  if (!shared) return null;
  return { ...buildLayoutC(chat, shared, own, speaker, members, options, othersAs, how.anchor ?? false), stop, speaker: speaker.id };
}

const isStable = (reach: string) => reach === 'line' || reach === 'always' || reach === 'here';
const partLine = (part: ContextBlock['parts'][number]) => (part.reach === 'line' ? part.text : `${part.title}: ${part.text}`);
const blockLines = (block: ContextBlock | undefined, stable: boolean) => (block ? block.parts.filter((part) => isStable(part.reach) === stable).map(partLine) : []);
const RELATIONSHIP: Record<Chat['relationship'], string> = { stranger: "doesn't know {{user}} yet", acquaintance: 'and {{user}} are acquaintances', close: 'and {{user}} are close', romantic: 'and {{user}} are romantic partners' };

// Layout C: everything before the speaker's block is the same whoever speaks.
function buildLayoutC(chat: Chat, shared: Scene, own: Scene, speaker: Member, members: readonly Member[], options: BuildOptions, othersAs: 'assistant' | 'user', anchor: boolean): Built {
  const { userName, persona, scenario } = shared;
  const setup = options.prompt ?? DEFAULT_PROMPT;
  const nameOf = namer(chat, members);
  const said = recentText(chat, options.upTo, options.draft);
  // The shared part names no one in particular: {{char}} in a persona or scenario reads as the
  // chat's own character, whoever speaks.
  const macros = (text: string) => replaceMacros(text, shared.charName, userName, shared.nowMs);
  const castIds = new Set(members.map((member) => member.id));
  const sharedAnswer = contextFor(shared.view, { hereIds: [persona?.id, scenario?.id].filter((id): id is string => Boolean(id)), recentText: said, conditionIds: shared.conditionIds });
  const blockOf = (id: string | undefined) => sharedAnswer.blocks.find((block) => block.recordId === id);
  const lore = sharedAnswer.blocks.filter((block) => block.recordId && block.recordId !== persona?.id && block.recordId !== scenario?.id && !castIds.has(block.recordId));
  const keyed = (block: ContextBlock) => block.why === 'named' || block.why === 'when';

  const parts: { label: string; text: string }[] = [];
  const add = (label: string, text: string) => { if (text.trim()) parts.push({ label, text }); };
  add('Rules', groupRules(setup, 'c', speaker.name, userName, members.map((member) => member.name)));
  const personaLines = [...blockLines(blockOf(persona?.id), true), persona?.pronouns.trim() && `Pronouns: ${persona.pronouns.trim()}`, persona?.gender.trim() && `Gender: ${persona.gender.trim()}`].filter(Boolean) as string[];
  if (personaLines.length) add(`${userName} (you)`, macros(`## ${userName}, who everyone here is talking to\n${personaLines.join('\n')}`));
  const scenarioLines = blockLines(blockOf(scenario?.id), true);
  if (scenarioLines.length) add('Scenario', macros(`## The scenario\n${scenarioLines.join('\n')}`));
  add('Who is here', castText(members, 'Who is here'));
  const standing = lore.filter((block) => !keyed(block)).map((block) => [`[${block.name}]`, ...blockLines(block, true)]).filter((lines) => lines.length > 1);
  if (standing.length) add('Also true', macros(`## Also true\n${standing.map((lines) => lines.join('\n')).join('\n\n')}`));
  const system = parts.map((part) => part.text).join('\n\n');
  const facts = chat.journal.filter((entry) => entry.active && entry.text.trim()).map((entry) => `- ${macros(entry.text.trim())}`);
  const journal = facts.length ? `## What everyone here knows about ${userName}\nThey know the following about ${userName} and are comfortable bringing it up.\n${facts.join('\n')}` : '';

  // The speaker's block: their sheet, a few lines of their examples, their own memories and plans,
  // the moment, and the cue. It goes after the transcript, so it alone changes with the speaker.
  const ownAnswer = contextFor(own.view, { hereIds: [speaker.id], recentText: said, conditionIds: own.conditionIds });
  const ownBlock = ownAnswer.blocks.find((block) => block.recordId === speaker.id);
  const ownMacros = (text: string) => replaceMacros(text, speaker.name, userName, own.nowMs);
  const record = own.character;
  const sheet = [
    ...blockLines(ownBlock, true),
    record.pronouns.trim() && `Pronouns: ${record.pronouns.trim()}`,
    record.gender.trim() && `Gender: ${record.gender.trim()}`,
    `${speaker.name} ${RELATIONSHIP[chat.relationship]}.`,
  ].filter(Boolean) as string[];
  const exampleLines = record.examples.flatMap((example) => example.messages.filter((message) => message.fromCharacter).map((message) => `${speaker.name}: ${message.text}`)).slice(0, 6);
  const windowGuess = chat.windowStart;
  const moment = generalMoment(chat, own, options, windowGuess);
  const momentLines = [
    ...blockLines(ownBlock, false).map((line) => `${speaker.name}, ${line}`),
    ...blockLines(blockOf(persona?.id), false).map((line) => `${userName}, ${line}`),
    ...blockLines(blockOf(scenario?.id), false),
    ...lore.flatMap((block) => (keyed(block) ? block.parts.map((part) => `${block.name}: ${part.text}`) : blockLines(block, false).map((line) => `${block.name}, ${line}`))),
    ...moment.lines,
  ];
  const cardPost = setup.cardPrompt ? record.sections.find((section) => section.title === CARD_POST_TITLE && section.text.trim())?.text.trim() ?? '' : '';
  const after = [cardPost, setup.after.trim()].filter(Boolean);

  // The transcript, from the window's start, every reply under its writer's name.
  const history = chat.messages.slice(0, options.upTo);
  const costs = history.map((message) => estimateTokens(turnText(message, nameOf(message))) + 6);
  const carried = options.continuing && history.at(-1)?.from === 'character' && speakerOf(chat, history.at(-1)!) === speaker.id ? history.at(-1)! : null;
  const openText = carried ? openReplyText(mergeParts(pickedAlt(carried).parts), speaker.name, false) : '';
  const block = () => {
    const ask = carried && !options.canPrefill ? `Carry on ${speaker.name}'s last message from exactly where it stops. Don't repeat any of it.` : `Write ${speaker.name}'s next message only.`;
    return ownMacros([
      ...(anchor ? [`You are writing as ${speaker.name}.`] : []),
      `## ${speaker.name}, who you write as now`,
      ...sheet,
      ...(exampleLines.length ? [`How ${speaker.name} sounds (from example chats, not part of this chat):`, ...exampleLines] : []),
      `Style: ${chat.style}. Length: ${lengthWords(chat.style, chat.responseLength)}.`,
      ...momentLines,
      ...after,
      ask,
    ].join('\n'));
  };
  const blockTokens = estimateTokens(block());
  const story = macros(storySoFar(chat, Math.min(chat.windowStart, options.upTo), Math.round(options.contextTokens * STORY_SHARE), said));
  const kept = [journal, story].filter(Boolean).join('\n\n');
  const prefixTokens = estimateTokens(system) + estimateTokens(kept);
  const budget = budgetFor(options.contextTokens, options.replyTokens, prefixTokens + blockTokens);
  const windowStart = windowStartFor(costs, chat.windowStart, budget.high, budget.low);
  const start = Math.min(windowStart, history.length);
  const shown = carried && options.canPrefill ? history.slice(start, -1) : history.slice(start);

  const turns: Message[] = [];
  const push = (role: 'user' | 'assistant', content: string) => {
    const last = turns.at(-1);
    if (last?.role === role) last.content += `\n${content}`;
    else turns.push({ role, content });
  };
  if (!shown[0] || shown[0].from === 'character') push('user', start > 0 ? '[Earlier messages are out of view.]' : '[The chat begins.]');
  for (const message of shown) push(message.from === 'character' ? othersAs : 'user', turnText(message, nameOf(message)));
  const cue = `[${block()}]`;
  if (turns.at(-1)?.role === 'user') turns.at(-1)!.content += `\n\n${cue}`;
  else turns.push({ role: 'user', content: cue });

  const messages: Message[] = [{ role: 'system', content: system }, ...(kept ? [{ role: 'system' as const, content: kept }] : []), ...turns];
  const lead = carried ? openText : `${speaker.name}:`;
  const transcriptTokens = turns.reduce((sum, turn) => sum + estimateTokens(turn.content), 0) - estimateTokens(cue);
  const builtParts: BuiltPart[] = [
    { label: 'Shared: rules, persona, scenario, who is here', tokens: estimateTokens(system) },
    ...(kept ? [{ label: 'Shared: journal and story so far', tokens: estimateTokens(kept) }] : []),
    { label: 'Transcript', tokens: Math.max(0, transcriptTokens) },
    { label: `${speaker.name}'s block`, tokens: estimateTokens(cue) },
  ];
  const notes: string[] = [];
  if (windowStart > 0) notes.push(`The window starts at message ${windowStart + 1}; earlier ones are out of view.`);
  return {
    profile: 'general', messages, prefill: options.canPrefill ? lead : '', lead,
    roll: chat.roll, windowStart, plans: moment.plans, firstSent: windowStart, answer: ownAnswer,
    parts: builtParts, tokens: messages.reduce((sum, message) => sum + estimateTokens(message.content), 0), notes,
  };
}
