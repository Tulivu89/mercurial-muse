// Prompt formats: how each family of models wants a conversation written out as one prompt.
//
// Sending one prompt to a completions endpoint, instead of chat messages, is what lets Praxis
// write the start of the reply and have the model continue it (the prefill). Finetunes keep
// their base model's format, so a handful of formats covers nearly every open model.
//
// Shared by the server's relay and the browser, so it imports nothing.

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const FORMAT_IDS = ['glm', 'chatml', 'qwen3', 'llama3', 'mistral', 'mistral-legacy', 'gemma', 'deepseek'] as const;
export type FormatId = typeof FORMAT_IDS[number];

export const FORMAT_NAMES: Record<FormatId, string> = {
  glm: 'GLM',
  chatml: 'ChatML (Qwen 2.5, Hermes, many finetunes)',
  qwen3: 'Qwen 3 (ChatML, thinking off)',
  llama3: 'Llama 3',
  mistral: 'Mistral (Small 3 and later)',
  'mistral-legacy': 'Mistral (Nemo and older)',
  gemma: 'Gemma',
  deepseek: 'DeepSeek',
};

export interface Formatted {
  prompt: string;
  stop: string[];
}

// Formats with no system role take the system messages at the top of the first user turn.
function foldSystem(messages: Message[]): Message[] {
  const system = messages.filter((message) => message.role === 'system').map((message) => message.content);
  const rest = messages.filter((message) => message.role !== 'system');
  if (!system.length) return rest;
  const firstUser = rest.findIndex((message) => message.role === 'user');
  if (firstUser < 0) return [{ role: 'user', content: system.join('\n\n') }, ...rest];
  return rest.map((message, index) => (index === firstUser ? { ...message, content: `${system.join('\n\n')}\n\n${message.content}` } : message));
}

// GLM-4.x and later, with thinking turned off: '/nothink' on the user turns and an empty
// think block where each reply begins.
function glm(messages: Message[], prefill: string): Formatted {
  let prompt = '[gMASK]<sop>';
  for (const message of messages) {
    if (message.role === 'system') prompt += `<|system|>\n${message.content}`;
    else if (message.role === 'user') prompt += `<|user|>\n${message.content}${message.content.trimEnd().endsWith('/nothink') ? '' : '/nothink'}`;
    else prompt += `<|assistant|>\n<think></think>\n${message.content}`;
  }
  return { prompt: `${prompt}<|assistant|>\n<think></think>\n${prefill}`, stop: ['<|user|>', '<|observation|>', '<|system|>', '<|endoftext|>'] };
}

function chatml(messages: Message[], prefill: string, emptyThink: boolean): Formatted {
  const turns = messages.map((message) => `<|im_start|>${message.role}\n${message.content}<|im_end|>\n`).join('');
  return { prompt: `${turns}<|im_start|>assistant\n${emptyThink ? '<think>\n\n</think>\n\n' : ''}${prefill}`, stop: ['<|im_end|>', '<|im_start|>', '<|endoftext|>'] };
}

// No <|begin_of_text|>: completion servers add the start token themselves.
function llama3(messages: Message[], prefill: string): Formatted {
  const turns = messages.map((message) => `<|start_header_id|>${message.role}<|end_header_id|>\n\n${message.content}<|eot_id|>`).join('');
  return { prompt: `${turns}<|start_header_id|>assistant<|end_header_id|>\n\n${prefill}`, stop: ['<|eot_id|>', '<|start_header_id|>', '<|end_of_text|>'] };
}

// Mistral's V7 Tekken format, with system prompts. No <s>, as with Llama 3.
function mistral(messages: Message[], prefill: string): Formatted {
  let prompt = '';
  for (const message of messages) {
    if (message.role === 'system') prompt += `[SYSTEM_PROMPT]${message.content}[/SYSTEM_PROMPT]`;
    else if (message.role === 'user') prompt += `[INST]${message.content}[/INST]`;
    else prompt += `${message.content}</s>`;
  }
  return { prompt: `${prompt}${prefill}`, stop: ['</s>', '[INST]', '[SYSTEM_PROMPT]'] };
}

function mistralLegacy(messages: Message[], prefill: string): Formatted {
  let prompt = '';
  for (const message of foldSystem(messages)) {
    if (message.role === 'user') prompt += `[INST] ${message.content} [/INST]`;
    else prompt += ` ${message.content}</s>`;
  }
  return { prompt: `${prompt} ${prefill}`, stop: ['</s>', '[INST]'] };
}

function gemma(messages: Message[], prefill: string): Formatted {
  const turns = foldSystem(messages).map((message) => `<start_of_turn>${message.role === 'assistant' ? 'model' : 'user'}\n${message.content}<end_of_turn>\n`).join('');
  return { prompt: `${turns}<start_of_turn>model\n${prefill}`, stop: ['<end_of_turn>', '<start_of_turn>'] };
}

// DeepSeek V3: system text first and untagged. No start token, as above.
function deepseek(messages: Message[], prefill: string): Formatted {
  let prompt = messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n');
  for (const message of messages) {
    if (message.role === 'user') prompt += `<｜User｜>${message.content}`;
    else if (message.role === 'assistant') prompt += `<｜Assistant｜>${message.content}<｜end▁of▁sentence｜>`;
  }
  return { prompt: `${prompt}<｜Assistant｜>${prefill}`, stop: ['<｜end▁of▁sentence｜>', '<｜User｜>'] };
}

export function formatPrompt(format: FormatId, messages: Message[], prefill = ''): Formatted {
  switch (format) {
    case 'glm': return glm(messages, prefill);
    case 'chatml': return chatml(messages, prefill, false);
    case 'qwen3': return chatml(messages, prefill, true);
    case 'llama3': return llama3(messages, prefill);
    case 'mistral': return mistral(messages, prefill);
    case 'mistral-legacy': return mistralLegacy(messages, prefill);
    case 'gemma': return gemma(messages, prefill);
    case 'deepseek': return deepseek(messages, prefill);
  }
}

// A best guess from the model's name. Finetunes often hide their base, so the player can
// always pick the format by hand; ChatML is the commonest among finetunes.
export function guessFormat(model: string): FormatId {
  const name = model.toLowerCase();
  if (/glm/.test(name)) return 'glm';
  if (/qwen-?3|qwq/.test(name)) return 'qwen3';
  if (/deepseek/.test(name)) return 'deepseek';
  if (/gemma/.test(name)) return 'gemma';
  // These finetunes use ChatML whatever their base.
  if (/hermes|magnum|dolphin|chatml/.test(name)) return 'chatml';
  if (/llama-?3|\bl3[.-]|euryale|hanami|lumimaid/.test(name)) return 'llama3';
  if (/mistral-small-(3|24b)|mistral-small-2[5-9]|magistral|mistral-medium|mistral-large-2411|devstral/.test(name)) return 'mistral';
  if (/mistral|mixtral|nemo|ministral|rocinante|cydonia/.test(name)) return 'mistral-legacy';
  return 'chatml';
}
