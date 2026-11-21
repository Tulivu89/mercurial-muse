// A test pack: one file with everything needed to rebuild a chat's next turn somewhere else.
// It holds the chat, the world as that chat sees it (with a persona or scenario borrowed from
// another world), the settings the request was built with (never the key), what the next reply
// would be sent, and the last request with what came back. `npm run chat:lab` reads it, and so
// can a person or a model in any other app. Pure: no DOM, no storage.
import type { Message } from '../narration/formats.js';
import { parseWorld, type World } from '../records/schema.js';
import { buildRequest, profileFor, PROFILE_NAMES, XIALONG, type Built, type BuildOptions } from './build.js';
import { parseChat, type Chat } from './chat.js';
import { buildGroupRequest, isGroup, membersOf, nextSpeaker, speakerOf, type GroupHow } from './group.js';

export const TEST_PACK_FORMAT = 'inkwyrm-chat-test/1';
export const SETTINGS_EXPORT_FORMAT = 'inkwyrm-chat-settings/1';

// What a request was built with. The connection's key is never part of it.
export interface PackSettings {
  provider: string;
  model: string;
  // How the model was called: chat messages or one completions prompt, and in what format.
  mode: string;
  format: string;
  profile: string;
  // The window the context was fitted to, after "sized to the model".
  contextTokens: number;
  replyTokens: number;
  samplers: Record<string, number>;
}

export interface PackRequest {
  profile: string;
  model: string;
  messages: Message[];
  prefill: string;
  parts: { label: string; tokens: number }[];
  tokens: number;
  notes: string[];
  // A group chat's turn: who it is written as, and where the reply stops.
  speaker?: string;
  stop?: string[];
}

export interface PackLast {
  at: number;
  profile: string;
  request: unknown;
  reply: string;
  tokens: number;
  // Why the provider said the reply ended ('stop', 'length', 'content_filter'), and its count.
  finishReason?: string | null;
  usage?: unknown;
  error?: string;
}

export interface TestPack {
  format: typeof TEST_PACK_FORMAT;
  exportedAt: number;
  settings: PackSettings;
  // Home's needs line, when the character's needs are being kept.
  needs: string;
  chat: Chat;
  world: World;
  next: PackRequest | null;
  last: PackLast | null;
}

// The samplers a request goes out with: CharacterRoom's for xialong, the chat's temperature otherwise.
export function samplersFor(model: string, temperature: number): Record<string, number> {
  return profileFor(model) === 'aetherroom'
    ? { temperature: XIALONG.temperature, top_p: XIALONG.top_p, top_k: XIALONG.top_k, min_p: XIALONG.min_p }
    : { temperature };
}

export function packRequest(built: Built, model: string): PackRequest {
  return { profile: built.profile, model, messages: built.messages, prefill: built.prefill, parts: built.parts, tokens: built.tokens, notes: built.notes, ...(built.speaker ? { speaker: built.speaker, stop: built.stop ?? [] } : {}) };
}

export function makeTestPack(input: { chat: Chat; world: World; settings: PackSettings; needs?: string; next: Built | null; last: PackLast | null; now: number }): TestPack {
  return {
    format: TEST_PACK_FORMAT, exportedAt: input.now, settings: input.settings, needs: input.needs ?? '',
    chat: input.chat, world: input.world,
    next: input.next ? packRequest(input.next, input.settings.model) : null,
    last: input.last,
  };
}

export function readTestPack(raw: unknown): { ok: true; pack: TestPack } | { ok: false; errors: string[] } {
  const top = raw && typeof raw === 'object' ? raw as Partial<TestPack> : {};
  if (top.format !== TEST_PACK_FORMAT) return { ok: false, errors: ['This is not a test pack from Inkwyrm Chat (Save a test pack, under What was sent).'] };
  const chat = parseChat(top.chat);
  if (!chat.ok) return { ok: false, errors: chat.errors.map((error) => `The chat: ${error}`) };
  const world = parseWorld(top.world);
  if (!world.ok) return { ok: false, errors: world.errors.map((error) => `The world: ${error}`) };
  const settings = top.settings;
  if (!settings || typeof settings.model !== 'string' || typeof settings.contextTokens !== 'number') return { ok: false, errors: ['The pack has no settings.'] };
  return { ok: true, pack: { ...(top as TestPack), needs: typeof top.needs === 'string' ? top.needs : '', chat: chat.chat, world: world.world, next: top.next ?? null, last: top.last ?? null } };
}

// The options to rebuild a turn with, as the pack's settings say. The same random choices each
// time, so two builds of one pack match.
export function packOptions(pack: Pick<TestPack, 'settings' | 'needs' | 'chat'>, upTo: number, model = pack.settings.model): BuildOptions {
  return {
    model,
    canPrefill: false,
    contextTokens: pack.settings.contextTokens,
    replyTokens: pack.settings.replyTokens,
    nowMs: pack.chat.updatedAt,
    upTo, continuing: false, firstBuild: false, dryRun: true,
    needs: pack.needs || undefined,
    rngInt: (min) => min,
  };
}

// Who a group chat's turn is written as: the writer of the reply at that turn, or whoever would
// answer next (the agent's fallback, since the lab makes no calls).
export function packSpeaker(pack: Pick<TestPack, 'chat' | 'world'>, upTo: number): string | null {
  const at = pack.chat.messages[upTo];
  if (at?.from === 'character') return speakerOf(pack.chat, at);
  const next = nextSpeaker(pack.chat, membersOf(pack.chat, pack.world), upTo);
  return next ? ('member' in next ? next.member.id : next.fallback.id) : membersOf(pack.chat, pack.world)[0]?.id ?? null;
}

export async function rebuild(pack: Pick<TestPack, 'settings' | 'needs' | 'chat' | 'world'>, upTo = pack.chat.messages.length, model = pack.settings.model, how?: GroupHow): Promise<PackRequest | null> {
  if (isGroup(pack.chat)) {
    const speaker = packSpeaker(pack, upTo);
    const built = speaker ? await buildGroupRequest(pack.chat, pack.world, speaker, packOptions(pack, upTo, model), how) : null;
    return built ? packRequest(built, model) : null;
  }
  const built = await buildRequest(pack.chat, pack.world, packOptions(pack, upTo, model));
  return built ? packRequest(built, model) : null;
}

// A request as text a person can read, or paste into another app as one message.
export function requestText(request: { profile: string; model: string; messages: Message[]; prefill?: string; parts?: { label: string; tokens: number }[]; tokens?: number }, title: string): string {
  const profile = PROFILE_NAMES[request.profile as keyof typeof PROFILE_NAMES] ?? request.profile;
  const lines = [
    `# ${title}`,
    '',
    [profile, request.model, request.tokens ? `about ${request.tokens.toLocaleString('en')} tokens` : ''].filter(Boolean).join(' · '),
  ];
  if (request.parts?.length) lines.push(request.parts.map((part) => `${part.label} ${part.tokens.toLocaleString('en')}`).join(' · '));
  lines.push('', `${request.messages.length} messages, in order. Each starts with its role. In another app, put the first system message in its system instructions and the rest in the chat, or paste the whole file as one message and ask for the next reply.`);
  request.messages.forEach((message, index) => lines.push('', `## ${index + 1} · ${message.role}`, '', message.content));
  if (request.prefill) lines.push('', '## The start of the reply (prefill)', '', request.prefill);
  return `${lines.join('\n')}\n`;
}
