# Prompt setup: decision

Nov 17, 2026 · @AmbiProp · Waiting on the owner

From the brief, the owner's Gemini test, and the source of SillyTavern, Agnai and RisuAI (notes beside this page). Covers the General profile, every model but Xialong; Xialong keeps CharacterRoom's prompt.

## The plan in a few lines

Ask for length in words, and continue on its own when a reply hits the limit. Take the emotion line out of the reply and pick the emotion afterwards. Reach Gemini through Google's own API so its filters can be switched off, as all three apps do. Mature content is a switch the player sets, not wording hidden in every prompt. Then give the prompt's parts a page where the player can read and change them. Keep the rest of our prompt: the reaches, the moment note, the format rules and the stable prefix are already ahead of these apps.

## What the apps agree on (settled)

- **The system prompt is short.** SillyTavern's default is one line, and Agnai's and RisuAI's are a paragraph. Character, lore and examples are where the words go.
- **Length is asked for in words.** "Write at least one paragraph, up to four" (Agnai's presets, SillyTavern's Immersive preset) and "Write a 3+ paragraph response" (RisuAI). Behind that sits a token cap, which is only a cap.
- **Gemini's filters are switched off at the API.** SillyTavern sends all five categories `OFF`, also for Gemini on OpenRouter. Agnai and RisuAI send `BLOCK_NONE`. All three use Google's own API to do it.
- **Mature content isn't in the default prompt.** SillyTavern ships its Auxiliary (once NSFW) and Post-History (once jailbreak) prompts empty, and RisuAI's jailbreak is off by default. The explicit wording lives in presets a player chooses.
- **Nobody asks the reply for an emotion by default.** SillyTavern classifies afterwards, with a small local model or a one-word side call, and its default is no expressions at all. RisuAI's default is a side call that picks from the list with recent picks penalised; a tag in the reply is only one of its views. Agnai's classifier is a stub.
- **Continue joins with a space** (SillyTavern's postfix, Agnai's join) and nudges with one bracketed line. Chat 0.5.2 already does this.
- **Thinking comes out of Gemini's allowance.** SillyTavern carves Gemini's thinking budget from the reply cap, which supports 0.5.2's `thinkingRoom`.

## Where we are already ahead

- **Why a reply stopped.** None of the three checks a finish reason for SAFETY or for the limit on a streamed reply. A blocked stream just ends empty, or the API's error is shown raw. Chat 0.5.2 says which it was, under the reply.
- **What the model gets, and when.** Their lore is keyword lorebooks with positions. Ours is reaches, the moment note and a stable prefix that a provider's cache can reuse.

## The calls

| Question | Call | Why |
| --- | --- | --- |
| Reply length | **Ask for it in words, with a token cap to match.** Short: one paragraph (about 250 tokens). Medium: two to four (about 600, the default). Long: four to six (about 1,000). The line goes in the moment note, every turn. CharacterRoom's list stays for Xialong | Every app does it this way. Today "unspecified" says nothing, so Gemini writes two lines |
| A reply that hits the cap | **Continue on its own, at most twice, when the provider says it hit the limit.** A switch, on by default | We know the finish reason, so there's no guessing from punctuation or token counts as SillyTavern and RisuAI must. The owner pressed Continue by hand several times a reply |
| A half sentence left at the end | **Trim to the last sentence end, as an option, off** | Rare once continuing on its own works |
| The emotion | **Out of the reply.** Pick it afterwards with a one-word side call, constrained to our 24 and penalising the last few for variety (RisuAI's way). Only when the character has emotion portraits or moods are on; otherwise none | A line every reply costs tokens, a cut reply loses it anyway, and the owner doubts it suits every model. The side call can run on the Side job (`docs/model-jobs.md`) |
| Gemini | **A Google adapter in the relay:** `streamGenerateContent` with every safety category `OFF`, the first system message as `systemInstruction` and later ones folded into the user turn, `thinkingConfig` by family. A blocked prompt (`blockReason`) and a SAFETY finish come back as the 0.5.2 filter line, with the reason | The only way to set Google's filters, which its OpenAI-style route reportedly rejects. All three apps do this |
| Gemini on OpenRouter | **Send `safety_settings` with every category off for `google/*` models** | As SillyTavern does |
| Thinking | **Keep the room; add a per-connection thinking level later** (Default, Low, Off where the model allows) | Default sends nothing, as SillyTavern's "auto" does. Low is cheaper and quicker for chat |
| Mature content | **A switch on the connection, off until the player turns it on:** one plain line in the system prompt that this is fiction between adults and that explicit content is allowed when the story calls for it. Never the "authorized red team" or "professional researcher" framing some presets use | The apps keep this out of the default and in a preset the player picks. Fake framings are brittle and some providers penalise them |
| The prompt itself | **A Prompt page in Chat's settings** showing the parts in order (who you play, format, length, content, the card's own prompt, post-history). Each can be read, turned off or rewritten, saved per connection, with Put back | The owner wants Chat to handle models the way these apps do. SillyTavern's prompt manager is the model. Ours stays shorter |
| The card's own system prompt | **A part on that page,** off by default and flagged when a card has one (the standards decision) | Already decided |
| In-character refusals | **Not caught.** The ended line offers Regenerate as well as Continue | None of the apps does it well. SillyTavern's blocklist auto-swipe is the nearest, and it guesses |
| Shaping messages per provider | **Keep ours.** Merge same-role turns (done), fold later system messages for Google (the adapter), and a prefill only where the provider takes one (done) | SillyTavern's reasons for each setting are API limits, and our providers are covered |

## Phases

| Phase | What | Size |
| --- | --- | --- |
| **P1, length and emotion** | Length in words with its cap; continuing on its own on the limit, at most twice; the emotion line out of General replies, picked by a side call where portraits or moods need it; trimming as an option | One PR, core and Chat |
| **P2, Gemini direct** | The Google adapter in the relay (safety off, `systemInstruction`, thinking, finish and block reasons) and OpenRouter's `safety_settings` for Gemini | One PR, server and core |
| **P3, the Prompt page** | The parts, editable per connection with Put back; the mature content switch; the card's own prompt; a thinking level | One PR, Chat and kit |

**Proposed order:** P1 and P2 first, because they fix what the owner hit. Then X1 from the standards review (nothing leaks). Then P3, which X1's card prompt switch fits into.

## Questions for the owner

1. **Mature content:** a switch the player turns on (proposed), on for everyone, or decided per world (a household like HOG Wild could ask for it)?
2. **The emotion side call** costs one short extra request per reply where portraits or moods are on. Fine, or off unless the player asks for it?
3. **Continuing on its own**, at most twice: on by default?
4. **Gemini direct** sends the player's key to Google's own API through the relay, the same as now but at a different address. No change for the player. Agreed?
