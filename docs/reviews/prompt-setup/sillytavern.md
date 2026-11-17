# Notes: SillyTavern on prompt setup

Nov 17, 2026 · @AmbiProp

SillyTavern 1.19.0 (AGPL-3.0), from its npm package. Not read in depth: the text-completion backends' handling of thinking.

## The prompts are short and neutral

- **The main prompt** is one line: "Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}." (`public/scripts/openai.js:102`).
- The **Auxiliary** prompt (once called NSFW) and the **Post-History Instructions** (once called the jailbreak) ship **on but empty**.
- The default order (`PromptManager.js:2087-2136`): main, lore before, persona, description, personality, scenario, auxiliary, lore after, examples, chat history, post-history.
- A card's own system prompt and post-history line replace the main and post-history prompts by default. Each prompt can forbid that.
- **Small bracketed nudges:**
  - "[Start a new Chat]" before the history.
  - "[Continue your last message without repeating its original content.]" for Continue.
  - "[Write the next reply only as {{char}}.]" in groups.
- **System prompt presets** for prompt-style models. The default is "Neutral - Chat", the one line above. The others are opt-in:
  - "Roleplay - Immersive": "Write one reply only. Do not decide what {{user}} says or does. **Write at least one paragraph, up to four.** Be descriptive and immersive…"
  - "Roleplay - Detailed": explicit, graphic detail.
  - "Roleplay - Simple": an uncensored never-ending roleplay.
  - "Actor": never break character.
- **34 context templates and about as many instruct templates** cover model families' prompt formats.

## Length

- **A hard cap only by default:** 300 tokens for chat models. The default prompts say nothing about length; only the opt-in presets do.
- **Auto-Continue** (`script.js:5716-5776`, off by default) presses Continue while the reply is under a target token count (400 by default). Chat-style models need a second switch.
- **Trim incomplete sentences** (off by default) cuts back to the last sentence end.
- **Auto-swipe** (off by default) rerolls a reply that is too short or contains words from the player's blocklist. This is the nearest it has to a refusal catcher.

## Continue

The reply being continued goes back as it was, then a system nudge (above). Or it is sent as a prefill, as an option. Text is joined with a set postfix, a space by default, unless the reply already ends in one.

## Mature content: at the API, not in the prompt

- **Gemini** gets all five harm categories set to `OFF` (`src/constants.js:141-162`). So does Gemini through OpenRouter (`safety_settings` on `google/gemini*`, `chat-completions.js:2391-2393`).
- **Mistral** gets `safe_prompt: false`; **Cohere** `safety_mode: OFF`.
- **Claude** gets nothing.
- No content wording is sent by default.

## Refusals

- **Gemini:** only a blocked prompt (`promptFeedback.blockReason`) or an empty candidate, and only without streaming. A blocked stream just ends empty.
- **No app-wide finish reason check, and no refusal detection** beyond auto-swipe's blocklist.

## Thinking

- **Requested by default** (`include_reasoning`), with an effort setting: auto, min, low, medium, high or max. Auto sends nothing.
- **Gemini 3** gets `thinkingLevel` (Flash: minimal to high; Pro: low or high). **Gemini 2.5** gets a budget as a share of the allowance.
- **For Gemini the thinking comes out of the reply allowance; it isn't added on top.** This matches Inkwyrm's reason for Google's `thinkingRoom`.
- **Claude:** an allowance of 1,024 or less gets 1,024 more.
- **DeepSeek, GLM and Moonshot:** thinking switched on or off.
- **Past thinking isn't sent back** unless asked.

## Emotions

**The Expressions extension never asks the reply for an emotion.** It classifies the reply afterwards, with one of:
- a small local model (28 labels);
- a separate model call: "Classify the emotion of the last message. Output just one word…", constrained to the labels where the API allows;
- nothing, which is the default.

## Shaping messages per model

"Prompt Post-Processing" (`prompt-converters.js:827-954`) can:
- merge same-role messages;
- turn later system messages into user ones;
- force strict alternation;
- or send everything as one user message.

Some providers get one of these fixed, and the reasons the code gives are API limits:
- DeepSeek: semi-strict, with a prefix.
- MiniMax: merged.
- Claude, Google, Mistral, Cohere and xAI: converters of their own.

Gemini's leading system messages become `systemInstruction`. The newest Flash models reject a prefill, which goes back as a user turn.
