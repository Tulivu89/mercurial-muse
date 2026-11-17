# Notes: Agnai and RisuAI

Nov 17, 2026 · @AmbiProp

Agnai 1.0.555 (AGPL-3.0) read from its npm package, with its web code taken from the source maps' original sources. RisuAI (GPL-3.0) read from `kwaroran/Risuai` on `main`: `src/ts/characterCards.ts`, `src/ts/process/modules.ts`, `src/ts/process/lorebook.svelte.ts`, `src/ts/storage/database.svelte.ts`. Not read: `@risuai/ccardlib` (Risu's decorator parser), its chat and persona exports.

## Agnai

**Cards in:** PNG, APNG, JPEG, WebP and JSON; Agnai's own, TextGen/Pygmalion, Tavern V1 and V2. **No V3**: `chara_card_v3` is never checked, and its PNG reader takes the first text chunk whatever its name, so a V3-only PNG fails (`card-utils.ts:74-92`).

**Cards out:** a V1+V2 hybrid (V1 fields at the top, `spec: chara_card_v2` and `data`) in a `chara` chunk, with Agnai's own structured persona, voice and sprite in `extensions.agnai` so a round trip loses nothing (`common/characters.ts:28-90`).

**Lorebooks ("memory books"):** an entry is name, entry, keywords, priority, weight, enabled. It carries V2's other fields so they survive export, but its matcher only reads keywords, priority and weight. Keywords match whole words, case-insensitive, with `*` and `?` as wildcards. It reads its own books, Chub's and SillyTavern's World Info export (ST's `order` is lost). It scans the last 50 lines, ranks by priority then recency, fills a 500-token budget, then orders by weight.

**Chats:** reads its own and SillyTavern's JSONL (skips the header line, keeps only `mes` and `is_user`). Writes only its own JSON.

**Personas:** one attribute map shown five ways: W++, SBF, Boostyle, "Attributes" and plain text.

**Memory:** the lorebook, plus in-browser embeddings of older chat messages (only those already out of context) and of documents (Wikipedia, PDF). No summaries.

**Prompt:** a template with placeholders (`{{memory}}`, `{{scenario}}`, `{{chat_embed}}`, `{{ujb}}` and more) and a card's `depth_prompt` (SillyTavern's convention) put N messages back; its cost is taken off the budget first. `{{original}}` works in a card's prompts.

## RisuAI

**Cards out:** V3 by default, as PNG (a `ccv3` chunk only, no `chara`), JSON (assets inline as data URLs), CHARX, or a JPEG with the CHARX zip appended. V2 PNG on request (`chara` chunk). Its own data in `extensions.risuai`; foreign extensions and `depth_prompt` pass through.

**Cards in:** V1, V2 and V3 as JSON, PNG (`ccv3` beats `chara`), CHARX and CHARX-in-JPEG; password-encrypted cards. **It turns SillyTavern's lorebook extras into V3 decorators on the way in:** probability, depth and role, the secondary-key logic, delay as `@@activate_only_after`, whole-word matching (`characterCards.ts:1093-1200`).

**Lorebooks:** sources are the character's book, the chat's own and modules'. Its importer (`convertExternalLorebook`) reads four vocabularies at once: SillyTavern World Info (`key`, `comment`, `order`), V2 (`keys`, `name`, `secondary_keys`), Agnai (`keywords`, `entry`, `priority`) and NovelAI (`displayName`, `text`, `forceActivation`). It implements the V3 decorators and adds its own (`@@probability`, `@@priority`, `@@recursive`, injecting into another entry).

**Modules (`.risum`):** a bundle of lorebook, regex scripts, triggers, assets and styling that a player switches on globally, per character or per chat. A binary format of Risu's own.

**Presets (`.risup`):** generation settings, compressed and lightly encrypted; it also reads NovelAI and SillyTavern presets.

**Regex scripts:** find and replace on the player's words, the model's reply, the request, or only the display (used to draw HTML panels).

## What they share

- The `chara` PNG chunk and V2 are what every app reads. V3 and `ccv3` are read by SillyTavern and Risu, not Agnai.
- The V2 book's fields, and SillyTavern's World Info file, are the lorebook vocabulary. Risu reads every dialect, which shows what "the standard" is in practice: a handful of field names, read loosely.
- `extensions.depth_prompt` (a note put N messages back) is SillyTavern's and is honoured by Agnai and Risu.
- SillyTavern's chat JSONL is the chat file other apps read.
