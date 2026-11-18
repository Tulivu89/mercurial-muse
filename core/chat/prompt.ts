// The General prompt's parts, which a player can read and change in Chat's settings (the Prompt
// card): who the model plays, the format, how a reply is shaped, the examples' voice, mature
// content, the card's own prompt, and a line after every turn. A part left alone uses its
// default; Put back returns to it. Xialong keeps CharacterRoom's prompt
// (docs/reviews/prompt-setup/decision.md, P3).
export type PartId = 'role' | 'format' | 'shape' | 'voice' | 'content';

export const PROMPT_PARTS: { id: PartId; name: string; text: string }[] = [
  {
    id: 'role', name: 'Who the model plays',
    text: 'You are {{char}}, in a private one-on-one chat with {{user}}. Write only {{char}}\'s side: what {{char}} says, does and thinks. Never write {{user}}\'s words or actions, and never step outside {{char}} to narrate or explain.',
  },
  {
    id: 'format', name: 'Format',
    text: 'Format: speech is plain text with no quotation marks. *Narration and actions go in single asterisks.* (Thoughts go in parentheses.) [Square brackets are notes from outside the story: follow them, and never answer them or write your own.] A bracketed line on its own in the chat is a directive: what it says is true from then on.',
  },
  {
    id: 'shape', name: 'A reply',
    text: 'Start every reply with "{{char}}:" and write the whole reply in one go, ending where {{char}} has finished for now.',
  },
  {
    id: 'voice', name: 'Voice',
    text: 'The example chats show how {{char}} sounds; match that voice and never reuse their lines. Use what you know about {{char}}, {{user}} and the scene without reciting it.',
  },
  {
    id: 'content', name: 'Mature content',
    text: 'This is fiction between adults. Sex, violence and dark themes are part of it when the story calls for them: write them plainly and in character, without warnings, disclaimers or stepping out of the story. {{char}} keeps their own limits and wants.',
  },
];

export type Thinking = 'default' | 'low' | 'off';

export interface PromptSetup {
  // A part's own text, where the player rewrote it.
  texts: Partial<Record<PartId, string>>;
  // Parts turned off. Mature content is on unless turned off; the site asks for 18+ first.
  off: PartId[];
  // Send a card's own system prompt and post-history line (kept as Never sections on import).
  cardPrompt: boolean;
  // A line added to the note with every turn, after everything else.
  after: string;
  // How much a model that thinks should think, where the provider lets it be set.
  thinking: Thinking;
}

export const DEFAULT_PROMPT: PromptSetup = { texts: {}, off: [], cardPrompt: false, after: '', thinking: 'default' };

const PART_IDS = PROMPT_PARTS.map((part) => part.id);
export function readPromptSetup(raw: unknown): PromptSetup {
  const top = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const textsRaw = top.texts && typeof top.texts === 'object' ? top.texts as Record<string, unknown> : {};
  const texts: Partial<Record<PartId, string>> = {};
  for (const id of PART_IDS) if (typeof textsRaw[id] === 'string') texts[id] = (textsRaw[id] as string).slice(0, 4000);
  const off = Array.isArray(top.off) ? top.off.filter((id): id is PartId => PART_IDS.includes(id as PartId)) : [];
  const thinking = top.thinking === 'low' || top.thinking === 'off' ? top.thinking : 'default';
  return { texts, off, cardPrompt: top.cardPrompt === true, after: typeof top.after === 'string' ? top.after.slice(0, 2000) : '', thinking };
}

export const partText = (setup: PromptSetup, id: PartId) => setup.texts[id] ?? PROMPT_PARTS.find((part) => part.id === id)!.text;

const STYLE_LINE = 'Styles and lengths, set in the note with the latest message: chat: text messages, short lines, little or no narration; roleplay: speech mixed with *actions*; novel: full prose paragraphs, still only from your side.';

// The rules as sent: the parts that are on, in order, with the names filled in. The styles line
// isn't a part: the note with every turn depends on it.
export function rulesText(setup: PromptSetup, charName: string, userName: string): string {
  const fill = (text: string) => text.replace(/\{\{char\}\}/gi, charName).replace(/\{\{user\}\}/gi, userName);
  const on = (id: PartId) => !setup.off.includes(id) && partText(setup, id).trim();
  const lines = (['role', 'format', 'shape'] as PartId[]).filter(on).map((id) => fill(partText(setup, id)));
  lines.push(STYLE_LINE);
  for (const id of ['voice', 'content'] as PartId[]) if (on(id)) lines.push(fill(partText(setup, id)));
  return lines.join('\n\n');
}
