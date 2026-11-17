// Where narration can come from. Every provider here speaks the OpenAI-style API: a models
// list, chat completions and, for most, plain completions that take one prompt.
//
// The server relays only to these, so it can never be used to reach anywhere else. A server
// operator can add more (a partner's endpoint, say) with NARRATION_PROVIDERS. A server of the
// player's own, such as one running on their computer, is called from the browser directly
// and never through the relay: that is the "custom" provider.
import { z } from 'zod';

export const CUSTOM_PROVIDER = 'custom';

export const providerSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,31}$/),
  name: z.string().trim().min(1).max(60),
  // The API's root, ending before /models or /chat/completions.
  base: z.string().url().refine((url) => url.startsWith('https://'), 'must be an https address'),
  // Whether it has a completions endpoint that takes a raw prompt.
  completions: z.boolean().default(true),
  // How a chat request carries the start of the reply: as the last assistant message, which
  // the provider continues, or as a last system message where it cannot continue one.
  chatPrefill: z.enum(['assistant', 'system']).default('system'),
  // Added to chat requests to turn a model's thinking off, in the provider's own words.
  thinkingOff: z.record(z.string(), z.unknown()).optional(),
  // Tokens added to the reply allowance for models that think first and can't be told not to,
  // where the thinking counts against it: the player's reply length stays the reply's.
  thinkingRoom: z.number().int().min(0).max(32_000).optional(),
  keyLabel: z.string().max(60).default('API key'),
  keyHint: z.string().max(40).default(''),
  // Where the player finds their key, in a few words.
  keyNote: z.string().max(200).default(''),
});
export type ProviderInfo = z.infer<typeof providerSchema>;

export const BUILT_IN_PROVIDERS: ProviderInfo[] = [
  {
    id: 'novelai', name: 'NovelAI', base: 'https://text.novelai.net/oa/v1', completions: true, chatPrefill: 'system',
    keyLabel: 'Persistent API Token', keyHint: 'pst-…', keyNote: 'In NovelAI under User Settings, Account.',
  },
  {
    id: 'openrouter', name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', completions: true, chatPrefill: 'assistant',
    thinkingOff: { reasoning: { enabled: false } }, keyLabel: 'API key', keyHint: 'sk-or-…', keyNote: 'On openrouter.ai under Keys.',
  },
  {
    id: 'featherless', name: 'Featherless', base: 'https://api.featherless.ai/v1', completions: true, chatPrefill: 'system',
    keyLabel: 'API key', keyHint: '', keyNote: 'On featherless.ai under your account’s API keys.',
  },
  {
    id: 'arliai', name: 'ArliAI', base: 'https://api.arliai.com/v1', completions: true, chatPrefill: 'system',
    keyLabel: 'API key', keyHint: '', keyNote: 'On arliai.com under your account’s API keys.',
  },
  {
    id: 'infermatic', name: 'Infermatic', base: 'https://api.totalgpt.ai/v1', completions: true, chatPrefill: 'system',
    keyLabel: 'API key', keyHint: '', keyNote: 'On infermatic.ai under your account’s API keys.',
  },
  {
    id: 'nanogpt', name: 'NanoGPT', base: 'https://nano-gpt.com/api/v1', completions: true, chatPrefill: 'system',
    keyLabel: 'API key', keyHint: '', keyNote: 'On nano-gpt.com under API.',
  },
  {
    id: 'deepseek', name: 'DeepSeek', base: 'https://api.deepseek.com', completions: false, chatPrefill: 'system',
    keyLabel: 'API key', keyHint: 'sk-…', keyNote: 'On platform.deepseek.com under API keys.',
  },
  {
    id: 'zai', name: 'Z.ai (GLM)', base: 'https://api.z.ai/api/paas/v4', completions: false, chatPrefill: 'system',
    thinkingOff: { thinking: { type: 'disabled' } }, keyLabel: 'API key', keyHint: '', keyNote: 'On z.ai under API keys.',
  },
  {
    // Google's OpenAI-compatible door to Gemini. Its keys come with a free daily allowance.
    id: 'google', name: 'Google AI Studio (Gemini)', base: 'https://generativelanguage.googleapis.com/v1beta/openai', completions: false, chatPrefill: 'system', thinkingRoom: 4096,
    keyLabel: 'API key', keyHint: 'AIza…', keyNote: 'On aistudio.google.com under Get API key.',
  },
];

// The providers this server relays to: the built-in ones, then any from NARRATION_PROVIDERS, a
// JSON list in the shape above. A bad entry is left out and reported, never half-used.
export function providersFrom(extra: string | undefined, warn: (message: string) => void = () => {}): ProviderInfo[] {
  const providers = [...BUILT_IN_PROVIDERS];
  if (!extra?.trim()) return providers;
  let list: unknown;
  try { list = JSON.parse(extra); } catch { warn('NARRATION_PROVIDERS is not JSON; no extra providers.'); return providers; }
  if (!Array.isArray(list)) { warn('NARRATION_PROVIDERS should be a JSON list; no extra providers.'); return providers; }
  for (const [index, entry] of list.entries()) {
    const parsed = providerSchema.safeParse(entry);
    if (!parsed.success) { warn(`NARRATION_PROVIDERS entry ${index + 1} left out: ${parsed.error.issues[0]?.path.join('.') ?? ''} ${parsed.error.issues[0]?.message ?? ''}`.trim()); continue; }
    if (parsed.data.id === CUSTOM_PROVIDER || providers.some((provider) => provider.id === parsed.data.id)) { warn(`NARRATION_PROVIDERS entry ${index + 1} left out: the id "${parsed.data.id}" is taken.`); continue; }
    providers.push(parsed.data);
  }
  return providers;
}

// A server of the player's own. It must allow this site's requests (CORS), and a page served
// over https can reach plain http only on localhost.
export function customProvider(base: string): ProviderInfo {
  return { id: CUSTOM_PROVIDER, name: 'Your own server', base: base.trim().replace(/\/+$/, ''), completions: true, chatPrefill: 'assistant', keyLabel: 'API key, if it needs one', keyHint: '', keyNote: '' };
}
