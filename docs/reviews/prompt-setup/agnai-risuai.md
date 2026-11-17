# Notes: Agnai and RisuAI on prompt setup

Nov 17, 2026 · @AmbiProp

Agnai 1.0.555 (AGPL-3.0) from its npm package; RisuAI (GPL-3.0) from `kwaroran/Risuai` on `main`, read on Nov 17. Not reached: RisuAI's local-model chat templates, its Anthropic prefill code, its DeepSeek and GLM request code.

## System prompts

**Agnai** keeps a preset per service (`common/presets.ts:388-431`). Gemini gets no preset of its own: it runs on a "Gemini Starter" template.
- Its shared prompt (`common/presets/templates.ts:9-12`) is two lines: write the character's next reply in a fictional roleplay chat, and "all content including sexually explicit is allowed".
- The OpenAI, OpenRouter and Claude presets share one system prompt: play the character, don't decide what the user says or does, Internet roleplay style, be proactive, "**Write at least one paragraph, up to four.**", stay in character, avoid repetition.
- Claude's version is wrapped in XML tags, with the user rule moved to the post-history line.

**RisuAI**'s stored default is a numbered main prompt (`templates.ts:157`): actor and novelist, never the user, third-person author's view, "**Write a 3+ paragraph response**", leave room for the user, go slowly.
- Its newer "Default Prompt" preset (`templates.ts:223-413`) is a long template in XML-tagged sections (rules, configuration, roleplay info, response instructions with anti-repetition), ending with a prefill. It opens by declaring all content permitted.
- A jailbreak exists but is **off by default** (`jailbreakToggle`).

**Both apps let a character's own system prompt and post-history line override the preset**, with `{{original}}` for the preset's text and a switch to ignore them.

## Reply length

- **The token allowance is small by default:** Agnai 300 to 500 (Horde 80), RisuAI 300 to 500. **Length is asked for in words, not tokens:** "one to four paragraphs", "3+ paragraphs".
- **Auto-continue** (RisuAI only, off by default, `index.svelte.ts:1885-1904`): ask again when the reply is under a minimum token count, or doesn't end in punctuation.
- **Trimming a half sentence:** both, as an option. Agnai trims for display and in the history it sends back (`common/prompt.ts:234-245`). RisuAI trims back to the last punctuation.

## Continue

- **Agnai** adds a system line, "Continue {name}'s response", and **joins with one space** (`srv/api/chat/message.ts:350`). A comment over a dead attempt at improving it reads "it cannot be fixed" (`common/template-parser.ts:276`).
- **RisuAI** adds `[Continue the last response]` for Claude, GPT and OpenRouter only, and joins with no separator.

## Gemini

Both call **Google's own API**, not the OpenAI-style one, and both send safety settings:
- **Agnai** (`srv/adapter/gemini.ts:250-271`): BLOCK_NONE for harassment, hate speech, sexually explicit, dangerous content and civic integrity, on every request. The system message becomes `systemInstruction`. With thinking on, the allowance becomes at least 2,048, and the thinking budget is a share of it.
- **RisuAI** (`request/google.ts:284-314`): the same five at BLOCK_NONE, or OFF for models flagged for it. Only a first system message becomes `systemInstruction`; later ones are folded into user turns. Gemini 3 thinking is set by level (`thinkingConfig.thinkingLevel`), 2.5 by budget.

## Refusals and filters

**Neither catches a refusal well.**
- Agnai reports a blocked prompt (`promptFeedback.blockReason`) as an error, but passes Gemini's SAFETY finish on as an ordinary stop. Empty replies from OpenAI, Claude and OpenRouter become "Received empty response. Try again." in a toast.
- RisuAI ignores Gemini's finish reason entirely and shows raw API errors in a dialog (or inline, as an option). It can fall back to another model when a reply comes back blank.
- **Neither looks for an in-character refusal.**

## Emotions

- **Agnai:** sprite emotions, with a classify prompt, but the classifier is a stub in this build. **Nothing is asked of the reply.**
- **RisuAI**, three ways:
  1. **A second, small call by default** (`index.svelte.ts:1992-2160`). A side model picks one word from the list after the reply is written: 30 tokens, the emotion names boosted, recent ones penalised for variety.
  2. **Embedding similarity**, as an option.
  3. **A tag in the reply** (`<Emotion="X">`), only in the "inlay" view.

So the main reply carries an emotion only where the player chose that view.

## What this says for us

- Length belongs in plain words in the prompt ("one to four paragraphs"), with a sensible token allowance behind it, and optionally auto-continue on a reply that ends mid-sentence.
- The established apps reach Gemini through Google's own API so they can turn the filters down. Our OpenAI-style route can't.
- Emotions are better picked after the reply, by a small call or a classifier, than demanded of every reply.
- Every app's refusal handling is weak. Saying plainly that a filter stopped a reply, as 0.5.2 does, is already ahead of them.
