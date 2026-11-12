// The model a live run calls, from the environment. Calls go straight to the provider's
// OpenAI-style endpoint, the way a server of the player's own is called (kit/src/connection.ts).
import { customProvider } from '../../core/narration/providers';
import { buildUpstream, narrationRequestSchema, readReply } from '../../core/narration/upstream';
import type { Generate } from '../src/author/run';

declare const process: { env: Record<string, string | undefined> };

export interface LiveModel { base: string; model: string; mode: 'prompt' | 'chat'; runs: number; prefill: boolean; label: string }

export function liveModel(): LiveModel | null {
  const { PROMPTS_BASE: base, PROMPTS_MODEL: model, PROMPTS_MODE: mode, PROMPTS_RUNS: runs } = process.env;
  if (!base || !model) return null;
  const asPrompt = mode !== 'chat';
  return { base: base.replace(/\/+$/, ''), model, mode: asPrompt ? 'prompt' : 'chat', runs: Math.max(1, Number(runs) || 20), prefill: asPrompt, label: `${model} (${asPrompt ? 'completions' : 'chat'})` };
}

export function liveGenerate(live: LiveModel): Generate {
  const provider = customProvider(live.base);
  return async (messages, options) => {
    const request = narrationRequestSchema.parse({
      provider: 'custom', model: live.model, messages, mode: live.mode,
      max_tokens: options.maxTokens, temperature: options.temperature,
      ...(process.env.PROMPTS_FORMAT ? { format: process.env.PROMPTS_FORMAT } : {}),
      ...(options.prefill ? { prefill: options.prefill } : {}),
    });
    const upstream = buildUpstream(request, provider, false);
    const key = process.env.PROMPTS_KEY;
    const response = await fetch(`${live.base}${upstream.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify(upstream.body),
    });
    if (!response.ok) throw new Error(`${live.base} answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const reply = readReply(await response.json());
    return { text: reply.content, model: reply.model ?? live.model };
  };
}
