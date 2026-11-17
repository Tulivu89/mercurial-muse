# Prompt setup: brief

Nov 17, 2026 · @AmbiProp

How the request a chat sends should be set up for each model family: the system prompt, reply length, mature content, refusals and emotions. From the owner's test of Gemini 3.8 Flash on HOG Wild's Lux. Replies came back two lines long and stopped partway, every one ended on an emotion line, and nothing said whether a reply had been refused. The owner isn't tied to CharacterRoom's setup outside Xialong: Chat should handle models the way the established apps do.

## The questions

1. **The system prompt per model family.** One General prompt goes to every model but Xialong. What do the other apps change by family (Gemini, DeepSeek, GLM, Mistral, Llama finetunes), and can the player edit it?
2. **Reply length.** How do they get replies of the length a player wants? A length instruction, a token target, continuing automatically, trimming a half sentence?
3. **Mature content.** What do they say to a model about fiction and adult content, where in the prompt, and what do they send a provider's safety settings?
4. **Refusals.** How does a player learn that a reply was filtered, blocked, empty or refused in character?
5. **Thinking models.** How do they keep thinking from eating the reply, and do they show it?
6. **Emotions.** Do they ask the main reply for an emotion, or pick one another way (a classifier, a second call)?
7. **Continue.** How is a continued reply asked for and joined?

## What Inkwyrm does now

The General profile (`core/chat/general.ts`), for every model but Xialong:
- **System message:** the rules (`rulesFor`): play only the character, never the player; the format (plain speech, `*actions*`, `(thoughts)`, `[notes]`); **every reply in the shape `Name: reply` then `Emotion: word`** from 24 emotions; the three styles; use the examples' voice. Then the character's sections, the persona, the scenario, standing lore and the example chats. A second system message holds the journal.
- **The transcript,** each reply written as `Name: text` plus its emotion line. Since Chat 0.5.2 a continued reply goes back as one turn.
- **The moment,** a bracketed note on the player's last turn: `Style: roleplay; response length: medium.`, the lore keys brought in, then "Reply as {char} only." **Response length** is CharacterRoom's list (short to "spammy very long"). Left unset, which is the default, nothing about length is said.
- **Prefill:** `Name:` where the provider can continue an assistant turn. Otherwise none.
- **Stop:** the player's name followed by a colon.
- **Reply allowance:** the chat's Reply length setting (1,000 tokens in the test). Since 0.5.2, Google gets 4,096 more for thinking.
- **Nothing about mature content,** for any model. **No safety settings** go to any provider; Google's OpenAI-style connection reportedly rejects them.
- **Refusals:** an empty reply shows an error, with "filtered" when the provider said so. Since 0.5.2 a reply cut at the limit or by a filter says so. A refusal written in character is not caught.
- **Prompt formats** (`core/narration/formats.ts`) cover eight families for providers that take a whole prompt. Chat-style providers get messages.

Xialong gets CharacterRoom's AetherRoom prompt byte for byte (`core/chat/aetherroom.ts`) and is out of scope. The adventure has its own narrator prompts; what is decided here should suit it too.

## Read for this review

- SillyTavern 1.19.0 (AGPL-3.0): the prompt manager and its default prompts, system prompt and instruct presets, auto-continue, what it sends Google, the expressions extension.
- Agnai 1.0.555 (AGPL-3.0): its presets, jailbreak, per-provider adapters.
- RisuAI (GPL-3.0): its default prompt template, Gemini settings, emotion images.
- Ideas only, never code.
