// The browser side of narration. Requests for a known provider go to the Praxis server's relay
// with the player's key in a header; a server of the player's own is called from here directly,
// with the same request the relay would send. Keys are kept in memory, and in this browser's
// storage only when the player ticks "Remember on this device".
// One set of keys and saved choices for the whole site: they are the kit's (kit/src/connection.ts),
// so a key typed on the Settings page, in Chat or in the Studio is the one the narrator uses.
import type { ChatMessage } from '../engine';
import { CUSTOM_PROVIDER, customProvider } from '../../../core/narration/providers';
import { buildUpstream, diagnosticsFor, emptyReplyReason, narrationRequestSchema, readReply } from '../../../core/narration/upstream';
import { NarrationError, currentKey, type Diagnostics, type Target } from '../../../kit/src/connection';

export {
  CUSTOM_VIEW, DEFAULT_MODEL, DEFAULT_PROVIDER, NarrationError, currentKey, forgetKey, listModels, listProviders, rememberedKey, saveBase, saveFormat,
  saveMode, saveModel, saveProvider, savedBase, savedFormat, savedMode, savedModel, savedProvider, setKey,
  type Diagnostics, type FormatChoice, type ListedModels, type NarrationMode, type ProviderView, type Target,
} from '../../../kit/src/connection';

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
    const message = typeof body?.error === 'string' ? body.error : body === null ? `The Inkwyrm server answered ${response.status} with something that was not JSON. Is the API deployed?` : `Narration failed (${response.status}).`;
    throw new NarrationError(message, diagnostics, response.status);
  }
  return body as T;
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
  // How much a thinking model should think, where the provider lets it be set.
  thinking?: 'default' | 'low' | 'off';
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
    ...(options.thinking && options.thinking !== 'default' ? { thinking: options.thinking } : {}),
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
