// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatPrompt, guessFormat } from '../../core/narration/formats';
import { BUILT_IN_PROVIDERS, customProvider, providersFrom } from '../../core/narration/providers';
import { buildUpstream, narrationRequestSchema, readModels, readReply, stripThinking } from '../../core/narration/upstream';
import { publicProviders, relayChat, relayModels } from '../server/narration-relay';

type Call = { url: string; init?: RequestInit };

function fakeProvider(reply: { status?: number; body: unknown }) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { calls, fetchImpl };
}

// Captures console.warn for one call, so tests can read what the server logs.
async function capturingWarnings<T>(run: () => Promise<T>): Promise<{ result: T; warnings: unknown[][] }> {
  const original = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => { warnings.push(args); };
  try { return { result: await run(), warnings }; } finally { console.warn = original; }
}

const key = 'pst-abcdefghijklmnop';
const providers = BUILT_IN_PROVIDERS;
const chat = { provider: 'novelai', model: 'glm-4-6', mode: 'chat', messages: [{ role: 'user', content: 'Hello.' }] };
const sentBody = (call: Call) => JSON.parse(String(call.init!.body));

describe('prompt formats', () => {
  const messages = [{ role: 'system' as const, content: 'Rules.' }, { role: 'user' as const, content: 'Hello.' }];

  it('writes GLM with thinking off, and the prefill where the reply begins', () => {
    expect(formatPrompt('glm', messages, 'Understood.\n*').prompt).toBe('[gMASK]<sop><|system|>\nRules.<|user|>\nHello./nothink<|assistant|>\n<think></think>\nUnderstood.\n*');
    expect(formatPrompt('glm', [{ role: 'assistant', content: 'Fog.' }, { role: 'user', content: 'Go./nothink' }]).prompt)
      .toBe('[gMASK]<sop><|assistant|>\n<think></think>\nFog.<|user|>\nGo./nothink<|assistant|>\n<think></think>\n');
  });

  it('writes ChatML, and Qwen 3 with an empty think block', () => {
    expect(formatPrompt('chatml', messages, '*').prompt).toBe('<|im_start|>system\nRules.<|im_end|>\n<|im_start|>user\nHello.<|im_end|>\n<|im_start|>assistant\n*');
    expect(formatPrompt('qwen3', messages, '*').prompt.endsWith('<|im_start|>assistant\n<think>\n\n</think>\n\n*')).toBe(true);
    expect(formatPrompt('chatml', messages).stop).toContain('<|im_end|>');
  });

  it('writes Llama 3 and Mistral without a start token, which servers add', () => {
    expect(formatPrompt('llama3', messages, '*').prompt).toBe('<|start_header_id|>system<|end_header_id|>\n\nRules.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nHello.<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n*');
    expect(formatPrompt('mistral', messages, '*').prompt).toBe('[SYSTEM_PROMPT]Rules.[/SYSTEM_PROMPT][INST]Hello.[/INST]*');
  });

  it('folds system messages into the first user turn where a format has no system role', () => {
    expect(formatPrompt('gemma', messages, '*').prompt).toBe('<start_of_turn>user\nRules.\n\nHello.<end_of_turn>\n<start_of_turn>model\n*');
    expect(formatPrompt('mistral-legacy', [...messages, { role: 'assistant', content: 'Fog.' }, { role: 'user', content: 'Go.' }], '*').prompt)
      .toBe('[INST] Rules.\n\nHello. [/INST] Fog.</s>[INST] Go. [/INST] *');
  });

  it('writes DeepSeek with the system text first', () => {
    expect(formatPrompt('deepseek', messages, '*').prompt).toBe('Rules.<｜User｜>Hello.<｜Assistant｜>*');
  });

  it('guesses the format from the model\'s name', () => {
    expect(guessFormat('glm-4-6')).toBe('glm');
    expect(guessFormat('z-ai/glm-4.6')).toBe('glm');
    expect(guessFormat('qwen/qwen3-235b-a22b')).toBe('qwen3');
    expect(guessFormat('Qwen/Qwen2.5-72B-Instruct')).toBe('chatml');
    expect(guessFormat('Sao10K/L3.3-70B-Euryale-v2.3')).toBe('llama3');
    expect(guessFormat('meta-llama/llama-3.3-70b-instruct')).toBe('llama3');
    expect(guessFormat('mistralai/mistral-nemo')).toBe('mistral-legacy');
    expect(guessFormat('mistralai/Mistral-Small-3.2-24B-Instruct-2506')).toBe('mistral');
    expect(guessFormat('google/gemma-3-27b-it')).toBe('gemma');
    expect(guessFormat('deepseek/deepseek-chat-v3.1')).toBe('deepseek');
    expect(guessFormat('NousResearch/Hermes-3-Llama-3.1-70B')).toBe('chatml');
    expect(guessFormat('anthracite-org/magnum-v4-72b')).toBe('chatml');
  });
});

describe('the upstream request', () => {
  const parse = (raw: unknown) => narrationRequestSchema.parse(raw);
  const openrouter = providers.find((provider) => provider.id === 'openrouter')!;
  const deepseek = providers.find((provider) => provider.id === 'deepseek')!;

  it('sends one prompt to completions in the guessed format, or the chosen one', () => {
    const guessed = buildUpstream(parse({ provider: 'openrouter', model: 'qwen/qwen-2.5-72b-instruct', messages: [{ role: 'user', content: 'Hi.' }], prefill: '*' }), openrouter);
    expect(guessed).toMatchObject({ path: '/completions', format: 'chatml', body: { model: 'qwen/qwen-2.5-72b-instruct', stream: false } });
    expect(String(guessed.body.prompt).endsWith('<|im_start|>assistant\n*')).toBe(true);
    expect(buildUpstream(parse({ provider: 'openrouter', model: 'some-finetune', format: 'llama3', messages: [{ role: 'user', content: 'Hi.' }] }), openrouter).format).toBe('llama3');
  });

  it('sends chat where the provider takes no single prompt', () => {
    const upstream = buildUpstream(parse({ provider: 'deepseek', model: 'deepseek-chat', mode: 'prompt', messages: [{ role: 'user', content: 'Hi.' }], prefill: 'Understood.' }), deepseek);
    expect(upstream.path).toBe('/chat/completions');
    expect(upstream.body.messages).toEqual([{ role: 'user', content: 'Hi.' }, { role: 'system', content: 'Understood.' }]);
  });

  it('carries the prefill as the reply\'s start, and turns thinking off, where the provider allows', () => {
    const upstream = buildUpstream(parse({ provider: 'openrouter', model: 'z-ai/glm-4.6', mode: 'chat', messages: [{ role: 'user', content: 'Hi.' }], prefill: '*' }), openrouter);
    expect(upstream.body).toMatchObject({ messages: [{ role: 'user', content: 'Hi.' }, { role: 'assistant', content: '*' }], reasoning: { enabled: false } });
  });

  it('refuses a body with fields it does not know', () => {
    expect(narrationRequestSchema.safeParse({ ...chat, extra: 1 }).success).toBe(false);
  });
});

describe('replies and model lists', () => {
  it('takes the reply from wherever the provider put it, without thinking', () => {
    expect(readReply({ choices: [{ text: '', parsedContent: '*Rain.*' }] }).content).toBe('*Rain.*');
    expect(readReply({ choices: [{ message: { content: '<think>plan</think>*Rain.*' } }] }).content).toBe('*Rain.*');
    expect(stripThinking('some reasoning</think>*Rain.*')).toBe('*Rain.*');
    expect(stripThinking('<think>cut off mid-thought')).toBe('');
  });

  it('lists model ids with how much each can read', () => {
    expect(readModels({ data: [{ id: 'a', context_length: 32768 }, { id: 'b', top_provider: { context_length: 8192 } }, { id: 'c' }, { name: 'no id' }] }))
      .toEqual({ models: ['a', 'b', 'c'], contexts: { a: 32768, b: 8192 } });
  });
});

describe('providers', () => {
  it('adds a server operator\'s providers, and leaves out bad or clashing ones', () => {
    const warnings: string[] = [];
    const list = providersFrom(JSON.stringify([
      { id: 'partner', name: 'Partner', base: 'https://api.partner.example/v1', chatPrefill: 'assistant' },
      { id: 'plain', name: 'Plain', base: 'http://insecure.example/v1' },
      { id: 'novelai', name: 'Again', base: 'https://x.example/v1' },
      { id: 'custom', name: 'Mine', base: 'https://y.example/v1' },
    ]), (message) => warnings.push(message));
    expect(list.map((provider) => provider.id)).toEqual([...BUILT_IN_PROVIDERS.map((provider) => provider.id), 'partner']);
    expect(list.at(-1)).toMatchObject({ completions: true, keyLabel: 'API key' });
    expect(warnings).toHaveLength(3);
    expect(providersFrom('not json', (message) => warnings.push(message))).toHaveLength(BUILT_IN_PROVIDERS.length);
  });

  it('describes providers to the interface without their addresses', () => {
    expect(JSON.stringify(publicProviders(providers))).not.toContain('https://');
  });

  it('trims a custom server\'s address', () => {
    expect(customProvider(' http://localhost:5001/v1/ ').base).toBe('http://localhost:5001/v1');
  });
});

describe('the relay', () => {
  it('forwards a chat to NovelAI with the caller\'s key and returns the text and usage', async () => {
    const upstream = fakeProvider({ body: { model: 'glm-4-6', choices: [{ message: { content: '*Rain.*' } }], usage: { prompt_tokens: 12 } } });
    const result = await relayChat(upstream.fetchImpl, providers, key, chat);
    expect(result).toMatchObject({ status: 200, body: { text: '*Rain.*', model: 'glm-4-6', usage: { prompt_tokens: 12 } } });
    expect(upstream.calls[0]!.url).toBe('https://text.novelai.net/oa/v1/chat/completions');
    expect((upstream.calls[0]!.init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${key}`);
    expect(sentBody(upstream.calls[0]!)).toMatchObject({ model: 'glm-4-6', max_tokens: 2048, stream: false });
  });

  it('sends GLM\'s prompt to NovelAI\'s completions endpoint by default, as before', async () => {
    const upstream = fakeProvider({ body: { choices: [{ text: '*Rain.*', finish_reason: 'stop' }] } });
    const result = await relayChat(upstream.fetchImpl, providers, key, { provider: 'novelai', model: 'glm-4-6', messages: [{ role: 'system', content: 'Rules.' }, { role: 'user', content: 'Hello.' }] });
    expect(result).toMatchObject({ status: 200, body: { text: '*Rain.*', diagnostics: { provider: 'novelai', endpoint: '/completions', mode: 'prompt', format: 'glm' } } });
    expect(upstream.calls[0]!.url).toBe('https://text.novelai.net/oa/v1/completions');
    const sent = sentBody(upstream.calls[0]!);
    expect(sent.prompt).toBe('[gMASK]<sop><|system|>\nRules.<|user|>\nHello./nothink<|assistant|>\n<think></think>\n');
    expect(sent.messages).toBeUndefined();
  });

  it('relays to another provider at its own address', async () => {
    const upstream = fakeProvider({ body: { choices: [{ text: '*Rain.*' }] } });
    await relayChat(upstream.fetchImpl, providers, 'sk-or-abcdefgh', { provider: 'openrouter', model: 'sao10k/l3.3-euryale-70b', messages: [{ role: 'user', content: 'Hi.' }] });
    expect(upstream.calls[0]!.url).toBe('https://openrouter.ai/api/v1/completions');
    expect(String(sentBody(upstream.calls[0]!).prompt)).toContain('<|start_header_id|>user<|end_header_id|>');
  });

  it('refuses a provider it does not know, the player\'s own server, a missing key or a malformed body, and never calls out', async () => {
    const upstream = fakeProvider({ body: {} });
    expect((await relayChat(upstream.fetchImpl, providers, key, { ...chat, provider: 'elsewhere' })).status).toBe(400);
    expect((await relayChat(upstream.fetchImpl, providers, key, { ...chat, provider: 'custom' })).status).toBe(400);
    expect((await relayChat(upstream.fetchImpl, providers, undefined, chat)).status).toBe(401);
    expect((await relayChat(upstream.fetchImpl, providers, key, { ...chat, extra: 'field' })).status).toBe(400);
    expect((await relayModels(upstream.fetchImpl, providers, 'novelai', 'short')).status).toBe(401);
    expect((await relayModels(upstream.fetchImpl, providers, 'elsewhere', key)).status).toBe(400);
    expect(upstream.calls).toEqual([]);
  });

  it('passes on the provider\'s own refusal without the key', async () => {
    const upstream = fakeProvider({ status: 401, body: { error: { message: 'Invalid key' } } });
    const result = await relayChat(upstream.fetchImpl, providers, key, chat);
    expect(result).toMatchObject({ status: 401, body: { error: 'Invalid key', diagnostics: { status: 401 } } });
    expect(JSON.stringify(result)).not.toContain(key);
  });

  it('explains a reasoning model that ran out of room before answering', async () => {
    const upstream = fakeProvider({ body: { choices: [{ finish_reason: 'length', message: { content: '', reasoning_content: 'Let me think about the gate...' } }] } });
    const { result } = await capturingWarnings(() => relayChat(upstream.fetchImpl, providers, key, chat));
    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({
      error: 'The model used its whole allowance (2048 tokens) thinking and wrote no reply.',
      diagnostics: { finishReason: 'length', contentLength: 0, reasoningLength: 30, choiceFields: ['finish_reason', 'message', 'message.content', 'message.reasoning_content'] },
    });
  });

  it('shows the player the raw choice when text is empty, with token lists shortened', async () => {
    const upstream = fakeProvider({ body: { choices: [{ index: 0, text: '', token_ids: Array.from({ length: 20 }, (_, i) => i), finish_reason: 'stop', matched_stop: 151329 }] } });
    const { result } = await capturingWarnings(() => relayChat(upstream.fetchImpl, providers, key, chat));
    expect(result.body).toMatchObject({ error: 'NovelAI returned an empty reply.', diagnostics: { textType: 'string', contentLength: 0 } });
    const raw = (result.body as { diagnostics: { rawChoice: string } }).diagnostics.rawChoice;
    expect(raw).toContain('"token_ids":"[20 items: 0, 1, 2, 3, 4, 5, 6, 7, ...]"');
  });

  it('logs only structural metadata on the server for an empty reply', async () => {
    const upstream = fakeProvider({ body: {
      choices: [{ message: { content: '', reasoning_content: 'private reasoning' }, parsedContent: '', finish_reason: 'length' }],
      usage: { prompt_tokens: 12, completion_tokens: 500 },
    } });
    const { result, warnings } = await capturingWarnings(() => relayChat(upstream.fetchImpl, providers, key, chat));
    expect(result.status).toBe(502);
    expect(warnings).toHaveLength(1);
    expect(JSON.parse(warnings[0]![1] as string)).toMatchObject({ provider: 'novelai', hasReasoning: true, finishReason: 'length', completionTokens: 500, requestedMaxTokens: 2048 });
    const output = JSON.stringify(warnings);
    for (const secret of [key, 'private reasoning', 'Hello.']) expect(output).not.toContain(secret);
  });

  it('lists a provider\'s models, and lets a provider that lists none connect anyway', async () => {
    const listing = fakeProvider({ body: { data: [{ id: 'glm-4-6' }, { id: 'xialong-v1' }, { name: 'no id' }] } });
    expect(await relayModels(listing.fetchImpl, providers, 'novelai', key)).toEqual({ status: 200, body: { models: ['glm-4-6', 'xialong-v1'], contexts: {} } });
    expect(listing.calls[0]!.url).toBe('https://text.novelai.net/oa/v1/models');
    const none = fakeProvider({ status: 404, body: {} });
    expect(await relayModels(none.fetchImpl, providers, 'zai', key)).toMatchObject({ status: 200, body: { models: [], unlisted: true } });
  });

  it('reports an unreachable provider by name', async () => {
    const result = await relayChat(async () => { throw new Error('offline'); }, providers, key, chat);
    expect(result).toMatchObject({ status: 502, body: { error: 'Could not reach NovelAI.' } });
  });
});
