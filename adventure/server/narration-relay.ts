// Relays narration to the providers Praxis knows, with the player's own key.
//
// The key arrives with each request and goes straight to the provider. It is never stored,
// never logged and never echoed back, and there is no server-side key to fall back on, so the
// relay can only spend the account of whoever is calling it. It forwards only to the
// providers in its list, only to their models, chat and completions paths, and every body is
// validated first, so it cannot be used to reach anywhere else.
//
// This lives until Orbis's generation gateway can carry Praxis; see the charter.
import { CUSTOM_PROVIDER, type ProviderInfo } from '../../core/narration/providers.js';
import { buildUpstream, diagnosticsFor, emptyReplyReason, narrationRequestSchema, readModels, readReply } from '../../core/narration/upstream.js';

export interface RelayResult {
  status: number;
  body: unknown;
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

function cleanKey(raw: string | undefined): string | null {
  const key = (raw ?? '').trim().replace(/^Bearer\s+/i, '');
  return key.length >= 8 && key.length <= 4096 && !/\s/.test(key) ? key : null;
}

// What the interface needs to know about each provider. Nothing here is secret.
export function publicProviders(providers: ProviderInfo[]) {
  return providers.map(({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote }) => ({ id, name, completions, chatPrefill, keyLabel, keyHint, keyNote }));
}

function find(providers: ProviderInfo[], id: string | undefined): ProviderInfo | null {
  if (!id || id === CUSTOM_PROVIDER) return null;
  return providers.find((provider) => provider.id === id) ?? null;
}

const unknownProvider = (id: string | undefined): RelayResult => ({
  status: 400,
  body: { error: id === CUSTOM_PROVIDER ? 'Your own server is called from the browser, not through Praxis.' : `Praxis doesn't relay to "${id ?? ''}".` },
});
const missingKey = (provider: ProviderInfo): RelayResult => ({ status: 401, body: { error: `Connect ${provider.name} with your ${provider.keyLabel} first.` } });

async function upstreamError(response: Response, provider: ProviderInfo): Promise<RelayResult> {
  let message = '';
  let raw = '';
  try {
    const text = await response.text();
    raw = text.slice(0, 600);
    try {
      const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
      const error = parsed.error && typeof parsed.error === 'object' ? (parsed.error as { message?: unknown }).message : parsed.error;
      message = typeof parsed.message === 'string' ? parsed.message : typeof error === 'string' ? error : '';
    } catch {
      message = text.slice(0, 300);
    }
  } catch {
    // The status alone still says enough.
  }
  const status = [400, 401, 402, 403, 404, 429].includes(response.status) ? response.status : 502;
  const fallback = status === 401 ? `${provider.name} did not accept that key.`
    : status === 402 ? `${provider.name} says the account is out of credit.`
      : status === 429 ? `${provider.name} is rate limiting requests; wait a moment.`
        : `${provider.name} could not complete the request.`;
  return { status, body: { error: message.trim() || fallback, diagnostics: { provider: provider.id, status: response.status, upstreamBody: raw } } };
}

export async function relayModels(fetchImpl: Fetch, providers: ProviderInfo[], providerId: string | undefined, rawKey: string | undefined): Promise<RelayResult> {
  const provider = find(providers, providerId);
  if (!provider) return unknownProvider(providerId);
  const key = cleanKey(rawKey);
  if (!key) return missingKey(provider);
  let response: Response;
  try {
    response = await fetchImpl(`${provider.base}/models`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { status: 502, body: { error: `Could not reach ${provider.name}.` } };
  }
  // Some providers list no models. The key is checked on the first narration instead, and
  // the player types the model's name.
  if (response.status === 404 || response.status === 405) return { status: 200, body: { models: [], contexts: {}, unlisted: true } };
  if (!response.ok) return upstreamError(response, provider);
  const body = await response.json().catch(() => null);
  return { status: 200, body: readModels(body) };
}

export async function relayChat(fetchImpl: Fetch, providers: ProviderInfo[], rawKey: string | undefined, raw: unknown): Promise<RelayResult> {
  const parsed = narrationRequestSchema.safeParse(raw);
  if (!parsed.success) return { status: 400, body: { error: `Invalid narration request: ${parsed.error.issues[0]?.message ?? 'unknown problem'}.` } };
  const request = parsed.data;
  const provider = find(providers, request.provider);
  if (!provider) return unknownProvider(request.provider);
  const key = cleanKey(rawKey);
  if (!key) return missingKey(provider);
  const upstream = buildUpstream(request, provider);
  const mode = upstream.path === '/completions' ? 'prompt' : 'chat';

  // How long the provider took, measured here so the browser's own distance to this server
  // does not count. The generation test compares these.
  const started = performance.now();
  const upstreamMs = () => Math.round(performance.now() - started);
  let response: Response;
  try {
    response = await fetchImpl(`${provider.base}${upstream.path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(upstream.body),
      signal: AbortSignal.timeout(180_000),
    });
  } catch {
    return { status: 502, body: { error: `Could not reach ${provider.name}.`, diagnostics: { provider: provider.id, endpoint: upstream.path, mode, upstreamMs: upstreamMs() } } };
  }
  if (!response.ok) {
    const failed = await upstreamError(response, provider);
    const body = failed.body as { error: string; diagnostics?: Record<string, unknown> };
    return { status: failed.status, body: { ...body, diagnostics: { ...body.diagnostics, endpoint: upstream.path, mode, format: upstream.format, upstreamMs: upstreamMs() } } };
  }
  const json = await response.json().catch(() => null);
  const reply = readReply(json);
  const diagnostics = { ...diagnosticsFor(upstream, mode, provider, response.status, reply, request.max_tokens, upstreamMs()), model: reply.model ?? request.model };
  if (!reply.content) {
    logEmptyReply(provider.id, upstream.path, reply, request.max_tokens);
    return { status: 502, body: { error: emptyReplyReason(reply, request.max_tokens, provider.name, json !== null), diagnostics } };
  }
  return { status: 200, body: { text: reply.content, model: diagnostics.model, usage: reply.usage, diagnostics } };
}

// Server log for an empty reply. Structure only: never provider text, prompts, keys or reasoning.
function logEmptyReply(provider: string, endpoint: string, reply: ReturnType<typeof readReply>, requestedMaxTokens: number) {
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  console.warn('[narration] empty-reply', JSON.stringify({
    provider,
    endpoint,
    hasChoice: Boolean(reply.choice),
    hasReasoning: Boolean(reply.reasoning),
    finishReason: ['stop', 'length', 'content_filter', 'tool_calls', 'function_call'].includes(String(reply.finishReason)) ? reply.finishReason : 'unknown',
    promptTokens: count(reply.usage?.prompt_tokens),
    completionTokens: count(reply.usage?.completion_tokens),
    requestedMaxTokens,
    choiceFields: reply.choice ? Object.keys(reply.choice) : [],
  }));
}
