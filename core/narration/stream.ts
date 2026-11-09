// Streaming, shared by the server's relay and the browser (for a server of the player's own).
// A provider that streams sends server-sent events, each a JSON chunk in OpenAI's shape; this
// reads them into text as it arrives, keeping a model's thinking out of what the player sees.
import { stripThinking } from './upstream.js';

// Splits a byte stream's text into the `data:` payloads of complete events.
export function sseReader() {
  let buffer = '';
  return {
    push(chunk: string): string[] {
      buffer += chunk.replace(/\r\n?/g, '\n');
      const out: string[] = [];
      let end = buffer.indexOf('\n\n');
      while (end >= 0) {
        const event = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = event.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).replace(/^ /, '')).join('\n');
        if (data) out.push(data);
        end = buffer.indexOf('\n\n');
      }
      return out;
    },
    // Whatever is left when the stream closes without a final blank line.
    rest(): string[] {
      const data = buffer.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).replace(/^ /, '')).join('\n');
      buffer = '';
      return data ? [data] : [];
    },
  };
}

export interface StreamChunk {
  text: string;
  reasoning: string;
  finishReason: string | null;
  model: string | null;
  usage: Record<string, unknown> | null;
  error: string | null;
}

// One event's payload, in any of the places OpenAI-style providers put streamed text.
export function readStreamChunk(payload: string): StreamChunk | null {
  if (payload.trim() === '[DONE]') return null;
  let json: unknown;
  try { json = JSON.parse(payload); } catch { return null; }
  const top = json && typeof json === 'object' ? json as Record<string, unknown> : {};
  const choice = Array.isArray(top.choices) && top.choices[0] && typeof top.choices[0] === 'object' ? top.choices[0] as Record<string, unknown> : null;
  const delta = choice?.delta && typeof choice.delta === 'object' ? choice.delta as Record<string, unknown> : null;
  const message = choice?.message && typeof choice.message === 'object' ? choice.message as Record<string, unknown> : null;
  const first = (...values: unknown[]) => (values.find((value) => typeof value === 'string' && value.length > 0) as string | undefined) ?? '';
  const error = top.error && typeof top.error === 'object' ? (top.error as { message?: unknown }).message : top.error;
  return {
    text: first(delta?.content, choice?.text, message?.content),
    reasoning: first(delta?.reasoning_content, delta?.reasoning),
    finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : null,
    model: typeof top.model === 'string' ? top.model : null,
    usage: top.usage && typeof top.usage === 'object' ? top.usage as Record<string, unknown> : null,
    error: typeof error === 'string' ? error : null,
  };
}

// Text as it arrives, with thinking held back: nothing inside <think>…</think> is passed on, and
// a tag split across two chunks is waited for. `text()` is the whole reply so far, cleaned.
export function thinkingFilter() {
  let raw = '';
  let shown = 0;
  const visible = () => {
    let clean = stripThinking(raw);
    // Hold back a tag that may still be arriving.
    const partial = /<\/?t?h?i?n?k?>?$/i.exec(clean);
    if (partial && partial[0] && '<think>'.startsWith(partial[0].toLowerCase().replace('/', ''))) clean = clean.slice(0, partial.index);
    return clean;
  };
  return {
    push(chunk: string): string {
      raw += chunk;
      const clean = visible();
      // Stripping can shorten what was shown (a late </think>); then nothing new goes out.
      if (clean.length <= shown) { shown = Math.min(shown, clean.length); return ''; }
      const next = clean.slice(shown);
      shown = clean.length;
      return next;
    },
    text: () => stripThinking(raw),
    raw: () => raw,
  };
}
