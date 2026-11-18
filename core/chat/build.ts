// One request for one reply: picks the context profile for the model and builds it from the same
// chat either way. AetherRoom for xialong-v1, exactly as CharacterRoom sends it; General for
// every other model. The interface shows these exact messages as "What was sent".
import type { Message } from '../narration/formats.js';
import { contextFor, mentions, type ContextAnswer } from '../records/context.js';
import type { World } from '../records/schema.js';
import { AETHERROOM_MODEL, brainEntries, contextBuilt, type KernelContext, type KernelMessage, type KernelPlan, type Roll } from './aetherroom.js';
import { aetherRoomStyle, lastContactMs, pickedAlt, recentEmotions, type Chat, type Plan } from './chat.js';
import { joinText, mergeParts, openReplyText, parseReply, replyText, type ReplyPart } from './emotions.js';
import { budgetFor, buildGeneral, estimateTokens, windowStartFor } from './general.js';
import { currentEventsLine, hoursApart, moodFor, moodLine, pickPlans, timeApartLine } from './moment.js';
import { recentText, sceneFor, type Scene } from './scene.js';
import { sheetFor } from './sheet.js';
import type { PromptSetup } from './prompt.js';
import { STORY_SHARE } from './chapters.js';
import { clockNow, clockTracks, storyActive } from './time.js';

export type Profile = 'aetherroom' | 'general';
export const profileFor = (model: string): Profile => (/xialong/i.test(model) ? 'aetherroom' : 'general');
export const PROFILE_NAMES: Record<Profile, string> = { aetherroom: 'AetherRoom (Xialong)', general: 'General' };

// What the owner's Discord bot runs xialong-v1 with.
export const XIALONG = { contextTokens: 28_672, rolloverTokens: 8_192, replyTokens: 1_000, sideTokens: 250, temperature: 0.85, top_p: 0.95, top_k: 250, min_p: 0 } as const;

export interface BuildOptions {
  model: string;
  canPrefill: boolean;
  contextTokens: number;
  replyTokens: number;
  // The device's time. The chat's own clock decides what time it is in the story.
  nowMs: number;
  // Messages [0, upTo) are the story the reply follows. Regenerating a turn stops before it.
  upTo: number;
  // Carry on the last message in that story instead of starting a new turn.
  continuing: boolean;
  // True until the first reply of this visit: AetherRoom trims a long chat down on its first build.
  firstBuild: boolean;
  // A look at what would be sent: plans don't count down.
  dryRun: boolean;
  rngInt: (min: number, max: number) => number;
  draft?: string;
  // Home: how the character's needs stand, already worded. Sent as CharacterRoom's Needs brain.
  needs?: string;
  // The player's prompt setup, for every model but xialong.
  prompt?: PromptSetup;
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
  plans: Plan[];
  // The first chat message still in the context.
  firstSent: number;
  answer: ContextAnswer;
  parts: BuiltPart[];
  tokens: number;
  notes: string[];
}

// --- Things written beside the chat: a diary entry, a feeling, a plan (CharacterRoom's Reflect,
// Process and Plan). Each uses CharacterRoom's own prompt and budget, and is started by the player.

export type SideKind = 'diary' | 'process' | 'plan';
// A side task: its shape and style as CharacterRoom words them, and for a task that isn't a
// memory (a post), what else it is told, what its reply is started on, and how other models are
// asked for it.
export interface SideTask {
  kind: SideKind | 'post';
  shape: string;
  style: string;
  maxTokens: number;
  // More the task is told, between the shape and the style: a post's time frame, what it is not about.
  frame?: string[];
  // What the reply is started on. Memories start on "Title:".
  lead?: string;
  // For models other than xialong: how the reply should be laid out, said in a sentence.
  layout?: string;
}
export const SIDE_NAMES: Record<SideKind, { button: string; what: string }> = {
  diary: { button: 'Reflect', what: 'a diary entry about the chat so far' },
  process: { button: 'Process', what: 'a short memory of how one moment felt' },
  plan: { button: 'Plan', what: 'something to do in the next few replies' },
};

// How CharacterRoom words an emotion when it asks for a memory about it.
const EMOTION_PHRASING: Record<string, string> = { hurt: 'injury', laughing: 'amused', love: 'loving', thinking: 'analytical', tired: 'wearied' };

export function sideTask(kind: SideKind, emotions: readonly string[], rngInt: BuildOptions['rngInt']): SideTask {
  if (kind === 'diary') return { kind, shape: 'A diary entry consists of a Title:, Content:, and Activation Keys:', style: '[ Style: diary entry, reflection on events ]', maxTokens: 250 };
  if (kind === 'plan') {
    return { kind, shape: 'An action plan consists of a Title: and Content:, formatted as a single paragraph. The plan is one or more actions that can be taken in the chat, written in the unique style and tone of the author.', style: '[ Style: action plan, authentic expression ]', maxTokens: 300 };
  }
  const emotion = emotions[rngInt(0, Math.max(0, emotions.length - 1))] ?? 'neutral';
  return {
    kind,
    shape: 'A emotional memory consists of a Title:, Content:, and Activation Keys:\nIt is focused on how a particular small interaction made the person feel and can reference a recent interaction, or one that happened some time ago.',
    style: `[ Style: emotional memory, brief, ${EMOTION_PHRASING[emotion] ?? emotion} feelings ]`,
    maxTokens: 250,
  };
}

// The clock for this build: story time as it was when the turn being rewritten was first written.
function chatNow(chat: Chat, options: BuildOptions): number {
  const target = chat.messages[options.continuing ? options.upTo - 1 : options.upTo];
  if (storyActive(chat.clock) && target?.clock !== undefined) return target.clock;
  return clockNow(chat.clock, options.nowMs);
}

const answerFor = (scene: Scene, chat: Chat, options: BuildOptions) =>
  contextFor(scene.view, { hereIds: scene.hereIds, recentText: recentText(chat, options.upTo, options.draft), conditionIds: scene.conditionIds });

async function buildAetherRoom(chat: Chat, scene: Scene, options: BuildOptions, side?: SideTask): Promise<Built> {
  const sheet = sheetFor(scene);
  if (options.needs) sheet.char.brains = [...(sheet.char.brains ?? []), { name: 'Needs', content: options.needs }];
  const history = chat.messages.slice(0, options.upTo);
  const carried = !side && options.continuing && history.at(-1)?.from === 'character' ? history.pop()! : null;
  const slot = carried ? openReplyText(pickedAlt(carried).parts, scene.charName, true) : '';
  const memory = (entry: Chat['diary'][number]) => ({ name: entry.name, content: entry.content, keys: entry.keys });

  const ctx: KernelContext = {
    char: sheet.char, user: sheet.user, scenario: sheet.scenario,
    chat: { intimacy: chat.relationship, style: aetherRoomStyle(chat.style), responseLength: chat.responseLength },
    includeGameStats: false, gameRecord: {},
    floaty: sheet.floaty,
    jots: chat.journal.filter((entry) => entry.active).map((entry) => ({ id: entry.id, text: entry.text })),
    diary: chat.diary.map(memory),
    process: chat.process.map(memory),
    // A side generation gets the sheet and the story: no plans, no clock, no mood (CR D-23).
    plans: side ? undefined : chat.plans.map((plan) => ({ ...plan })) as KernelPlan[],
    trackRealTime: !side && clockTracks(chat.clock),
    lastContactMs: lastContactMs(chat, options.upTo),
    useEmotionalModes: !side && chat.moods,
    nowMs: scene.nowMs,
  };
  // Keys are matched on what was said, without the speakers' names in front of each line.
  const story = [...history.map((message) => pickedAlt(message).parts.map((part) => part.text).join('\n')), options.draft ?? ''].join('\n');
  const brains = brainEntries(AETHERROOM_MODEL, story, ctx)?.temporaryLorebookEntries.filter((entry) => entry.active !== false) ?? [];

  // A note is an in-chat system message: xialong reads square-bracketed system lines as
  // directions, the way it reads the style line.
  const turns: KernelMessage[] = history.map((message) => (message.from === 'character'
    ? { role: 'assistant', content: `${replyText(pickedAlt(message).parts, scene.charName, true)}\n` }
    : { role: message.from === 'note' ? 'system' : 'user', content: pickedAlt(message).parts.map((part) => part.text).join('\n') }));
  const input: KernelMessage[] = [...brains.map((entry): KernelMessage => ({ role: 'system', content: entry.content })), ...turns, { role: 'assistant', content: slot }];

  const rollover = Math.min(XIALONG.rolloverTokens, Math.floor(options.contextTokens * 0.28));
  const roll: Roll = { ...chat.roll, pathIdList: [...chat.roll.pathIdList], checkInitialTrim: options.firstBuild };
  const result = await contextBuilt(input, AETHERROOM_MODEL, options.dryRun || !!side, ctx, {
    rngInt: options.rngInt,
    encode: (text) => new Array<number>(estimateTokens(text)).fill(0),
    maxTokens: () => options.contextTokens,
    rolloverTokens: () => rollover,
    naiSystemPrompt: () => '\u0000no NovelAI system prompt\u0000',
    recentEmotions: (count) => recentEmotions(chat, count, options.upTo),
    log: () => {},
  }, roll);

  const built = (result.messages ?? []).map((message) => ({ role: message.role, content: message.content ?? '' }));
  // The last assistant message is where the reply goes. Empty, it is left for the provider to
  // open; with text in it (Continue, or a plan in a think block), it is sent for the model to
  // carry on.
  if (built.at(-1)?.role === 'assistant' && !built.at(-1)!.content) built.pop();
  let lead = slot;
  if (side) {
    // The chat's own style line gives way to the task's shape, style and primer.
    for (let index = built.length - 1; index >= 0; index -= 1) {
      if (built[index]!.role === 'system' && built[index]!.content.startsWith('[ Style:')) { built.splice(index, 1); break; }
    }
    lead = side.lead ?? `${scene.charName}: Title:`;
    built.push({ role: 'system', content: side.shape }, ...(side.frame ?? []).map((content) => ({ role: 'system' as const, content })), { role: 'system', content: side.style }, { role: 'assistant', content: lead });
  }
  const parts: BuiltPart[] = [
    { label: 'Sheet', tokens: estimateTokens(built[0]?.content ?? '') },
    { label: 'Brains and memories', tokens: brains.reduce((sum, entry) => sum + estimateTokens(entry.content), 0) },
    { label: 'Transcript', tokens: built.slice(1).filter((message) => message.role !== 'system').reduce((sum, message) => sum + estimateTokens(message.content), 0) },
  ];
  return {
    profile: 'aetherroom', messages: built, prefill: '', lead,
    roll: { startIndex: roll.startIndex, pathIdList: roll.pathIdList, trimmed: roll.trimmed },
    windowStart: chat.windowStart,
    plans: side || !result.plans ? chat.plans : result.plans as Plan[],
    firstSent: Math.max(0, roll.startIndex - brains.length),
    answer: answerFor(scene, chat, options),
    parts, tokens: built.reduce((sum, message) => sum + estimateTokens(message.content), 0),
    notes: roll.startIndex > 0 ? [`The window starts at message ${Math.max(1, roll.startIndex - brains.length + 1)}; earlier ones are out of view.`] : [],
  };
}

// The moment's extra lines for the General profile, and the plans as they stand afterwards.
function generalMoment(chat: Chat, scene: Scene, options: BuildOptions, windowStart: number): { lines: string[]; plans: Plan[] } {
  const { charName, userName } = scene;
  const lines: string[] = [];
  let away = false;
  if (clockTracks(chat.clock)) {
    const hours = hoursApart(scene.nowMs, lastContactMs(chat, options.upTo));
    if (hours > 0) { lines.push(timeApartLine(hours, charName, userName)); away = true; }
    const events = currentEventsLine(scene.status.live, scene.status.day, scene.status.minutes, charName, userName, scene.nowMs);
    if (events) lines.push(events);
  }
  if (chat.moods) {
    const mood = moodFor(recentEmotions(chat, 3, options.upTo), away, options.rngInt);
    if (mood) lines.push(`${charName}'s mood. ${moodLine(mood, charName)}`);
  }
  if (options.needs) lines.push(options.needs);
  const said = recentText(chat, options.upTo, options.draft);
  for (const entry of chat.diary) if (mentions(said, entry.keys)) lines.push(`From ${charName}'s diary, ${entry.name}: ${entry.content}`);
  for (const entry of chat.process) if (mentions(said, entry.keys)) lines.push(`How ${charName} remembers feeling, ${entry.name}: ${entry.content}`);
  const userTurns = chat.messages.slice(windowStart, options.upTo).filter((message) => message.from === 'user').length;
  const picked = pickPlans(chat.plans, options.rngInt, userTurns, options.dryRun);
  // A note, never a thinking block: models other than xialong weren't taught to read one.
  for (const content of picked.contents) lines.push(`What ${charName} means to do next (act on it, don't announce it): ${content}`);
  return { lines, plans: picked.plans };
}

function buildGeneralProfile(chat: Chat, scene: Scene, options: BuildOptions, side?: SideTask): Built {
  const base = { upTo: options.upTo, canPrefill: options.canPrefill, continuing: !side && options.continuing, nowMs: scene.nowMs, draft: options.draft, prompt: options.prompt, storyTokens: Math.round(options.contextTokens * STORY_SHARE) };
  const task = side ? {
    rules: `You are ${scene.charName}. Below is who you are, who ${scene.userName} is, and your chat with them so far. After it you will be asked to write something of your own, in your own voice. Write only that, in the form asked for, and nothing after it.`,
    ask: [side.shape, ...(side.frame ?? []), side.style, `Write it now as ${scene.charName}. ${side.layout ?? `Start with "Title:", then "Content:"${side.kind === 'plan' ? '' : ', then "Activation Keys:" with a few comma-separated words or names from the chat that should bring it back to mind'}.`}`].join('\n'),
    lead: side.lead ?? 'Title:',
  } : undefined;
  const sized = buildGeneral(chat, scene, { ...base, windowStart: chat.windowStart, task });
  const budget = budgetFor(options.contextTokens, side ? side.maxTokens : options.replyTokens, sized.prefixTokens);
  const windowStart = windowStartFor(sized.costs, chat.windowStart, budget.high, budget.low);
  const moment = side ? { lines: [], plans: chat.plans } : generalMoment(chat, scene, options, windowStart);
  const built = buildGeneral(chat, scene, { ...base, windowStart, task, momentLines: moment.lines });
  const notes: string[] = [];
  if (windowStart > 0) notes.push(`The window starts at message ${windowStart + 1}; earlier ones are out of view.`);
  if (sized.prefixTokens > options.contextTokens * 0.6) notes.push('The character, persona, scenario and examples take most of the window. Trim them in the Studio, or raise the context size.');
  return {
    profile: 'general', messages: built.messages, prefill: built.prefill, lead: built.lead,
    roll: chat.roll, windowStart, plans: moment.plans, firstSent: windowStart, answer: built.answer,
    parts: built.parts.map(({ label, tokens }) => ({ label, tokens })),
    tokens: built.messages.reduce((sum, message) => sum + estimateTokens(message.content), 0),
    notes,
  };
}

export async function buildRequest(chat: Chat, world: World, options: BuildOptions): Promise<Built | null> {
  const scene = sceneFor(world, chat, chatNow(chat, options));
  if (!scene) return null;
  return profileFor(options.model) === 'aetherroom' ? buildAetherRoom(chat, scene, options) : buildGeneralProfile(chat, scene, options);
}

// The request for a diary entry, a memory, a plan or a post, over the whole chat so far, or with
// `upTo` over the chat as it stood after that many messages.
export async function buildSide(task: SideTask, chat: Chat, world: World, options: BuildOptions, upTo = chat.messages.length): Promise<Built | null> {
  const whole = { ...options, upTo: Math.max(0, Math.min(upTo, chat.messages.length)), continuing: false, dryRun: true };
  const scene = sceneFor(world, chat, chatNow(chat, whole));
  if (!scene) return null;
  return profileFor(options.model) === 'aetherroom' ? buildAetherRoom(chat, scene, whole, task) : buildGeneralProfile(chat, scene, whole, task);
}

export interface SideEntry { name: string; content: string; keys: string[] }

// What came back, read as Title, Content and Activation Keys. Null when there is no content.
export function readSide(text: string, lead: string, charName: string, userName: string): SideEntry | null {
  const whole = /Title\s*:/i.test(text) ? text : `${lead} ${text}`;
  const name = /Title\s*:[ \t]*([^\n]*)/i.exec(whole)?.[1]?.trim() ?? '';
  const body = /Content\s*:\s*([\s\S]*?)(?=\n\s*Activation Keys\s*:|$)/i.exec(whole)?.[1] ?? '';
  const content = body.split('\n').filter((line) => !/^\s*Emotion\s*:/i.test(line)).join('\n').trim();
  if (!content) return null;
  const names = new Set([charName.toLowerCase(), userName.toLowerCase()]);
  const keys = (/Activation Keys\s*:[ \t]*([^\n]*)/i.exec(whole)?.[1] ?? '').split(',')
    .map((key) => key.replace(/["“”]|<\/?think>/g, '').trim().replace(/\.$/, ''))
    .filter((key) => key && !names.has(key.toLowerCase()) && key.length <= 80);
  return { name: name.replace(/^["“]|["”]$/g, '').slice(0, 200), content: content.slice(0, 8000), keys: [...new Set(keys)].slice(0, 40) };
}

// The model's text, read as the character's turn. With a lead (a prefill, or a message being
// carried on), the reply continues it, unless the model wrote the name out again itself.
// `whole` (every model but xialong) keeps a reply in one piece: a carried-on reply joins the
// text before it, and a name written out again starts no new piece.
export function readReply(text: string, lead: string, charName: string, userName: string, whole = false): ReplyPart[] {
  const body = text.replace(/^\s*\n/, '');
  const named = new RegExp(`^\\s*${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'i').test(body);
  const opener = `${charName}:`;
  const done = (parts: ReplyPart[]) => (whole ? mergeParts(parts) : parts);
  if (!lead) return done(parseReply(body, charName, userName));
  if (lead === opener) return done(parseReply(named ? body : `${opener} ${body.replace(/^ /, '')}`, charName, userName));
  if (named) return done(parseReply(`${lead}\n${body}`, charName, userName));
  return done(parseReply(whole ? joinText(lead, body) : `${lead}${body}`, charName, userName));
}
