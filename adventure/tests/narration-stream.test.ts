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
