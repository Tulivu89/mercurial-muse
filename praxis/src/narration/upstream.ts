// One narration request, from Praxis's messages to the provider's body and back to a reply.
// The server's relay and the browser (for a server of the player's own) share it, so both
// send exactly the same thing.
import { z } from 'zod';
import { FORMAT_IDS, formatPrompt, guessFormat, type FormatId, type Message } from './formats.js';
import type { ProviderInfo } from './providers.js';

export const narrationRequestSchema = z.object({
  provider: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(200),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().max(400_000),
  })).min(1).max(500),
  // Reasoning models spend part of this thinking before they answer, so it is generous.
  max_tokens: z.number().int().min(16).max(8192).default(2048),
  temperature: z.number().min(0).max(2).default(0.8),
  // 'prompt' writes the messages out as one prompt in the model's format and sends it to the
  // completions endpoint, where the model continues the prefill. 'chat' sends the messages.
  mode: z.enum(['chat', 'prompt']).default('prompt'),
  // The prompt format; left out, it is guessed from the model's name.
  format: z.enum(FORMAT_IDS).optional(),
  prefill: z.string().max(20_000).optional(),
}).strict();
export type NarrationRequest = z.infer<typeof narrationRequestSchema>;

export interface Upstream {
  path: '/chat/completions' | '/completions';
  body: Record<string, unknown>;
  format: FormatId | null;
}

export function buildUpstream(request: NarrationRequest, provider: ProviderInfo): Upstream {
  const { messages, prefill, model, max_tokens, temperature } = request;
  const mode = request.mode === 'prompt' && provider.completions ? 'prompt' : 'chat';
  if (mode === 'prompt') {
    const format = request.format ?? guessFormat(model);
    const { prompt, stop } = formatPrompt(format, messages as Message[], prefill ?? '');
    return { path: '/completions', format, body: { model, prompt, stop, max_tokens, temperature, stream: false } };
  }
  const sent: Message[] = [...messages];
  if (prefill) sent.push({ role: provider.chatPrefill === 'assistant' ? 'assistant' : 'system', content: prefill });
  return { path: '/chat/completions', format: null, body: { model, messages: sent, max_tokens, temperature, stream: false, ...(provider.thinkingOff ?? {}) } };
}

// Thinking a model wrote into its reply, which the player should never see.
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '').replace(/^\s*<think>[\s\S]*$/i, '');
}

export interface Reply {
  content: string;
  reasoning: string;
  finishReason: string | null;
  model: string | null;
  usage: Record<string, unknown> | null;
  choice: Record<string, unknown> | null;
}

// The reply in any of the places OpenAI-style providers put it.
export function readReply(body: unknown): Reply {
  const top = body && typeof body === 'object' ? body as Record<string, unknown> : null;
  const choices = Array.isArray(top?.choices) ? top.choices : [];
  const choice = choices[0] && typeof choices[0] === 'object' ? choices[0] as Record<string, unknown> : null;
  const message = choice?.message && typeof choice.message === 'object' ? choice.message as Record<string, unknown> : null;
  const firstText = (...values: unknown[]) => (values.find((value) => typeof value === 'string' && value.trim()) as string | undefined) ?? '';
  const raw = firstText(message?.content, choice?.text, choice?.parsedContent, choice?.parsed_content);
  const reasoningRaw = message?.reasoning_content ?? message?.reasoning;
  return {
    content: stripThinking(raw).trim() ? stripThinking(raw) : '',
    reasoning: typeof reasoningRaw === 'string' ? reasoningRaw : '',
    finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : null,
    model: typeof top?.model === 'string' ? top.model : null,
    usage: top?.usage && typeof top.usage === 'object' ? top.usage as Record<string, unknown> : null,
    choice,
  };
}

// The model ids a provider lists, and how much each can read when it says.
export interface ModelList {
  models: string[];
  contexts: Record<string, number>;
}

export function readModels(body: unknown): ModelList {
  const top = body && typeof body === 'object' ? body as Record<string, unknown> : null;
  const data: unknown[] = Array.isArray(top?.data) ? top.data : Array.isArray(body) ? body : [];
  const models: string[] = [];
  const contexts: Record<string, number> = {};
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== 'string' || !record.id) continue;
    models.push(record.id);
    const size = [record.context_length, record.max_context_length, record.context_window, (record.top_provider as Record<string, unknown> | undefined)?.context_length]
      .find((value) => typeof value === 'number' && Number.isFinite(value) && value > 0);
    if (typeof size === 'number') contexts[record.id] = size;
  }
  return { models, contexts };
}

// The first choice as a readable record for the diagnostics panel: long lists become a
// count, logprobs are dropped.
export function describeChoice(choice: unknown): string {
  if (!choice || typeof choice !== 'object') return JSON.stringify(choice ?? null);
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(choice as Record<string, unknown>)) {
    if (key === 'logprobs') continue;
    copy[key] = Array.isArray(value) && value.length > 8 ? `[${value.length} items: ${value.slice(0, 8).join(', ')}, ...]` : value;
  }
  return JSON.stringify(copy).slice(0, 1500);
}

// What the diagnostics panel shows for one reply. Never includes a key.
export function diagnosticsFor(upstream: Upstream, mode: string, provider: ProviderInfo, status: number, reply: Reply, maxTokens: number, ms: number) {
  const message = reply.choice?.message && typeof reply.choice.message === 'object' ? reply.choice.message as Record<string, unknown> : null;
  return {
    provider: provider.id,
    endpoint: upstream.path,
    mode,
    format: upstream.format,
    status,
    model: reply.model,
    finishReason: reply.finishReason,
    contentLength: reply.content.length,
    reasoningLength: reply.reasoning.length,
    reasoningPreview: reply.reasoning.slice(0, 600),
    choiceFields: reply.choice ? Object.keys(reply.choice).concat(message ? Object.keys(message).map((key) => `message.${key}`) : []) : [],
    textType: reply.choice && 'text' in reply.choice ? (reply.choice.text === null ? 'null' : typeof reply.choice.text) : 'absent',
    rawChoice: describeChoice(reply.choice),
    maxTokens,
    upstreamMs: ms,
    usage: reply.usage,
  };
}

export function emptyReplyReason(reply: Reply, maxTokens: number, providerName: string, parsed: boolean): string {
  if (reply.reasoning && reply.finishReason === 'length') return `The model used its whole allowance (${maxTokens} tokens) thinking and wrote no reply.`;
  if (!parsed) return `${providerName} sent something that was not JSON.`;
  if (reply.finishReason === 'content_filter') return `${providerName} filtered the reply.`;
  return `${providerName} returned an empty reply.`;
}
