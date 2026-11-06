// The browser side of narration. Requests for a known provider go to the Praxis server's relay
// with the player's key in a header; a server of the player's own is called from here directly,
// with the same request the relay would send. Keys are kept in memory, and in this browser's
// storage only when the player ticks "Remember on this device".
import type { ChatMessage } from '../engine';
import type { FormatId } from '../narration/formats';
import { BUILT_IN_PROVIDERS, CUSTOM_PROVIDER, customProvider, type ProviderInfo } from '../narration/providers';
import { buildUpstream, diagnosticsFor, emptyReplyReason, narrationRequestSchema, readModels, readReply, type ModelList } from '../narration/upstream';

export type NarrationMode = 'prompt' | 'chat';
export type FormatChoice = FormatId | 'auto';
export const DEFAULT_PROVIDER = 'novelai';
export const DEFAULT_MODEL = 'glm-4-6';

// What the interface knows about a provider; the relay keeps the addresses.
export type ProviderView = Pick<ProviderInfo, 'id' | 'name' | 'completions' | 'chatPrefill' | 'keyLabel' | 'keyHint' | 'keyNote'>;

export const CUSTOM_VIEW: ProviderView = (({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote }) => ({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote }))(customProvider(''));

// Where to send one request.
export interface Target {
  provider: string;
  model: string;
  mode: NarrationMode;
  format: FormatChoice;
  base: string;
}

const memoryKeys = new Map<string, string>();

function storage(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}
function read(key: string): string {
  try { return storage()?.getItem(key) ?? ''; } catch { return ''; }
}
function write(key: string, value: string | null) {
  try {
    if (value === null || value === '') storage()?.removeItem(key);
    else storage()?.setItem(key, value);
  } catch {
    // Storage can be blocked; the value still works for this page.
  }
}

// NovelAI's settings keep the names they had before other providers, so nothing is lost.
const keyName = (provider: string) => (provider === 'novelai' ? 'praxis.novelai.token' : `praxis.key.${provider}`);
const modelName = (provider: string) => (provider === 'novelai' ? 'praxis.novelai.model' : `praxis.model.${provider}`);
const modeName = (provider: string) => (provider === 'novelai' ? 'praxis.novelai.mode' : `praxis.mode.${provider}`);
const formatName = (provider: string) => `praxis.format.${provider}`;

export function rememberedKey(provider: string): string { return read(keyName(provider)); }
export function currentKey(provider: string): string { return memoryKeys.get(provider) || rememberedKey(provider); }
export function setKey(provider: string, key: string, remember: boolean) {
  const value = key.trim();
  if (value) memoryKeys.set(provider, value); else memoryKeys.delete(provider);
  write(keyName(provider), remember && value ? value : null);
}
export function forgetKey(provider: string) {
  memoryKeys.delete(provider);
  write(keyName(provider), null);
}

export function savedProvider(): string { return read('praxis.provider') || DEFAULT_PROVIDER; }
export function saveProvider(provider: string) { write('praxis.provider', provider); }
export function savedBase(): string { return read('praxis.custom.base'); }
export function saveBase(base: string) { write('praxis.custom.base', base.trim()); }
export function savedModel(provider: string): string { return read(modelName(provider)) || (provider === DEFAULT_PROVIDER ? DEFAULT_MODEL : ''); }
export function saveModel(provider: string, model: string) { write(modelName(provider), model); }
export function savedMode(provider: string): NarrationMode {
  const value = read(modeName(provider));
  return value === 'chat' ? 'chat' : 'prompt';
}
export function saveMode(provider: string, mode: NarrationMode) { write(modeName(provider), mode); }
export function savedFormat(provider: string): FormatChoice { return (read(formatName(provider)) || 'auto') as FormatChoice; }
export function saveFormat(provider: string, format: FormatChoice) { write(formatName(provider), format === 'auto' ? null : format); }

export type Diagnostics = Record<string, unknown>;

// An error that carries the relay's diagnostics, so a failure can be inspected.
export class NarrationError extends Error {
  constructor(message: string, readonly diagnostics: Diagnostics | null, readonly status: number) {
    super(message);
  }
}

async function relay<T>(path: string, provider: string, init: RequestInit = {}): Promise<T> {
  const key = currentKey(provider);
  const response = await fetch(path, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(key ? { 'X-Provider-Key': key } : {}) },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null) as { error?: unknown; diagnostics?: unknown } | null;
  if (!response.ok) {
    const diagnostics = body?.diagnostics && typeof body.diagnostics === 'object' ? body.diagnostics as Diagnostics : null;
    const message = typeof body?.error === 'string' ? body.error : body === null ? `The Praxis server answered ${response.status} with something that was not JSON. Is the API deployed?` : `Narration failed (${response.status}).`;
    throw new NarrationError(message, diagnostics, response.status);
  }
  return body as T;
}

// The providers this Praxis server relays to, then the player's own.
export async function listProviders(): Promise<ProviderView[]> {
  try {
    const body = await relay<{ providers: ProviderView[] }>('/api/narration/providers', '');
    if (Array.isArray(body.providers) && body.providers.length) return [...body.providers, CUSTOM_VIEW];
  } catch {
    // An older server, or none: the built-in list still describes what it relays to.
  }
  return [...BUILT_IN_PROVIDERS.map(({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote }) => ({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote })), CUSTOM_VIEW];
}

// A server of the player's own, called from this page.
async function direct(base: string, path: string, init: RequestInit = {}): Promise<{ response: Response; body: unknown }> {
  const root = customProvider(base).base;
  if (!/^https?:\/\//i.test(root)) throw new NarrationError('Give your server’s address, such as http://localhost:5001/v1.', null, 400);
  const key = currentKey(CUSTOM_PROVIDER);
  let response: Response;
  try {
    response = await fetch(`${root}${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      cache: 'no-store',
    });
  } catch {
    throw new NarrationError(`Could not reach ${root}. Check that it is running and allows requests from this site (CORS). From an https page, plain http works only for localhost.`, null, 0);
  }
  const body = await response.json().catch(() => null);
  return { response, body };
}

export interface ListedModels extends ModelList {
  unlisted?: boolean;
}

export async function listModels(provider: string, base = ''): Promise<ListedModels> {
  if (provider === CUSTOM_PROVIDER) {
    const { response, body } = await direct(base, '/models');
    if (response.status === 404) return { models: [], contexts: {}, unlisted: true };
    if (!response.ok) throw new NarrationError(`Your server answered ${response.status} to a models request.`, null, response.status);
    return readModels(body);
  }
  return relay<ListedModels>(`/api/narration/models?provider=${encodeURIComponent(provider)}`, provider);
}

export interface Narration {
  text: string;
  model: string;
  usage: Record<string, unknown> | null;
  diagnostics?: Diagnostics;
}

export interface NarrateOptions {
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  // The start of the reply; what comes back continues it.
  prefill?: string;
}

export async function narrate(messages: ChatMessage[], target: Target, options: NarrateOptions = {}): Promise<Narration> {
  const request = {
    provider: target.provider,
    model: target.model,
    messages,
    mode: target.mode,
    ...(target.format !== 'auto' ? { format: target.format } : {}),
    max_tokens: options.maxTokens ?? 1000,
    temperature: options.temperature ?? 0.8,
    ...(options.prefill ? { prefill: options.prefill } : {}),
  };
  if (target.provider !== CUSTOM_PROVIDER) {
    return relay<Narration>('/api/narration/chat', target.provider, { method: 'POST', body: JSON.stringify(request), signal: options.signal });
  }
  const parsed = narrationRequestSchema.parse(request);
  const provider = customProvider(target.base);
  const upstream = buildUpstream(parsed, provider);
  const mode = upstream.path === '/completions' ? 'prompt' : 'chat';
  const started = performance.now();
  const { response, body } = await direct(target.base, upstream.path, { method: 'POST', body: JSON.stringify(upstream.body), signal: options.signal });
  const reply = readReply(body);
  const diagnostics = { ...diagnosticsFor(upstream, mode, provider, response.status, reply, parsed.max_tokens, Math.round(performance.now() - started)), model: reply.model ?? parsed.model };
  if (!response.ok) throw new NarrationError(`Your server answered ${response.status}.`, diagnostics, response.status);
  if (!reply.content) throw new NarrationError(emptyReplyReason(reply, parsed.max_tokens, 'Your server', body !== null), diagnostics, 502);
  return { text: reply.content, model: diagnostics.model, usage: reply.usage, diagnostics };
}

// The provider's count of the prompt's tokens, when it sent one.
export function promptTokensOf(usage: Record<string, unknown> | null | undefined): number | null {
  const value = usage?.prompt_tokens;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}
