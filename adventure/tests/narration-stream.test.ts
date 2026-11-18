// @vitest-environment node
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { BUILT_IN_PROVIDERS } from '../../core/narration/providers';
import { createApp } from '../server/app';
import { relayStream, type StreamEvent } from '../server/narration-relay';

const key = 'pst-abcdefghijklmnop';
const chat = { provider: 'novelai', model: 'glm-4-6', mode: 'chat', messages: [{ role: 'user', content: 'Hello.' }] };

function streaming(chunks: string[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const body = new ReadableStream<Uint8Array>({ start(controller) { for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk)); controller.close(); } });
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  };
  return { calls, fetchImpl };
}
const piece = (content: string, extra: Record<string, unknown> = {}) => `data: ${JSON.stringify({ model: 'glm-4-6', choices: [{ delta: { content }, ...extra }] })}\n\n`;

async function collect(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>, body: unknown, rawKey: string | undefined = key) {
  const events: StreamEvent[] = [];
  await relayStream(fetchImpl, BUILT_IN_PROVIDERS, rawKey, body, (event) => events.push(event));
  return events;
}

describe('the streaming relay', () => {
  it('passes text on as it arrives and ends with the whole reply', async () => {
    const upstream = streaming([piece('*Ra'), piece('in.*'), `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 9 } })}\n\ndata: [DONE]\n\n`]);
    const events = await collect(upstream.fetchImpl, chat);
    expect(events.map((event) => event.event)).toEqual(['delta', 'delta', 'done']);
    expect(events[0]).toEqual({ event: 'delta', data: { text: '*Ra' } });
    expect(events[2]).toMatchObject({ event: 'done', data: { text: '*Rain.*', model: 'glm-4-6', usage: { prompt_tokens: 9 }, diagnostics: { streamed: true, finishReason: 'stop', endpoint: '/chat/completions' } } });
    expect(JSON.parse(String(upstream.calls[0]!.init!.body)).stream).toBe(true);
    expect((upstream.calls[0]!.init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${key}`);
  });

  it('never shows a model\'s thinking', async () => {
    const events = await collect(streaming([piece('<think>pl'), piece('an</think>'), piece('Hello.')]).fetchImpl, chat);
    expect(events.filter((event) => event.event === 'delta').map((event) => (event.data as { text: string }).text).join('')).toBe('Hello.');
    expect(events.at(-1)).toMatchObject({ event: 'done', data: { text: 'Hello.' } });
  });

  it('hands a whole reply on in one piece when the provider does not stream', async () => {
    const whole = async () => new Response(JSON.stringify({ choices: [{ message: { content: 'All at once.' } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const events = await collect(whole, chat);
    expect(events).toMatchObject([{ event: 'delta', data: { text: 'All at once.' } }, { event: 'done', data: { text: 'All at once.', diagnostics: { streamed: false } } }]);
  });

  it('reports failures in the relay\'s own shape and never echoes the key', async () => {
    expect(await collect(streaming([]).fetchImpl, chat, '')).toMatchObject([{ event: 'error', data: { status: 401 } }]);
    expect(await collect(streaming([]).fetchImpl, { ...chat, provider: 'elsewhere' })).toMatchObject([{ event: 'error', data: { status: 400 } }]);
    const refused = async () => new Response(JSON.stringify({ error: { message: 'Bad key.' } }), { status: 401 });
    const events = await collect(refused, chat);
    expect(events).toMatchObject([{ event: 'error', data: { status: 401, error: 'Bad key.' } }]);
    expect(JSON.stringify(events)).not.toContain(key);
    const silent = console.warn;
    console.warn = () => {};
    try { expect(await collect(streaming(['data: [DONE]\n\n']).fetchImpl, chat)).toMatchObject([{ event: 'error', data: { status: 502 } }]); } finally { console.warn = silent; }
  });

  it('answers /api/narration/stream as server-sent events', async () => {
    const upstream = streaming([piece('Hi'), piece(' there.')]);
    const server = createApp({ fetch: upstream.fetchImpl as typeof fetch, providers: BUILT_IN_PROVIDERS }).listen(0);
    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/api/narration/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Provider-Key': key }, body: JSON.stringify(chat) });
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      const text = await response.text();
      expect(text).toContain('event: delta\ndata: {"type":"delta","text":"Hi"}');
      expect(text).toContain('"type":"done","text":"Hi there."');
    } finally { server.close(); }
  });
});

describe('Google\'s own Gemini API', () => {
  const gemini = { provider: 'google', model: 'models/gemini-3.8-flash', mode: 'chat', max_tokens: 1000, temperature: 0.8, stop: ['\nSam:', '\nRamis (The Housemate):'], messages: [
    { role: 'system', content: 'You are Lux.' },
    { role: 'system', content: 'Journal.' },
    { role: 'user', content: '[The chat begins.]' },
    { role: 'assistant', content: 'Lux: Hi, angel.' },
    { role: 'user', content: 'Hi.' },
    { role: 'user', content: '[Style: roleplay.]' },
  ] };
  const g = (body: Record<string, unknown>) => `data: ${JSON.stringify(body)}\n\n`;
  const text = (value: string, extra: Record<string, unknown> = {}) => g({ candidates: [{ content: { role: 'model', parts: [{ text: value }] }, ...extra }], modelVersion: 'gemini-3.8-flash' });

  it('sends the key in Google\'s header, safety off, the system instruction and Google\'s turns', async () => {
    const upstream = streaming([text('Lux: *She'), text(' grins.*', { finishReason: 'STOP' }), g({ usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 8, thoughtsTokenCount: 300, totalTokenCount: 358 } })]);
    const events = await collect(upstream.fetchImpl, gemini, 'AIzaSyabcdefghijklmnop');
    const call = upstream.calls[0]!;
    expect(call.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse');
    const headers = call.init!.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe('AIzaSyabcdefghijklmnop');
    expect(headers.Authorization).toBeUndefined();
    const body = JSON.parse(String(call.init!.body));
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'You are Lux.\n\nJournal.' }] });
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: '[The chat begins.]' }] },
      { role: 'model', parts: [{ text: 'Lux: Hi, angel.' }] },
      { role: 'user', parts: [{ text: 'Hi.\n\n[Style: roleplay.]' }] },
    ]);
    expect(body.safetySettings).toHaveLength(5);
    expect(body.safetySettings.every((setting: { threshold: string }) => setting.threshold === 'OFF')).toBe(true);
    // Room to think on top of the reply; only stop strings Google takes.
    expect(body.generationConfig).toMatchObject({ maxOutputTokens: 1000 + 4096, temperature: 0.8, stopSequences: ['\nSam:'] });
    expect(events.at(-1)).toMatchObject({ event: 'done', data: { text: 'Lux: *She grins.*', model: 'gemini-3.8-flash', diagnostics: { finishReason: 'stop' } } });
    const done = events.at(-1)!.data as { usage: { completion_tokens_details?: { reasoning_tokens?: number } } };
    expect(done.usage.completion_tokens_details?.reasoning_tokens).toBe(300);
  });

  it('keeps thinking out and says when a filter or the limit stopped a reply', async () => {
    const thought = g({ candidates: [{ content: { role: 'model', parts: [{ text: 'planning', thought: true }] } }] });
    const cut = await collect(streaming([thought, text('Lux: It\'s clean', { finishReason: 'SAFETY' })]).fetchImpl, gemini, 'AIzaSyabcdefghijklmnop');
    expect(cut.filter((event) => event.event === 'delta').map((event) => (event.data as { text: string }).text).join('')).toBe('Lux: It\'s clean');
    expect(cut.at(-1)).toMatchObject({ event: 'done', data: { diagnostics: { finishReason: 'content_filter', filterReason: 'SAFETY', reasoningLength: 8 } } });
    const long = await collect(streaming([text('Lux: and on', { finishReason: 'MAX_TOKENS' })]).fetchImpl, gemini, 'AIzaSyabcdefghijklmnop');
    expect(long.at(-1)).toMatchObject({ event: 'done', data: { diagnostics: { finishReason: 'length' } } });
  });

  it('reports a blocked prompt with Google\'s reason', async () => {
    const silent = console.warn;
    console.warn = () => {};
    try {
      const blocked = await collect(streaming([g({ promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } })]).fetchImpl, gemini, 'AIzaSyabcdefghijklmnop');
      expect(blocked).toMatchObject([{ event: 'error', data: { status: 502, error: 'Google AI Studio (Gemini) filtered the reply (PROHIBITED_CONTENT).' } }]);
    } finally { console.warn = silent; }
  });

  it('folds the system prompt into the first turn for Gemma, which takes none', async () => {
    const upstream = streaming([text('Lux: Hi.', { finishReason: 'STOP' })]);
    await collect(upstream.fetchImpl, { ...gemini, model: 'gemma-3-27b-it', messages: [{ role: 'system', content: 'Rules.' }, { role: 'assistant', content: 'Lux: Hey.' }] }, 'AIzaSyabcdefghijklmnop');
    const body = JSON.parse(String(upstream.calls[0]!.init!.body));
    expect(body.systemInstruction).toBeUndefined();
    expect(body.contents[0]).toEqual({ role: 'user', parts: [{ text: 'Rules.\n\n[The chat begins.]' }] });
  });

  it('turns Gemini\'s filters off on OpenRouter too', async () => {
    const upstream = streaming([piece('Hi.')]);
    await collect(upstream.fetchImpl, { ...chat, provider: 'openrouter', model: 'google/gemini-3.8-flash' });
    expect(JSON.parse(String(upstream.calls[0]!.init!.body)).safety_settings).toHaveLength(5);
    const other = streaming([piece('Hi.')]);
    await collect(other.fetchImpl, { ...chat, provider: 'openrouter', model: 'deepseek/deepseek-chat' });
    expect(JSON.parse(String(other.calls[0]!.init!.body)).safety_settings).toBeUndefined();
  });
});
