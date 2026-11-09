// The player's connection to a model provider, for the whole site. These are the adventure's own
// settings in this browser's storage (adventure/src/ui/narration.ts), under the names they have
// always had, so a player who connected there is connected here. Don't rename the keys.
//
// Requests for a listed provider go through the site's relay with the key in a header; a server
// of the player's own is called from here directly. Keys are kept in memory, and in storage only
// when the player ticks "Remember on this device".
import type { FormatId, Message } from '../../core/narration/formats';
import { BUILT_IN_PROVIDERS, CUSTOM_PROVIDER, customProvider, type ProviderInfo } from '../../core/narration/providers';
import { readStreamChunk, sseReader, thinkingFilter } from '../../core/narration/stream';
import { buildUpstream, diagnosticsFor, emptyReplyReason, narrationRequestSchema, readModels, readReply, type ModelList } from '../../core/narration/upstream';

export type NarrationMode = 'prompt' | 'chat';
export type FormatChoice = FormatId | 'auto';
export const DEFAULT_PROVIDER = 'novelai';
export const DEFAULT_MODEL = 'glm-4-6';

export type ProviderView = Pick<ProviderInfo, 'id' | 'name' | 'completions' | 'chatPrefill' | 'keyLabel' | 'keyHint' | 'keyNote'>;
const viewOf = ({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote }: ProviderInfo): ProviderView => ({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote });
export const CUSTOM_VIEW: ProviderView = viewOf(customProvider(''));

export interface Target { provider: string; model: string; mode: NarrationMode; format: FormatChoice; base: string }

const memoryKeys = new Map<string, string>();
function read(key: string): string {
  try { return window.localStorage.getItem(key) ?? ''; } catch { return ''; }
}
function write(key: string, value: string | null) {
  try {
    if (value === null || value === '') window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch { /* storage can be blocked; the value still works for this page */ }
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
export function forgetKey(provider: string) { memoryKeys.delete(provider); write(keyName(provider), null); }

export function savedProvider(): string { return read('praxis.provider') || DEFAULT_PROVIDER; }
export function saveProvider(provider: string) { write('praxis.provider', provider); }
export function savedBase(): string { return read('praxis.custom.base'); }
export function saveBase(base: string) { write('praxis.custom.base', base.trim()); }
export function savedModel(provider: string): string { return read(modelName(provider)) || (provider === DEFAULT_PROVIDER ? DEFAULT_MODEL : ''); }
export function saveModel(provider: string, model: string) { write(modelName(provider), model); }
export function savedMode(provider: string): NarrationMode { return read(modeName(provider)) === 'chat' ? 'chat' : 'prompt'; }
export function saveMode(provider: string, mode: NarrationMode) { write(modeName(provider), mode); }
export function savedFormat(provider: string): FormatChoice { return (read(formatName(provider)) || 'auto') as FormatChoice; }
export function saveFormat(provider: string, format: FormatChoice) { write(formatName(provider), format === 'auto' ? null : format); }

export type Diagnostics = Record<string, unknown>;
export class NarrationError extends Error {
  constructor(message: string, readonly diagnostics: Diagnostics | null, readonly status: number) { super(message); }
}

const headers = (provider: string) => {
  const key = currentKey(provider);
  return { Accept: 'application/json', 'Content-Type': 'application/json', ...(key ? { 'X-Provider-Key': key } : {}) };
};

async function relay<T>(path: string, provider: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, headers: headers(provider), cache: 'no-store' });
  const body = await response.json().catch(() => null) as { error?: unknown; diagnostics?: unknown } | null;
  if (!response.ok) {
    const diagnostics = body?.diagnostics && typeof body.diagnostics === 'object' ? body.diagnostics as Diagnostics : null;
    const message = typeof body?.error === 'string' ? body.error : body === null ? `The site's server answered ${response.status} with something that was not JSON. Is it running?` : `The request failed (${response.status}).`;
    throw new NarrationError(message, diagnostics, response.status);
  }
  return body as T;
}

// The providers this site relays to, then the player's own server.
export async function listProviders(): Promise<ProviderView[]> {
  try {
    const body = await relay<{ providers: ProviderView[] }>('/api/narration/providers', '');
    if (Array.isArray(body.providers) && body.providers.length) return [...body.providers, CUSTOM_VIEW];
  } catch { /* an older server, or none: the built-in list still describes what it relays to */ }
  return [...BUILT_IN_PROVIDERS.map(viewOf), CUSTOM_VIEW];
}

function customRoot(base: string): string {
  const root = customProvider(base).base;
  if (!/^https?:\/\//i.test(root)) throw new NarrationError('Give your server’s address, such as http://localhost:5001/v1.', null, 400);
  return root;
}
async function direct(base: string, path: string, init: RequestInit = {}): Promise<Response> {
  const root = customRoot(base);
  const key = currentKey(CUSTOM_PROVIDER);
  try {
    return await fetch(`${root}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) }, cache: 'no-store' });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new NarrationError(`Could not reach ${root}. Check that it is running and allows requests from this site (CORS). From an https page, plain http works only for localhost.`, null, 0);
  }
}

export interface ListedModels extends ModelList { unlisted?: boolean }

export async function listModels(provider: string, base = ''): Promise<ListedModels> {
  if (provider === CUSTOM_PROVIDER) {
    const response = await direct(base, '/models');
    if (response.status === 404) return { models: [], contexts: {}, unlisted: true };
    if (!response.ok) throw new NarrationError(`Your server answered ${response.status} to a models request.`, null, response.status);
    return readModels(await response.json().catch(() => null));
  }
  return relay<ListedModels>(`/api/narration/models?provider=${encodeURIComponent(provider)}`, provider);
}

export interface Generated { text: string; model: string; usage: Record<string, unknown> | null; diagnostics?: Diagnostics }

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  stop?: string[];
  prefill?: string;
  signal?: AbortSignal;
  // Called with each piece of text as it arrives. The promise resolves with the whole reply.
  onDelta?: (text: string) => void;
}

// The request as the relay takes it. Shown to the player as "What was sent".
export function requestFor(messages: Message[], target: Target, options: GenerateOptions) {
  return {
    provider: target.provider,
    model: target.model,
    messages,
    mode: target.mode,
    ...(target.format !== 'auto' ? { format: target.format } : {}),
    max_tokens: options.maxTokens ?? 1000,
    temperature: options.temperature ?? 0.8,
    ...(options.top_p !== undefined ? { top_p: options.top_p } : {}),
    ...(options.top_k !== undefined ? { top_k: options.top_k } : {}),
    ...(options.min_p !== undefined ? { min_p: options.min_p } : {}),
    ...(options.stop?.length ? { stop: options.stop } : {}),
    ...(options.prefill ? { prefill: options.prefill } : {}),
  };
}

type RelayEvent = { type: 'delta'; text: string } | { type: 'done'; text: string; model: string; usage: Record<string, unknown> | null; diagnostics?: Diagnostics } | { type: 'error'; status: number; error: string; diagnostics?: Diagnostics };

async function readEvents(response: Response, onPayload: (payload: string) => void): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const events = sseReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const payload of events.push(decoder.decode(value, { stream: true }))) onPayload(payload);
  }
  for (const payload of events.rest()) onPayload(payload);
}

// One reply, streamed where the provider streams and whole where it doesn't.
export async function generate(messages: Message[], target: Target, options: GenerateOptions = {}): Promise<Generated> {
  const request = requestFor(messages, target, options);
  if (target.provider !== CUSTOM_PROVIDER) {
    const response = await fetch('/api/narration/stream', { method: 'POST', headers: { ...headers(target.provider), Accept: 'text/event-stream' }, body: JSON.stringify(request), signal: options.signal, cache: 'no-store' });
    // A server from before streaming: ask for the whole reply instead.
    if (response.status === 404 || response.status === 405) {
      const whole = await relay<Generated>('/api/narration/chat', target.provider, { method: 'POST', body: JSON.stringify(request), signal: options.signal });
      options.onDelta?.(whole.text);
      return whole;
    }
    if (!response.ok || !response.body) throw new NarrationError(`The site's server answered ${response.status}.`, null, response.status);
    let result: Generated | null = null;
    let failure: NarrationError | null = null;
    await readEvents(response, (payload) => {
      let event: RelayEvent;
      try { event = JSON.parse(payload) as RelayEvent; } catch { return; }
      if (event.type === 'delta') options.onDelta?.(event.text);
      else if (event.type === 'done') result = { text: event.text, model: event.model, usage: event.usage, diagnostics: event.diagnostics };
      else if (event.type === 'error') failure = new NarrationError(event.error, event.diagnostics ?? null, event.status);
    });
    if (failure) throw failure;
    if (!result) throw new NarrationError('The reply stopped before it finished.', null, 502);
    return result;
  }

  const parsed = narrationRequestSchema.parse(request);
  const provider = customProvider(target.base);
  const upstream = buildUpstream(parsed, provider, true);
  const mode = upstream.path === '/completions' ? 'prompt' : 'chat';
  const started = performance.now();
  const response = await direct(target.base, upstream.path, { method: 'POST', body: JSON.stringify(upstream.body), signal: options.signal });
  const finish = (reply: ReturnType<typeof readReply>, parsedOk: boolean): Generated => {
    const diagnostics = { ...diagnosticsFor(upstream, mode, provider, response.status, reply, parsed.max_tokens, Math.round(performance.now() - started)), model: reply.model ?? parsed.model };
    if (!response.ok) throw new NarrationError(`Your server answered ${response.status}.`, diagnostics, response.status);
    if (!reply.content) throw new NarrationError(emptyReplyReason(reply, parsed.max_tokens, 'Your server', parsedOk), diagnostics, 502);
    return { text: reply.content, model: diagnostics.model, usage: reply.usage, diagnostics };
  };
  if (!response.ok || !response.body || !(response.headers.get('content-type') ?? '').includes('text/event-stream')) {
    const body = await response.json().catch(() => null);
    const whole = finish(readReply(body), body !== null);
    options.onDelta?.(whole.text);
    return whole;
  }
  const filter = thinkingFilter();
  let reasoning = '';
  let finishReason: string | null = null;
  let model: string | null = null;
  let usage: Record<string, unknown> | null = null;
  await readEvents(response, (payload) => {
    const chunk = readStreamChunk(payload);
    if (!chunk) return;
    reasoning += chunk.reasoning;
    finishReason = chunk.finishReason ?? finishReason;
    model = chunk.model ?? model;
    usage = chunk.usage ?? usage;
    const text = chunk.text ? filter.push(chunk.text) : '';
    if (text) options.onDelta?.(text);
  });
  const content = filter.text();
  return finish({ content: content.trim() ? content : '', reasoning, finishReason, model, usage, choice: null }, true);
}

// --- The connection as the interface holds it.

export interface Connection extends Target {
  connected: boolean;
  models: string[];
  // How much each model can read, where the provider says.
  contexts: Record<string, number>;
  // The provider lists no models, so the player types the name.
  unlisted: boolean;
  providers: ProviderView[];
}

export function initialConnection(): Connection {
  const provider = savedProvider();
  return { connected: false, provider, model: savedModel(provider), mode: savedMode(provider), format: savedFormat(provider), base: savedBase(), models: [], contexts: {}, unlisted: false, providers: [] };
}

export const providerOf = (connection: Pick<Connection, 'provider' | 'providers'>): ProviderView =>
  connection.providers.find((entry) => entry.id === connection.provider) ?? (connection.provider === CUSTOM_PROVIDER ? CUSTOM_VIEW : { ...CUSTOM_VIEW, id: connection.provider, name: connection.provider });

function pickModel(models: string[], wanted: string, provider: string): string {
  if (wanted && (models.includes(wanted) || !models.length)) return wanted;
  if (provider === 'novelai' && models.includes(DEFAULT_MODEL)) return DEFAULT_MODEL;
  return models[0] ?? wanted;
}

// The settings that belong to one provider, read back when the player switches to it.
export function forProvider(connection: Connection, provider: string): Connection {
  return { ...connection, provider, model: savedModel(provider), mode: savedMode(provider), format: savedFormat(provider), models: [], contexts: {}, unlisted: false, connected: false };
}

export async function connectWith(connection: Connection): Promise<Connection> {
  const listed = await listModels(connection.provider, connection.base);
  const model = pickModel(listed.models, connection.model, connection.provider);
  const mode: NarrationMode = providerOf(connection).completions ? connection.mode : 'chat';
  if (model) saveModel(connection.provider, model);
  saveProvider(connection.provider);
  return { ...connection, connected: true, model, mode, models: listed.models, contexts: listed.contexts, unlisted: Boolean(listed.unlisted) || !listed.models.length };
}

// Connects with whatever key is already known. Used at start when one was remembered.
export async function reconnect(connection: Connection): Promise<Connection> {
  const providers = await listProviders();
  const known = providers.some((entry) => entry.id === connection.provider) ? connection : forProvider({ ...connection, providers }, providers[0]!.id);
  const ready = { ...known, providers };
  const canTry = ready.provider === CUSTOM_PROVIDER ? Boolean(ready.base) : Boolean(currentKey(ready.provider));
  if (!canTry) return ready;
  try { return await connectWith(ready); } catch { return { ...ready, connected: false }; }
}

// Whether the model can be handed the start of its reply to carry on: a completions prompt, or a
// provider that continues a last assistant message.
export function canPrefill(connection: Pick<Connection, 'provider' | 'providers' | 'mode'>): boolean {
  const provider = providerOf(connection);
  return (connection.mode === 'prompt' && provider.completions) || provider.chatPrefill === 'assistant';
}
