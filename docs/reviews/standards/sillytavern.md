# Notes: SillyTavern

Nov 17, 2026 · @AmbiProp

SillyTavern 1.19.0 (AGPL-3.0), read from its npm package; its docs site wasn't reachable from the session. Paths are in that package.

## World Info (its lorebook)

**A book file** is `{ entries: { "<uid>": entry } }`; one made from a card also keeps `originalData`, the card's book. It reads its own, NovelAI's, Agnai's and Risu's books, and Chub's by address (`public/scripts/world-info.js:5850-5890`).

**An entry** (`world-info.js:4082-4125`), the fields that matter:

| Field | Default | What it does |
| --- | --- | --- |
| `key`, `keysecondary` | `[]` | Keys; a key written `/like this/i` is a regex |
| `selectiveLogic` | 0 | How the second list counts: any of them, not all, none, all |
| `constant` | false | Always in |
| `order` | 100 | Higher wins the budget and sits nearer the end |
| `position` | 0 | 0 before the character, 1 after, 2–3 the Author's Note top or bottom, 4 at a depth in the chat, 5–6 around the examples, 7 only where `{{outlet::name}}` asks |
| `depth`, `role` | 4, system | For position 4 |
| `probability` | 100 | Percent chance once triggered |
| `group`, `groupOverride`, `groupWeight` | | Only one entry of a group gets in: the prioritised one, or a weighted draw |
| `sticky`, `cooldown`, `delay` | | Stay on N messages; rest N messages; not before message N |
| `scanDepth`, `caseSensitive`, `matchWholeWords` | global | Per-entry overrides |
| `excludeRecursion`, `preventRecursion`, `delayUntilRecursion` | | How entries trigger each other |
| `characterFilter`, `triggers` | | Only for these characters; only on these kinds of generation |
| `vectorized` | false | Brought in by similarity, not keys |
| `ignoreBudget` | false | Goes in past the budget |

Content can start with `@@activate` or `@@dont_activate`; no other V3 decorator is read.

**Global settings** (`world-info.js:69-82`): scan depth **2 messages** by default, a budget of 25% of context (with an optional cap), recursion off, names included in the scanned text, minimum activations (widen the scan until N entries fire). Character books go first by default; the chat's own book and the persona's book go before both.

**How a turn picks entries** (`checkWorldInfo`, `:4709-5282`): skip the disabled, the filtered, those waiting on delay or cooldown; take constants and sticky ones; then a primary key has to match and the second list pass its logic. Then groups are thinned, probability rolled, and entries added by order until the budget runs out. With recursion on, what got in is scanned again. Sticky and cooldown are kept per chat in `chat_metadata.timedWorldInfo`.

**Card book ⇄ World Info** (`world-info.js:5617-5674` in, `src/endpoints/characters.js:663-722` out): V2's fields map across by name (`keys`→`key`, `insertion_order`→`order`, `enabled`→`!disable`). Everything V2 has no place for travels in each entry's `extensions` in snake_case: `position`, `depth`, `role`, `probability`, `group`, `sticky`, `cooldown`, `delay`, `match_whole_words` and the rest. This is the de facto extension of a card's book; Risu reads it and turns it into decorators.

## Cards

- **Out** (`src/character-card-parser.js:15-46`): PNG or JSON only. The PNG gets **both** chunks: `chara` with the V2 card and `ccv3` with the same JSON relabelled V3. No V3-only field is ever written. The card's book is rebuilt from the linked World Info on every save. Unknown fields of an imported card ride along untouched.
- **ST's own card extensions** (`characters.js:614-626`): `depth_prompt` `{prompt, depth: 4, role: "system"}` (the character's note, put N messages back, used heavily by card writers), `talkativeness` (group chat), `world` (the linked book's name), `regex_scripts`, `fav`.
- **In** (`characters.js:1560-1599`): PNG (V1–V3), JSON (V1–V3, Pygmalion), YAML, CHARX (icon becomes the avatar, emotion assets become sprites, backgrounds become backgrounds), Backyard's BYAF. By address: Chub, JanitorAI, Pygmalion, RisuRealm, Perchance and a few more.

## Chat files

**JSONL**: line one is a header, each later line a message (`public/global.d.ts:45-128`).
- Header: `{ chat_metadata: {…}, user_name: "unused", character_name: "unused" }`. Older files have real names and a `create_date` there.
- Message: `name`, `is_user`, `is_system` (kept but not sent), `send_date`, `mes`, `swipes` (every alternative), `swipe_id` (which one shows), `swipe_info`, and `extra` (model, reasoning, a summary in `extra.memory`, images).
- **Reads** its own JSONL and chats from Kobold Lite, CAI Tools, Oobabooga, Agnai and RisuAI (`src/endpoints/chats.js:771-870`). **Writes** JSONL, or plain text as `Name: message` paragraphs.

## Macros

A new engine is on by default: `{{name::arg::arg}}`, `{{if}}…{{else}}…{{/if}}`, variables. The ones card writers actually use:
- Who: `{{char}}`, `{{user}}`, `{{persona}}`, `{{description}}`, `{{personality}}`, `{{scenario}}`, `{{charIfNotGroup}}`, `{{group}}`, `{{original}}`; the old `<USER>`, `<BOT>`, `<CHAR>`.
- Chance: `{{random::a::b}}` (and the old `{{random:a,b}}`), `{{pick::a::b}}` (stable per chat), `{{roll 1d20}}` or `{{roll:d20}}`.
- Time: `{{time}}`, `{{date}}`, `{{weekday}}`, `{{isodate}}`, `{{isotime}}`, `{{idle_duration}}`.
- Plumbing: `{{// note}}` (empty), `{{trim}}`, `{{newline}}`, `{{noop}}`.
- Variables: `{{setvar::x::1}}`, `{{getvar::x}}`, `{{addvar}}`, `{{incvar}}` and global versions, kept in the chat's metadata.

## Personas

An avatar picture with a name, a description, where the description goes (in the prompt, the Author's Note, at a depth, or nowhere), and an optional lorebook. A persona can be tied to characters or locked to a chat. **No single-persona file**: only a backup of all of them.

## Memory, briefly (for the next review)

- **Summarize** is built in: every 10 messages (by default) it asks a model for a summary of about 200 words, stores it on a message (`extra.memory`) and sends it as `[Summary: …]`.
- **Vectors**: older chat messages, attached files and World Info entries marked `vectorized` come back by similarity.
- **Data Bank**: files at three scopes (everywhere, per character, per chat), from uploads or scraped pages.
