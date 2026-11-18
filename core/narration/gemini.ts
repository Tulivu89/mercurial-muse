// Google's own Gemini API, for the Google AI Studio provider (docs/reviews/prompt-setup/decision.md,
// P2). Its OpenAI-style route can't take safety settings, so a story that needs room is stopped by
// filters the player never chose. Here every harm category is set OFF, the leading system messages
// become the system instruction, and replies, stream pieces, finish reasons and blocked prompts are
// read back into the shapes the relay already uses (Reply, StreamChunk).
//
// Shared by the server's relay and its tests; it imports no server code.
import { GEMINI_SAFETY, type ProviderInfo } from './providers.js';
import type { StreamChunk } from './stream.js';
import { stripThinking, type NarrationRequest, type Reply, type Upstream } from './upstream.js';

// The provider's listed base is its OpenAI-style one (…/v1beta/openai); the API itself is one up.
export const geminiBase = (base: string) => base.replace(/\/openai\/?$/, '');

// Google's stop strings: at most five, each 1 to 16 characters.
const geminiStops = (stops: readonly string[]) => stops.filter((stop) => stop.length >= 1 && stop.length <= 16).slice(0, 5);

interface GeminiPart { text: string }
interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }

// Our messages in Google's shape. Leading system messages become the system instruction (folded
// into the first user turn for Gemma, which takes none); a later system message rides in the user
// turn beside it; turns of one role are merged; the conversation starts with the user.
export function geminiContents(messages: NarrationRequest['messages'], model: string): { system: string; contents: GeminiContent[] } {
  let at = 0;
  const leading: string[] = [];
  while (at < messages.length && messages[at]!.role === 'system') { leading.push(messages[at]!.content); at += 1; }
  const contents: GeminiContent[] = [];
  const push = (role: 'user' | 'model', text: string) => {
    if (!text.trim()) return;
    const last = contents.at(-1);
    if (last?.role === role) last.parts[0]!.text += `\n\n${text}`;
    else contents.push({ role, parts: [{ text }] });
  };
  for (const message of messages.slice(at)) push(message.role === 'assistant' ? 'model' : 'user', message.content);
  if (contents[0]?.role !== 'user') contents.unshift({ role: 'user', parts: [{ text: '[The chat begins.]' }] });
  let system = leading.join('\n\n').trim();
  if (system && /gemma/i.test(model)) {
    contents[0]!.parts[0]!.text = `${system}\n\n${contents[0]!.parts[0]!.text}`;
    system = '';
  }
  return { system, contents };
}

// The request. A model id may come as Google lists it ("models/…") or bare.
export function geminiUpstream(request: NarrationRequest, provider: ProviderInfo, stream = false): Upstream {
  const model = request.model.replace(/^models\//, '');
  const { system, contents } = geminiContents(request.messages, request.model);
  const stops = geminiStops(request.stop ?? []);
  const generationConfig = {
    maxOutputTokens: request.max_tokens + (provider.thinkingRoom ?? 0),
    temperature: request.temperature,
    ...(request.top_p !== undefined ? { topP: request.top_p } : {}),
    ...(request.top_k !== undefined ? { topK: request.top_k } : {}),
    ...(stops.length ? { stopSequences: stops } : {}),
  };
  return {
    path: `/models/${encodeURIComponent(model)}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`,
    format: null,
    body: { contents, ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}), generationConfig, safetySettings: GEMINI_SAFETY },
  };
}

// Google's finish reasons in the OpenAI words the rest of the site reads.
export function geminiFinish(reason: unknown): string | null {
  if (typeof reason !== 'string' || !reason) return null;
  if (reason === 'STOP') return 'stop';
  if (reason === 'MAX_TOKENS') return 'length';
  if (['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_SAFETY', 'LANGUAGE'].includes(reason)) return 'content_filter';
  return reason.toLowerCase();
}

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);

// What one response (or one stream piece) carries: the text, any thinking, why it ended, the
// counts in OpenAI's names, the model, and a blocked prompt's reason.
function readPiece(body: unknown) {
  const top = isObject(body) ? body : {};
  const candidate = Array.isArray(top.candidates) && isObject(top.candidates[0]) ? top.candidates[0] : null;
  const parts = candidate && isObject(candidate.content) && Array.isArray(candidate.content.parts) ? candidate.content.parts.filter(isObject) : [];
  const text = parts.filter((part) => part.thought !== true && typeof part.text === 'string').map((part) => part.text as string).join('');
  const reasoning = parts.filter((part) => part.thought === true && typeof part.text === 'string').map((part) => part.text as string).join('');
  const feedback = isObject(top.promptFeedback) ? top.promptFeedback : {};
  const blocked = typeof feedback.blockReason === 'string' ? feedback.blockReason : '';
  const finishRaw = candidate?.finishReason;
  const meta = isObject(top.usageMetadata) ? top.usageMetadata : null;
  const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
  const usage = meta ? {
    prompt_tokens: count(meta.promptTokenCount),
    completion_tokens: (count(meta.candidatesTokenCount) ?? 0) + (count(meta.thoughtsTokenCount) ?? 0),
    total_tokens: count(meta.totalTokenCount),
    ...(count(meta.thoughtsTokenCount) ? { completion_tokens_details: { reasoning_tokens: count(meta.thoughtsTokenCount) } } : {}),
  } : null;
  const error = isObject(top.error) && typeof top.error.message === 'string' ? top.error.message : null;
  return {
    text,
    reasoning,
    finishReason: blocked ? 'content_filter' : geminiFinish(finishRaw),
    filterReason: blocked || (geminiFinish(finishRaw) === 'content_filter' ? String(finishRaw) : ''),
    model: typeof top.modelVersion === 'string' ? top.modelVersion : null,
    usage,
    error,
    candidate,
  };
}

export function readGeminiReply(body: unknown): Reply {
  const piece = readPiece(body);
  return {
    content: stripThinking(piece.text).trim() ? stripThinking(piece.text) : '',
    reasoning: piece.reasoning,
    finishReason: piece.finishReason,
    model: piece.model,
    usage: piece.usage,
    choice: piece.candidate,
    ...(piece.filterReason ? { filterReason: piece.filterReason } : {}),
  };
}

export function readGeminiChunk(payload: string): (StreamChunk & { filterReason: string }) | null {
  let json: unknown;
  try { json = JSON.parse(payload); } catch { return null; }
  const piece = readPiece(json);
  return { text: piece.text, reasoning: piece.reasoning, finishReason: piece.finishReason, model: piece.model, usage: piece.usage, error: piece.error, filterReason: piece.filterReason };
}
